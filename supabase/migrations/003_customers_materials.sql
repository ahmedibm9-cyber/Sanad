-- SANAD Database Migration 003: Customers & Materials
-- This migration creates customer and material tables with full field support.

-- ===========================================
-- 1. Customers
-- ===========================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Basic information
  name TEXT NOT NULL,
  name_ar TEXT,
  legal_name TEXT,
  contact_person TEXT,
  
  -- Contact
  phone TEXT,
  phone_secondary TEXT,
  email TEXT,
  website TEXT,
  
  -- Address
  country TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  
  -- Tax/Legal
  vat_number TEXT,
  registration_number TEXT,
  
  -- Commercial defaults
  default_currency TEXT DEFAULT 'SAR',
  default_vat_treatment TEXT DEFAULT '0',
  payment_terms TEXT,
  payment_method_notes TEXT,
  default_incoterm TEXT,
  delivery_terms TEXT,
  default_document_language TEXT DEFAULT 'en',
  default_document_template TEXT,
  commercial_notes TEXT,
  
  -- Logistics defaults
  default_dest_country TEXT,
  default_dest_city TEXT,
  default_port TEXT,
  transport_responsibility TEXT DEFAULT 'Seller',
  loading_responsibility TEXT DEFAULT 'Seller',
  unloading_responsibility TEXT DEFAULT 'Buyer',
  default_consignee TEXT,
  default_notify_party TEXT,
  packing_instructions TEXT,
  shipping_notes TEXT,
  special_handling TEXT,
  
  -- General
  notes TEXT,
  
  -- Metadata
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_name ON customers(company_id, name);
CREATE INDEX idx_customers_active ON customers(company_id, active);
CREATE INDEX idx_customers_deleted ON customers(company_id, deleted_at);

-- ===========================================
-- 2. Materials
-- ===========================================
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Basic information
  name TEXT NOT NULL,
  grade TEXT,
  manufacturer TEXT,
  origin TEXT,
  hs_code TEXT,
  default_packing TEXT,
  
  -- Last selling price
  last_selling_price NUMERIC,
  last_selling_currency TEXT DEFAULT 'SAR',
  last_selling_unit TEXT DEFAULT 'MT',
  
  -- Metadata
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_materials_company ON materials(company_id);
CREATE INDEX idx_materials_name ON materials(company_id, name);
CREATE INDEX idx_materials_active ON materials(company_id, active);
CREATE INDEX idx_materials_deleted ON materials(company_id, deleted_at);

-- ===========================================
-- 3. Material Files (TDS, MSDS, COA)
-- ===========================================
CREATE TABLE material_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('TDS', 'MSDS', 'COA', 'other')),
  r2_object_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_material_files_company ON material_files(company_id);
CREATE INDEX idx_material_files_material ON material_files(material_id);
CREATE INDEX idx_material_files_type ON material_files(file_type);

-- ===========================================
-- 4. Material Price Events
-- ===========================================
CREATE TABLE material_price_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  work_item_id UUID,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  unit TEXT NOT NULL DEFAULT 'MT',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_price_events_company ON material_price_events(company_id);
CREATE INDEX idx_price_events_material ON material_price_events(material_id);
CREATE INDEX idx_price_events_recorded ON material_price_events(recorded_at DESC);

-- ===========================================
-- 5. Triggers for updated_at
-- ===========================================
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_files_updated_at
  BEFORE UPDATE ON material_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 6. RLS Policies
-- ===========================================

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_price_events ENABLE ROW LEVEL SECURITY;

-- Customers: company-scoped read/write
CREATE POLICY customers_read ON customers
  FOR SELECT USING (
    active = TRUE AND deleted_at IS NULL AND (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = customers.company_id
          AND cm.user_id = auth.uid()
          AND cm.active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
      )
    )
  );

CREATE POLICY customers_write ON customers
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

-- Materials: company-scoped read/write
CREATE POLICY materials_read ON materials
  FOR SELECT USING (
    active = TRUE AND deleted_at IS NULL AND (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = materials.company_id
          AND cm.user_id = auth.uid()
          AND cm.active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
      )
    )
  );

CREATE POLICY materials_write ON materials
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

-- Material files: same as materials
CREATE POLICY material_files_read ON material_files
  FOR SELECT USING (
    active = TRUE AND (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = material_files.company_id
          AND cm.user_id = auth.uid()
          AND cm.active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
      )
    )
  );

CREATE POLICY material_files_write ON material_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = material_files.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Material price events: same pattern
CREATE POLICY material_price_events_read ON material_price_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = material_price_events.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY material_price_events_write ON material_price_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = material_price_events.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- ===========================================
-- 7. View for customer search
-- ===========================================
CREATE OR REPLACE VIEW customer_search_view AS
SELECT 
  c.id,
  c.company_id,
  c.name,
  c.name_ar,
  c.contact_person,
  c.phone,
  c.email,
  c.country,
  c.city,
  c.created_at
FROM customers c
WHERE c.active = TRUE AND c.deleted_at IS NULL;

-- ===========================================
-- 8. View for material search
-- ===========================================
CREATE OR REPLACE VIEW material_search_view AS
SELECT 
  m.id,
  m.company_id,
  m.name,
  m.grade,
  m.manufacturer,
  m.origin,
  m.hs_code,
  m.default_packing,
  m.last_selling_price,
  m.last_selling_currency,
  m.created_at
FROM materials m
WHERE m.active = TRUE AND m.deleted_at IS NULL;
