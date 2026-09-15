-- DOWN Migration 001: Reverse Initial Schema
-- Drops all objects created in 001_initial_schema.sql

-- Drop views
DROP VIEW IF EXISTS user_memberships_view;
DROP VIEW IF EXISTS company_membership_count_view;

-- Drop function
DROP FUNCTION IF EXISTS check_user_permission(UUID, UUID, TEXT);

-- Drop policies
DROP POLICY IF EXISTS deployments_admin_read ON deployments;
DROP POLICY IF EXISTS users_read_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_admin_read ON users;
DROP POLICY IF EXISTS companies_read_member ON companies;
DROP POLICY IF EXISTS companies_admin_write ON companies;
DROP POLICY IF EXISTS memberships_read ON company_memberships;
DROP POLICY IF EXISTS permissions_read ON membership_permissions;
DROP POLICY IF EXISTS permission_catalog_read ON permission_catalog;

-- Disable RLS
ALTER TABLE deployments DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_permissions DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_deployments_updated_at ON deployments;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_company_memberships_updated_at ON company_memberships;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Delete seed data
DELETE FROM permission_catalog;

-- Drop tables (CASCADE removes FKs)
DROP TABLE IF EXISTS membership_permissions CASCADE;
DROP TABLE IF EXISTS permission_catalog CASCADE;
DROP TABLE IF EXISTS company_memberships CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS deployments CASCADE;

-- Note: uuid-ossp extension is shared; do NOT drop it in case other objects depend on it.
