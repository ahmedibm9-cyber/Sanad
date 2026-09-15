-- DOWN Migration 002: Reverse Company Settings & Assets

-- Drop policies
DROP POLICY IF EXISTS company_settings_read ON company_settings;
DROP POLICY IF EXISTS company_settings_write ON company_settings;
DROP POLICY IF EXISTS company_assets_read ON company_assets;
DROP POLICY IF EXISTS company_assets_write ON company_assets;
DROP POLICY IF EXISTS company_bank_accounts_read ON company_bank_accounts;
DROP POLICY IF EXISTS company_bank_accounts_write ON company_bank_accounts;
DROP POLICY IF EXISTS company_doc_defaults_read ON company_document_defaults;
DROP POLICY IF EXISTS company_doc_defaults_write ON company_document_defaults;
DROP POLICY IF EXISTS company_config_lists_read ON company_config_lists;
DROP POLICY IF EXISTS company_config_lists_write ON company_config_lists;

-- Disable RLS
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_bank_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_document_defaults DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_config_lists DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
DROP TRIGGER IF EXISTS update_company_assets_updated_at ON company_assets;
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON company_bank_accounts;
DROP TRIGGER IF EXISTS update_doc_defaults_updated_at ON company_document_defaults;

-- Drop tables
DROP TABLE IF EXISTS company_config_lists CASCADE;
DROP TABLE IF EXISTS company_document_defaults CASCADE;
DROP TABLE IF EXISTS company_bank_accounts CASCADE;
DROP TABLE IF EXISTS company_assets CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
