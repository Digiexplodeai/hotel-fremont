-- Migration: Expand room booking limit to match physical hotel inventory (up to 12 rooms)
-- Replaces create_reservation RPC with dynamic capacity limit up to total hotel keys (12).

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

  -- 5. Rooms requested validation (up to 12 physical rooms)
  IF p_rooms_requested IS NULL OR p_rooms_requested < 1 OR p_rooms_requested > 12 THEN
    RAISE EXCEPTION 'INVALID_ROOMS: You can request between 1 and 12 rooms per booking.';
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

