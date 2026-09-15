-- DOWN Migration 012: Reverse Factory Code Staging

-- Drop function
DROP FUNCTION IF EXISTS validate_staging_rows(UUID);

-- Drop policy
DROP POLICY IF EXISTS "Staging visible to import owner or admin" ON factory_code_staging;

-- Disable RLS
ALTER TABLE factory_code_staging DISABLE ROW LEVEL SECURITY;

-- Drop table
DROP TABLE IF EXISTS factory_code_staging CASCADE;
