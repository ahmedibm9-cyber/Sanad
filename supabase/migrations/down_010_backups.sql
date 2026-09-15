-- DOWN Migration 010: Reverse Backup & Recovery

-- Drop policies
DROP POLICY IF EXISTS backups_read ON backups;
DROP POLICY IF EXISTS backups_write ON backups;
DROP POLICY IF EXISTS backup_settings_read ON backup_settings;
DROP POLICY IF EXISTS backup_settings_write ON backup_settings;

-- Disable RLS
ALTER TABLE backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings DISABLE ROW LEVEL SECURITY;

-- Drop trigger
DROP TRIGGER IF EXISTS update_backup_settings_updated_at ON backup_settings;

-- Drop tables
DROP TABLE IF EXISTS backup_settings CASCADE;
DROP TABLE IF EXISTS backups CASCADE;
