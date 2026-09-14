-- Fix H9: Backup RLS cross-company visibility
-- Add company_id to backups table and tighten RLS policy

-- 1. Add company_id column
ALTER TABLE backups ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_backups_company ON backups(company_id);

-- 2. Backfill from deployment_id (backups linked to deployments inherit company)
-- Note: deployment_id is a UUID reference, not a company reference
-- In practice, backups are created by the app which sets company_id going forward

-- 3. Drop old overly-permissive policies
DROP POLICY IF EXISTS backups_read ON backups;
DROP POLICY IF EXISTS backups_write ON backups;

-- 4. Recreate with company_id check
CREATE POLICY backups_read ON backups
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.user_id = auth.uid()
          AND cm.base_role = 'admin'
          AND cm.active = TRUE
          AND cm.company_id = backups.company_id
      )
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY backups_write ON backups
  FOR ALL USING (
    (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.user_id = auth.uid()
          AND cm.base_role = 'admin'
          AND cm.active = TRUE
          AND cm.company_id = backups.company_id
      )
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );
