-- ============================================================================
-- SANAD V1 — 018: Add missing columns to existing tables
-- ============================================================================
-- This migration adds columns identified in the gap analysis that are
-- missing from the current live database schema.
-- ============================================================================

-- ── 1. users: add auth_user_id, username, phone, avatar, account_status, last_login_at ──
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar text,
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'disabled')),
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Unique constraints for users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

-- ── 2. companies: add status, deleted_at, deleted_by ──
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- FK for deleted_by
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_deleted_by_fkey') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES public.users(id);
  END IF;
END $$;

-- ── 3. work_items: add destination, archived_at ──
ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- ── 4. materials: add manufacturer, default_packing, default_weight_unit,
--                  latest_selling_price, latest_selling_currency, latest_price_at
--          rename origin_country → country_of_origin for consistency
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS manufacturer text,
  ADD COLUMN IF NOT EXISTS default_packing text,
  ADD COLUMN IF NOT EXISTS default_weight_unit text,
  ADD COLUMN IF NOT EXISTS latest_selling_price numeric,
  ADD COLUMN IF NOT EXISTS latest_selling_currency text,
  ADD COLUMN IF NOT EXISTS latest_price_at timestamptz;

-- ── 5. work_item_materials: add snapshot and line-level fields ──
ALTER TABLE public.work_item_materials
  ADD COLUMN IF NOT EXISTS item_code text,
  ADD COLUMN IF NOT EXISTS description_override text,
  ADD COLUMN IF NOT EXISTS grade_snapshot text,
  ADD COLUMN IF NOT EXISTS hs_code_snapshot text,
  ADD COLUMN IF NOT EXISTS origin_snapshot text,
  ADD COLUMN IF NOT EXISTS packing text,
  ADD COLUMN IF NOT EXISTS package_count integer,
  ADD COLUMN IF NOT EXISTS weight_unit text,
  ADD COLUMN IF NOT EXISTS line_total numeric;

-- ── 6. documents: add financial and display fields ──
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS expiration_date date,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS vat_rate numeric,
  ADD COLUMN IF NOT EXISTS subtotal numeric,
  ADD COLUMN IF NOT EXISTS vat_amount numeric,
  ADD COLUMN IF NOT EXISTS total numeric,
  ADD COLUMN IF NOT EXISTS bank_account_id uuid,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS terms text,
  ADD COLUMN IF NOT EXISTS show_logo boolean DEFAULT true;

-- FK for bank_account_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_bank_account_id_fkey') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_bank_account_id_fkey
      FOREIGN KEY (bank_account_id) REFERENCES public.company_bank_accounts(id);
  END IF;
END $$;

-- ── 7. notes: add deleted_at ──
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── 8. report_issues: add resolved_by ──
ALTER TABLE public.report_issues
  ADD COLUMN IF NOT EXISTS resolved_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_issues_resolved_by_fkey') THEN
    ALTER TABLE public.report_issues
      ADD CONSTRAINT report_issues_resolved_by_fkey
      FOREIGN KEY (resolved_by) REFERENCES public.users(id);
  END IF;
END $$;

-- ── 9. attachments: add category, description, checksum, deleted_at, deleted_by ──
ALTER TABLE public.attachments
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS document_id uuid,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS checksum text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attachments_deleted_by_fkey') THEN
    ALTER TABLE public.attachments
      ADD CONSTRAINT attachments_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES public.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attachments_document_id_fkey') THEN
    ALTER TABLE public.attachments
      ADD CONSTRAINT attachments_document_id_fkey
      FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── 10. audit_events: add entity_reference, before_data, after_data, metadata, ip, user_agent ──
ALTER TABLE public.audit_events
  ADD COLUMN IF NOT EXISTS entity_reference text,
  ADD COLUMN IF NOT EXISTS before_data jsonb,
  ADD COLUMN IF NOT EXISTS after_data jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS actor_user_id uuid;

-- ── 11. notifications: add read_at ──
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- ── 12. material_files: add file_type, checksum, uploaded_by ──
ALTER TABLE public.material_files
  ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'OTHER'
    CHECK (file_type IN ('TDS', 'MSDS', 'COA', 'OTHER')),
  ADD COLUMN IF NOT EXISTS checksum text,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_files_uploaded_by_fkey') THEN
    ALTER TABLE public.material_files
      ADD CONSTRAINT material_files_uploaded_by_fkey
      FOREIGN KEY (uploaded_by) REFERENCES public.users(id);
  END IF;
END $$;

-- ── 13. material_price_events: add customer_id, work_item_id, document_id, unit ──
ALTER TABLE public.material_price_events
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS work_item_id uuid,
  ADD COLUMN IF NOT EXISTS document_id uuid,
  ADD COLUMN IF NOT EXISTS unit text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_price_events_customer_id_fkey') THEN
    ALTER TABLE public.material_price_events
      ADD CONSTRAINT material_price_events_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_price_events_work_item_id_fkey') THEN
    ALTER TABLE public.material_price_events
      ADD CONSTRAINT material_price_events_work_item_id_fkey
      FOREIGN KEY (work_item_id) REFERENCES public.work_items(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_price_events_document_id_fkey') THEN
    ALTER TABLE public.material_price_events
      ADD CONSTRAINT material_price_events_document_id_fkey
      FOREIGN KEY (document_id) REFERENCES public.documents(id);
  END IF;
END $$;

-- ── 14. factory_code_records: add address, active_in_latest_source, timestamps ──
ALTER TABLE public.factory_code_records
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS active_in_latest_source boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- Add FK constraints for import IDs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'factory_code_records_first_seen_import_id_fkey') THEN
    ALTER TABLE public.factory_code_records
      ADD CONSTRAINT factory_code_records_first_seen_import_id_fkey
      FOREIGN KEY (first_seen_import_id) REFERENCES public.factory_code_imports(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'factory_code_records_last_seen_import_id_fkey') THEN
    ALTER TABLE public.factory_code_records
      ADD CONSTRAINT factory_code_records_last_seen_import_id_fkey
      FOREIGN KEY (last_seen_import_id) REFERENCES public.factory_code_imports(id);
  END IF;
END $$;

-- ── 15. company_config_lists: add category column (rename list_name → category) ──
-- The existing table uses list_name; we add category as an alias or migrate
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_config_lists' AND column_name = 'category') THEN
    ALTER TABLE public.company_config_lists ADD COLUMN category text;
    -- Backfill from list_name
    UPDATE public.company_config_lists SET category = list_name WHERE category IS NULL;
    ALTER TABLE public.company_config_lists ALTER COLUMN category SET NOT NULL;
  END IF;
END $$;

-- Add label_ar, label_en, value columns to company_config_lists
ALTER TABLE public.company_config_lists
  ADD COLUMN IF NOT EXISTS label_ar text,
  ADD COLUMN IF NOT EXISTS label_en text,
  ADD COLUMN IF NOT EXISTS value text,
  ADD COLUMN IF NOT EXISTS code text;

-- Add unique constraint on (company_id, category, code)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_config_lists_company_category_code_key') THEN
    ALTER TABLE public.company_config_lists
      ADD CONSTRAINT company_config_lists_company_category_code_key
      UNIQUE (company_id, category, code);
  END IF;
END $$;
