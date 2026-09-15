-- DOWN Migration 008: Reverse Factory Code Master Database

-- Drop policies
DROP POLICY IF EXISTS factory_code_read ON factory_code_records;
DROP POLICY IF EXISTS factory_code_write ON factory_code_records;
DROP POLICY IF EXISTS factory_imports_read ON factory_code_imports;
DROP POLICY IF EXISTS factory_imports_write ON factory_code_imports;

-- Disable RLS
ALTER TABLE factory_code_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE factory_code_imports DISABLE ROW LEVEL SECURITY;

-- Drop trigger
DROP TRIGGER IF EXISTS update_factory_code_records_updated_at ON factory_code_records;

-- Drop tables
DROP TABLE IF EXISTS factory_code_imports CASCADE;
DROP TABLE IF EXISTS factory_code_records CASCADE;
