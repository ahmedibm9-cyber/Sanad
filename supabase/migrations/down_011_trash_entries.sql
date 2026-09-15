-- DOWN Migration 011: Reverse Trash Entries

-- Drop policies
DROP POLICY IF EXISTS trash_entries_read ON trash_entries;
DROP POLICY IF EXISTS trash_entries_write ON trash_entries;

-- Disable RLS
ALTER TABLE trash_entries DISABLE ROW LEVEL SECURITY;

-- Drop table
DROP TABLE IF EXISTS trash_entries CASCADE;
