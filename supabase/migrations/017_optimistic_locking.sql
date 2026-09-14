-- C5: Optimistic locking via version column
-- Prevents silent last-write-wins data loss in multi-user scenarios

-- Add version column to key tables
ALTER TABLE work_items ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE documents ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE customers ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE materials ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Indexes for version checks
CREATE INDEX IF NOT EXISTS idx_work_items_version ON work_items(id, version);
CREATE INDEX IF NOT EXISTS idx_documents_version ON documents(id, version);
CREATE INDEX IF NOT EXISTS idx_customers_version ON customers(id, version);
CREATE INDEX IF NOT EXISTS idx_materials_version ON materials(id, version);
