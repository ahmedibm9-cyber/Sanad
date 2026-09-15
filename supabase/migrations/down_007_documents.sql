-- DOWN Migration 007: Reverse Document Data Engine

-- Drop view
DROP VIEW IF EXISTS document_summary_view;

-- Drop policies
DROP POLICY IF EXISTS documents_read ON documents;
DROP POLICY IF EXISTS documents_write ON documents;

-- Disable RLS
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Drop trigger
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

-- Drop table
DROP TABLE IF EXISTS documents CASCADE;
