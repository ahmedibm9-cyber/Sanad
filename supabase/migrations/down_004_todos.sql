-- DOWN Migration 004: Reverse To-dos

-- Drop view
DROP VIEW IF EXISTS todo_summary_view;

-- Drop policies
DROP POLICY IF EXISTS todos_read ON todos;
DROP POLICY IF EXISTS todos_write ON todos;

-- Disable RLS
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;

-- Drop trigger
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;

-- Drop table
DROP TABLE IF EXISTS todos CASCADE;
