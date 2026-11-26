-- ==============================================================================
-- HOTEL FREMONT: REAL HOTEL PROFILE, 21 KEYS, DINING, VENUES & CMS DATA MIGRATION
-- Migration Date: 2026-11-20
-- Idempotent Supabase SQL Migration
-- ==============================================================================

-- 1. EXTEND room_types TABLE (Do not drop)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'slug') THEN
    ALTER TABLE public.room_types ADD COLUMN slug text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'short_description') THEN
    ALTER TABLE public.room_types ADD COLUMN short_description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'long_description') THEN
    ALTER TABLE public.room_types ADD COLUMN long_description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'size_sqft') THEN
    ALTER TABLE public.room_types ADD COLUMN size_sqft integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'bed_type') THEN
    ALTER TABLE public.room_types ADD COLUMN bed_type text DEFAULT 'Plush King-size bed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'rooms_total') THEN
    ALTER TABLE public.room_types ADD COLUMN rooms_total integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'amenities') THEN
    ALTER TABLE public.room_types ADD COLUMN amenities text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'tag') THEN
    ALTER TABLE public.room_types ADD COLUMN tag text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'rate_cp_double') THEN
    ALTER TABLE public.room_types ADD COLUMN rate_cp_double numeric(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'rate_cp_single') THEN
    ALTER TABLE public.room_types ADD COLUMN rate_cp_single numeric(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'rate_ep_double') THEN
    ALTER TABLE public.room_types ADD COLUMN rate_ep_double numeric(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'rate_ep_single') THEN
    ALTER TABLE public.room_types ADD COLUMN rate_ep_single numeric(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'image_slot') THEN
    ALTER TABLE public.room_types ADD COLUMN image_slot text;
  END IF;
END $$;

