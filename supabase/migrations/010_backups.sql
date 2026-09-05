-- SANAD Database Migration 010: Backup & Recovery

-- ===========================================
-- 1. Backups
-- ===========================================
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_id UUID,
  type TEXT NOT NULL CHECK (type IN ('manual', 'automatic')),
  destination TEXT NOT NULL CHECK (destination IN ('r2', 'offline')),
  object_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata_json JSONB
);

-- Indexes
CREATE INDEX idx_backups_status ON backups(status);
CREATE INDEX idx_backups_created ON backups(created_at DESC);
CREATE INDEX idx_backups_type ON backups(type);

-- ===========================================
-- 2. Backup Settings (per deployment)
-- ===========================================
CREATE TABLE backup_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_id UUID NOT NULL UNIQUE,
  auto_backup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  backup_schedule TEXT NOT NULL DEFAULT 'daily',
  retention_days INTEGER NOT NULL DEFAULT 30,
  last_backup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- 3. Triggers
-- ===========================================
CREATE TRIGGER update_backup_settings_updated_at
  BEFORE UPDATE ON backup_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 4. RLS Policies
-- ===========================================
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;

-- Backups: readable by admin users
CREATE POLICY backups_read ON backups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY backups_write ON backups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Backup settings: same pattern
CREATE POLICY backup_settings_read ON backup_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY backup_settings_write ON backup_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );
