# Task 4: Migration Idempotency Validation Tests — Report

## Status: DONE

## Summary

Created `app/tests/lib/migrations.test.ts` — 86 parameterized tests that statically analyze all 17 SQL migration files for idempotency compliance. Also fixed one real defect found by the tests.

## Validation Rules Tested

| Rule | Pattern | Migration Files Scanned |
|------|---------|------------------------|
| CREATE TABLE must use IF NOT EXISTS | `CREATE TABLE IF NOT EXISTS` | 17 |
| CREATE INDEX must use IF NOT EXISTS | `CREATE INDEX IF NOT EXISTS` | 17 |
| Foreign keys must have ON DELETE | `REFERENCES ... ON DELETE` | 17 |
| Seed INSERT must use ON CONFLICT | `INSERT ... ON CONFLICT` | 17 |
| DROP TABLE must use IF EXISTS | `DROP TABLE IF EXISTS` | 17 |

## Test Architecture

- **File**: `app/tests/lib/migrations.test.ts`
- **Approach**: Each test uses `it.each(files)` to run the same check against every migration file, giving clear per-file pass/fail output.
- **SQL parsing**: Comments (`--` and `/* */`) and string literals are stripped before regex matching to avoid false positives on commented-out code or quoted text containing keywords.
- **Function body exclusion**: For INSERT checks, function bodies (`$$ ... $$`) are stripped so `INSERT INTO` statements inside PL/pgSQL function definitions are not flagged (they are deferred, not executed at migration time).
- **Coverage gate**: Asserts at least 15 migration files exist, preventing accidental file deletion from going unnoticed.

## Defect Found & Fixed

**`001_initial_schema.sql:103`** — `membership_permissions.permission_key` had `REFERENCES permission_catalog(permission_key)` with no `ON DELETE` clause.

**Fix**: Added `ON DELETE CASCADE` — if a permission is removed from the catalog, associated membership permission rows should be cascade-deleted.

## Test Results

```
✓ tests/lib/migrations.test.ts (86 tests) 126ms
  ✓ CREATE TABLE IF NOT EXISTS: 17/17 files pass
  ✓ CREATE INDEX IF NOT EXISTS: 17/17 files pass
  ✓ FK ON DELETE:              17/17 files pass (after fix)
  ✓ INSERT ON CONFLICT:        17/17 files pass
  ✓ DROP TABLE IF EXISTS:      17/17 files pass
  ✓ Coverage:                  17/17 files scanned

Full suite: 286 tests passed across 25 test files — no regressions.
```

## Commit

```
7c8e22c test: add migration idempotency validation tests + fix missing ON DELETE
```
