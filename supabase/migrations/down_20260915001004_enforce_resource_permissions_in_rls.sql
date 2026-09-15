-- DOWN Migration: Reverse enforce resource permissions in RLS

-- Drop new permission-based policies
DROP POLICY IF EXISTS customers_insert ON public.customers;
DROP POLICY IF EXISTS customers_update ON public.customers;
DROP POLICY IF EXISTS customers_delete ON public.customers;
DROP POLICY IF EXISTS materials_insert ON public.materials;
DROP POLICY IF EXISTS materials_update ON public.materials;
DROP POLICY IF EXISTS materials_delete ON public.materials;
DROP POLICY IF EXISTS documents_insert ON public.documents;
DROP POLICY IF EXISTS documents_update ON public.documents;
DROP POLICY IF EXISTS documents_delete ON public.documents;
DROP POLICY IF EXISTS attachments_insert ON public.attachments;
DROP POLICY IF EXISTS attachments_update ON public.attachments;
DROP POLICY IF EXISTS attachments_delete ON public.attachments;
DROP POLICY IF EXISTS work_items_insert ON public.work_items;
DROP POLICY IF EXISTS work_items_update ON public.work_items;
DROP POLICY IF EXISTS work_items_delete ON public.work_items;

-- Recreate original broad "Company members can manage" policies
CREATE POLICY "Company members can manage customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = customers.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY "Company members can manage materials" ON public.materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = materials.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY "Company members can manage documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = documents.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY "Company members can manage attachments" ON public.attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = attachments.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY "Company members can manage work_items" ON public.work_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = work_items.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Remove seed permissions (files.upload and files.delete from this migration)
-- Note: Original files.upload/delete may have existed; this migration added duplicates
DELETE FROM public.permission_catalog
WHERE permission_key IN ('files.upload', 'files.delete')
  AND sort_order IN (63, 64);