-- 2. SEED REAL ROOM TYPES (21 rooms total: Deluxe 9, Super Deluxe 10, Premium 2)
-- Base price_per_night is set to the lowest starting rate (rate_ep_single) for compatibility.
INSERT INTO public.room_types (
  code,
  name,
  slug,
  price_per_night,
  total_rooms,
  rooms_total,
  max_guests,
  is_active,
  sort_order,
  size_sqft,
  bed_type,
  tag,
  short_description,
  long_description,
  amenities,
  rate_cp_double,
  rate_cp_single,
  rate_ep_double,
  rate_ep_single,
  image_slot,
  updated_at
)
VALUES
  (
    'deluxe-room',
    'Deluxe Room',
    'deluxe-room',
    2299,
    9,
    9,
    2,
    true,
    1,
    160,
    'Plush King-size bed',
    NULL,
    'A practical, comfortable stay with essential modern conveniences.',
    'A practical, comfortable stay with essential modern conveniences. Features a plush king-size bed, air conditioning, Smart TV, tea and coffee maker, and complimentary Wi-Fi.',
    ARRAY['Air Conditioning', 'Smart TV', 'Tea & Coffee Kettle', 'Complimentary Wi-Fi', 'Washroom Amenities', 'Central Hot Water', 'Housekeeping Service', 'Premium Linen & Duvets'],
    2799,
    2499,
    2499,
    2299,
    'deluxe-room',
    now()
  ),
  (
    'super-deluxe-room',
    'Super Deluxe Room',
    'super-deluxe-room',
    3299,
    10,
    10,
    2,
    true,
    2,
    250,
    'Plush King-size bed',
    'Best choice for corporate stays',
    'More room to unwind, with a calm palette and inviting interiors.',
    'More room to unwind, with a calm palette and inviting interiors. The Super Deluxe Room pairs a plush king-size bed with warm wood finishes, soft lighting and a calm, contemporary look.',
    ARRAY['Air Conditioning', 'Smart TV', 'Tea & Coffee Kettle', 'Complimentary Wi-Fi', 'Washroom Amenities', 'Central Hot Water', 'Housekeeping Service', 'Premium Linen & Duvets'],
    3799,
    3499,
    3499,
    3299,
    'super-deluxe',
    now()
  ),
  (
    'premium-room',
    'Premium Room',
    'premium-room',
    4299,
    2,
    2,
    2,
    true,
    3,
    365,
    'Plush King-size bed',
    NULL,
    'A more spacious stay with distinctive styling and a refined feel.',
    'A more spacious stay with distinctive styling and a refined feel. The Premium Room features elegant burgundy interiors, a plush king-size bed and contemporary furnishings. Its generous layout offers a welcoming place to relax, work or recharge.',
    ARRAY['Air Conditioning', 'Smart TV', 'Tea & Coffee Kettle', 'Complimentary Wi-Fi', 'Washroom Amenities', 'Central Hot Water', 'Housekeeping Service', 'Premium Linen & Duvets'],
    4799,
    4499,
    4499,
    4299,
    'premium',
    now()
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  price_per_night = EXCLUDED.price_per_night,
  total_rooms = EXCLUDED.total_rooms,
  rooms_total = EXCLUDED.rooms_total,
  max_guests = EXCLUDED.max_guests,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  size_sqft = EXCLUDED.size_sqft,
  bed_type = EXCLUDED.bed_type,
  tag = EXCLUDED.tag,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  amenities = EXCLUDED.amenities,
  rate_cp_double = EXCLUDED.rate_cp_double,
  rate_cp_single = EXCLUDED.rate_cp_single,
  rate_ep_double = EXCLUDED.rate_ep_double,
  rate_ep_single = EXCLUDED.rate_ep_single,
  image_slot = EXCLUDED.image_slot,
  updated_at = now();

-- Deactivate old mock categories without deleting rows (so historical reservations remain linked)
UPDATE public.room_types
SET is_active = false, updated_at = now()
WHERE code IN ('deluxe-king', 'premier-executive', 'royal-fremont', 'presidential-penthouse');

-- 3. CREATE NEW CONTENT TABLES (facilities, venues, nearby_places, site_settings)

-- A. facilities table
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- B. venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('banquet', 'conference')),
  count integer NOT NULL DEFAULT 1,
  capacity_text text NOT NULL,
  description text NOT NULL,
  image_slot text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- C. nearby_places table
CREATE TABLE IF NOT EXISTS public.nearby_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- D. site_settings table (key-value store for contact, policies, GST, etc.)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. ROW LEVEL SECURITY ON ALL CONTENT TABLES
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nearby_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies (SELECT only on active rows, or public settings)
DROP POLICY IF EXISTS "Public read active facilities" ON public.facilities;
CREATE POLICY "Public read active facilities" ON public.facilities
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read active venues" ON public.venues;
CREATE POLICY "Public read active venues" ON public.venues
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read active nearby_places" ON public.nearby_places;
CREATE POLICY "Public read active nearby_places" ON public.nearby_places
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT USING (true);

-- Admin write policies (restricted strictly to admin@hotelfremont.com via JWT or service role)
DROP POLICY IF EXISTS "Admin write facilities" ON public.facilities;
CREATE POLICY "Admin write facilities" ON public.facilities
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@hotelfremont.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@hotelfremont.com');

DROP POLICY IF EXISTS "Admin write venues" ON public.venues;
CREATE POLICY "Admin write venues" ON public.venues
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@hotelfremont.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@hotelfremont.com');

DROP POLICY IF EXISTS "Admin write nearby_places" ON public.nearby_places;
CREATE POLICY "Admin write nearby_places" ON public.nearby_places
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@hotelfremont.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@hotelfremont.com');

DROP POLICY IF EXISTS "Admin write site_settings" ON public.site_settings;
CREATE POLICY "Admin write site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@hotelfremont.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@hotelfremont.com');

-- 5. SEED DATA FOR FACILITIES, VENUES, NEARBY PLACES, SITE SETTINGS

