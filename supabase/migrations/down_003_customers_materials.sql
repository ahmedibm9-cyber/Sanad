-- DOWN Migration 003: Reverse Customers & Materials

-- Drop views
DROP VIEW IF EXISTS customer_search_view;
DROP VIEW IF EXISTS material_search_view;

-- Drop policies
DROP POLICY IF EXISTS customers_read ON customers;
DROP POLICY IF EXISTS customers_write ON customers;
DROP POLICY IF EXISTS materials_read ON materials;
DROP POLICY IF EXISTS materials_write ON materials;
DROP POLICY IF EXISTS material_files_read ON material_files;
DROP POLICY IF EXISTS material_files_write ON material_files;
DROP POLICY IF EXISTS material_price_events_read ON material_price_events;
DROP POLICY IF EXISTS material_price_events_write ON material_price_events;

-- Disable RLS
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE material_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE material_price_events DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
DROP TRIGGER IF EXISTS update_material_files_updated_at ON material_files;

-- Drop tables
DROP TABLE IF EXISTS material_price_events CASCADE;
DROP TABLE IF EXISTS material_files CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
