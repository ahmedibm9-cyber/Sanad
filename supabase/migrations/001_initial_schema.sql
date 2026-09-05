-- SANAD Database Migration 001: Initial Schema
-- This migration creates the foundational tables for SANAD.
-- Run this against your Supabase PostgreSQL database.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. Deployments
-- ===========================================
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  installation_id TEXT NOT NULL UNIQUE,
  license_status TEXT NOT NULL DEFAULT 'inactive',
  license_last_verified_at TIMESTAMPTZ,
  settings_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- 2. Users (profile data linked to auth)
-- ===========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
  is_system_admin BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);

-- ===========================================
-- 3. Companies
-- ===========================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  legal_name_en TEXT,
  legal_name_ar TEXT,
  short_name TEXT NOT NULL,
  company_code TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_companies_active ON companies(active);
CREATE INDEX idx_companies_code ON companies(company_code);

-- ===========================================
-- 4. Company Memberships
-- ===========================================
CREATE TABLE company_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_role TEXT NOT NULL DEFAULT 'user' CHECK (base_role IN ('admin', 'user', 'viewer')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_company_user UNIQUE (company_id, user_id)
);

-- Indexes
CREATE INDEX idx_memberships_company ON company_memberships(company_id);
CREATE INDEX idx_memberships_user ON company_memberships(user_id);
CREATE INDEX idx_memberships_active ON company_memberships(active);

-- ===========================================
-- 5. Permission Catalog
-- ===========================================
CREATE TABLE permission_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_key TEXT NOT NULL UNIQUE,
  group_name TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Index
CREATE INDEX idx_permission_catalog_group ON permission_catalog(group_name);

-- ===========================================
-- 6. Membership Permissions
-- ===========================================
CREATE TABLE membership_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID NOT NULL REFERENCES company_memberships(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permission_catalog(permission_key),
  allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_membership_permission UNIQUE (membership_id, permission_key)
);

-- Indexes
CREATE INDEX idx_membership_perms_membership ON membership_permissions(membership_id);
CREATE INDEX idx_membership_perms_key ON membership_permissions(permission_key);

-- ===========================================
-- 7. Trigger: Updated At
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_memberships_updated_at
  BEFORE UPDATE ON company_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 8. Row Level Security (RLS) Policies
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_read_own ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = auth.uid());

-- System admins can read all users
CREATE POLICY users_admin_read ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

-- Companies: readable by members
CREATE POLICY companies_read_member ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_memberships
      WHERE company_id = companies.id
        AND user_id = auth.uid()
        AND active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

-- Companies: writable by system admins only
CREATE POLICY companies_admin_write ON companies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

-- Memberships: readable by members of the same company or admins
CREATE POLICY memberships_read ON company_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_memberships.company_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

-- Permissions: readable by admins of the same company
CREATE POLICY permissions_read ON membership_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.id = membership_permissions.membership_id
        AND cm.user_id = auth.uid()
        AND cm.base_role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

