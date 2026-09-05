-- SANAD Development Seed Data
-- This script inserts test data for development.
-- Run this after migrations.

-- ===========================================
-- 1. Insert Permission Catalog
-- ===========================================
-- Already done in migration 001_initial_schema.sql

-- ===========================================
-- 2. Insert Test Companies
-- ===========================================
INSERT INTO companies (id, name_en, name_ar, legal_name_en, legal_name_ar, short_name, company_code, active, created_by)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fulla International', 'فلا'international', 'Fulla International Trading Co.', 'شركة فلا الدولية للتجارة', 'Fulla', 'FUL', TRUE, NULL),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'GBC Petrochemicals', 'جي بي سي للبتروكيماويات', 'GBC Petrochemicals Ltd.', 'جي بي سي للبتروكيماويات المحدودة', 'GBC', 'GBC', TRUE, NULL),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Kayan Polymers', 'كيان للبوليمرات', 'Kayan Polymers Manufacturing', 'كيان للبوليمرات التصنيع', 'Kayan', 'KAY', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 3. Insert Test Users
-- ===========================================
-- Note: Users must be created through Supabase Auth first.
-- After auth users are created, insert profiles:

-- Example for development (replace with actual auth user IDs):
-- INSERT INTO users (id, display_name, email, preferred_language, is_system_admin, active)
-- VALUES
--   ('user-id-from-auth-1', 'Mohamed Al-Hassan', 'mohamed@sanad-app.com', 'en', TRUE, TRUE),
--   ('user-id-from-auth-2', 'Fatima Al-Rashid', 'fatima@sanad-app.com', 'en', FALSE, TRUE),
--   ('user-id-from-auth-3', 'Omar Saeed', 'omar@sanad-app.com', 'en', FALSE, TRUE),
--   ('user-id-from-auth-4', 'Nora Khalil', 'nora@sanad-app.com', 'ar', FALSE, TRUE);

-- ===========================================
-- 4. Insert Test Memberships
-- ===========================================
-- Example memberships (replace with actual IDs):
-- INSERT INTO company_memberships (company_id, user_id, base_role, active)
-- VALUES
--   -- Mohamed: Admin in all companies
--   ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'user-id-1', 'admin', TRUE),
--   ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'user-id-1', 'admin', TRUE),
--   ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'user-id-1', 'admin', TRUE),
--   
--   -- Fatima: User in Fulla, Viewer in GBC
--   ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'user-id-2', 'user', TRUE),
--   ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'user-id-2', 'viewer', TRUE),
--   
--   -- Omar: User in GBC only
--   ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'user-id-3', 'user', TRUE),
--   
--   -- Nora: Viewer in Fulla only
--   ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'user-id-4', 'viewer', TRUE);

-- ===========================================
-- 5. Insert Test Permissions for Fatima in Fulla
-- ===========================================
-- Example permissions (replace with actual membership IDs):
-- INSERT INTO membership_permissions (membership_id, permission_key, allowed)
-- VALUES
--   -- Fatima in Fulla: User with specific permissions
--   ('membership-id-fatima-fulla', 'projects.view', TRUE),
--   ('membership-id-fatima-fulla', 'projects.create', TRUE),
--   ('membership-id-fatima-fulla', 'projects.edit', TRUE),
--   ('membership-id-fatima-fulla', 'projects.pin', TRUE),
--   ('membership-id-fatima-fulla', 'documents.view', TRUE),
--   ('membership-id-fatima-fulla', 'documents.create', TRUE),
--   ('membership-id-fatima-fulla', 'documents.edit', TRUE),
--   ('membership-id-fatima-fulla', 'documents.download', TRUE),
--   ('membership-id-fatima-fulla', 'customers.view', TRUE),
--   ('membership-id-fatima-fulla', 'customers.create', TRUE),
--   ('membership-id-fatima-fulla', 'customers.edit', TRUE),
--   ('membership-id-fatima-fulla', 'materials.view', TRUE),
--   ('membership-id-fatima-fulla', 'materials.create', TRUE),
--   ('membership-id-fatima-fulla', 'files.view', TRUE),
--   ('membership-id-fatima-fulla', 'files.upload', TRUE),
--   ('membership-id-fatima-fulla', 'files.download', TRUE),
--   ('membership-id-fatima-fulla', 'reports.view', TRUE),
--   ('membership-id-fatima-fulla', 'reports.export_pdf', TRUE),
--   ('membership-id-fatima-fulla', 'reports.export_excel', TRUE),
--   ('membership-id-fatima-fulla', 'factory.view', TRUE),
--   ('membership-id-fatima-fulla', 'factory.export', TRUE),
--   ('membership-id-fatima-fulla', 'audit.view', TRUE),
--   ('membership-id-fatima-fulla', 'trash.view', TRUE),
--   ('membership-id-fatima-fulla', 'trash.restore', TRUE);

-- ===========================================
-- 6. Create Development Helper Function
-- ===========================================
CREATE OR REPLACE FUNCTION setup_dev_user(
  p_user_id UUID,
  p_email TEXT,
  p_display_name TEXT,
  p_is_admin BOOLEAN DEFAULT FALSE
) RETURNS void AS $$
BEGIN
  -- Insert user profile if not exists
  INSERT INTO users (id, display_name, email, is_system_admin, active)
  VALUES (p_user_id, p_display_name, p_email, p_is_admin, TRUE)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    is_system_admin = EXCLUDED.is_system_admin;
  
  -- Create memberships for all companies if admin
  IF p_is_admin THEN
    INSERT INTO company_memberships (company_id, user_id, base_role, active)
    SELECT id, p_user_id, 'admin', TRUE
    FROM companies
    WHERE active = TRUE
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;
