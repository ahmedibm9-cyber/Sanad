-- ============================================================================
-- SANAD V1 — 020: RLS policies for new tables
-- ============================================================================
-- RLS policies for all tables added in 018 and 019.
-- ============================================================================

-- ── Helper: company membership check (reusable subquery pattern) ──
-- We use a function to avoid repeating the membership check in every policy.

CREATE OR REPLACE FUNCTION public.get_user_company_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT cm.company_id FROM public.company_memberships cm
  WHERE cm.user_id = auth.uid() AND cm.active = true
$$;

-- ── 1. deployment_instance: system admin only ──
CREATE POLICY "deployment_instance_admin_read" ON public.deployment_instance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_system_admin = true)
  );

CREATE POLICY "deployment_instance_admin_insert" ON public.deployment_instance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_system_admin = true)
  );

-- ── 2. license_state: system admin only ──
CREATE POLICY "license_state_admin_read" ON public.license_state
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_system_admin = true)
  );

CREATE POLICY "license_state_admin_all" ON public.license_state
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_system_admin = true)
  );

-- ── 3. system_settings: system admin only ──
CREATE POLICY "system_settings_admin_read" ON public.system_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_system_admin = true)
  );

CREATE POLICY "system_settings_admin_all" ON public.system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_system_admin = true)
  );

-- ── 4. user_preferences: own preferences only ──
CREATE POLICY "user_preferences_own_read" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_preferences_own_insert" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_own_update" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_preferences_own_delete" ON public.user_preferences
  FOR DELETE USING (user_id = auth.uid());

-- ── 5. customer_contacts: company isolation ──
CREATE POLICY "customer_contacts_company_isolation" ON public.customer_contacts
  FOR ALL USING (
    customer_id IN (
      SELECT c.id FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 6. work_item_shared_data: company isolation via work_item ──
CREATE POLICY "work_item_shared_data_company_isolation" ON public.work_item_shared_data
  FOR ALL USING (
    work_item_id IN (
      SELECT wi.id FROM public.work_items wi
      WHERE wi.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 7. shipment_details: company isolation via work_item ──
CREATE POLICY "shipment_details_company_isolation" ON public.shipment_details
  FOR ALL USING (
    work_item_id IN (
      SELECT wi.id FROM public.work_items wi
      WHERE wi.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 8. document_items: company isolation via document ──
CREATE POLICY "document_items_company_isolation" ON public.document_items
  FOR ALL USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE d.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 9. document_party_snapshots: company isolation via document ──
CREATE POLICY "document_party_snapshots_company_isolation" ON public.document_party_snapshots
  FOR ALL USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE d.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 10. quotation_details: company isolation via document ──
CREATE POLICY "quotation_details_company_isolation" ON public.quotation_details
  FOR ALL USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE d.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 11. invoice_details: company isolation via document ──
CREATE POLICY "invoice_details_company_isolation" ON public.invoice_details
  FOR ALL USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE d.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 12. packing_list_details: company isolation via document ──
CREATE POLICY "packing_list_details_company_isolation" ON public.packing_list_details
  FOR ALL USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE d.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 13. delivery_note_details: company isolation via document ──
CREATE POLICY "delivery_note_details_company_isolation" ON public.delivery_note_details
  FOR ALL USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE d.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 14. bill_of_lading_details: company isolation via document ──
CREATE POLICY "bill_of_lading_details_company_isolation" ON public.bill_of_lading_details
  FOR ALL USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      WHERE d.company_id IN (SELECT public.get_user_company_ids())
    )
  );

-- ── 15. document_templates: read for all authenticated, write for admin ──
CREATE POLICY "document_templates_read" ON public.document_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "document_templates_admin_insert" ON public.document_templates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_system_admin = true)
  );

CREATE POLICY "document_templates_admin_update" ON public.document_templates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_system_admin = true)
  );

-- ── 16. company_template_defaults: company isolation ──
CREATE POLICY "company_template_defaults_company_isolation" ON public.company_template_defaults
  FOR ALL USING (
    company_id IN (SELECT public.get_user_company_ids())
  );

-- ── 17. saved_report_views: company isolation + own views ──
CREATE POLICY "saved_report_views_company_isolation" ON public.saved_report_views
  FOR ALL USING (
    company_id IN (SELECT public.get_user_company_ids())
  );

-- ── Revoke execute on helper function from anon ──
REVOKE EXECUTE ON FUNCTION public.get_user_company_ids() FROM anon;
