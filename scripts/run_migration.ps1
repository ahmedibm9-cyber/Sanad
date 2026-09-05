# Script to run SANAD migrations via Supabase Management API
# Usage: .\scripts\run_migration.ps1

$SUPABASE_PAT = "sbp_fc6eaa1706ed12265eaa8cbdfe166a0a5411a08f"
$PROJECT_ID = "pegilnlehnfkucgbtxak"
$API_URL = "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query"

$headers = @{
    "Authorization" = "Bearer $SUPABASE_PAT"
    "Content-Type" = "application/json"
}

function Run-SQL($sql, $description) {
    Write-Host "Running: $description..." -ForegroundColor Cyan
    $body = @{ query = $sql } | ConvertTo-Json -Depth 5
    try {
        $r = Invoke-WebRequest -Uri $API_URL -Method POST -Headers $headers -Body $body -TimeoutSec 120 -UseBasicParsing
        Write-Host "  SUCCESS" -ForegroundColor Green
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  FAILED (HTTP $statusCode): $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "=== SANAD Database Migration ===" -ForegroundColor Yellow
Write-Host ""

# Migration 001: Initial Schema
Write-Host "Migration 001: Initial Schema" -ForegroundColor Yellow

Run-SQL "CREATE EXTENSION IF NOT EXISTS ""uuid-ossp""" "Enable UUID extension"

Run-SQL @"
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  installation_id TEXT NOT NULL UNIQUE,
  license_status TEXT NOT NULL DEFAULT 'inactive',
  license_last_verified_at TIMESTAMPTZ,
  settings_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
"@ "Create deployments table"

Run-SQL @"
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
  is_system_admin BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
"@ "Create users table"

Run-SQL "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)" "Create users email index"
Run-SQL "CREATE INDEX IF NOT EXISTS idx_users_active ON users(active)" "Create users active index"

Run-SQL @"
CREATE TABLE IF NOT EXISTS companies (
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
)
"@ "Create companies table"

Run-SQL "CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active)" "Create companies active index"
Run-SQL "CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(company_code)" "Create companies code index"

Run-SQL @"
CREATE TABLE IF NOT EXISTS company_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_role TEXT NOT NULL DEFAULT 'user' CHECK (base_role IN ('admin', 'user', 'viewer')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_company_user UNIQUE (company_id, user_id)
)
"@ "Create company_memberships table"

Run-SQL "CREATE INDEX IF NOT EXISTS idx_memberships_company ON company_memberships(company_id)" "Create memberships company index"
Run-SQL "CREATE INDEX IF NOT EXISTS idx_memberships_user ON company_memberships(user_id)" "Create memberships user index"

Run-SQL @"
CREATE TABLE IF NOT EXISTS permission_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_key TEXT NOT NULL UNIQUE,
  group_name TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
)
"@ "Create permission_catalog table"

Run-SQL @"
CREATE TABLE IF NOT EXISTS membership_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID NOT NULL REFERENCES company_memberships(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permission_catalog(permission_key),
  allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_membership_permission UNIQUE (membership_id, permission_key)
)
"@ "Create membership_permissions table"

# Create updated_at function
Run-SQL @"
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
"@ "Create updated_at trigger function"

# Create triggers
Run-SQL "CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()" "Create deployments trigger"
Run-SQL "CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()" "Create users trigger"
Run-SQL "CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()" "Create companies trigger"
Run-SQL "CREATE TRIGGER update_company_memberships_updated_at BEFORE UPDATE ON company_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()" "Create memberships trigger"

# Enable RLS
Run-SQL "ALTER TABLE deployments ENABLE ROW LEVEL SECURITY" "Enable RLS on deployments"
Run-SQL "ALTER TABLE users ENABLE ROW LEVEL SECURITY" "Enable RLS on users"
Run-SQL "ALTER TABLE companies ENABLE ROW LEVEL SECURITY" "Enable RLS on companies"
Run-SQL "ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY" "Enable RLS on memberships"
Run-SQL "ALTER TABLE membership_permissions ENABLE ROW LEVEL SECURITY" "Enable RLS on permissions"

# RLS Policies
Run-SQL "CREATE POLICY users_read_own ON users FOR SELECT USING (id = auth.uid())" "Create users read policy"
Run-SQL "CREATE POLICY users_update_own ON users FOR UPDATE USING (id = auth.uid())" "Create users update policy"
Run-SQL "CREATE POLICY users_admin_read ON users FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_system_admin = TRUE))" "Create users admin read policy"

Run-SQL "CREATE POLICY companies_read_member ON companies FOR SELECT USING (EXISTS (SELECT 1 FROM company_memberships WHERE company_id = companies.id AND user_id = auth.uid() AND active = TRUE) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_system_admin = TRUE))" "Create companies read policy"
Run-SQL "CREATE POLICY companies_admin_write ON companies FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_system_admin = TRUE))" "Create companies write policy"

Run-SQL "CREATE POLICY memberships_read ON company_memberships FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM company_memberships cm WHERE cm.company_id = company_memberships.company_id AND cm.user_id = auth.uid() AND cm.base_role = 'admin') OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_system_admin = TRUE))" "Create memberships read policy"
Run-SQL "CREATE POLICY permissions_read ON membership_permissions FOR SELECT USING (EXISTS (SELECT 1 FROM company_memberships cm WHERE cm.id = membership_permissions.membership_id AND cm.user_id = auth.uid() AND cm.base_role = 'admin') OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_system_admin = TRUE))" "Create permissions read policy"
Run-SQL "CREATE POLICY permission_catalog_read ON permission_catalog FOR SELECT USING (auth.uid() IS NOT NULL)" "Create permission catalog read policy"

# Seed Permission Catalog
Run-SQL @"
INSERT INTO permission_catalog (permission_key, group_name, description_en, description_ar, is_critical, sort_order) VALUES
  ('company.view', 'Company', 'View company details', 'عرض تفاصيل الشركة', false, 1),
  ('company.edit', 'Company', 'Edit company settings', 'تعديل إعدادات الشركة', true, 2),
  ('projects.view', 'Projects', 'View projects', 'عرض المشاريع', false, 10),
  ('projects.create', 'Projects', 'Create projects', 'إنشاء مشاريع', false, 11),
  ('projects.edit', 'Projects', 'Edit projects', 'تعديل المشاريع', false, 12),
  ('projects.archive', 'Projects', 'Archive projects', 'أرشفة المشاريع', false, 13),
  ('projects.reopen', 'Projects', 'Reopen archived projects', 'إعادة فتح المشاريع المؤرشفة', false, 14),
  ('projects.pin', 'Projects', 'Pin projects', 'تثبيت المشاريع', false, 15),
  ('projects.delete', 'Projects', 'Delete projects', 'حذف المشاريع', false, 16),
  ('tasks.view', 'Tasks', 'View tasks', 'عرض المهام', false, 20),
  ('tasks.create', 'Tasks', 'Create tasks', 'إنشاء مهام', false, 21),
  ('tasks.edit', 'Tasks', 'Edit tasks', 'تعديل المهام', false, 22),
  ('tasks.convert_to_project', 'Tasks', 'Convert task to project', 'تحويل المهمة إلى مشروع', false, 23),
  ('tasks.archive', 'Tasks', 'Archive tasks', 'أرشفة المهام', false, 24),
  ('tasks.delete', 'Tasks', 'Delete tasks', 'حذف المهام', false, 25),
  ('documents.view', 'Documents', 'View documents', 'عرض المستندات', false, 30),
  ('documents.create', 'Documents', 'Create documents', 'إنشاء مستندات', false, 31),
  ('documents.edit', 'Documents', 'Edit documents', 'تعديل المستندات', false, 32),
  ('documents.print', 'Documents', 'Print documents', 'طباعة المستندات', false, 33),
  ('documents.download', 'Documents', 'Download documents', 'تحميل المستندات', false, 34),
  ('documents.delete', 'Documents', 'Delete documents', 'حذف المستندات', false, 35),
  ('customers.view', 'Customers', 'View customers', 'عرض العملاء', false, 40),
  ('customers.create', 'Customers', 'Create customers', 'إنشاء عملاء', false, 41),
  ('customers.edit', 'Customers', 'Edit customers', 'تعديل العملاء', false, 42),
  ('customers.delete', 'Customers', 'Delete customers', 'حذف العملاء', false, 43),
  ('customers.export', 'Customers', 'Export customers', 'تصدير العملاء', false, 44),
  ('materials.view', 'Materials', 'View materials', 'عرض المواد', false, 50),
  ('materials.create', 'Materials', 'Create materials', 'إنشاء مواد', false, 51),
  ('materials.edit', 'Materials', 'Edit materials', 'تعديل المواد', false, 52),
  ('materials.delete', 'Materials', 'Delete materials', 'حذف المواد', false, 53),
  ('materials.files.manage', 'Materials', 'Manage material files', 'إدارة ملفات المواد', false, 54),
  ('files.view', 'Files', 'View files', 'عرض الملفات', false, 60),
  ('files.upload', 'Files', 'Upload files', 'رفع الملفات', false, 61),
  ('files.download', 'Files', 'Download files', 'تحميل الملفات', false, 62),
  ('files.delete', 'Files', 'Delete files', 'حذف الملفات', false, 63),
  ('reports.view', 'Reports', 'View reports', 'عرض التقارير', false, 70),
  ('reports.export_pdf', 'Reports', 'Export reports to PDF', 'تصدير التقارير إلى PDF', false, 71),
  ('reports.export_excel', 'Reports', 'Export reports to Excel', 'تصدير التقارير إلى Excel', false, 72),
  ('users.view', 'Users', 'View users', 'عرض المستخدمين', false, 80),
  ('users.create', 'Users', 'Create users', 'إنشاء مستخدمين', true, 81),
  ('users.edit', 'Users', 'Edit users', 'تعديل المستخدمين', true, 82),
  ('users.permissions.manage', 'Users', 'Manage user permissions', 'إدارة صلاحيات المستخدمين', true, 83),
  ('users.disable', 'Users', 'Disable users', 'تعطيل المستخدمين', true, 84),
  ('audit.view', 'Activity', 'View activity log', 'عرض سجل النشاط', false, 90),
  ('trash.view', 'Trash', 'View trash', 'عرض سلة المهملات', false, 100),
  ('trash.restore', 'Trash', 'Restore from trash', 'استعادة من سلة المهملات', false, 101),
  ('trash.hard_delete', 'Trash', 'Permanently delete', 'حذف نهائي', true, 102),
  ('factory.view', 'Factory Code', 'View factory codes', 'عرض أكواد المصانع', false, 110),
  ('factory.export', 'Factory Code', 'Export factory codes', 'تصدير أكواد المصانع', false, 111),
  ('factory.import_update', 'Factory Code', 'Import/update factory codes', 'استيراد/تحديث أكواد المصانع', true, 112),
  ('backup.create', 'Backup', 'Create backups', 'إنشاء نسخ احتياطية', false, 120),
  ('backup.restore', 'Backup', 'Restore from backup', 'استعادة من نسخة احتياطية', true, 121),
  ('settings.view', 'Settings', 'View settings', 'عرض الإعدادات', false, 130),
  ('settings.edit', 'Settings', 'Edit settings', 'تعديل الإعدادات', true, 131)
ON CONFLICT (permission_key) DO NOTHING
"@ "Seed permission catalog"

# Create user profile trigger
Run-SQL @"
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
$$ LANGUAGE plpgsql SECURITY DEFINER
"@ "Create user profile trigger function"

Run-SQL "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users" "Drop existing trigger"
Run-SQL "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()" "Create user profile trigger"

Write-Host ""
Write-Host "=== Migration 001 Complete ===" -ForegroundColor Green
