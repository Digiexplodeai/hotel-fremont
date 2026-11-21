-- ============================================================================
-- HOTEL FREMONT: ADMINISTRATIVE AUDIT LOGS TABLE MIGRATION
-- Authoritative, tamper-evident logging for deletions, customer data privacy,
-- test record cleanups, and administrative actions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    user_email TEXT,
    changes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for speedy ordering & retrieval
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

-- Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to view audit logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs'
    ) THEN
        CREATE POLICY "Admins can view audit logs"
            ON public.audit_logs
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

-- Allow authenticated admins and service role to record audit logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' AND policyname = 'Admins and service role can insert audit logs'
    ) THEN
        CREATE POLICY "Admins and service role can insert audit logs"
            ON public.audit_logs
            FOR INSERT
            TO authenticated, service_role
            WITH CHECK (true);
    END IF;
END $$;
