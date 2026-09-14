# Migration Rollback Guide

## Rollback Philosophy
Supabase does not support DOWN migrations. Rollback must be manual.

## Per-Migration Rollback

### 001_initial_schema
- **Created**: `deployments`, `users`, `companies`, `company_memberships`, `permission_catalog`, `membership_permissions` tables; `update_updated_at_column()` function; RLS policies; `user_memberships_view`, `company_membership_count_view` views; `handle_new_user()` function and trigger; permission catalog seed data
- **Rollback**: DROP all tables, functions, views, triggers in reverse order
- **Risk**: HIGH - Data loss (all core tables cascade)
- **Mitigation**: Full backup before rollback

### 002_company_settings
- **Created**: `company_settings`, `company_assets`, `company_bank_accounts`, `company_document_defaults`, `company_config_lists` tables; triggers; RLS policies; seed data for config lists
- **Rollback**: DROP all tables, triggers; DROP RLS policies
- **Risk**: MEDIUM - Loss of company configuration and assets
- **Mitigation**: Export company_settings, company_assets, company_config_lists before rollback

### 003_customers_materials
- **Created**: `customers`, `materials`, `material_files`, `material_price_events` tables; triggers; RLS policies; `customer_search_view`, `material_search_view` views
- **Rollback**: DROP all tables, triggers, views; DROP RLS policies
- **Risk**: HIGH - Loss of customer and material data
- **Mitigation**: Export customers and materials data before rollback

### 004_todos
- **Created**: `todos` table; trigger; RLS policies; `todo_summary_view` view
- **Rollback**: DROP table, trigger, view; DROP RLS policies
- **Risk**: LOW - Personal user data only
- **Mitigation**: Export todos if needed

### 005_work_items
- **Created**: `work_items`, `work_item_materials` tables; triggers; RLS policies; `work_item_summary_view` view
- **Rollback**: DROP tables, triggers, view; DROP RLS policies
- **Risk**: HIGH - Core business data (tasks/projects)
- **Mitigation**: Export work_items and work_item_materials before rollback

### 006_notes_issues_attachments
- **Created**: `notes`, `report_issues`, `attachments` tables; triggers; RLS policies
- **Rollback**: DROP tables, triggers; DROP RLS policies
- **Risk**: MEDIUM - Loss of notes, issues, and attachment metadata
- **Mitigation**: Export tables before rollback

### 007_documents
- **Created**: `documents` table; trigger; RLS policies; `document_summary_view` view
- **Rollback**: DROP table, trigger, view; DROP RLS policies
- **Risk**: HIGH - Core business documents
- **Mitigation**: Export documents data before rollback

### 008_factory_code
- **Created**: `factory_code_records`, `factory_code_imports` tables; trigger; RLS policies
- **Rollback**: DROP tables, trigger; DROP RLS policies
- **Risk**: MEDIUM - Loss of factory code master data
- **Mitigation**: Export factory_code_records before rollback

### 009_notifications_audit_reports
- **Created**: `audit_events`, `notifications`, `notification_preferences` tables; RLS policies; seed data for notification preferences
- **Rollback**: DROP tables; DROP RLS policies
- **Risk**: LOW - Audit logs and notifications (non-critical data)
- **Mitigation**: Export audit_events if compliance requires

### 010_backups
- **Created**: `backups`, `backup_settings` tables; trigger; RLS policies
- **Rollback**: DROP tables, trigger; DROP RLS policies
- **Risk**: LOW - Backup metadata only (actual backups in R2)
- **Mitigation**: None needed

### 011_trash_entries
- **Created**: `trash_entries` table; RLS policies
- **Rollback**: DROP table; DROP RLS policies
- **Risk**: LOW - Soft-delete tracking only
- **Mitigation**: None needed

### 012_factory_code_staging
- **Created**: `factory_code_staging` table; RLS policies; `validate_staging_rows()` function
- **Rollback**: DROP table, function; DROP RLS policies
- **Risk**: LOW - Temporary staging data only
- **Mitigation**: None needed

### 013_rls_permission_catalog
- **Created**: RLS enabled on `permission_catalog`
- **Rollback**: ALTER TABLE permission_catalog DISABLE ROW LEVEL SECURITY
- **Risk**: LOW - RLS fix only
- **Mitigation**: None needed

### 014_soft_delete_todos_notes_issues
- **Created**: `active` column on `todos`, `notes`, `report_issues`; indexes
- **Rollback**: DROP indexes; ALTER TABLE DROP COLUMN active ( CASCADE)
- **Risk**: MEDIUM - Loss of soft-delete state
- **Mitigation**: Export active status before rollback

### 015_fix_backup_rls_company_isolation
- **Created**: `company_id` column on `backups`; index; recreated RLS policies
- **Rollback**: DROP new policies; DROP index; ALTER TABLE DROP COLUMN company_id
- **Risk**: LOW - RLS policy fix
- **Mitigation**: None needed

### 016_transaction_rpc
- **Created**: `exec_transaction()` function
- **Rollback**: DROP FUNCTION exec_transaction(JSONB)
- **Risk**: LOW - RPC function only
- **Mitigation**: None needed

### 017_optimistic_locking
- **Created**: `version` column on `work_items`, `documents`, `customers`, `materials`, `company_settings`; indexes
- **Rollback**: DROP indexes; ALTER TABLE DROP COLUMN version ( CASCADE)
- **Risk**: MEDIUM - Loss of version tracking
- **Mitigation**: Export version data if needed
