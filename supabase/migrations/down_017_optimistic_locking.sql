-- DOWN Migration 017: Reverse Optimistic Locking

-- Drop indexes
DROP INDEX IF EXISTS idx_work_items_version;
DROP INDEX IF EXISTS idx_documents_version;
DROP INDEX IF EXISTS idx_customers_version;
DROP INDEX IF EXISTS idx_materials_version;

-- Drop version columns
ALTER TABLE work_items DROP COLUMN IF EXISTS version;
ALTER TABLE documents DROP COLUMN IF EXISTS version;
ALTER TABLE customers DROP COLUMN IF EXISTS version;
ALTER TABLE materials DROP COLUMN IF EXISTS version;
ALTER TABLE company_settings DROP COLUMN IF EXISTS version;
