# 02 — Security Audit

## Summary
- **Critical vulnerabilities found:** 7 (F015, F016, F017, F018, F019, F020, F022)
- **Critical vulnerabilities fixed:** 5 (F015, F018, F019, F020, F022)
- **Critical vulnerabilities remaining:** 2 (F016, F017 — backup isolation, require migration with data)
- **High vulnerabilities:** 7 (F023-F032)
- **Build secret scan:** PASS — no server secrets exposed
- **Supabase anon key:** SAFE — designed to be public; verify RLS

## Fixed Security Issues

### F015: Privilege Escalation via Self-Update (P0) — FIXED
**File:** `001_initial_schema.sql:164-171`
**Fix:** Added `WITH CHECK (id = auth.uid() AND is_system_admin = FALSE)` to prevent users from promoting themselves to system admin.
**Verification:** Existing tests pass; policy now blocks `UPDATE users SET is_system_admin = TRUE WHERE id = auth.uid()`.

### F018: IDOR in document.ts (P0) — FIXED
**File:** `src/lib/services/document.ts:107-120`
**Fix:** Added `query.eq('company_id', context.companyId)` to `getDocumentById` to scope queries to the user's company.
**Verification:** TypeScript clean; existing tests pass.

### F019: IDOR in attachment.ts (P0) — FIXED
**File:** `src/lib/services/attachment.ts:74-86`
**Fix:** Added `requirePermission(context, 'files.view')` and company_id filter to `getAttachmentById`.
**Verification:** TypeScript clean; existing tests pass.

### F020: IDOR in workItem.ts (P0) — FIXED
**File:** `src/lib/services/workItem.ts:502-595`
**Fix:** Added permission checks and company_id validation to `getWorkItemMaterials`, `updateMaterial`, and `removeMaterial`.
**Verification:** TypeScript clean; existing tests pass.

### F021: IDOR in material.ts (P1) — FIXED
**File:** `src/lib/services/material.ts:298-312`
**Fix:** Added `requirePermission(context, 'materials.view')` and company_id filter to `getMaterialFiles`.
**Verification:** TypeScript clean; existing tests pass.

### F022: IDOR in audit.ts (P1) — FIXED
**File:** `src/lib/services/audit.ts:148-166`
**Fix:** Added company_id filter to `getEntityAudit` query.
**Verification:** TypeScript clean; existing tests pass.

### F031: Notes RLS Missing System Admin (P1) — FIXED
**File:** `006_notes_issues_attachments.sql:114-136`
**Fix:** Added `OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE)` to `notes_update` and `notes_delete` policies.
**Verification:** Migration syntax valid; existing tests pass.

## Remaining Security Issues

### F016: Backups Table Missing company_id (P0) — OPEN
**File:** `010_backups.sql`
**Issue:** `backups` table has no `company_id` column; any admin from any company can read/write/delete ALL backups.
**Impact:** Cross-company backup data access.
**Fix Required:** Migration to add `company_id` column, update RLS policies.
**Status:** Requires new migration with data backfill.

### F017: Backup Settings Missing company_id (P0) — OPEN
**File:** `010_backups.sql`
**Issue:** `backup_settings` table has no `company_id`; any authenticated user can read all backup settings.
**Impact:** Cross-company settings leak.
**Fix Required:** Migration to add `company_id` column, update RLS policies.
**Status:** Requires new migration with data backfill.

### F013: users.email NOT UNIQUE (P1) — OPEN
**Issue:** No UNIQUE constraint on `users.email`.
**Impact:** Allows duplicate email accounts at DB level.
**Fix Required:** Migration to add UNIQUE constraint.

### F014: FK Missing ON DELETE (P2) — OPEN
**Issue:** `work_items.customer_id` and `work_item_materials.material_id` have no explicit ON DELETE.
**Fix Required:** Migration to add ON DELETE behavior.

### F025: Document Number Uniqueness TOCTOU (P1) — OPEN
**Issue:** Select-then-insert is not atomic; concurrent requests can violate uniqueness.
**Mitigation:** DB constraint catches it; error handling needs improvement.

### F026: Permission Delete-Then-Insert Race (P1) — OPEN
**Issue:** If insert fails after delete, user has zero permissions.
**Fix Required:** Atomic upsert or transaction wrapper.

### F027: sharedData Rollback Fragility (P2) — OPEN
**Issue:** Compensating rollback not wrapped in transaction.
**Mitigation:** Document limitation.

### F028: Fake Backup Checksum (P2) — OPEN
**Issue:** Checksum is timestamp-based, not cryptographic.
**Fix Required:** Replace with real SHA-256.

### F029: Customer Company Fallback (P2) — OPEN
**Issue:** Falls back to `.limit(1)` if no companyId.
**Fix Required:** Remove fallback, require explicit companyId.

### F030: Missing Auth on getWorkItemMaterials (P2) — FIXED
**Status:** Fixed as part of F020.

## Build Secret Scan Results

| What Searched | Found? | Status |
|---------------|--------|--------|
| Supabase service role key | References resolve to `undefined` | SAFE |
| R2 secret access key | References resolve to `undefined` | SAFE |
| R2 access key ID | References resolve to `undefined` | SAFE |
| License credential | References resolve to `undefined` | SAFE |
| Passwords/credentials | None found | SAFE |
| Private API keys | None found | SAFE |
| Supabase anon key | Hardcoded JWT literal in bundle | SAFE (by design) |

## RLS Isolation Summary

| Data Type | Isolated? | Notes |
|-----------|-----------|-------|
| Customers | ✅ | company_id check |
| Materials | ✅ | company_id check |
| Documents | ✅ | company_id check |
| Work Items | ✅ | company_id check |
| Settings | ✅ | company_id check |
| Audit Events | ✅ | company_id check |
| Trash Entries | ✅ | company_id check |
| Notes | ✅ | company_id + author check |
| Attachments | ✅ | company_id check |
| Backups | ❌ | No company_id in table |
| Backup Settings | ❌ | No company_id in table |
| Factory Code Records | ✅ | Global shared table (intentional) |
| Factory Code Imports | ✅ | Global shared table (intentional) |
| Users | ⚠️ | Admin can see all users (intentional) |
