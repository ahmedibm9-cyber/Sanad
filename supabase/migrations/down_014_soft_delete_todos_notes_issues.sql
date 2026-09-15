-- DOWN Migration 014: Reverse Soft-delete support for todos, notes, report_issues

-- Drop indexes
DROP INDEX IF EXISTS idx_todos_active;
DROP INDEX IF EXISTS idx_notes_active;
DROP INDEX IF EXISTS idx_report_issues_active;

-- Drop columns
ALTER TABLE todos DROP COLUMN IF EXISTS active;
ALTER TABLE notes DROP COLUMN IF EXISTS active;
ALTER TABLE report_issues DROP COLUMN IF EXISTS active;
