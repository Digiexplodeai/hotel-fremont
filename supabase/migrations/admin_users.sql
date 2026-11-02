-- ====================================================================
-- HOTEL FREMONT: ADMIN USERS & SECURITY HARDENING
-- Copy and run this in Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'front_desk', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated admins can view/manage
DROP POLICY IF EXISTS "Admins view admin_users" ON public.admin_users;
CREATE POLICY "Admins view admin_users" ON public.admin_users
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins manage admin_users" ON public.admin_users;
CREATE POLICY "Admins manage admin_users" ON public.admin_users
  FOR ALL USING (auth.uid() = id OR auth.role() = 'service_role');

-- 4. Helper trigger to automatically register user in admin_users if created as admin
CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(new.raw_app_meta_data->>'role', new.raw_user_meta_data->>'role') IN ('owner', 'manager', 'admin', 'front_desk') THEN
    INSERT INTO public.admin_users (id, email, role)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_app_meta_data->>'role', new.raw_user_meta_data->>'role', 'owner')
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_admin_user_created ON auth.users;
CREATE TRIGGER on_auth_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_user();

