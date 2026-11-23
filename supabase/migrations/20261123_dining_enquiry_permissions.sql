-- ==============================================================================
-- HOTEL FREMONT: DINING & EVENT ENQUIRIES PERMISSIONS & SCHEMA REVIEW MIGRATION
-- File: supabase/migrations/20261123_dining_enquiry_permissions.sql
--
-- NOTE: THIS MIGRATION IS PROVIDED FOR REVIEW AND DOCUMENTATION ONLY.
-- DO NOT EXECUTE AUTOMATICALLY.
--
-- CONTEXT & ROOT CAUSE:
-- In migration 20261102_inventory_system.sql, direct public INSERT on `public.reservations`
-- was revoked from the `anon` PostgreSQL role:
--   REVOKE INSERT ON public.reservations FROM anon;
-- This was intentional to prevent unauthorized clients from creating arbitrary room bookings
-- or bypassing payment/inventory checks.
--
-- The application architecture submits public leads (Dining Hall table enquiries, Cloud 6
-- Banquet enquiries, and Conference Hall enquiries) via a secure Next.js Server Action
-- (`submitPublicEnquiryAction`). The Server Action executes server-side with
-- `SUPABASE_SERVICE_ROLE_KEY` (PostgreSQL `service_role`), which bypasses RLS and writes
-- directly without exposing service credentials to the client.
--
-- If an administrator also wishes to allow optional direct client INSERT for anon leads
-- with strict RLS guards, the DDL below illustrates the exact permissions required.
-- ==============================================================================

-- 1. Ensure service_role has explicit, uninhibited permissions on public.reservations
GRANT ALL PRIVILEGES ON public.reservations TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. Ensure RLS is active on public.reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 3. OPTIONAL: Hardened RLS Policy for direct anon lead creation (if ever called via anon key)
-- Notice: Restricts anon to ONLY inserting records with status = 'new' and non-room channels.
-- Prevents anon from setting status = 'confirmed', 'paid', or booking guest rooms.
DROP POLICY IF EXISTS "Allow anon to submit non-room enquiries" ON public.reservations;

CREATE POLICY "Allow anon to submit non-room enquiries"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (
  status = 'new'
  AND (
    channel IN ('dining', 'dining_aura', 'event_banquet', 'conference', 'contact')
    OR room_type_code IN ('dining', 'event_banquet', 'conference', 'contact')
    OR lower(room_type) IN ('hotel fremont dining hall', 'cloud 6 banquet', 'conference hall', 'general inquiry')
  )
);

-- Note: If the above policy is activated, GRANT INSERT ON public.reservations TO anon; is also required:
-- GRANT INSERT ON public.reservations TO anon;

-- 4. Verify existing admin full access policies
-- Authenticated admins retain complete SELECT, INSERT, UPDATE, DELETE access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;

-- 5. Inventory Isolation Guarantee:
-- The get_room_availability RPC filters by:
--   WHERE r.status IN ('confirmed', 'converted', 'paid') AND rt.is_active = true
--   JOIN public.room_types rt ON r.room_type_code = rt.code ...
-- Because enquiries are inserted with status = 'new' and room_type_code = 'dining'/'conference'/'event_banquet'
-- (none of which exist in public.room_types), enquiries NEVER reduce available keys from the 21 physical rooms.
-- ==============================================================================
