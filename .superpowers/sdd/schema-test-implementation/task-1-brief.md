# Task 1: Backup Service Schema Tests

## Description

Write tests for the BackupService that verify it correctly interacts with the newly created `backups` and `backup_settings` tables.

## Requirements

### BackupRecord Type
- Must include `company_id` field
- Must include `r2_object_key` (not `r2_key`)

### BackupSettings Type
- Must include `company_id` field

### createManualBackup
- Must insert with `company_id`
- Must insert with `r2_object_key` (not `r2_key`)

### createAutomaticBackup
- Must insert with `company_id`
- Must insert with `r2_object_key` (not `r2_key`)

### listBackups
- Must filter by `company_id`

### getBackupSettings
- Must read by `company_id`

### updateBackupSettings
- Must upsert by `company_id`

## Files to Modify
- `tests/lib/services/backup.test.ts`

## Existing Patterns to Follow
- Chainable Supabase mock pattern from `company.test.ts`
- Type validation pattern from `document.test.ts`

## Global Constraints
- All tests use Vitest with the existing `tests/setup.ts` mock infrastructure
- Tests must be deterministic and isolated (no real Supabase calls)
- Follow existing test patterns: chainable Supabase mocks, factory functions, type validation
- All existing 158 tests must continue passing
- TypeScript must compile with zero errors