-- Permission catalog: readable by all authenticated users
CREATE POLICY permission_catalog_read ON permission_catalog
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ===========================================
-- 9. Seed Permission Catalog
-- ===========================================
INSERT INTO permission_catalog (permission_key, group_name, description_en, description_ar, is_critical, sort_order) VALUES
  -- Company
  ('company.view', 'Company', 'View company details', 'عرض تفاصيل الشركة', false, 1),
  ('company.edit', 'Company', 'Edit company settings', 'تعديل إعدادات الشركة', true, 2),
  
  -- Projects
  ('projects.view', 'Projects', 'View projects', 'عرض المشاريع', false, 10),
  ('projects.create', 'Projects', 'Create projects', 'إنشاء مشاريع', false, 11),
  ('projects.edit', 'Projects', 'Edit projects', 'تعديل المشاريع', false, 12),
  ('projects.archive', 'Projects', 'Archive projects', 'أرشفة المشاريع', false, 13),
  ('projects.reopen', 'Projects', 'Reopen archived projects', 'إعادة فتح المشاريع المؤرشفة', false, 14),
  ('projects.pin', 'Projects', 'Pin projects', 'تثبيت المشاريع', false, 15),
  ('projects.delete', 'Projects', 'Delete projects', 'حذف المشاريع', false, 16),
  
  -- Tasks
  ('tasks.view', 'Tasks', 'View tasks', 'عرض المهام', false, 20),
  ('tasks.create', 'Tasks', 'Create tasks', 'إنشاء مهام', false, 21),
  ('tasks.edit', 'Tasks', 'Edit tasks', 'تعديل المهام', false, 22),
  ('tasks.convert_to_project', 'Tasks', 'Convert task to project', 'تحويل المهمة إلى مشروع', false, 23),
  ('tasks.archive', 'Tasks', 'Archive tasks', 'أرشفة المهام', false, 24),
  ('tasks.delete', 'Tasks', 'Delete tasks', 'حذف المهام', false, 25),
  
  -- Documents
  ('documents.view', 'Documents', 'View documents', 'عرض المستندات', false, 30),
  ('documents.create', 'Documents', 'Create documents', 'إنشاء مستندات', false, 31),
  ('documents.edit', 'Documents', 'Edit documents', 'تعديل المستندات', false, 32),
  ('documents.print', 'Documents', 'Print documents', 'طباعة المستندات', false, 33),
  ('documents.download', 'Documents', 'Download documents', 'تحميل المستندات', false, 34),
  ('documents.delete', 'Documents', 'Delete documents', 'حذف المستندات', false, 35),
  
  -- Customers
  ('customers.view', 'Customers', 'View customers', 'عرض العملاء', false, 40),
  ('customers.create', 'Customers', 'Create customers', 'إنشاء عملاء', false, 41),
  ('customers.edit', 'Customers', 'Edit customers', 'تعديل العملاء', false, 42),
  ('customers.delete', 'Customers', 'Delete customers', 'حذف العملاء', false, 43),
  ('customers.export', 'Customers', 'Export customers', 'تصدير العملاء', false, 44),
  
  -- Materials
  ('materials.view', 'Materials', 'View materials', 'عرض المواد', false, 50),
  ('materials.create', 'Materials', 'Create materials', 'إنشاء مواد', false, 51),
  ('materials.edit', 'Materials', 'Edit materials', 'تعديل المواد', false, 52),
  ('materials.delete', 'Materials', 'Delete materials', 'حذف المواد', false, 53),
  ('materials.files.manage', 'Materials', 'Manage material files', 'إدارة ملفات المواد', false, 54),
  
  -- Files
  ('files.view', 'Files', 'View files', 'عرض الملفات', false, 60),
  ('files.upload', 'Files', 'Upload files', 'رفع الملفات', false, 61),
  ('files.download', 'Files', 'Download files', 'تحميل الملفات', false, 62),
  ('files.delete', 'Files', 'Delete files', 'حذف الملفات', false, 63),
  
  -- Reports
  ('reports.view', 'Reports', 'View reports', 'عرض التقارير', false, 70),
  ('reports.export_pdf', 'Reports', 'Export reports to PDF', 'تصدير التقارير إلى PDF', false, 71),
  ('reports.export_excel', 'Reports', 'Export reports to Excel', 'تصدير التقارير إلى Excel', false, 72),
  
  -- Users
  ('users.view', 'Users', 'View users', 'عرض المستخدمين', false, 80),
  ('users.create', 'Users', 'Create users', 'إنشاء مستخدمين', true, 81),
  ('users.edit', 'Users', 'Edit users', 'تعديل المستخدمين', true, 82),
  ('users.permissions.manage', 'Users', 'Manage user permissions', 'إدارة صلاحيات المستخدمين', true, 83),
  ('users.disable', 'Users', 'Disable users', 'تعطيل المستخدمين', true, 84),
  
  -- Activity
  ('audit.view', 'Activity', 'View activity log', 'عرض سجل النشاط', false, 90),
  
  -- Trash
  ('trash.view', 'Trash', 'View trash', 'عرض سلة المهملات', false, 100),
  ('trash.restore', 'Trash', 'Restore from trash', 'استعادة من سلة المهملات', false, 101),
  ('trash.hard_delete', 'Trash', 'Permanently delete', 'حذف نهائي', true, 102),
  
  -- Factory Code
  ('factory.view', 'Factory Code', 'View factory codes', 'عرض أكواد المصانع', false, 110),
  ('factory.export', 'Factory Code', 'Export factory codes', 'تصدير أكواد المصانع', false, 111),
  ('factory.import_update', 'Factory Code', 'Import/update factory codes', 'استيراد/تحديث أكواد المصانع', true, 112),
  
  -- Backup
  ('backup.create', 'Backup', 'Create backups', 'إنشاء نسخ احتياطية', false, 120),
  ('backup.restore', 'Backup', 'Restore from backup', 'استعادة من نسخة احتياطية', true, 121),
  
  -- Settings
  ('settings.view', 'Settings', 'View settings', 'عرض الإعدادات', false, 130),
  ('settings.edit', 'Settings', 'Edit settings', 'تعديل الإعدادات', true, 131);

