-- DOWN Migration 015: Reverse Fix backup RLS company isolation

-- Drop policies
DROP POLICY IF EXISTS backups_read ON backups;
DROP POLICY IF EXISTS backups_write ON backups;

-- Recreate original overly-permissive policies (without company_id check)
CREATE POLICY backups_read ON backups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY backups_write ON backups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Drop index and column
DROP INDEX IF EXISTS idx_backups_company;
ALTER TABLE backups DROP COLUMN IF EXISTS company_id;
