-- ====================================================================
-- HOTEL FREMONT: image_slots TABLE & RLS POLICIES
-- Copy and run this directly in the Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Create table image_slots if it does not exist
CREATE TABLE IF NOT EXISTS public.image_slots (
  slot_key TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt_text TEXT,
  focal_x TEXT DEFAULT '50%',
  focal_y TEXT DEFAULT '50%',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure columns exist if table was previously created with another schema
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS focal_x TEXT DEFAULT '50%';
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS focal_y TEXT DEFAULT '50%';
ALTER TABLE public.image_slots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Drop NOT NULL constraints from older schema columns (if present)
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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.image_slots ENABLE ROW LEVEL SECURITY;

-- 5. Public read policy (allows public website and admin to read slot URLs)
DROP POLICY IF EXISTS "Public read image_slots" ON public.image_slots;
CREATE POLICY "Public read image_slots" ON public.image_slots
  FOR SELECT USING (true);

-- 6. Server write policy (allows server actions to upsert & delete slot records)
DROP POLICY IF EXISTS "Managers manage image_slots" ON public.image_slots;
DROP POLICY IF EXISTS "Allow all writes to image_slots" ON public.image_slots;
CREATE POLICY "Allow all writes to image_slots" ON public.image_slots
  FOR ALL USING (true) WITH CHECK (true);

