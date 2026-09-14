# Migration Safety Report

**Reviewed**: 17 migration files (`001_initial_schema.sql` through `017_optimistic_locking.sql`), `seed.sql`, and `supabase/functions/r2-proxy/`

**Date**: 2026-09-11

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKER  | 2     |
| WARNING  | 6     |
| INFO     | 5     |

---

## BLOCKER — Must fix before deploy

### B1: SQL Injection in `exec_transaction` (016_transaction_rpc.sql:16-19)

**File**: `016_transaction_rpc.sql`

The INSERT branch concatenates user-supplied JSON keys directly into SQL without identifier quoting:

```sql
EXECUTE format('INSERT INTO %I (%s) VALUES (%s) RETURNING id',
  op->>'table',
  (SELECT string_agg(key, ',') FROM jsonb_each_text(op->'data')),  -- <-- UNSAFE
  (SELECT string_agg(quote_literal(value), ',') FROM jsonb_each_text(op->'data'))
);
```

The `%s` for column names is raw string interpolation. An attacker controlling the `key` values in the JSON payload can inject arbitrary SQL. The UPDATE branch correctly uses `format('%I = %L', key, value)` — the INSERT branch must do the same.

**Fix**: Quote column identifiers with `%I`:
```sql
SELECT string_agg(format('%I', key), ',') FROM jsonb_each_text(op->'data')
```

---

### B2: `SECURITY DEFINER` Function Has No Authorization Check (016_transaction_rpc.sql:39)

**File**: `016_transaction_rpc.sql`

`exec_transaction` is `SECURITY DEFINER`, meaning it executes with the function owner's privileges (typically `postgres`), **bypassing all RLS policies**. There is no check that the calling user is authenticated or authorized. Any anonymous or authenticated user can:

- INSERT/UPDATE/DELETE any row in any table
- Read all data regardless of company isolation
- Escalate privileges

**Fix**: Add an authorization gate at the start of the function:
```sql
-- Verify caller is an authenticated system admin or appropriate role
IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Not authenticated';
END IF;
-- Optionally check is_system_admin
```

Or remove `SECURITY DEFINER` and let RLS apply (preferred if the caller context is correct).

---

## WARNING — Should address

### W1: No Rollback / Down Migrations

None of the 17 migration files include rollback logic. Supabase does not natively support `DOWN` migrations, so this is common — but there is no documentation of a rollback plan.

**Risk**: If a migration fails partway or needs reversal, there is no automated recovery path. The `015_fix_backup_rls_company_isolation.sql` migration is particularly risky because it drops and recreates policies — a partial failure could leave tables without any RLS policy.

**Mitigation**: Add a comment block at the top of each migration documenting the manual rollback steps, or use Supabase branching for safe testing.

---

### W2: Non-Idempotent `ALTER TABLE ADD COLUMN` (014, 017)

**Files**: `014_soft_delete_todos_notes_issues.sql`, `017_optimistic_locking.sql`

```sql
ALTER TABLE todos ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;       -- 014
ALTER TABLE work_items ADD COLUMN version INTEGER NOT NULL DEFAULT 1;    -- 017
```

These use bare `ADD COLUMN` without checking if the column already exists. While Supabase migrations run once, if a migration needs to be re-run (e.g., after a partial failure), it will fail with a "column already exists" error.

**Fix**: Use a DO block to conditionally add:
```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='active') THEN
    ALTER TABLE todos ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;
```

---

### W3: `CREATE TRIGGER` Without `IF NOT EXISTS` (001, 002, 003, 005, 006, 007, 008, 010)

Multiple migrations create triggers without idempotency guards:

```sql
CREATE TRIGGER update_deployments_updated_at ...   -- 001
CREATE TRIGGER update_company_settings_updated_at  -- 002
CREATE TRIGGER update_customers_updated_at         -- 003
-- etc.
```

PostgreSQL (before v14) does not support `CREATE TRIGGER IF NOT EXISTS`. If any of these triggers already exist (e.g., from a prior partial run), the migration will fail.

**Mitigation**: Since Supabase uses PostgreSQL 15+, wrap in a DO block:
```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deployments_updated_at') THEN
    CREATE TRIGGER update_deployments_updated_at ...;
  END IF;
END $$;
```

Or accept this as a known risk if migrations are guaranteed to run exactly once.

---

### W4: Backup RLS Fix Makes Pre-Existing Records Invisible (015)

**File**: `015_fix_backup_rls_company_isolation.sql`

