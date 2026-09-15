-- DOWN Migration: Reverse secure audit events

-- Restore direct INSERT permissions on audit_events
GRANT INSERT, UPDATE, DELETE ON public.audit_events TO anon, authenticated;

-- Recreate original policies
CREATE POLICY audit_events_insert ON public.audit_events
  FOR INSERT WITH CHECK (
    actor_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Drop the hardened function
DROP FUNCTION IF EXISTS public.record_audit_event(uuid, text, text, uuid, jsonb);

-- Re-grant execute to public
-- Note: record_audit_event was created in this migration, dropping it is sufficient
