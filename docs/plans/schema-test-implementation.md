# Plan: Schema Reconciliation Test Implementation

## Context

The SANAD project underwent a comprehensive schema reconciliation that created 10 new database tables, added columns to existing tables, created 2 new PostgreSQL functions, and fixed idempotency issues across 17 migration files. The existing test suite has 158 passing tests but lacks coverage for these new schema objects. This plan implements tests to verify the new schema works correctly.

## Global Constraints

- All tests use Vitest with the existing `tests/setup.ts` mock infrastructure
- Tests must be deterministic and isolated (no real Supabase calls)
- Follow existing test patterns: chainable Supabase mocks, factory functions, type validation
- All existing 158 tests must continue passing
- TypeScript must compile with zero errors
- Tests go in `tests/lib/services/` following existing naming conventions

## Task 1: Backup Service Schema Tests

Write tests for the BackupService that verify it correctly interacts with the newly created `backups` and `backup_settings` tables. Test that:
- `BackupRecord` type includes `company_id` field
- `BackupSettings` type includes `company_id` field
- `createManualBackup` inserts with `company_id`
- `createAutomaticBackup` inserts with `company_id`
- `listBackups` filters by `company_id`
- `getBackupSettings` reads by `company_id`
- `updateBackupSettings` upserts by `company_id`

Files to modify: `tests/lib/services/backup.test.ts`
Existing patterns: Follow `company.test.ts` chainable mock pattern

## Task 2: Optimistic Locking Tests

Write tests verifying the optimistic locking mechanism added to5 tables. Test that:
- `WorkItem` type includes `version` field (default 1)
- `Document` type includes `version` field (default 1)
- `Customer` type includes `version` field (default 1)
- `Material` type includes `version` field (default 1)
- `CompanySettings` type includes `version` field (default 1)
- Update operations check `version` match before applying
- Version mismatch throws conflict error
- Successful update increments version

Files to modify: `tests/lib/services/workItem.test.ts`, `tests/lib/services/document.test.ts`, `tests/lib/services/customer.test.ts`, `tests/lib/services/material.test.ts`, `tests/lib/services/settings.test.ts`
Existing patterns: Follow `document.test.ts` type validation pattern

## Task 3: Soft Delete (notes.active) Tests

Write tests verifying the soft delete mechanism for notes. Test that:
- `Note` type includes `active` field (boolean, default true)
- `deleteNote` sets `active = false` instead of hard delete
- `getNotes` filters by `active = true`
- `restoreNote` sets `active = true`

Files to modify: `tests/lib/services/note.test.ts`
Existing patterns: Follow `todo.test.ts` type validation pattern

## Task 4: Migration Idempotency Validation Tests

Write tests that validate the migration files are idempotent. Test that:
- All `CREATE TABLE` statements use `IF NOT EXISTS`
- All `CREATE INDEX` statements use `IF NOT EXISTS`
- All foreign keys have `ON DELETE` clauses
- Seed data uses `ON CONFLICT DO NOTHING`
- No `DROP TABLE` without `IF EXISTS`

Files to create: `tests/lib/migrations.test.ts`
Pattern: Read migration files, regex-match patterns, assert presence/absence

## Task 5: Company Document Defaults & Config Lists Tests

Write tests for the document defaults and config lists integration. Test that:
- `DocumentDefaults` type matches `company_document_defaults` schema
- `ConfigListItem` type matches `company_config_lists` schema
- `getDocumentDefaults` reads from `company_document_defaults`
- `updateDocumentDefaults` upserts to `company_document_defaults`
- `getConfigLists` reads from `company_config_lists`
- Seed data creates 6 list types with correct item counts

Files to modify: `tests/lib/services/settings.test.ts`
Existing patterns: Follow `settings.test.ts` type validation pattern

## Task 6: Integration Test Update

Update the integration test to verify all new schema objects are accessible. Test that:
- `company_document_defaults` table is referenced in integration
- `company_config_lists` table is referenced in integration
- `backups` table is referenced in integration
- `backup_settings` table is referenced in integration
- `exec_transaction` function is referenced in integration
- Version columns are present on all 5 tables

Files to modify: `tests/integration/app.test.ts`
Existing patterns: Follow existing milestone verification pattern

## Success Criteria

- All new tests pass (0 failures)
- All existing 158 tests continue passing
- TypeScript compiles with 0 errors
- No regressions in existing functionality