After adding `company_id` to `backups` and tightening RLS, any backup records created before this migration will have `company_id = NULL`. The new RLS policy requires `cm.company_id = backups.company_id`, which will never match for NULL values. These records become invisible to all users — including system admins (the admin check doesn't help since it checks company membership, not a global bypass).

**Mitigation**: Backfill existing records:
```sql
UPDATE backups SET company_id = (SELECT id FROM companies LIMIT 1) WHERE company_id IS NULL;
```
Or add a fallback in the RLS policy for NULL company_id.

---

### W5: Missing `ON DELETE` Clause on `backups.deployment_id` (010)

**File**: `010_backups.sql`

```sql
deployment_id UUID,  -- No FK constraint, no ON DELETE
```

While this column intentionally has no foreign key (backups reference deployments that may be deleted), the inconsistency with all other UUID references (which have FK + ON DELETE) should be documented.

**Mitigation**: Add a comment explaining why no FK is intentional.

---

### W6: Seed Data for `permission_catalog` in Migration (001)

**File**: `001_initial_schema.sql:250-332`

The permission catalog seed data is embedded in the initial migration. While this uses `ON CONFLICT DO NOTHING` (safe), mixing schema and seed data in migrations makes the seed unchangeable without a new migration. Future permission changes require a separate migration.

**Mitigation**: Consider moving seed data to `seed.sql` for non-critical reference data, or accept this as the permanent permission catalog.

---

## INFO — Accepted risk

### I1: Indexes Not Created `CONCURRENTLY`

All indexes are created with standard `CREATE INDEX`, not `CREATE INDEX CONCURRENTLY`. On Supabase, migrations run during deployment windows where table locks are acceptable. `CONCURRENTLY` would be needed for zero-downtime migrations on large production tables, but is not required for the current scale.

**Accepted**: Fine for current deployment model.

---

### I2: `CREATE OR REPLACE FUNCTION` Is Idempotent

All function definitions use `CREATE OR REPLACE FUNCTION`, which is safe for re-runs:
- `update_updated_at_column()` (001)
- `handle_new_user()` (001)
- `check_user_permission()` (001)
- `validate_staging_rows()` (012)
- `exec_transaction()` (016)
- `setup_dev_user()` (seed.sql)

**Status**: No action needed.

---

### I3: `CREATE OR REPLACE VIEW` Is Idempotent

All views use `CREATE OR REPLACE VIEW`, safe for re-runs:
- `user_memberships_view` (001)
- `company_membership_count_view` (001)
- `customer_search_view` (003)
- `material_search_view` (003)
- `todo_summary_view` (004)
- `work_item_summary_view` (005)
- `document_summary_view` (007)

**Status**: No action needed.

---

### I4: Seed Data Uses `ON CONFLICT` Properly

All seed inserts use conflict handling:
- `permission_catalog`: `ON CONFLICT (permission_key) DO NOTHING` (001)
- `company_document_defaults`: `ON CONFLICT (company_id) DO NOTHING` (002)
- `company_config_lists`: `ON CONFLICT (company_id, list_name, item_value) DO NOTHING` (002)
- `notification_preferences`: `ON CONFLICT (user_id, notification_type) DO NOTHING` (009)
- `companies` in seed.sql: `ON CONFLICT (id) DO NOTHING`
- `setup_dev_user()`: Uses `ON CONFLICT ... DO UPDATE` and `ON CONFLICT ... DO NOTHING`

**Status**: No action needed.

---

### I5: Foreign Keys Have `ON DELETE` Clauses

Every foreign key in the schema specifies either `ON DELETE CASCADE` or `ON DELETE SET NULL`:

- `ON DELETE CASCADE`: Used for dependent data (memberships → company, notes → work_item, etc.)
- `ON DELETE SET NULL`: Used for audit fields (created_by, updated_by, uploaded_by)
- Exception: `backups.deployment_id` has no FK (documented in W5)

**Status**: No action needed.

---

## Edge Function Review: `r2-proxy`

**File**: `supabase/functions/r2-proxy/index.ts`

| Check | Status |
|-------|--------|
| JWT verification | ✅ Validates via Supabase `/auth/v1/user` |
| Company membership check | ✅ Queries `company_memberships` with service role |
| Key ownership validation | ✅ `companies/<companyId>/...` prefix enforced |
| Shared data is read-only | ✅ Upload/delete blocked for `shared/` prefix |
| CORS restrictive by default | ✅ Denies cross-origin when no origins configured |
| Secrets not logged | ✅ No credential logging in error paths |

**Minor note**: The `SUPABASE_SERVICE_ROLE_KEY` is used server-side only (appropriate). No issues found.

---

## Recommendations

1. **Immediate**: Fix B1 (SQL injection) and B2 (authorization bypass) in `016_transaction_rpc.sql` before any production deployment
2. **Before production**: Address W4 (backup data visibility) and add rollback documentation (W1)
3. **Long-term**: Consider adding idempotency guards (W2, W3) if migration re-runs become a pattern
