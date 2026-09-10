-- SANAD Database Migration 006: Notes, Report Issues, Attachments

-- ===========================================
-- 1. Notes
-- ===========================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notes_company ON notes(company_id);
CREATE INDEX idx_notes_work_item ON notes(work_item_id);
CREATE INDEX idx_notes_author ON notes(author_user_id);

-- ===========================================
-- 2. Report Issues
-- ===========================================
CREATE TABLE report_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_report_issues_company ON report_issues(company_id);
CREATE INDEX idx_report_issues_work_item ON report_issues(work_item_id);
CREATE INDEX idx_report_issues_status ON report_issues(status);
CREATE INDEX idx_report_issues_severity ON report_issues(severity);

-- ===========================================
-- 3. Attachments
-- ===========================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'general',
  r2_object_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attachments_company ON attachments(company_id);
CREATE INDEX idx_attachments_work_item ON attachments(work_item_id);

-- ===========================================
-- 4. Triggers
-- ===========================================
CREATE TRIGGER update_report_issues_updated_at
  BEFORE UPDATE ON report_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attachments_updated_at
  BEFORE UPDATE ON attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 5. RLS Policies
-- ===========================================

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Notes: company-scoped read/write (viewers can create)
CREATE POLICY notes_read ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = notes.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY notes_insert ON notes
  FOR INSERT WITH CHECK (
    author_user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = notes.company_id
          AND cm.user_id = auth.uid()
          AND cm.active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
      )
    )
  );

CREATE POLICY notes_update ON notes
  FOR UPDATE USING (
    (author_user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = notes.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    ) OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY notes_delete ON notes
  FOR DELETE USING (
    (author_user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = notes.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    ) OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Report Issues: viewers can create, admin/author can update
CREATE POLICY report_issues_read ON report_issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = report_issues.company_id
        AND cm.user_id = auth.uid()
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY report_issues_insert ON report_issues
  FOR INSERT WITH CHECK (
    reporter_user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = report_issues.company_id
          AND cm.user_id = auth.uid()
          AND cm.active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
      )
    )
  );

CREATE POLICY report_issues_update ON report_issues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = report_issues.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY report_issues_delete ON report_issues
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = report_issues.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- Attachments: company-scoped read/write
CREATE POLICY attachments_read ON attachments
  FOR SELECT USING (
    active = TRUE AND (
      EXISTS (
        SELECT 1 FROM company_memberships cm
        WHERE cm.company_id = attachments.company_id
          AND cm.user_id = auth.uid()
          AND cm.active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
      )
    )
  );

CREATE POLICY attachments_insert ON attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = attachments.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY attachments_update ON attachments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = attachments.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY attachments_delete ON attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = attachments.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role IN ('admin', 'user')
        AND cm.active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );
