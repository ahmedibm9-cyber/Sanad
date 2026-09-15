-- DOWN Migration: Reverse company backup settings isolation and document list index

-- Drop new index
DROP INDEX IF EXISTS idx_documents_company_created_date;

-- Drop new policies
DROP POLICY IF EXISTS backup_settings_read ON public.backup_settings;
DROP POLICY IF EXISTS backup_settings_write ON public.backup_settings;

-- Recreate original policies (without helper functions)
CREATE POLICY backup_settings_read ON public.backup_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY backup_settings_write ON public.backup_settings
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

-- Restore deployment_id column and unique constraint
ALTER TABLE public.backup_settings ADD COLUMN deployment_id UUID;
ALTER TABLE public.backup_settings ADD CONSTRAINT backup_settings_deployment_id_key UNIQUE (deployment_id);
ALTER TABLE public.backup_settings ALTER COLUMN company_id DROP NOT NULL;

-- Drop unique index on company_id
DROP INDEX IF EXISTS idx_backup_settings_company;
