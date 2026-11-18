-- ==============================================================================
-- HOTEL FREMONT: RAZORPAY ONLINE BOOKINGS & FULL PAYMENT ENGINE
-- Migration for Supabase SQL Editor
-- ==============================================================================

-- 1. Create or extend the bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  room_category TEXT NOT NULL,
  rooms_requested INTEGER NOT NULL DEFAULT 1 CHECK (rooms_requested >= 1),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL CHECK (nights >= 1),
  guests INTEGER NOT NULL DEFAULT 1 CHECK (guests >= 1),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  payment_method TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Ensure all required columns exist if the table was created previously with older schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'booking_ref') THEN
    ALTER TABLE public.bookings ADD COLUMN booking_ref TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'access_token') THEN
    ALTER TABLE public.bookings ADD COLUMN access_token TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'phone') THEN
    ALTER TABLE public.bookings ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'email') THEN
    ALTER TABLE public.bookings ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'room_category') THEN
    ALTER TABLE public.bookings ADD COLUMN room_category TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'rooms_requested') THEN
    ALTER TABLE public.bookings ADD COLUMN rooms_requested INTEGER NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'nights') THEN
    ALTER TABLE public.bookings ADD COLUMN nights INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'guests') THEN
    ALTER TABLE public.bookings ADD COLUMN guests INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'amount_paid') THEN
    ALTER TABLE public.bookings ADD COLUMN amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'currency') THEN
    ALTER TABLE public.bookings ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'razorpay_order_id') THEN
    ALTER TABLE public.bookings ADD COLUMN razorpay_order_id TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'razorpay_payment_id') THEN
    ALTER TABLE public.bookings ADD COLUMN razorpay_payment_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'payment_method') THEN
    ALTER TABLE public.bookings ADD COLUMN payment_method TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'special_requests') THEN
    ALTER TABLE public.bookings ADD COLUMN special_requests TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'paid_at') THEN
    ALTER TABLE public.bookings ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'expires_at') THEN
    ALTER TABLE public.bookings ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Drop and recreate status check constraint to support all Razorpay states
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'));

-- 2. Indexes for fast lookups & concurrency checks
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON public.bookings(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_ref ON public.bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_stay_dates ON public.bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON public.bookings(expires_at) WHERE status = 'pending';

-- 3. Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop any legacy policies
DROP POLICY IF EXISTS "Deny public select on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Deny public insert on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Deny public update on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view and manage bookings" ON public.bookings;

-- Only authenticated admins can view and manage bookings via Supabase Auth
CREATE POLICY "Admins can view and manage bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public anon clients CANNOT read or write bookings directly.
-- All guest bookings, Razorpay order creations, and signature verifications 
-- MUST run through server API routes using the Supabase Service Role key.

-- 4. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bookings_updated_at();

-- 5. Helper function to clean up expired pending bookings
CREATE OR REPLACE FUNCTION public.expire_stale_pending_bookings()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.bookings
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ensure public.reservations has reference_code and channel columns for sync
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'reference_code') THEN
    ALTER TABLE public.reservations ADD COLUMN reference_code TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'channel') THEN
    ALTER TABLE public.reservations ADD COLUMN channel TEXT DEFAULT 'website';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'room_type_code') THEN
    ALTER TABLE public.reservations ADD COLUMN room_type_code TEXT;
  END IF;
END $$;

