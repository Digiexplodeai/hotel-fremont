-- ============================================================================
-- HOTEL FREMONT: BOOKING LIFECYCLE & OPERATIONAL STATUS MIGRATION
-- Supports full state machine: pending -> confirmed -> checked_in -> checked_out / cancelled
-- Enables authoritative timestamp tracking & physical room assignments
-- ============================================================================

-- 1. BOOKINGS TABLE STATUS CONSTRAINT
-- Allow all operational states and Razorpay payment states
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'paid', 'refunded', 'failed', 'expired'));

-- Add operational lifecycle columns to public.bookings if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'room_number') THEN
        ALTER TABLE public.bookings ADD COLUMN room_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'checked_in_at') THEN
        ALTER TABLE public.bookings ADD COLUMN checked_in_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'checked_out_at') THEN
        ALTER TABLE public.bookings ADD COLUMN checked_out_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'early_departure') THEN
        ALTER TABLE public.bookings ADD COLUMN early_departure BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. RESERVATIONS TABLE STATUS CONSTRAINT
-- Allow all operational states and legacy CRM states
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
  CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'new', 'contacted', 'in_discussion', 'converted', 'closed', 'paid'));

-- Add operational lifecycle columns to public.reservations if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'room_number') THEN
        ALTER TABLE public.reservations ADD COLUMN room_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'checked_in_at') THEN
        ALTER TABLE public.reservations ADD COLUMN checked_in_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'checked_out_at') THEN
        ALTER TABLE public.reservations ADD COLUMN checked_out_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'early_departure') THEN
        ALTER TABLE public.reservations ADD COLUMN early_departure BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. UPDATE AUTHORITATIVE AVAILABILITY RPC TO INCLUDE ALL OPERATIONAL STAYS
-- Bookings with status 'checked_in' and 'checked_out' legitimately reserve nights in [check_in, check_out)
CREATE OR REPLACE FUNCTION public.get_room_availability(
  p_check_in date,
  p_check_out date
)
RETURNS TABLE (
  code text,
  name text,
  price_per_night numeric,
  total_rooms integer,
  rooms_booked integer,
  rooms_left integer,
  is_available boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH stay_dates AS (
    SELECT d::date AS night
    FROM generate_series(p_check_in, p_check_out - interval '1 day', interval '1 day') AS d
  ),
  -- 1. Front-desk & Admin Reservations that legitimately block rooms
  active_res AS (
    SELECT
      rt.code AS rt_code,
      sd.night,
      COALESCE(r.rooms_requested, 1)::integer AS rooms_count,
      r.reference_code AS ref
    FROM public.reservations r
    JOIN stay_dates sd ON r.check_in <= sd.night AND r.check_out > sd.night
    JOIN public.room_types rt 
      ON (r.room_type_code = rt.code 
          OR r.room_type_code = rt.slug 
          OR lower(r.room_type) = lower(rt.name)
          OR (rt.code = 'super-deluxe' AND r.room_type_code = 'super-deluxe-room')
          OR (rt.code = 'premium' AND r.room_type_code = 'premium-room'))
    WHERE r.status IN ('confirmed', 'converted', 'paid', 'checked_in', 'checked_out')
      AND rt.is_active = true
  ),
  -- 2. Online Gateway Bookings (Deduplicated against reservations by reference code)
  active_book AS (
    SELECT
      rt.code AS rt_code,
      sd.night,
      COALESCE(b.rooms_count, b.rooms_requested, 1)::integer AS rooms_count,
      b.booking_ref AS ref
    FROM public.bookings b
    JOIN stay_dates sd ON b.check_in <= sd.night AND b.check_out > sd.night
    JOIN public.room_types rt 
      ON (b.room_category = rt.code 
          OR b.room_category = rt.slug 
          OR lower(b.room_category) = lower(rt.name)
          OR (rt.code = 'super-deluxe' AND b.room_category = 'super-deluxe-room')
          OR (rt.code = 'premium' AND b.room_category = 'premium-room'))
    WHERE (
      b.status IN ('paid', 'confirmed', 'checked_in', 'checked_out') 
      OR (b.status = 'pending' AND b.expires_at > now())
    )
    AND rt.is_active = true
    AND (
      b.booking_ref IS NULL 
      OR NOT EXISTS (
        SELECT 1 FROM active_res ar WHERE ar.ref = b.booking_ref AND ar.night = sd.night
      )
    )
  ),
  -- 3. Unified Distinct Occupancy per night
  all_blocked_stays AS (
    SELECT rt_code, night, rooms_count FROM active_res
    UNION ALL
    SELECT rt_code, night, rooms_count FROM active_book
  ),
  -- 4. Aggregate nightly usage
  nightly_usage AS (
    SELECT 
      rt.code AS rt_code,
      sd.night,
      COALESCE(SUM(abs.rooms_count), 0)::integer AS rooms_booked
    FROM public.room_types rt
    CROSS JOIN stay_dates sd
    LEFT JOIN all_blocked_stays abs ON abs.rt_code = rt.code AND abs.night = sd.night
    WHERE rt.is_active = true
    GROUP BY rt.code, sd.night
  ),
  -- 5. Peak booked per category
  peak_usage AS (
    SELECT 
      rt_code, 
      MAX(rooms_booked)::integer AS peak_booked
    FROM nightly_usage
    GROUP BY rt_code
  )
  SELECT
    rt.code,
    rt.name,
    rt.price_per_night,
    CASE 
      WHEN rt.code IN ('deluxe', 'deluxe-room') THEN 9
      WHEN rt.code IN ('super-deluxe', 'super-deluxe-room') THEN 10
      WHEN rt.code IN ('premium', 'premium-room') THEN 2
      ELSE COALESCE(rt.total_rooms, rt.rooms_total, 1)::integer
    END AS total_rooms,
    COALESCE(pu.peak_booked, 0)::integer AS rooms_booked,
    GREATEST(0, (
      CASE 
        WHEN rt.code IN ('deluxe', 'deluxe-room') THEN 9
        WHEN rt.code IN ('super-deluxe', 'super-deluxe-room') THEN 10
        WHEN rt.code IN ('premium', 'premium-room') THEN 2
        ELSE COALESCE(rt.total_rooms, rt.rooms_total, 1)::integer
      END
    ) - COALESCE(pu.peak_booked, 0))::integer AS rooms_left,
    (GREATEST(0, (
      CASE 
        WHEN rt.code IN ('deluxe', 'deluxe-room') THEN 9
        WHEN rt.code IN ('super-deluxe', 'super-deluxe-room') THEN 10
        WHEN rt.code IN ('premium', 'premium-room') THEN 2
        ELSE COALESCE(rt.total_rooms, rt.rooms_total, 1)::integer
      END
    ) - COALESCE(pu.peak_booked, 0)) > 0) AS is_available
  FROM public.room_types rt
  LEFT JOIN peak_usage pu ON pu.rt_code = rt.code
  WHERE rt.is_active = true
  ORDER BY rt.sort_order ASC;
$$;
