-- SANAD Database Migration 007: Document Data Engine
-- Documents for all 7 types: QUOT, PINV, TINV, CINV, PKL, DN, BL

-- ===========================================
-- 1. Documents
-- ===========================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  
  -- Document identification
  document_type TEXT NOT NULL CHECK (document_type IN ('QUOT', 'PINV', 'TINV', 'CINV', 'PKL', 'DN', 'BL')),
  document_number TEXT NOT NULL,
  
  -- Metadata
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  template_key TEXT NOT NULL DEFAULT 'template-a',
  prepared_by TEXT,
  show_signature BOOLEAN NOT NULL DEFAULT TRUE,
  show_stamp BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  
  -- Document data (JSON for flexibility across document types)
  document_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Rendering
  latest_render_object_key TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

-- Unique constraint: document number must be unique within a company
CREATE UNIQUE INDEX idx_documents_number_company ON documents(company_id, document_number) WHERE deleted_at IS NULL;

-- Indexes
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_work_item ON documents(work_item_id);
CREATE INDEX idx_documents_type ON documents(company_id, document_type);
CREATE INDEX idx_documents_status ON documents(status);

-- ===========================================
-- 2. Triggers
-- ===========================================
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. RLS Policies
-- ===========================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Documents: company-scoped read
CREATE POLICY documents_read ON documents
  FOR SELECT USING (
    active = TRUE AND deleted_at IS NULL AND (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = documents.company_id
          AND cm.user_id = auth.uid()
          AND cm.active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
      )
    )
  );

-- Documents: company-scoped write (admin/user)
CREATE POLICY documents_write ON documents
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

-- ===========================================
-- 4. View for document summaries
-- ===========================================
CREATE OR REPLACE VIEW document_summary_view AS
SELECT 
  d.id,
  d.company_id,
  d.work_item_id,
  d.document_type,
  d.document_number,
  d.created_date,
  d.language,
  d.status,
  d.prepared_by,
  d.created_at,
  wi.name as work_item_name,
  wi.type as work_item_type
FROM documents d
LEFT JOIN work_items wi ON d.work_item_id = wi.id
WHERE d.deleted_at IS NULL;
