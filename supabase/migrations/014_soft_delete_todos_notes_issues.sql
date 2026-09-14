-- Add soft-delete support to todos, notes, report_issues
-- These entities previously hard-deleted with no recovery path

-- 1. Todos — add active column
ALTER TABLE todos ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_todos_active ON todos(user_id, active);

-- 2. Notes — add active column
ALTER TABLE notes ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_active ON notes(company_id, active);

-- 3. Report Issues — add active column
ALTER TABLE report_issues ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_report_issues_active ON report_issues(company_id, active);
