-- SANAD Database Migration 008: Factory Code Master Database
-- Shared global dataset across all companies.

-- ===========================================
-- 1. Factory Code Records
-- ===========================================
CREATE TABLE factory_code_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Stable source key for identity matching
  stable_source_key TEXT NOT NULL,
  
  -- Raw/normalized columns from source
  factory_code TEXT,
  factory_name TEXT,
  factory_name_ar TEXT,
  city TEXT,
  region TEXT,
  activity TEXT,
  product TEXT,
  hs_code TEXT,
  registration_number TEXT,
  
  -- Import tracking
  first_seen_import_id UUID,
  last_seen_import_id UUID,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on stable source key
CREATE UNIQUE INDEX idx_factory_code_source_key ON factory_code_records(stable_source_key);

-- Indexes for search
CREATE INDEX idx_factory_code_code ON factory_code_records(factory_code);
CREATE INDEX idx_factory_code_name ON factory_code_records(factory_name);
CREATE INDEX idx_factory_code_city ON factory_code_records(city);
CREATE INDEX idx_factory_code_region ON factory_code_records(region);
CREATE INDEX idx_factory_code_product ON factory_code_records(product);
CREATE INDEX idx_factory_code_hs ON factory_code_records(hs_code);
CREATE INDEX idx_factory_code_activity ON factory_code_records(activity);

-- Full-text search index
CREATE INDEX idx_factory_code_search ON factory_code_records 
  USING gin(to_tsvector('english', 
    coalesce(factory_code, '') || ' ' || 
    coalesce(factory_name, '') || ' ' || 
    coalesce(city, '') || ' ' || 
    coalesce(product, '') || ' ' || 
    coalesce(hs_code, '') || ' ' ||
    coalesce(activity, '')
  ));

-- ===========================================
-- 2. Factory Code Imports
-- ===========================================
CREATE TABLE factory_code_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID REFERENCES users(id),
  source_filename TEXT NOT NULL,
  r2_object_key TEXT,
  checksum TEXT,
  row_count INTEGER DEFAULT 0,
  inserted_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  unchanged_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_factory_imports_status ON factory_code_imports(status);
CREATE INDEX idx_factory_imports_uploaded ON factory_code_imports(uploaded_at DESC);

-- ===========================================
-- 3. Triggers
-- ===========================================
CREATE TRIGGER update_factory_code_records_updated_at
  BEFORE UPDATE ON factory_code_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 4. RLS Policies
-- ===========================================
ALTER TABLE factory_code_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_code_imports ENABLE ROW LEVEL SECURITY;

-- Factory code: readable by all authorized users, writable only by admin with import permission
CREATE POLICY factory_code_read ON factory_code_records
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

CREATE POLICY factory_code_write ON factory_code_records
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

-- Factory code imports: readable by admin users
CREATE POLICY factory_imports_read ON factory_code_imports
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

CREATE POLICY factory_imports_write ON factory_code_imports
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
