-- ==============================================================================
-- HOTEL FREMONT: CRITICAL AVAILABILITY & PHYSICAL INVENTORY REPAIR
-- Migration: 20261121_fix_room_availability.sql
-- 
-- Fixes:
-- 1. Eliminates phantom room deductions (fixing Deluxe 8/9 -> 9/9, Premium 1/2 -> 2/2).
-- 2. Deduplicates bookings between `public.bookings` and `public.reservations`.
-- 3. Strictly enforces 21 verified physical rooms (Deluxe: 9, Super Deluxe: 10, Premium: 2).
-- 4. Excludes cancelled, closed, and expired temporary holds.
-- 5. Implements half-open stay night interval [p_check_in, p_check_out).
-- ==============================================================================

-- 1. Synchronize category physical inventory in public.room_types
UPDATE public.room_types
SET 
  total_rooms = 9,
  rooms_total = 9
WHERE code = 'deluxe-room';

UPDATE public.room_types
SET 
  total_rooms = 10,
  rooms_total = 10
WHERE code IN ('super-deluxe', 'super-deluxe-room');

UPDATE public.room_types
SET 
  total_rooms = 2,
  rooms_total = 2
WHERE code IN ('premium', 'premium-room');

-- 2. Clean, Authoritative Availability RPC Function
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
  -- Date validation fallback: Return full physical inventory if invalid or missing dates
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in THEN
    RETURN QUERY
    SELECT 
      rt.code,
      rt.name,
      rt.price_per_night,
      CASE 
        WHEN rt.code = 'deluxe-room' THEN 9
        WHEN rt.code IN ('super-deluxe', 'super-deluxe-room') THEN 10
        WHEN rt.code IN ('premium', 'premium-room') THEN 2
        ELSE COALESCE(rt.rooms_total, rt.total_rooms, 1)
      END::integer AS total_rooms,
      CASE 
        WHEN rt.code = 'deluxe-room' THEN 9
        WHEN rt.code IN ('super-deluxe', 'super-deluxe-room') THEN 10
        WHEN rt.code IN ('premium', 'premium-room') THEN 2
        ELSE COALESCE(rt.rooms_total, rt.total_rooms, 1)
      END::integer AS rooms_left,
      rt.max_guests
    FROM public.room_types rt
    WHERE rt.is_active = true
    ORDER BY rt.sort_order ASC;
    RETURN;
  END IF;

  RETURN QUERY
  WITH stay_dates AS (
    -- Generates each night of the requested stay [p_check_in, p_check_out)
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
    WHERE r.status IN ('confirmed', 'converted', 'paid')
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
      b.status IN ('paid', 'confirmed') 
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
  -- 4. Aggregate nightly usage (Fixes the LEFT JOIN SUM(1) bug: SUM only matching rows)
  nightly_usage AS (
    SELECT 
      rt.code AS rt_code,
      sd.night,
      COALESCE(SUM(abs.rooms_count), 0)::integer AS rooms_booked
    FROM public.room_types rt
    CROSS JOIN stay_dates sd
    LEFT JOIN all_blocked_stays abs 
      ON abs.rt_code = rt.code AND abs.night = sd.night
    WHERE rt.is_active = true
    GROUP BY rt.code, sd.night
  ),
  -- 5. Peak occupied rooms across any night of the requested date range
  peak_usage AS (
    SELECT 
      nu.rt_code,
      COALESCE(MAX(nu.rooms_booked), 0)::integer AS peak_booked
    FROM nightly_usage nu
    GROUP BY nu.rt_code
  )
  -- 6. Return strictly bounded inventory (Never exceeds verified physical rooms, never negative)
  SELECT 
    rt.code,
    rt.name,
    rt.price_per_night,
    CASE 
      WHEN rt.code = 'deluxe-room' THEN 9
      WHEN rt.code IN ('super-deluxe', 'super-deluxe-room') THEN 10
      WHEN rt.code IN ('premium', 'premium-room') THEN 2
      ELSE COALESCE(rt.rooms_total, rt.total_rooms, 1)
    END::integer AS total_rooms,
    GREATEST(
      0,
      LEAST(
        CASE 
          WHEN rt.code = 'deluxe-room' THEN 9
          WHEN rt.code IN ('super-deluxe', 'super-deluxe-room') THEN 10
          WHEN rt.code IN ('premium', 'premium-room') THEN 2
          ELSE COALESCE(rt.rooms_total, rt.total_rooms, 1)
        END,
        CASE 
          WHEN rt.code = 'deluxe-room' THEN 9
          WHEN rt.code IN ('super-deluxe', 'super-deluxe-room') THEN 10
          WHEN rt.code IN ('premium', 'premium-room') THEN 2
          ELSE COALESCE(rt.rooms_total, rt.total_rooms, 1)
        END - COALESCE(pu.peak_booked, 0)
      )
    )::integer AS rooms_left,
    rt.max_guests
  FROM public.room_types rt
  LEFT JOIN peak_usage pu ON pu.rt_code = rt.code
  WHERE rt.is_active = true
  ORDER BY rt.sort_order ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_room_availability(date, date) TO anon, authenticated, service_role;
