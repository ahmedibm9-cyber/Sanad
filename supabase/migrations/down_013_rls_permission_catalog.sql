-- DOWN Migration 013: Reverse Enable RLS on permission_catalog

ALTER TABLE permission_catalog DISABLE ROW LEVEL SECURITY;
