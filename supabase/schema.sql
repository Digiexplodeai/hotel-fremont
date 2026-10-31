-- ====================================================================
-- HOTEL FREMONT - SUPABASE PRODUCTION DATABASE SCHEMA
-- ====================================================================
-- Exactly 12 Rooms, Cloudflare R2 Media Tracking, CMS & Role-Based Auth
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'front_desk' CHECK (role IN ('owner', 'manager', 'front_desk')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Helper to get user role in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Automatic profile creation on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'front_desk')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Cloudflare R2 Media Tracking Table
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'hotel-fremont-media',
  section TEXT NOT NULL DEFAULT 'general',
  category TEXT NOT NULL DEFAULT 'general',
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INT,
  height INT,
  blur_data_url TEXT,
  alt_text TEXT,
  is_trash BOOLEAN DEFAULT false,
  trashed_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Website Image Slots (Single Source of Truth for all site images)
CREATE TABLE IF NOT EXISTS public.image_slots (
  slot_key TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt_text TEXT,
  focal_x TEXT DEFAULT '50%',
  focal_y TEXT DEFAULT '50%',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safe migrations in case table was previously created with different columns
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS focal_x TEXT DEFAULT '50%';
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS focal_y TEXT DEFAULT '50%';
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  ALTER TABLE public.image_slots ALTER COLUMN label DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.image_slots ALTER COLUMN section DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.image_slots ALTER COLUMN fallback_url DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. Curated Gallery Items (Visual Journal)
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Architecture', 'Suites', 'Dining', 'Events')),
  media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  fallback_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  caption TEXT,
  span TEXT DEFAULT 'col-span-1 row-span-1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Room Categories (4 Categories for Exactly 12 Rooms)
CREATE TABLE IF NOT EXISTS public.room_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price INT NOT NULL,
  size TEXT NOT NULL,
  max_guests INT NOT NULL,
  bed TEXT NOT NULL,
  badge TEXT,
  view TEXT,
  description TEXT NOT NULL,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  fallback_image TEXT NOT NULL,
  gallery_fallback JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Physical Rooms (Exactly 12 Rooms: 101-106, 201-203, 301-302, 401)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT UNIQUE NOT NULL,
  category_slug TEXT NOT NULL REFERENCES public.room_categories(slug) ON UPDATE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'blocked')),
  floor INT NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Bookings & Reservations
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT UNIQUE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  category_slug TEXT NOT NULL REFERENCES public.room_categories(slug),
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INT NOT NULL DEFAULT 1,
  total_amount NUMERIC(10,2) NOT NULL,
  advance_paid NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'phone', 'walk_in', 'whatsapp')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Enquiries & Form Submissions
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('rate_check', 'book_now', 'dining_aura', 'event_banquet', 'contact')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dates TEXT,
  guests INT,
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. CMS Site Content Sections
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Comprehensive Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile; owners/managers can view all
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Owners update profiles" ON public.profiles
  FOR ALL USING (public.get_user_role() = 'owner');

-- Public readable tables (Website public display)
CREATE POLICY "Public read image_slots" ON public.image_slots
  FOR SELECT USING (true);

CREATE POLICY "Public read gallery_items" ON public.gallery_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read room_categories" ON public.room_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read rooms non-sensitive" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Public read site_content" ON public.site_content
  FOR SELECT USING (true);

CREATE POLICY "Public read media_assets" ON public.media_assets
  FOR SELECT USING (is_trash = false);

-- Public write for enquiries & bookings
CREATE POLICY "Public insert enquiries" ON public.enquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Staff access policies (Front Desk, Manager, Owner)
CREATE POLICY "Staff read bookings" ON public.bookings
  FOR SELECT USING (public.get_user_role() IN ('owner', 'manager', 'front_desk'));

CREATE POLICY "Staff update bookings" ON public.bookings
  FOR UPDATE USING (public.get_user_role() IN ('owner', 'manager', 'front_desk'));

CREATE POLICY "Staff read rooms" ON public.rooms
  FOR ALL USING (public.get_user_role() IN ('owner', 'manager', 'front_desk'));

CREATE POLICY "Staff read enquiries" ON public.enquiries
  FOR ALL USING (public.get_user_role() IN ('owner', 'manager', 'front_desk'));

