-- SANAD Database Migration 005: Tasks & Projects
-- Unified work-item model for Tasks and Projects.

-- ===========================================
-- 1. Work Items (Tasks & Projects)
-- ===========================================
CREATE TABLE work_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('task', 'project')),
  
  -- Basic information
  name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'cancelled', 'completed', 'archived')),
  
  -- Pinning (projects only)
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Shipment metadata
  destination_country TEXT,
  destination_city TEXT,
  currency TEXT DEFAULT 'SAR',
  incoterm TEXT,
  payment_terms TEXT,
  delivery_terms TEXT,
  port_of_loading TEXT,
  port_of_discharge TEXT,
  vessel_name TEXT,
  voyage_number TEXT,
  container_number TEXT,
  
  -- Metadata
  active BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_work_items_company ON work_items(company_id);
CREATE INDEX idx_work_items_type ON work_items(company_id, type);
CREATE INDEX idx_work_items_status ON work_items(company_id, status);
CREATE INDEX idx_work_items_customer ON work_items(company_id, customer_id);
CREATE INDEX idx_work_items_pinned ON work_items(company_id, pinned) WHERE pinned = TRUE;
CREATE INDEX idx_work_items_archived ON work_items(company_id, archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_work_items_active ON work_items(company_id, active);
CREATE INDEX idx_work_items_deleted ON work_items(company_id, deleted_at);

-- ===========================================
-- 2. Work Item Materials
-- ===========================================
CREATE TABLE work_item_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id),
  
  -- Material data (can be overridden from material library)
  description_override TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  weight_unit TEXT NOT NULL DEFAULT 'MT',
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  packing_unit TEXT,
  packing_description TEXT,
  origin TEXT,
  hs_code TEXT,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_work_item_materials_company ON work_item_materials(company_id);
CREATE INDEX idx_work_item_materials_work_item ON work_item_materials(work_item_id);
CREATE INDEX idx_work_item_materials_material ON work_item_materials(material_id);

-- ===========================================
-- 3. Triggers for updated_at
-- ===========================================
CREATE TRIGGER update_work_items_updated_at
  BEFORE UPDATE ON work_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_item_materials_updated_at
  BEFORE UPDATE ON work_item_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 4. RLS Policies
-- ===========================================

-- Enable RLS
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_materials ENABLE ROW LEVEL SECURITY;

-- Work Items: company-scoped read/write
CREATE POLICY work_items_read ON work_items
  FOR SELECT USING (
    active = TRUE AND deleted_at IS NULL AND (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = work_items.company_id
          AND cm.user_id = auth.uid()
          AND cm.active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
      )
    )
  );

CREATE POLICY work_items_write ON work_items
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

-- Work Item Materials: same pattern
CREATE POLICY work_item_materials_read ON work_item_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = work_item_materials.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY work_item_materials_write ON work_item_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = work_item_materials.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- ===========================================
-- 5. View for work item summaries
-- ===========================================
CREATE OR REPLACE VIEW work_item_summary_view AS
SELECT 
  wi.id,
  wi.company_id,
  wi.type,
  wi.name,
  wi.status,
  wi.pinned,
  wi.destination_country,
  wi.destination_city,
  wi.created_at,
  wi.updated_at,
  c.name as customer_name,
  COUNT(wim.id) as material_count,
  COALESCE(SUM(wim.quantity * wim.price), 0) as total_value
FROM work_items wi
LEFT JOIN customers c ON wi.customer_id = c.id
LEFT JOIN work_item_materials wim ON wi.id = wim.work_item_id
WHERE wi.active = TRUE AND wi.deleted_at IS NULL
GROUP BY wi.id, c.name;
