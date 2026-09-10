# 01 — Schema Audit

## Migration Summary
- **Total migrations:** 13 (001 through 013)
- **Total tables created:** 31
- **Total RLS policies:** 67
- **Total functions:** 4 (update_updated_at, handle_new_user, check_user_permission, validate_staging_rows)
- **Total triggers:** 13 (on_auth_user_created + 12 update_*_updated_at)
- **Total views:** 5 (user_memberships_view, company_membership_count_view, customer_search_view, material_search_view, work_item_summary_view, document_summary_view, todo_summary_view)

## Per-Table Summary

### Core Auth/Tenant
| Table | company_id | Soft-delete | Audit Fields | RLS Policies |
|-------|-----------|-------------|--------------|--------------|
| users | NO | active flag | NO | 3 |
| companies | NO (IS company) | active flag | created_by/updated_by | 2 |
| company_memberships | YES | active flag | NO | 1 |
| permission_catalog | NO | NO | NO | 1 |
| membership_permissions | NO | NO | NO | 1 |

### Business Data
| Table | company_id | Soft-delete | Audit Fields | RLS Policies |
|-------|-----------|-------------|--------------|--------------|
| customers | YES | deleted_at + active | created_by/updated_by | 2 |
| materials | YES | deleted_at + active | created_by/updated_by | 2 |
| material_files | YES | active flag | uploaded_by | 2 |
| material_price_events | YES | NO | recorded_by | 2 |
| work_items | YES | deleted_at + active | created_by/updated_by | 2 |
| work_item_materials | YES | NO | NO | 2 |
| notes | YES | NO | author_user_id | 4 |
| report_issues | YES | NO | reporter_user_id | 4 |
| attachments | YES | active flag | uploaded_by | 4 |
| documents | YES | deleted_at | created_by/updated_by | 2 |

### Configuration
| Table | company_id | Soft-delete | Audit Fields | RLS Policies |
|-------|-----------|-------------|--------------|--------------|
| company_settings | YES | NO | NO | 2 |
| company_assets | YES | active flag | NO | 2 |
| company_bank_accounts | YES | active flag | NO | 2 |
| company_document_defaults | YES | NO | NO | 2 |
| company_config_lists | YES | NO | NO | 2 |

### System/Global
| Table | company_id | Soft-delete | Audit Fields | RLS Policies |
|-------|-----------|-------------|--------------|--------------|
| todos | NO (user) | NO | NO | 2 |
| notifications | YES (nullable) | NO | NO | 3 |
| notification_preferences | NO (user) | NO | NO | 2 |
| audit_events | YES (nullable) | NO | actor_user_id | 2 |
| trash_entries | YES | IS tracker | deleted_by | 2 |
| deployments | NO | NO | NO | 1 |
| backups | NO (deployment) | NO | created_by | 2 |
| backup_settings | NO (deployment) | NO | NO | 2 |
| factory_code_records | NO (global) | NO | NO | 2 |
| factory_code_imports | NO (global) | NO | uploaded_by | 2 |
| factory_code_staging | NO (via import) | NO | NO | 1 |

## Critical Findings

### F012: Migration Bug — Non-existent Column (P0)
- **File:** `008_factory_code.sql:77`
- **Issue:** `CREATE INDEX idx_factory_imports_uploaded ON factory_code_imports(uploaded_at DESC)` references column `uploaded_at` which does not exist
- **Column name:** `started_at`
- **Impact:** Migration 008 will FAIL on clean database
- **Fix:** Changed to `started_at DESC`
- **Status:** FIXED

### F013: users.email NOT UNIQUE (P1)
- **Issue:** `users.email` column has no UNIQUE constraint
- **Impact:** Allows duplicate email accounts; auth system relies on Supabase Auth which does enforce email uniqueness, but the database allows it
- **Recommendation:** Add `UNIQUE` constraint on `users.email`
- **Status:** OPEN

### F014: FK Missing ON DELETE Behavior (P2)
- **Issue:** `work_items.customer_id` and `work_item_materials.material_id` have FK constraints without explicit ON DELETE
- **Impact:** Defaults to NO ACTION; deleting a customer or material referenced by work items will fail with constraint violation
- **Recommendation:** Add explicit ON DELETE behavior (SET NULL or RESTRICT)
- **Status:** OPEN

### F015: Inconsistent Soft-delete Patterns (P2)
- **Issue:** Some tables use `deleted_at`, others use `active` flag, some use both
- **Impact:** Code must handle both patterns; inconsistent query filtering
- **Status:** OPEN (design decision)

### F016: Inconsistent Audit Fields (P2)
- **Issue:** Some tables have full `created_by`/`updated_by`, others have partial (`uploaded_by`, `recorded_by`), many have none
- **Impact:** Incomplete audit trail for some entity types
- **Status:** OPEN (design decision)

### F017: Orphan-Prone FK Columns (P2)
- **Issue:** `material_price_events.work_item_id`, `factory_code_records.first_seen_import_id/last_seen_import_id`, `backups.deployment_id` have no FK constraints
- **Impact:** Can reference non-existent records
- **Status:** OPEN
