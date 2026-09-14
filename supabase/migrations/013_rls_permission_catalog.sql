-- SANAD Database Migration 013: Enable RLS on permission_catalog
-- The permission_catalog table has a read policy (defined in 001_initial_schema.sql)
-- but RLS was never enabled, making the policy ineffective.

ALTER TABLE permission_catalog ENABLE ROW LEVEL SECURITY;
