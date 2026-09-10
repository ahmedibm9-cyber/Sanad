-- SANAD Database Migration 011: Trash Entries
-- Missing table for soft-delete tracking.

-- ===========================================
-- 1. Trash Entries
-- ===========================================
CREATE TABLE trash_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'task', 'document', 'customer', 'material', 'attachment')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  deleted_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB
);

-- Indexes
CREATE INDEX idx_trash_company ON trash_entries(company_id);
CREATE INDEX idx_trash_entity ON trash_entries(entity_type, entity_id);
CREATE INDEX idx_trash_deleted ON trash_entries(deleted_at DESC);

-- ===========================================
-- 2. RLS Policies
-- ===========================================
ALTER TABLE trash_entries ENABLE ROW LEVEL SECURITY;

-- Trash entries: company-scoped read (admin/user)
CREATE POLICY trash_entries_read ON trash_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = trash_entries.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Trash entries: company-scoped write (admin/user)
CREATE POLICY trash_entries_write ON trash_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = trash_entries.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );
