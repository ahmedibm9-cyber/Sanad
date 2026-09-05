-- SANAD Database Migration 002: Company Settings & Assets
-- This migration creates company settings and assets tables.

-- ===========================================
-- 1. Company Settings (JSON-based for flexibility)
-- ===========================================
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Identity settings
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_company_settings UNIQUE (company_id)
);

-- Index for company lookup
CREATE INDEX idx_company_settings_company ON company_settings(company_id);

-- ===========================================
-- 2. Company Assets (Logo, Stamp, Signature)
-- ===========================================
CREATE TABLE company_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'stamp', 'signature')),
  object_key TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_company_assets_company ON company_assets(company_id);
CREATE INDEX idx_company_assets_type ON company_assets(asset_type);

-- ===========================================
-- 3. Bank Accounts (normalized for multiple accounts)
-- ===========================================
CREATE TABLE company_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT,
  swift TEXT,
  bank_address TEXT,
  currency TEXT NOT NULL DEFAULT 'SAR',
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_bank_accounts_company ON company_bank_accounts(company_id);

-- ===========================================
-- 4. Document Defaults (normalized for structured access)
-- ===========================================
CREATE TABLE company_document_defaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  default_language TEXT NOT NULL DEFAULT 'en',
  default_template TEXT NOT NULL DEFAULT 'template-a',
  default_vat_rate NUMERIC NOT NULL DEFAULT 0,
  default_currency TEXT NOT NULL DEFAULT 'SAR',
  default_weight_unit TEXT NOT NULL DEFAULT 'MT',
  default_packing_unit TEXT NOT NULL DEFAULT 'Bags',
  default_incoterm TEXT,
  default_payment_terms TEXT,
  default_delivery_terms TEXT,
  default_prepared_by TEXT,
  show_signature BOOLEAN NOT NULL DEFAULT TRUE,
  show_stamp BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_company_doc_defaults UNIQUE (company_id)
);

-- ===========================================
-- 5. Configurable Lists (currencies, VAT rates, etc.)
-- ===========================================
CREATE TABLE company_config_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL, -- 'currencies', 'vat_rates', 'weight_units', etc.
  item_value TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_company_list_item UNIQUE (company_id, list_name, item_value)
);

-- Index
CREATE INDEX idx_config_lists_company ON company_config_lists(company_id);
CREATE INDEX idx_config_lists_name ON company_config_lists(company_id, list_name);

-- ===========================================
-- 6. Triggers for updated_at
-- ===========================================
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_assets_updated_at
  BEFORE UPDATE ON company_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON company_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_defaults_updated_at
  BEFORE UPDATE ON company_document_defaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 7. RLS Policies
-- ===========================================

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_document_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_config_lists ENABLE ROW LEVEL SECURITY;

-- Company settings: readable by company members, writable by admins
CREATE POLICY company_settings_read ON company_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_settings.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY company_settings_write ON company_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_settings.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Company assets: same pattern
CREATE POLICY company_assets_read ON company_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_assets.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY company_assets_write ON company_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_assets.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Bank accounts: same pattern
CREATE POLICY company_bank_accounts_read ON company_bank_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_bank_accounts.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY company_bank_accounts_write ON company_bank_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_bank_accounts.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Document defaults: same pattern
CREATE POLICY company_doc_defaults_read ON company_document_defaults
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_document_defaults.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY company_doc_defaults_write ON company_document_defaults
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_document_defaults.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Config lists: same pattern
CREATE POLICY company_config_lists_read ON company_config_lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_config_lists.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY company_config_lists_write ON company_config_lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_config_lists.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- ===========================================
-- 8. Seed Default Document Defaults for Existing Companies
-- ===========================================
INSERT INTO company_document_defaults (company_id)
SELECT id FROM companies
ON CONFLICT (company_id) DO NOTHING;

-- ===========================================
-- 9. Seed Default Config Lists for Existing Companies
-- ===========================================
DO $$
DECLARE
  comp RECORD;
BEGIN
  FOR comp IN SELECT id FROM companies LOOP
    -- Currencies
    INSERT INTO company_config_lists (company_id, list_name, item_value, is_default, sort_order)
    VALUES 
      (comp.id, 'currencies', 'SAR', TRUE, 0),
      (comp.id, 'currencies', 'USD', FALSE, 1),
      (comp.id, 'currencies', 'EUR', FALSE, 2),
      (comp.id, 'currencies', 'GBP', FALSE, 3)
    ON CONFLICT (company_id, list_name, item_value) DO NOTHING;
    
    -- VAT rates
    INSERT INTO company_config_lists (company_id, list_name, item_value, is_default, sort_order)
    VALUES 
      (comp.id, 'vat_rates', '0', TRUE, 0),
      (comp.id, 'vat_rates', '15', FALSE, 1)
    ON CONFLICT (company_id, list_name, item_value) DO NOTHING;
    
    -- Weight units
    INSERT INTO company_config_lists (company_id, list_name, item_value, is_default, sort_order)
    VALUES 
      (comp.id, 'weight_units', 'MT', TRUE, 0),
      (comp.id, 'weight_units', 'KG', FALSE, 1),
      (comp.id, 'weight_units', 'LB', FALSE, 2),
      (comp.id, 'weight_units', 'TON', FALSE, 3)
    ON CONFLICT (company_id, list_name, item_value) DO NOTHING;
    
    -- Packing units
    INSERT INTO company_config_lists (company_id, list_name, item_value, is_default, sort_order)
    VALUES 
      (comp.id, 'packing_units', 'Bags', TRUE, 0),
      (comp.id, 'packing_units', 'Jumbo Bags', FALSE, 1),
      (comp.id, 'packing_units', 'Drums', FALSE, 2),
      (comp.id, 'packing_units', 'Containers', FALSE, 3)
    ON CONFLICT (company_id, list_name, item_value) DO NOTHING;
    
    -- Payment terms
    INSERT INTO company_config_lists (company_id, list_name, item_value, is_default, sort_order)
    VALUES 
      (comp.id, 'payment_terms', 'Net 30 days', TRUE, 0),
      (comp.id, 'payment_terms', 'Net 45 days', FALSE, 1),
      (comp.id, 'payment_terms', 'Net 60 days', FALSE, 2),
      (comp.id, 'payment_terms', 'Cash on Delivery', FALSE, 3)
    ON CONFLICT (company_id, list_name, item_value) DO NOTHING;
    
    -- Delivery terms
    INSERT INTO company_config_lists (company_id, list_name, item_value, is_default, sort_order)
    VALUES 
      (comp.id, 'delivery_terms', 'FOB', TRUE, 0),
      (comp.id, 'delivery_terms', 'CIF', FALSE, 1),
      (comp.id, 'delivery_terms', 'CFR', FALSE, 2),
      (comp.id, 'delivery_terms', 'EXW', FALSE, 3)
    ON CONFLICT (company_id, list_name, item_value) DO NOTHING;
  END LOOP;
END $$;
