-- SANAD Database Migration 009: Audit, Notifications & Reports

-- ===========================================
-- 1. Audit Events
-- ===========================================
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  actor_user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_reference TEXT,
  before_json JSONB,
  after_json JSONB,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_events_company ON audit_events(company_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX idx_audit_events_action ON audit_events(action);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);

-- Full-text search on entity_reference
CREATE INDEX idx_audit_events_reference ON audit_events 
  USING gin(to_tsvector('english', coalesce(entity_reference, '')));

-- ===========================================
-- 2. Notifications
-- ===========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ===========================================
-- 3. Notification Preferences
-- ===========================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_notification_type UNIQUE (user_id, notification_type)
);

-- Index
CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);

-- ===========================================
-- 4. RLS Policies
-- ===========================================
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Audit events: readable by authorized users
CREATE POLICY audit_events_read ON audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = audit_events.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Audit events: writable by system
CREATE POLICY audit_events_insert ON audit_events
  FOR INSERT WITH CHECK (
    actor_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Notifications: owner-only read/write
CREATE POLICY notifications_read ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Notification preferences: owner-only
CREATE POLICY notif_prefs_read ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notif_prefs_write ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- ===========================================
-- 5. Seed notification preferences for existing users
-- ===========================================
DO $$
DECLARE
  usr RECORD;
  notif_type TEXT;
BEGIN
  FOR usr IN SELECT id FROM users LOOP
    FOR notif_type IN 
      SELECT unnest(ARRAY[
        'task_assigned', 'task_due_soon', 'task_overdue',
        'project_status_changed', 'project_archived', 'project_reopened',
        'report_issue_created', 'report_issue_changed',
        'mention_in_note',
        'document_created', 'document_edited', 'document_trashed',
        'attachment_uploaded', 'attachment_removed',
        'permission_changed',
        'factory_code_updated',
        'backup_success', 'backup_failure',
        'todo_reminder'
      ])
    LOOP
      INSERT INTO notification_preferences (user_id, notification_type, enabled)
      VALUES (usr.id, notif_type, TRUE)
      ON CONFLICT (user_id, notification_type) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