-- ===========================================
-- 10. Create Development User
-- ===========================================
-- Note: In development, create a test user through Supabase Auth
-- and then insert the profile record manually or via a trigger.

-- For development, we'll create a function that auto-creates
-- user profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, email, preferred_language, is_system_admin, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    COALESCE((NEW.raw_user_meta_data->>'is_system_admin')::boolean, FALSE),
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 11. Views for common queries
-- ===========================================

-- View: User with their memberships
CREATE OR REPLACE VIEW user_memberships_view AS
SELECT 
  u.id as user_id,
  u.display_name,
  u.email,
  u.is_system_admin,
  cm.company_id,
  c.name_en as company_name_en,
  c.name_ar as company_name_ar,
  c.short_name as company_short_name,
  c.company_code,
  cm.base_role,
  cm.active as membership_active
FROM users u
JOIN company_memberships cm ON u.id = cm.user_id
JOIN companies c ON cm.company_id = c.id
WHERE cm.active = TRUE AND u.active = TRUE;

-- View: Company membership count
CREATE OR REPLACE VIEW company_membership_count_view AS
SELECT 
  c.id as company_id,
  c.name_en,
  c.short_name,
  COUNT(cm.id) as member_count
FROM companies c
LEFT JOIN company_memberships cm ON c.id = cm.company_id AND cm.active = TRUE
WHERE c.active = TRUE
GROUP BY c.id, c.name_en, c.short_name;

-- ===========================================
-- 12. Functions for common operations
-- ===========================================

-- Function: Check if user has permission in company
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_company_id UUID,
  p_permission_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_base_role TEXT;
  v_membership_id UUID;
  v_allowed BOOLEAN;
BEGIN
  -- Check if system admin
  SELECT is_system_admin INTO v_is_admin
  FROM users WHERE id = p_user_id;
  
  IF v_is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Get membership
  SELECT id, base_role INTO v_membership_id, v_base_role
  FROM company_memberships
  WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND active = TRUE;
  
  IF v_membership_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admin role has all permissions
  IF v_base_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT allowed INTO v_allowed
  FROM membership_permissions
  WHERE membership_id = v_membership_id 
    AND permission_key = p_permission_key;
  
  -- Viewer base permissions
  IF v_base_role = 'viewer' THEN
    IF p_permission_key IN ('projects.view', 'tasks.view', 'documents.view', 
                            'customers.view', 'materials.view', 'reports.view',
                            'factory.view') THEN
      RETURN TRUE;
    END IF;
    IF p_permission_key = 'files.download' THEN
      RETURN COALESCE(v_allowed, FALSE);
    END IF;
    RETURN FALSE;
  END IF;
  
  RETURN COALESCE(v_allowed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
