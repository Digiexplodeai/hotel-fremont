-- ==============================================================================
-- HOTEL FREMONT: 12-KEY INVENTORY & OVERBOOKING PREVENTION ENGINE
-- Single Source of Truth in Supabase Postgres
-- ==============================================================================

-- 1. CREATE TABLE: room_types (12 Luxury Keys)
CREATE TABLE IF NOT EXISTS public.room_types (
  code text PRIMARY KEY,
  name text NOT NULL,
  price_per_night numeric NOT NULL CHECK (price_per_night > 0),
  total_rooms integer NOT NULL CHECK (total_rooms >= 0),
  max_guests integer NOT NULL CHECK (max_guests >= 1),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed / Upsert the 4 luxury room types (Exactly 12 rooms total)
INSERT INTO public.room_types (code, name, price_per_night, total_rooms, max_guests, is_active, sort_order)
VALUES 
  ('deluxe-king', 'Deluxe King Room', 5499, 6, 3, true, 1),
  ('premier-executive', 'Premier Executive Suite', 8999, 3, 3, true, 2),
  ('royal-fremont', 'The Royal Fremont Suite', 14999, 2, 4, true, 3),
  ('presidential-penthouse', 'Presidential Penthouse', 24999, 1, 6, true, 4)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_per_night = EXCLUDED.price_per_night,
  total_rooms = EXCLUDED.total_rooms,
  max_guests = EXCLUDED.max_guests,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Enable RLS on room_types
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active room types" ON public.room_types;
CREATE POLICY "Public can view active room types" 
  ON public.room_types FOR SELECT 
  TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Admins can update room types" ON public.room_types;
CREATE POLICY "Admins can update room types" 
  ON public.room_types FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 2. ALTER TABLE: reservations (Add inventory-aware columns safely)
DO $$
BEGIN
  -- rooms_requested
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'rooms_requested'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN rooms_requested integer NOT NULL DEFAULT 1 CHECK (rooms_requested >= 1);
  END IF;

  -- nights
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'nights'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN nights integer;
  END IF;

  -- reference_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'reference_code'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN reference_code text UNIQUE;
  END IF;

  -- room_type_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'room_type_code'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN room_type_code text REFERENCES public.room_types(code) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  -- capacity_override
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'capacity_override'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN capacity_override boolean NOT NULL DEFAULT false;
  END IF;

  -- channel
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'channel'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN channel text NOT NULL DEFAULT 'room_reservation';
  END IF;
END $$;

-- Align status check constraint to support all management states
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
  CHECK (status IN ('new', 'contacted', 'in_discussion', 'confirmed', 'converted', 'cancelled', 'closed'));

-- Populate room_type_code for any existing rows that lack it
UPDATE public.reservations
SET room_type_code = CASE
  WHEN lower(COALESCE(room_type, '')) LIKE '%penthouse%' THEN 'presidential-penthouse'
  WHEN lower(COALESCE(room_type, '')) LIKE '%royal%' THEN 'royal-fremont'
  WHEN lower(COALESCE(room_type, '')) LIKE '%premier%' OR lower(COALESCE(room_type, '')) LIKE '%executive%' THEN 'premier-executive'
  ELSE 'deluxe-king'
END
WHERE room_type_code IS NULL AND (check_in IS NOT NULL);

-- Populate nights for existing rows
UPDATE public.reservations
SET nights = GREATEST(1, (check_out - check_in))
WHERE nights IS NULL AND check_in IS NOT NULL AND check_out IS NOT NULL;

-- Populate reference_code for existing rows
UPDATE public.reservations
SET reference_code = 'FRM-' || upper(substring(replace(id::text, '-', ''), 1, 6))
WHERE reference_code IS NULL;

-- 3. UNIQUE HUMAN-READABLE REFERENCE CODE GENERATOR (e.g. FRM-8K9N2P)
CREATE OR REPLACE FUNCTION public.generate_reference_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Clean set, no ambiguous 0/O, 1/I
  v_code text;
  v_exists boolean;
  i integer;
BEGIN
  LOOP
    v_code := 'FRM-';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS (SELECT 1 FROM public.reservations WHERE reference_code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- 4. AVAILABILITY RPC: get_room_availability(p_check_in, p_check_out)
-- Exposes ONLY inventory counts (rooms_left) and never any guest private info.
-- Interval logic: stay occupies nights [check_in, check_out); check_out day is free for next guest.
CREATE OR REPLACE FUNCTION public.get_room_availability(
  p_check_in date,
  p_check_out date
)
RETURNS TABLE (
  code text,
  name text,
  price_per_night numeric,
  total_rooms integer,
  rooms_left integer,
  max_guests integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic date validation
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in THEN
    RETURN QUERY
    SELECT 
      rt.code,
      rt.name,
      rt.price_per_night,
      rt.total_rooms,
      rt.total_rooms AS rooms_left,
      rt.max_guests
    FROM public.room_types rt
    WHERE rt.is_active = true
    ORDER BY rt.sort_order ASC;
    RETURN;
  END IF;

  RETURN QUERY
  WITH stay_dates AS (
    -- Generates each occupied night in [p_check_in, p_check_out)
    SELECT d::date AS night
    FROM generate_series(p_check_in, p_check_out - interval '1 day', interval '1 day') AS d
  ),
  nightly_usage AS (
    -- Sums confirmed rooms requested for each room type on each night of the requested stay
    SELECT 
      rt.code AS rt_code,
      sd.night,
      COALESCE(SUM(r.rooms_requested), 0)::integer AS rooms_booked
    FROM public.room_types rt
    CROSS JOIN stay_dates sd
    LEFT JOIN public.reservations r 
      ON (r.room_type_code = rt.code OR (r.room_type_code IS NULL AND lower(r.room_type) = lower(rt.name)))
      AND r.status IN ('confirmed', 'converted')
      AND r.check_in <= sd.night
      AND r.check_out > sd.night
    WHERE rt.is_active = true
    GROUP BY rt.code, sd.night
  ),
  max_booked AS (
    -- Peak room usage across any night of the stay
    SELECT 
      rt_code,
      COALESCE(MAX(rooms_booked), 0)::integer AS peak_booked
    FROM nightly_usage
    GROUP BY rt_code
  )
  SELECT 
    rt.code,
    rt.name,
    rt.price_per_night,
    rt.total_rooms,
    GREATEST(0, rt.total_rooms - COALESCE(mb.peak_booked, 0))::integer AS rooms_left,
    rt.max_guests
  FROM public.room_types rt
  LEFT JOIN max_booked mb ON mb.rt_code = rt.code
  WHERE rt.is_active = true
  ORDER BY rt.sort_order ASC;
END;
$$;

-- Grant access to anon & authenticated
GRANT EXECUTE ON FUNCTION public.get_room_availability(date, date) TO anon, authenticated;

-- 5. ATOMIC RESERVATION CREATION RPC: create_reservation(...)
-- Validates dates, lock row against race conditions, enforces capacity, computes price server-side.
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_full_name text,
  p_phone text,
  p_email text,
  p_check_in date,
  p_check_out date,
  p_room_type_code text,
  p_guests integer,
  p_rooms_requested integer DEFAULT 1,
  p_special_request text DEFAULT NULL,
  p_channel text DEFAULT 'room_reservation'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room record;
  v_nights integer;
  v_peak_booked integer;
  v_rooms_left integer;
  v_clean_phone text;
  v_subtotal numeric;
  v_gst numeric;
  v_estimated_total numeric;
  v_ref_code text;
  v_reservation_id uuid;
BEGIN
  -- 1. Full name validation
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'INVALID_NAME: Full name is required (at least 2 characters).';
  END IF;
  IF length(trim(p_full_name)) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME: Full name cannot exceed 100 characters.';
  END IF;

  -- 2. Phone validation (Indian 10-digit number)
  v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  IF length(v_clean_phone) = 12 AND substring(v_clean_phone from 1 for 2) = '91' THEN
    v_clean_phone := substring(v_clean_phone from 3);
  END IF;

  IF length(v_clean_phone) <> 10 OR substring(v_clean_phone from 1 for 1) NOT IN ('6', '7', '8', '9') THEN
    RAISE EXCEPTION 'INVALID_PHONE: Please provide a valid 10-digit Indian phone number.';
  END IF;

  -- 3. Email validation (nullable)
  IF p_email IS NOT NULL AND length(trim(p_email)) > 0 THEN
    IF length(trim(p_email)) > 100 OR trim(p_email) !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'INVALID_EMAIL: Please enter a valid email address.';
    END IF;
  END IF;

  -- 4. Dates validation
  IF p_check_in IS NULL OR p_check_out IS NULL THEN
    RAISE EXCEPTION 'INVALID_DATES: Check-in and check-out dates are required.';
  END IF;

  IF p_check_in < CURRENT_DATE THEN
    RAISE EXCEPTION 'INVALID_CHECK_IN: Check-in date cannot be in the past.';
  END IF;

  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'INVALID_CHECK_OUT: Check-out date must be strictly after check-in date.';
  END IF;

  v_nights := (p_check_out - p_check_in);
  IF v_nights > 30 THEN
    RAISE EXCEPTION 'MAX_STAY_EXCEEDED: Maximum stay duration is 30 nights.';
  END IF;

  -- 5. Rooms requested validation
  IF p_rooms_requested IS NULL OR p_rooms_requested < 1 OR p_rooms_requested > 3 THEN
    RAISE EXCEPTION 'INVALID_ROOMS: You can request between 1 and 3 rooms per booking.';
  END IF;

  -- 6. Lock room type row to prevent concurrent race condition overbooking
  SELECT * INTO v_room
  FROM public.room_types
  WHERE code = p_room_type_code AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_ROOM_TYPE: Room type % does not exist or is inactive.', p_room_type_code;
  END IF;

  -- 7. Guests capacity validation
  IF p_guests IS NULL OR p_guests < 1 THEN
    RAISE EXCEPTION 'INVALID_GUESTS: Number of guests must be at least 1.';
  END IF;

  IF p_guests > (v_room.max_guests * p_rooms_requested) THEN
    RAISE EXCEPTION 'GUESTS_EXCEEDED: % can accommodate maximum % guests across % room(s).',
      v_room.name, (v_room.max_guests * p_rooms_requested), p_rooms_requested;
  END IF;

  -- 8. Concurrency & Availability check: Count peak booked rooms across stay interval
  WITH stay_dates AS (
    SELECT d::date AS night
    FROM generate_series(p_check_in, p_check_out - interval '1 day', interval '1 day') AS d
  ),
  nightly_booked AS (
    SELECT sd.night, COALESCE(SUM(r.rooms_requested), 0) AS booked
    FROM stay_dates sd
    LEFT JOIN public.reservations r
      ON (r.room_type_code = v_room.code OR (r.room_type_code IS NULL AND lower(r.room_type) = lower(v_room.name)))
      AND r.status IN ('confirmed', 'converted')
      AND r.check_in <= sd.night
      AND r.check_out > sd.night
    GROUP BY sd.night
  )
  SELECT COALESCE(MAX(booked), 0) INTO v_peak_booked FROM nightly_booked;

  v_rooms_left := GREATEST(0, v_room.total_rooms - v_peak_booked);

  IF v_rooms_left < p_rooms_requested THEN
    RAISE EXCEPTION 'ROOM_SOLD_OUT: % is sold out for your selected dates (% room(s) available, % requested).',
      v_room.name, v_rooms_left, p_rooms_requested;
  END IF;

  -- 9. Server-side price computation (Never trust client prices)
  v_subtotal := v_nights * v_room.price_per_night * p_rooms_requested;
  v_gst := round(v_subtotal * 0.18); -- 18% Luxury Hotel GST
  v_estimated_total := v_subtotal + v_gst;

  -- 10. Generate unique human-friendly reference code
  v_ref_code := public.generate_reference_code();

  -- 11. Atomic Insert into public.reservations
  INSERT INTO public.reservations (
    full_name,
    phone,
    email,
    check_in,
    check_out,
    room_type,
    room_type_code,
    rooms_requested,
    nights,
    guests,
    special_request,
    estimated_total,
    reference_code,
    status,
    channel,
    created_at
  ) VALUES (
    trim(p_full_name),
    v_clean_phone,
    NULLIF(trim(p_email), ''),
    p_check_in,
    p_check_out,
    v_room.name,
    v_room.code,
    p_rooms_requested,
    v_nights,
    p_guests,
    NULLIF(trim(p_special_request), ''),
    v_estimated_total,
    v_ref_code,
    'new',
    COALESCE(p_channel, 'room_reservation'),
    now()
  ) RETURNING id INTO v_reservation_id;

  -- 12. Return structured JSON payload
  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'reference_code', v_ref_code,
    'nights', v_nights,
    'rooms_requested', p_rooms_requested,
    'price_per_night', v_room.price_per_night,
    'estimated_total', v_estimated_total,
    'room_name', v_room.name
  );
END;
$$;

-- Grant execute on create_reservation to anon & authenticated
GRANT EXECUTE ON FUNCTION public.create_reservation TO anon, authenticated;

-- 6. DATABASE-LEVEL CAPACITY GUARD TRIGGER
-- Blocks an admin from confirming a booking that exceeds room inventory unless capacity_override is true
CREATE OR REPLACE FUNCTION public.check_reservation_capacity_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_rooms integer;
  v_peak_booked integer;
  v_room_code text;
BEGIN
  -- Trigger check only when status is moving to confirmed or converted
  IF NEW.status IN ('confirmed', 'converted') AND (
    OLD.status IS NULL 
    OR OLD.status NOT IN ('confirmed', 'converted') 
    OR OLD.room_type_code IS DISTINCT FROM NEW.room_type_code 
    OR OLD.check_in IS DISTINCT FROM NEW.check_in 
    OR OLD.check_out IS DISTINCT FROM NEW.check_out 
    OR OLD.rooms_requested IS DISTINCT FROM NEW.rooms_requested
  ) THEN
    
    -- If admin explicitly gave capacity_override, allow it
    IF NEW.capacity_override = true THEN
      RETURN NEW;
    END IF;

    v_room_code := COALESCE(NEW.room_type_code, (
      SELECT code FROM public.room_types 
      WHERE lower(name) = lower(NEW.room_type) 
      LIMIT 1
    ));

    IF v_room_code IS NOT NULL THEN
      SELECT total_rooms INTO v_total_rooms
      FROM public.room_types
      WHERE code = v_room_code;

      IF v_total_rooms IS NOT NULL THEN
        -- Check peak usage on any night of the stay, excluding this reservation itself
        WITH stay_dates AS (
          SELECT d::date AS night
          FROM generate_series(NEW.check_in, NEW.check_out - interval '1 day', interval '1 day') AS d
        ),
        nightly_booked AS (
          SELECT sd.night, COALESCE(SUM(r.rooms_requested), 0) AS booked
          FROM stay_dates sd
          LEFT JOIN public.reservations r
            ON (r.room_type_code = v_room_code OR (r.room_type_code IS NULL AND lower(r.room_type) = lower(NEW.room_type)))
            AND r.id <> NEW.id
            AND r.status IN ('confirmed', 'converted')
            AND r.check_in <= sd.night
            AND r.check_out > sd.night
          GROUP BY sd.night
        )
        SELECT COALESCE(MAX(booked), 0) INTO v_peak_booked FROM nightly_booked;

        IF (v_peak_booked + COALESCE(NEW.rooms_requested, 1)) > v_total_rooms THEN
          RAISE EXCEPTION 'OVERBOOKING_GUARD: Confirming this booking for % (% room(s)) exceeds inventory. % of % rooms already confirmed. Confirm with override if authorized.',
            NEW.room_type, COALESCE(NEW.rooms_requested, 1), v_peak_booked, v_total_rooms;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservation_capacity_guard ON public.reservations;
CREATE TRIGGER trg_reservation_capacity_guard
BEFORE INSERT OR UPDATE OF status, rooms_requested, check_in, check_out, room_type_code, capacity_override
ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.check_reservation_capacity_guard();

-- 7. RESTRICT DIRECT ANON INSERT (RPC is now the single write path)
REVOKE INSERT ON public.reservations FROM anon;

-- Ensure authenticated admin retains full SELECT, UPDATE, DELETE permissions
GRANT SELECT, UPDATE, DELETE, INSERT ON public.reservations TO authenticated;
-- ==============================================================================

