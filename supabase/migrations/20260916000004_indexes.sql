-- ============================================================================
-- SANAD V1 — 021: Performance indexes for new tables and gap columns
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- ── 1. user_preferences ──
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);

-- ── 2. customer_contacts ──
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer ON public.customer_contacts(customer_id);

-- ── 3. work_item_shared_data ──
CREATE INDEX IF NOT EXISTS idx_work_item_shared_data_work_item ON public.work_item_shared_data(work_item_id);

-- ── 4. shipment_details ──
CREATE INDEX IF NOT EXISTS idx_shipment_details_work_item ON public.shipment_details(work_item_id);

-- ── 5. document_items ──
CREATE INDEX IF NOT EXISTS idx_document_items_document ON public.document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_document_items_material ON public.document_items(material_id);

-- ── 6. document_party_snapshots ──
CREATE INDEX IF NOT EXISTS idx_document_party_snapshots_document ON public.document_party_snapshots(document_id);

-- ── 7. Document type details (1:1, PK is FK — no extra index needed) ──

-- ── 8. company_template_defaults ──
CREATE INDEX IF NOT EXISTS idx_company_template_defaults_company ON public.company_template_defaults(company_id);

-- ── 9. saved_report_views ──
CREATE INDEX IF NOT EXISTS idx_saved_report_views_company ON public.saved_report_views(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_report_views_user ON public.saved_report_views(user_id);

-- ── 10. GIN indexes for new text search targets ──
CREATE INDEX IF NOT EXISTS idx_customer_contacts_name_gin ON public.customer_contacts USING gin(name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_factory_code_records_name_gin ON public.factory_code_records USING gin(factory_name extensions.gin_trgm_ops);

-- ── 11. Composite indexes for common query patterns ──
CREATE INDEX IF NOT EXISTS idx_documents_company_type ON public.documents(company_id, document_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_company_status ON public.documents(company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_work_items_company_status ON public.work_items(company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_work_items_company_type ON public.work_items(company_id, type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_company_status ON public.customers(company_id, active) WHERE deleted_at IS NULL;

-- ── 12. Indexes for soft-delete filtered queries ──
CREATE INDEX IF NOT EXISTS idx_notes_work_item_active ON public.notes(work_item_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_report_issues_work_item_active ON public.report_issues(work_item_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_attachments_work_item_active ON public.attachments(work_item_id) WHERE active = true;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attachments'
      AND column_name = 'document_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_attachments_document_active
      ON public.attachments(document_id) WHERE active = true;
  END IF;
END $$;