-- Facilities
INSERT INTO public.facilities (title, description, icon, sort_order, is_active)
VALUES
  ('24-Hour Reception', 'Front desk assistance available 24 hours a day, 7 days a week.', 'Clock', 1, true),
  ('Complimentary Wi-Fi', 'High-speed wireless internet access across all rooms and common areas.', 'Wifi', 2, true),
  ('On-Site Parking', 'Convenient and secure parking space for staying guests and visitors.', 'Car', 3, true),
  ('Air Conditioning', 'Fully air-conditioned guest rooms with individual climate control.', 'Wind', 4, true),
  ('Smart TV', 'In-room entertainment with high-definition smart television.', 'Tv', 5, true),
  ('Tea & Coffee Kettle', 'In-room electric kettle with daily supplies of tea and coffee.', 'Coffee', 6, true),
  ('Central Hot Water', 'Continuous central hot-water system for comfort around the clock.', 'Flame', 7, true),
  ('Housekeeping Service', 'Daily professional housekeeping service maintaining cleanliness and hygiene.', 'Sparkles', 8, true),
  ('Premium Linen & Duvets', 'Specially made duvets, plush king-size bed linen, and quality washroom amenities.', 'BedDouble', 9, true)
ON CONFLICT DO NOTHING;

-- Venues
INSERT INTO public.venues (name, type, count, capacity_text, description, image_slot, sort_order, is_active)
VALUES
  (
    'Cloud Six Banquet',
    'banquet',
    1,
    'Up to 150 guests',
    'An elegant venue for celebrations and special occasions.',
    'cloud-six-banquet',
    1,
    true
  ),
  (
    'Conference Hall',
    'conference',
    1,
    'Approximately 40 to 50 guests',
    'A dedicated setting for meetings and business discussions.',
    'conference-hall',
    2,
    true
  )
ON CONFLICT DO NOTHING;

-- Nearby Places (No fake travel times or distances)
INSERT INTO public.nearby_places (name, sort_order, is_active)
VALUES
  ('Gurdwara Singh Shaheedan, Sohana', 1, true),
  ('CP67 Mall and other shopping destinations', 2, true),
  ('Chandigarh International Airport', 3, true),
  ('Mohali IT, commercial and industrial hubs', 4, true),
  ('Local car-wash facility in the surrounding area', 5, true)
ON CONFLICT DO NOTHING;

