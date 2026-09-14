-- Backup settings are company-owned; deployment_id has no valid application contract.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.backup_settings) THEN
    RAISE EXCEPTION 'backup_settings contains rows; map deployment_id to company_id before applying this migration';
  END IF;
END $$;

ALTER TABLE public.backup_settings
  DROP CONSTRAINT IF EXISTS backup_settings_deployment_id_key,
  DROP COLUMN IF EXISTS deployment_id,
  ALTER COLUMN company_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_backup_settings_company
  ON public.backup_settings (company_id);

DROP POLICY IF EXISTS backup_settings_read ON public.backup_settings;
DROP POLICY IF EXISTS backup_settings_write ON public.backup_settings;

CREATE POLICY backup_settings_read ON public.backup_settings
  FOR SELECT USING (
    user_has_company_access(auth.uid(), company_id)
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

CREATE POLICY backup_settings_write ON public.backup_settings
  FOR ALL
  USING (
    user_is_company_admin(auth.uid(), company_id)
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  )
  WITH CHECK (
    user_is_company_admin(auth.uid(), company_id)
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

CREATE INDEX IF NOT EXISTS idx_documents_company_created_date
  ON public.documents (company_id, created_date DESC);
