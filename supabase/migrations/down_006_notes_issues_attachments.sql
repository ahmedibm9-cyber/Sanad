-- DOWN Migration 006: Reverse Notes, Report Issues, Attachments

-- Drop policies
DROP POLICY IF EXISTS notes_read ON notes;
DROP POLICY IF EXISTS notes_insert ON notes;
DROP POLICY IF EXISTS notes_update ON notes;
DROP POLICY IF EXISTS notes_delete ON notes;
DROP POLICY IF EXISTS report_issues_read ON report_issues;
DROP POLICY IF EXISTS report_issues_insert ON report_issues;
DROP POLICY IF EXISTS report_issues_update ON report_issues;
DROP POLICY IF EXISTS report_issues_delete ON report_issues;
DROP POLICY IF EXISTS attachments_read ON attachments;
DROP POLICY IF EXISTS attachments_insert ON attachments;
DROP POLICY IF EXISTS attachments_update ON attachments;
DROP POLICY IF EXISTS attachments_delete ON attachments;

-- Disable RLS
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_report_issues_updated_at ON report_issues;
DROP TRIGGER IF EXISTS update_attachments_updated_at ON attachments;

-- Drop tables
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS report_issues CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
