-- ============================================================================
-- SANAD V1 — 019: Add missing tables from gap analysis
-- ============================================================================
-- Tables identified in the Master Data Inventory that don't exist yet.
-- ============================================================================

-- ── 1. deployment_instance ──
CREATE TABLE IF NOT EXISTS public.deployment_instance (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  installation_id text NOT NULL,
  deployment_name text,
  environment text NOT NULL DEFAULT 'production'
    CHECK (environment IN ('production', 'staging', 'development')),
  sanad_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. license_state ──
CREATE TABLE IF NOT EXISTS public.license_state (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  license_key_ref text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'suspended', 'grace')),
  valid_until timestamptz,
  last_verified_at timestamptz,
  grace_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 3. system_settings ──
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 4. user_preferences ──
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  ui_language text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'Asia/Riyadh',
  date_format text NOT NULL DEFAULT 'YYYY-MM-DD',
  number_format text,
  sidebar_collapsed boolean NOT NULL DEFAULT false,
  preferred_page_size integer NOT NULL DEFAULT 25,
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  reduced_motion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ── 5. customer_contacts ──
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  customer_id uuid NOT NULL,
  name text NOT NULL,
  job_title text,
  email text,
  phone text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- ── 6. work_item_shared_data ──
CREATE TABLE IF NOT EXISTS public.work_item_shared_data (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  work_item_id uuid NOT NULL UNIQUE,
  currency text,
  payment_terms text,
  delivery_terms text,
  incoterm text,
  destination_country text,
  destination_city text,
  port_of_loading text,
  port_of_discharge text,
  transport_responsibility text,
  loading_responsibility text,
  unloading_responsibility text,
  consignee text,
  notify_party text,
  shipping_method text,
  shipping_notes text,
  general_terms text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_item_shared_data_work_item_id_fkey FOREIGN KEY (work_item_id) REFERENCES public.work_items(id) ON DELETE CASCADE
);

-- ── 7. shipment_details ──
CREATE TABLE IF NOT EXISTS public.shipment_details (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  work_item_id uuid NOT NULL UNIQUE,
  shipping_method text,
  place_of_receipt text,
  port_of_loading text,
  port_of_discharge text,
  place_of_delivery text,
  vessel text,
  voyage text,
  container_number text,
  seal_number text,
  freight_terms text,
  marks_and_numbers text,
  total_packages integer,
  net_weight numeric,
  gross_weight numeric,
  cbm numeric,
  planned_shipping_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipment_details_work_item_id_fkey FOREIGN KEY (work_item_id) REFERENCES public.work_items(id) ON DELETE CASCADE
);

-- ── 8. document_items ──
CREATE TABLE IF NOT EXISTS public.document_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  document_id uuid NOT NULL,
  material_id uuid,
  item_code text,
  material_name text NOT NULL,
  grade text,
  description text,
  hs_code text,
  packing text,
  origin text,
  packages integer,
  quantity numeric NOT NULL DEFAULT 0,
  weight_unit text,
  unit_price numeric,
  currency text,
  net_weight numeric,
  gross_weight numeric,
  line_total numeric,
  marks_numbers text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_items_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
  CONSTRAINT document_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL
);

-- ── 9. document_party_snapshots ──
CREATE TABLE IF NOT EXISTS public.document_party_snapshots (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  document_id uuid NOT NULL,
  party_type text NOT NULL
    CHECK (party_type IN ('seller', 'buyer', 'consignee', 'notify_party', 'bank')),
  snapshot_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_party_snapshots_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
  CONSTRAINT document_party_snapshots_document_id_party_type_key UNIQUE (document_id, party_type)
);

-- ── 10. quotation_details ──
CREATE TABLE IF NOT EXISTS public.quotation_details (
  document_id uuid PRIMARY KEY,
  validity_days integer,
  validity_text text,
  offer_notes text,
  commercial_notes text,
  CONSTRAINT quotation_details_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE
);

-- ── 11. invoice_details ──
CREATE TABLE IF NOT EXISTS public.invoice_details (
  document_id uuid PRIMARY KEY,
  invoice_reference text,
  buyer_reference text,
  tax_treatment text,
  qr_metadata jsonb,
  CONSTRAINT invoice_details_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE
);

-- ── 12. packing_list_details ──
CREATE TABLE IF NOT EXISTS public.packing_list_details (
  document_id uuid PRIMARY KEY,
  invoice_reference text,
  container_number text,
  seal_number text,
  total_packages integer,
  total_net_weight numeric,
  total_gross_weight numeric,
  cbm numeric,
  marks_numbers text,
  CONSTRAINT packing_list_details_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE
);

-- ── 13. delivery_note_details ──
CREATE TABLE IF NOT EXISTS public.delivery_note_details (
  document_id uuid PRIMARY KEY,
  receiver text,
  delivery_location text,
  shipping_method text,
  prepare_before date,
  related_invoice text,
  received_by text,
  remarks text,
  CONSTRAINT delivery_note_details_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE
);

-- ── 14. bill_of_lading_details ──
CREATE TABLE IF NOT EXISTS public.bill_of_lading_details (
  document_id uuid PRIMARY KEY,
  shipper text,
  consignee text,
  notify_party text,
  place_of_receipt text,
  port_of_loading text,
  port_of_discharge text,
  place_of_delivery text,
  vessel text,
  voyage text,
  container_number text,
  seal_number text,
  freight_terms text,
  marks_numbers text,
  description_of_goods text,
  packages integer,
  gross_weight numeric,
  net_weight numeric,
  remarks text,
  CONSTRAINT bill_of_lading_details_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE
);

-- ── 15. document_templates ──
CREATE TABLE IF NOT EXISTS public.document_templates (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  template_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  document_type text NOT NULL,
  family text,
  version integer NOT NULL DEFAULT 1,
  supports_ar boolean NOT NULL DEFAULT true,
  supports_en boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  native boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 16. company_template_defaults ──
CREATE TABLE IF NOT EXISTS public.company_template_defaults (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id uuid NOT NULL,
  document_type text NOT NULL,
  template_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_template_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT company_template_defaults_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE CASCADE,
  CONSTRAINT company_template_defaults_company_id_document_type_key UNIQUE (company_id, document_type)
);

-- ── 17. saved_report_views (V2 placeholder, minimal for now) ──
CREATE TABLE IF NOT EXISTS public.saved_report_views (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  report_type text NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_report_views_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT saved_report_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ── Enable RLS on all new tables ──
ALTER TABLE public.deployment_instance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_item_shared_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_party_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_list_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_note_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_of_lading_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_template_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_report_views ENABLE ROW LEVEL SECURITY;
