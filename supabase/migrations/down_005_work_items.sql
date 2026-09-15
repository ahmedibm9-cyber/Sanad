-- DOWN Migration 005: Reverse Tasks & Projects

-- Drop view
DROP VIEW IF EXISTS work_item_summary_view;

-- Drop policies
DROP POLICY IF EXISTS work_items_read ON work_items;
DROP POLICY IF EXISTS work_items_write ON work_items;
DROP POLICY IF EXISTS work_item_materials_read ON work_item_materials;
DROP POLICY IF EXISTS work_item_materials_write ON work_item_materials;

-- Disable RLS
ALTER TABLE work_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_materials DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_work_items_updated_at ON work_items;
DROP TRIGGER IF EXISTS update_work_item_materials_updated_at ON work_item_materials;

-- Drop tables
DROP TABLE IF EXISTS work_item_materials CASCADE;
DROP TABLE IF EXISTS work_items CASCADE;
