-- DOWN Migration 009: Reverse Audit, Notifications & Reports

-- Drop policies
DROP POLICY IF EXISTS audit_events_read ON audit_events;
DROP POLICY IF EXISTS audit_events_insert ON audit_events;
DROP POLICY IF EXISTS notifications_read ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;
DROP POLICY IF EXISTS notif_prefs_read ON notification_preferences;
DROP POLICY IF EXISTS notif_prefs_write ON notification_preferences;

-- Disable RLS
ALTER TABLE audit_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- Drop tables
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_events CASCADE;