-- Manager & Owner policies (CMS, Media, Settings)
CREATE POLICY "Managers manage media" ON public.media_assets
  FOR ALL USING (public.get_user_role() IN ('owner', 'manager'));

DROP POLICY IF EXISTS "Managers manage image_slots" ON public.image_slots;
CREATE POLICY "Allow all writes to image_slots" ON public.image_slots
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Managers manage gallery_items" ON public.gallery_items
  FOR ALL USING (public.get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Managers manage room_categories" ON public.room_categories
  FOR ALL USING (public.get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Managers manage site_content" ON public.site_content
  FOR ALL USING (public.get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Managers view audit_logs" ON public.audit_logs
  FOR SELECT USING (public.get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Staff create audit_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================================================
-- SEED DATA (HOTEL FREMONT - 12 ROOMS & INITIAL SLOTS)
-- ====================================================================

-- 1. Seed 4 Room Categories
INSERT INTO public.room_categories (slug, name, price, size, max_guests, bed, badge, view, description, fallback_image, gallery_fallback, is_active)
VALUES 
(
  'deluxe-king',
  'Deluxe King Room',
  5499,
  '380 sq.ft',
  2,
  'King Bed',
  'Best Value',
  'City Skyline & Courtyard View',
  'A sanctuary of calm featuring warm wooden textures, custom atmospheric lighting, an Italian marble en-suite with rain shower, and a high-speed ergonomic workstation.',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000',
  '["https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200"]'::jsonb,
  true
),
(
  'premier-executive',
  'Premier Executive Suite',
  8999,
  '540 sq.ft',
  3,
  'King Bed',
  'Corporate Choice',
  'Panoramic Airport Road & Boulevard View',
  'Generously proportioned with a private living lounge, plush velvet seating, walk-in dressing closet, and deep-soaking bathtub. Ideal for business leaders and extended stays.',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000',
  '["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=1200"]'::jsonb,
  true
),
(
  'royal-fremont',
  'The Royal Fremont Suite',
  14999,
  '780 sq.ft',
  4,
  'King Bed',
  'Signature Experience',
  'Dual-Aspect Garden & Horizon View',
  'The epitome of boutique grandeur. Features a 6-seater private dining alcove, hand-finished brass accents, champagne welcome bar, and dedicated butler service on call.',
  '/assets/rooms/royal-fremont-suite.webp',
  '["/assets/rooms/royal-fremont-suite.webp", "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=1200"]'::jsonb,
  true
),
(
  'presidential-penthouse',
  'Presidential Penthouse',
  24999,
  '1,250 sq.ft',
  6,
  'King Bed',
  'Ultra Luxury',
  'Top-Floor 360° Skyline & Airport Runway Sunset View',
  'Our crowning jewel on the highest tier. Boasting two luxurious master bedrooms, a private terrace, grand Steinway piano lounge, bespoke gold-leaf ceiling, and round-the-clock personal chef availability.',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000',
  '["https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1200", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200", "/assets/hero/hero-room-2.webp"]'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed Exactly 12 Physical Rooms
INSERT INTO public.rooms (room_number, category_slug, floor, status)
VALUES
('101', 'deluxe-king', 1, 'available'),
('102', 'deluxe-king', 1, 'available'),
('103', 'deluxe-king', 1, 'available'),
('104', 'deluxe-king', 1, 'available'),
('105', 'deluxe-king', 1, 'available'),
('106', 'deluxe-king', 1, 'available'),
('201', 'premier-executive', 2, 'available'),
('202', 'premier-executive', 2, 'available'),
('203', 'premier-executive', 2, 'available'),
('301', 'royal-fremont', 3, 'available'),
('302', 'royal-fremont', 3, 'available'),
('401', 'presidential-penthouse', 4, 'available')
ON CONFLICT (room_number) DO NOTHING;

-- 3. Seed Master Image Slots
INSERT INTO public.image_slots (slot_key, label, section, fallback_url, alt_text)
VALUES
('branding.logo', 'Primary Hotel Logo', 'branding', '/assets/logo.png', 'Hotel Fremont Official Brand Logo'),
('branding.icon', 'Favicon & Tab Icon', 'branding', '/assets/f-icon.png', 'Hotel Fremont Icon'),
('seo.og_image', 'OpenGraph Social Card', 'seo', '/assets/logo.png', 'Hotel Fremont Luxury Boutique Hotel'),
('hero.slide_1', 'Hero Background Slide 1', 'hero', '/assets/hero/hero-suite.webp', 'Classic Luxury Suite'),
('hero.slide_2', 'Hero Background Slide 2', 'hero', '/assets/hero/hero-room-1.webp', 'Deluxe King Room'),
('hero.slide_3', 'Hero Background Slide 3', 'hero', '/assets/hero/hero-lobby.webp', 'Panoramic Modern Suite'),
('hero.slide_4', 'Hero Background Slide 4', 'hero', '/assets/hero/hero-room-2.webp', 'Executive Lounge Suite'),
('about.image_primary', 'About Story Main Image', 'heritage', '/assets/hero/hero-room-1.webp', 'Hotel Fremont Deluxe Suite Sanctuary'),
('about.image_secondary', 'About Story Secondary Accent', 'heritage', '/assets/hero/hero-room-2.webp', 'Hotel Fremont Luxury Interior Suite'),
('rooms.deluxe-king.main', 'Deluxe King Room Card Cover', 'rooms', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000', 'Deluxe King Room'),
('rooms.premier-executive.main', 'Premier Executive Suite Card Cover', 'rooms', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000', 'Premier Executive Suite'),
('rooms.royal-fremont.main', 'The Royal Fremont Suite Card Cover', 'rooms', '/assets/rooms/royal-fremont-suite.webp', 'The Royal Fremont Suite'),
('rooms.presidential-penthouse.main', 'Presidential Penthouse Card Cover', 'rooms', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000', 'Presidential Penthouse'),
('dining.banner_primary', 'Aura Restaurant Main Banner', 'dining', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200', 'Aura Gourmet Restaurant & Lounge'),
('dining.banner_secondary', 'Aura Cocktail & Private Lounge', 'dining', 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800', 'Aura Private Dining Room'),
('events.venue_1', 'Grand Fremont Ballroom Image', 'events', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000', 'The Grand Fremont Ballroom'),
('events.venue_2', 'Fremont Terrace Lawn Image', 'events', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=1000', 'The Fremont Terrace Lawn'),
('events.venue_3', 'Executive Boardroom Image', 'events', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1000', 'The Executive Boardroom')
ON CONFLICT (slot_key) DO NOTHING;

-- 4. Seed Curated Gallery Items
INSERT INTO public.gallery_items (title, category, fallback_url, display_order, span)
VALUES
('Hotel Fremont Facade at Dusk', 'Architecture', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200', 1, 'col-span-2 row-span-2'),
('Royal Fremont Suite Master Bedroom', 'Suites', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000', 2, 'col-span-1 row-span-1'),
('Aura Fine Dining & Cocktail Bar', 'Dining', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000', 3, 'col-span-1 row-span-1'),
('Grand Ballroom Wedding Setup', 'Events', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000', 4, 'col-span-1 row-span-2'),
('Presidential Penthouse Living Lounge', 'Suites', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000', 5, 'col-span-1 row-span-1'),
('Italian Marble En-Suite Bathroom', 'Suites', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000', 6, 'col-span-1 row-span-1'),
('Chef''s Signature Tandoor Platter', 'Dining', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000', 7, 'col-span-1 row-span-1'),
('Deluxe King Room Sanctuary', 'Suites', '/assets/hero/hero-room-1.webp', 8, 'col-span-1 row-span-1')
ON CONFLICT DO NOTHING;

-- 5. Seed Initial Site Settings
INSERT INTO public.site_content (key, data)
VALUES
('site_settings', '{
  "phoneDisplay": "+91 98727 68514",
  "phoneTel": "+919872768514",
  "whatsappNumber": "919872768514",
  "bookingEmail": "reservations@hotelfremont.com",
  "address": "Hotel Fremont, Airport Road, Sector 80, SAS Nagar, Mohali, Punjab - 140308",
  "airportDistance": "10 Minutes from Chandigarh International Airport (IXC)",
  "checkInTime": "14:00",
  "checkOutTime": "12:00",
  "gstPercent": 18,
  "googleRating": "4.9",
  "googleReviewsCount": "",
  "isRatingVerified": false,
  "instagramUrl": "",
  "facebookUrl": "",
  "linkedinUrl": "",
  "youtubeUrl": ""
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