-- Site Settings
INSERT INTO public.site_settings (key, value, updated_at)
VALUES
  (
    'contact',
    jsonb_build_object(
      'phone', '+91 79734 50281',
      'clean_phone', '917973450281',
      'whatsapp', '+91 79734 50281',
      'whatsapp_link', 'https://wa.me/917973450281',
      'email', 'hotelfremont1@gmail.com'
    ),
    now()
  ),
  (
    'address',
    jsonb_build_object(
      'full', 'Hotel Fremont, Khasra No 186, Sector 80, Village Mauli Baidwan, Airport Road, Mohali (SAS Nagar), Punjab - 140308',
      'khasra', 'Khasra No 186',
      'sector', 'Sector 80',
      'village', 'Village Mauli Baidwan',
      'road', 'Airport Road',
      'city', 'Mohali (SAS Nagar)',
      'state', 'Punjab',
      'pincode', '140308'
    ),
    now()
  ),
  (
    'timings',
    jsonb_build_object(
      'check_in', '12:00 PM',
      'check_out', '11:00 AM',
      'front_desk', '24x7',
      'id_policy', 'Valid government-issued photo ID required at check-in for all staying guests.',
      'early_late_policy', 'Early check-in and late check-out on request, subject to availability, with additional charges.'
    ),
    now()
  ),
  (
    'cancellation',
    jsonb_build_object(
      'hours', 24,
      'free_window_text', 'Cancellations made 24 hours or more before scheduled check-in time are permitted and fully refunded to the original payment method.',
      'late_charge_text', 'Cancellations made within 24 hours of check-in are charged 1 Night Room Tariff.',
      'no_show_text', 'A no-show is charged 1 Night Room Tariff.',
      'refund_text', 'Refunds are processed to the original payment method, usually within 5 to 7 working days.'
    ),
    now()
  ),
  (
    'gst',
    jsonb_build_object(
      'threshold', 7500,
      'rate_low', 5,
      'rate_high', 18
    ),
    now()
  ),
  (
    'restaurant',
    jsonb_build_object(
      'name', 'Hotel Fremont Restaurant',
      'location', 'Ground floor',
      'covers', 50,
      'timings', 'In-house kitchen operational daily until 10:30 PM',
      'breakfast', 'Breakfast buffet (complimentary with breakfast-inclusive plans)'
    ),
    now()
  ),
  (
    'branding',
    jsonb_build_object(
      'name', 'Hotel Fremont',
      'badge', '3-Star Hotel',
      'tagline', 'Thoughtful comfort. Warm hospitality.',
      'subline', 'A convenient address on Airport Road.',
      'hero_line', 'A comfortable stay in Mohali.',
      'description', 'Hotel Fremont is a contemporary hotel on Sector 80, Airport Road, Mohali. The property brings together thoughtfully appointed guest rooms, an in-house restaurant, a dedicated banquet venue and a conference room, making it a convenient choice for business and leisure stays as well as social gatherings.'
    ),
    now()
  ),
  (
    'seo',
    jsonb_build_object(
      'title', 'Hotel Fremont | Comfortable Hotel on Airport Road, Mohali',
      'description', 'Hotel Fremont is a contemporary hotel on Sector 80, Airport Road, Mohali. Offering 21 guest rooms, in-house restaurant, Cloud Six Banquet and conference hall.',
      'keywords', 'hotel in Mohali, hotel near Chandigarh airport, hotel Airport Road Mohali, banquet hall Mohali, Hotel Fremont Sector 80',
      'canonical', 'https://www.hotelfremont.in'
    ),
    now()
  ),
  (
    'social_links',
    jsonb_build_object(
      'facebook', '',
      'instagram', '',
      'twitter', '',
      'linkedin', '',
      'youtube', ''
    ),
    now()
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- 6. EXTEND bookings TABLE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'meal_plan') THEN
    ALTER TABLE public.bookings ADD COLUMN meal_plan text DEFAULT 'ep';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'occupancy') THEN
    ALTER TABLE public.bookings ADD COLUMN occupancy text DEFAULT 'double';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'rooms_count') THEN
    ALTER TABLE public.bookings ADD COLUMN rooms_count integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'rate_per_night') THEN
    ALTER TABLE public.bookings ADD COLUMN rate_per_night numeric(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'base_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN base_amount numeric(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'gst_percent') THEN
    ALTER TABLE public.bookings ADD COLUMN gst_percent numeric(5,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'gst_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN gst_amount numeric(10,2);
  END IF;
END $$;

-- 7. UPDATE image_slots TABLE (Deactivate stock/AI images, register real photo slots)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'image_slots' AND column_name = 'is_active') THEN
    ALTER TABLE public.image_slots ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Deactivate existing AI/stock image slots
UPDATE public.image_slots
SET is_active = false
WHERE slot_key NOT IN (
  'branding.logo',
  'branding.icon',
  'seo.og_image',
  'exterior',
  'super-deluxe',
  'premium',
  'cloud-six-banquet',
  'deluxe-room',
  'restaurant',
  'conference-hall'
);

-- Ensure real photo slots exist
INSERT INTO public.image_slots (slot_key, url, alt_text, is_active, updated_at)
VALUES
  ('exterior', '', 'Hotel Fremont Exterior on Airport Road, Mohali', true, now()),
  ('super-deluxe', '', 'Super Deluxe Room with plush king bed and contemporary styling', true, now()),
  ('premium', '', 'Premium Room with elegant burgundy interiors', true, now()),
  ('cloud-six-banquet', '', 'Cloud Six Banquet venue up to 150 guests', true, now()),
  ('deluxe-room', '', 'Deluxe Room at Hotel Fremont', true, now()),
  ('restaurant', '', 'Hotel Fremont Restaurant - Ground Floor', true, now()),
  ('conference-hall', '', 'Conference Hall for business meetings', true, now())
ON CONFLICT (slot_key) DO UPDATE SET
  is_active = true,
  alt_text = EXCLUDED.alt_text,
  updated_at = now();

-- 8. UPDATE AVAILABILITY FUNCTION (Checks both confirmed reservations and paid/pending bookings)
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
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in THEN
    RETURN QUERY
    SELECT 
      rt.code,
      rt.name,
      rt.price_per_night,
      COALESCE(rt.rooms_total, rt.total_rooms) AS total_rooms,
      COALESCE(rt.rooms_total, rt.total_rooms) AS rooms_left,
      rt.max_guests
    FROM public.room_types rt
    WHERE rt.is_active = true
    ORDER BY rt.sort_order ASC;
    RETURN;
  END IF;

  RETURN QUERY
  WITH stay_dates AS (
    SELECT d::date AS night
    FROM generate_series(p_check_in, p_check_out - interval '1 day', interval '1 day') AS d
  ),
  reservations_usage AS (
    SELECT 
      rt.code AS rt_code,
      sd.night,
      COALESCE(SUM(r.rooms_requested), 0)::integer AS rooms_booked
    FROM public.room_types rt
    CROSS JOIN stay_dates sd
    LEFT JOIN public.reservations r 
      ON (r.room_type_code = rt.code OR lower(r.room_type) = lower(rt.name))
      AND r.status IN ('confirmed', 'converted')
      AND r.check_in <= sd.night
      AND r.check_out > sd.night
    WHERE rt.is_active = true
    GROUP BY rt.code, sd.night
  ),
  bookings_usage AS (
    SELECT 
      rt.code AS rt_code,
      sd.night,
      COALESCE(SUM(COALESCE(b.rooms_count, b.rooms_requested, 1)), 0)::integer AS rooms_booked
    FROM public.room_types rt
    CROSS JOIN stay_dates sd
    LEFT JOIN public.bookings b
      ON (b.room_category = rt.code OR lower(b.room_category) = lower(rt.name))
      AND (
        b.status = 'paid' 
        OR (b.status = 'pending' AND b.expires_at > now())
      )
      AND b.check_in <= sd.night
      AND b.check_out > sd.night
    WHERE rt.is_active = true
    GROUP BY rt.code, sd.night
  ),
  total_nightly_usage AS (
    SELECT 
      ru.rt_code,
      ru.night,
      (ru.rooms_booked + COALESCE(bu.rooms_booked, 0))::integer AS total_booked
    FROM reservations_usage ru
    LEFT JOIN bookings_usage bu ON bu.rt_code = ru.rt_code AND bu.night = ru.night
  ),
  peak_usage AS (
    SELECT 
      rt_code,
      COALESCE(MAX(total_booked), 0)::integer AS peak_booked
    FROM total_nightly_usage
    GROUP BY rt_code
  )
  SELECT 
    rt.code,
    rt.name,
    rt.price_per_night,
    COALESCE(rt.rooms_total, rt.total_rooms) AS total_rooms,
    GREATEST(0, COALESCE(rt.rooms_total, rt.total_rooms) - COALESCE(pu.peak_booked, 0))::integer AS rooms_left,
    rt.max_guests
  FROM public.room_types rt
  LEFT JOIN peak_usage pu ON pu.rt_code = rt.code
  WHERE rt.is_active = true
  ORDER BY rt.sort_order ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_room_availability(date, date) TO anon, authenticated;
