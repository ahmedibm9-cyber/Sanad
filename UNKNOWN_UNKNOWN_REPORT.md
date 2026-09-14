# SANAD Unknown Unknowns Discovery Report

**Date**: 2026-09-11  
**Codebase**: SANAD Export/Shipping Operations Web App  
**Methodology**: Unknown Unknown Discovery System (UUDS) applied to live codebase

---

## Executive Summary

This audit systematically probed SANAD for hidden failure modes that typical code reviews miss — the "unknown unknowns" where teams don't know what they don't know. We identified **8 critical**, **12 high**, and **15 medium** severity findings across financial precision, cross-tenant isolation, concurrent editing, recovery mechanisms, observability, and configuration interactions.

The system is architecturally sound in many areas (comprehensive RLS, audit trail, soft-delete/trash, error hierarchy), but has significant gaps that would become production-impacting at scale.

---

## Critical Findings (Must Fix Before Production)

### C1. No Company ID in JWT — RLS Is Sole Tenant Isolation
**Location**: `CompanyContext.tsx:140-145`, `AuthContext.tsx`  
**What**: Company switching is purely client-side state. No `company_id` claim in the Supabase JWT. If RLS is ever bypassed (debug mode, admin tools, migration scripts), all tenant data is accessible to any user.  
**Experiment**: Craft a direct Supabase REST API call with `company_id=<other_company>`. RLS blocks it today, but there is zero defense-in-depth.  
**Risk**: Single point of failure for multi-tenant data isolation.

### C2. `create-admin` Edge Function — Hardcoded Credentials, No Auth Guard
**Location**: `supabase/functions/create-admin/index.ts:12-15`  
**What**: Hardcoded `admin@sanad.com` / `123456789` credentials. Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). No authentication check — anyone who can invoke this function creates a superadmin.  
**Experiment**: `curl -X POST` to the edge function endpoint.  
**Risk**: Complete system compromise if deployed to production.

### C3. Backup Restore Is a Stub — No Actual Data Recovery
**Location**: `backup.ts:300-344`, `SettingsPage.tsx:1281-1299`  
**What**: `restoreBackup()` returns `{ restored: true, manifest }` without replaying any data. The restore confirmation modal in Settings just closes — no data operation occurs. Backup system creates files but cannot restore them.  
**Experiment**: Create a backup, delete records, click "Restore" — nothing happens.  
**Risk**: False sense of data safety. Users believe backups are recoverable.

### C4. `withTransaction()` Is Not a Real Transaction
**Location**: `api.ts:268-282`  
**What**: The `withTransaction()` wrapper simply runs the function and catches errors. No `BEGIN`/`COMMIT`/`ROLLBACK`. Multi-step operations (e.g., document creation with line items, shared data sync) are not atomic.  
**Experiment**: Simulate failure mid-operation — partial writes persist.  
**Risk**: Data inconsistency on partial failures. Shared data sync rollback pattern compensates but is fragile.

### C5. No Concurrency Control — Last-Write-Wins Everywhere
**Location**: `base.ts` (all update methods), all service `update()` methods  
**What**: No `version` column, no ETag, no `If-Match` preconditions. Two users editing the same document simultaneously will silently overwrite each other. `updated_at` is written but never checked.  
**Experiment**: Open same document in two browser tabs, edit differently, save both — last save wins silently.  
**Risk**: Silent data loss in multi-user scenarios.

### C6. Inconsistent `company_id` Filtering on Write Operations
**Location**: Multiple services (see details below)  
**What**: Read operations consistently filter by `company_id`, but UPDATE/DELETE operations often omit it:
- `workItem.ts`: `updateWorkItem`, `togglePin`, `archive`, `reopen`, `deleteWorkItem`, `restoreWorkItem` — all `.eq('id', id)` only
- `document.ts`: `updateDocument`, `deleteDocument`, `restoreDocument` — `.eq('id', id)` only
- `customer.ts`: `deleteCustomer`, `restoreCustomer` — `.eq('id', id)` only
- `material.ts`: `deleteMaterial`, `restoreMaterial`, `updateLastSellingPrice` — `.eq('id', id)` only
- `settings.ts`: `updateAsset`, `deleteAsset`, `updateBankAccount`, `deleteBankAccount` — `.eq('id', id)` only

**Risk**: If RLS has any bypass path, writes could affect wrong-tenant records.

### C7. Notes, Report Issues, Attachments — Zero Application-Level Company Filtering
**Location**: `note.ts` (all methods), `reportIssue.ts` (all methods), `attachment.ts` (most methods)  
**What**: These services query by `work_item_id` or `id` only — no `company_id` filter at any layer except RLS.  
**Experiment**: If RLS is disabled for any reason, any user can read/modify any note/issue/attachment across all tenants.  
**Risk**: Weakest isolation layer for 3 entity types.

### C8. `trash_entries` Delete in Restore Doesn't Filter by `entity_type`
**Location**: `workItem.ts:486-489`  
**What**: `restoreWorkItem` deletes trash entries by `entity_id` only, without `entity_type` filter. Could delete the wrong trash entry if IDs collide across entity types.  
**Risk**: Wrong trash entry deleted during restore.

---

## High Findings (Fix Before Beta)

### H1. All `useFetch` Hooks Silently Swallow Errors
**Location**: `useData.ts` (lines 119-125, 253, 385, 580, 594, 714, 796, 852, 867, 905, 923, 938, 979, 1074)  
**What**: Every data-fetching hook catches errors and returns `[]` or `null` with no logging, no user notification, no error state. Users see empty screens with no indication of failure.  
**Impact**: Silent failures mask backend issues. Users assume "no data" instead of "error loading data."

### H2. Financial Precision Uses IEEE-754 Double for Currency
**Location**: `DocumentFormPage.tsx:86, 169-173, 748, 754, 757`  
**What**: All money calculations use JavaScript `Number` (IEEE-754 double-precision float). VAT: `Math.round(subtotal * (vatRate / 100) * 100) / 100`. Line totals: plain `quantity * unitPrice`. No `BigInt` or `Decimal` library.  
**Test inconsistency**: `document.test.ts:84-91` computes VAT without the `Math.round(... * 100) / 100` wrapper that production code uses.  
**Risk**: Rounding drift on high-value invoices. Test doesn't match production behavior.

### H3. Backup Checksum Is Pseudo-Hash
**Location**: `backup.ts:485`  
**What**: `checksum: \`sha256-${Date.now()}-${companyId}\`` — timestamp-based pseudo-value, not an actual SHA-256 of data. No integrity verification possible.  
**Risk**: Corrupted backups pass validation.

### H4. Backup R2 Upload Error Is Swallowed
**Location**: `backup.ts:281`  
**What**: R2 upload failure returns `null` instead of propagating. User is not notified that backup was partially created but not uploaded.  
**Risk**: Backup appears successful but file is not in R2.

### H5. Backup Scheduler Ignores `hourly`/`monthly` Intervals
**Location**: `backupScheduler.ts:45`  
**What**: Scheduler only handles `daily` and `weekly`. `hourly` and `monthly` silently default to `daily`. SettingsPage exposes all 4 options.  
**Risk**: User configures `monthly` backups but gets daily.

### H6. Settings Save Doesn't Update Normalized Document Defaults Table
**Location**: `SettingsPage.tsx:275` vs `company_document_defaults` table  
**What**: SettingsPage saves everything to `company_settings` JSONB blob. The `company_document_defaults` table (with `default_language`, `default_template`, etc.) is never updated from the UI. Its seed values persist forever.  
**Risk**: Two sources of truth for document defaults; normalized table is stale.

### H7. Missing Foreign Key Constraints
**Location**: `003_customers_materials.sql:140`, `010_backups.sql:8`  
**What**: `material_price_events.work_item_id` and `backups.deployment_id` have no `REFERENCES` constraint. Orphaned records possible.  
**Risk**: Data integrity degradation over time.

### H8. Conditional `company_id` Filtering (Falsy Context)
**Location**: `document.ts:91`, `document.ts:119`, `attachment.ts:82`, `material.ts:308`, `audit.ts:161`  
**What**: Several services only add `company_id` filter when `context.companyId` is truthy. If context is missing company (e.g., system-level call), the filter is skipped.  
**Risk**: Accidental cross-tenant data access in edge cases.

### H9. Backups RLS Gap — Cross-Company Visibility for Admins
**Location**: `010_backups.sql:53-64`  
**What**: Backup RLS policy checks admin membership but doesn't filter by `deployment_id`. Any admin can see backups from other companies.  
**Risk**: Cross-tenant data leakage for backup metadata.

### H10. Permission Catalog RLS Was Ineffective (Fixed in Migration 013)
**Location**: `013_rls_permission_catalog.sql`  
**What**: Migration 001 defined an RLS policy on `permission_catalog` but never enabled RLS. Between migrations 001-013, the table was readable by any authenticated user. Fixed by migration 013.  
**Risk**: Historical data exposure window.

### H11. No Retry/Backoff Logic for Failed Operations
**Location**: Entire codebase  
**What**: Only retry logic is in `auth.ts:130-141` (profile poll, 5 attempts). All other operations fail immediately with no retry. `ErrorState` component has manual "Retry" button but relies on caller.  
**Risk**: Transient network errors cause permanent failures.

### H12. Remote Telemetry Is a Stub
**Location**: `logger.ts:163-171`  
**What**: `sendToRemote()` is an empty placeholder. No Sentry, Datadog, or any monitoring SDK. Errors go to console only.  
**Risk**: No production error visibility.

---

## Medium Findings (Fix Before Launch)

### M1. No Client-Side Settings Validation
**Location**: `SettingsPage.tsx:251-324`  
**What**: `handleSave()` sends raw form state to Supabase without length limits, format validation, or required-field checks.

### M2. `showSignature`/`showStamp` No Asset Existence Check
**Location**: `DocumentFormPage.tsx:80-81`, `template.ts:383,387`  
**What**: Flags can be enabled without uploaded signature/stamp assets. Templates render nothing silently.

### M3. Report Service Allows Caller-Controlled `company_id`
**Location**: `report.ts:87`  
**What**: `filters.companyId || context.companyId` — caller can override company scope.

### M4. No Real-Time Data Subscriptions
**Location**: Entire codebase  
**What**: Only auth state changes use Supabase Realtime. No live data sync between tabs/users. Multiple users see stale data.

### M5. `withTransaction()` Gives False Atomicity Assumption
**Location**: `api.ts:268-282`  
**What**: Developers may assume multi-step operations are atomic. They are not.

### M6. No DOWN Migrations
**Location**: `supabase/migrations/` (all 13 files)  
**What**: All migrations are forward-only. No rollback scripts. Safe today (additive only) but risky for future schema changes.

### M7. Hard Delete Permission Defined But Unused
**Location**: `types/index.ts:77`, `UsersPage.tsx:150`  
**What**: `trash.hard_delete` permission exists with `critical: true` but no UI or service method implements hard delete.

### M8. Hard Deletes for Todos, Notes, Report Issues
**Location**: `todo.ts:213`, `note.ts:158`, `reportIssue.ts:171`  
**What**: These entity types bypass the trash system entirely. Hard delete with no recovery path.

### M9. Notification Cleanup Hard Deletes After 90 Days
**Location**: `notification.ts:219`  
**What**: Read notifications older than 90 days are permanently deleted. No archive option.

### M10. Error Boundary Shows Stack Traces to Users
**Location**: `ErrorBoundary.tsx:83-86`  
**What**: Error details (message + stack trace) rendered in the UI. Should be logged server-side only in production.

### M11. Arabic RTL PDF Uses html2canvas (Screenshot-Based)
**Location**: `pdfExport.ts`  
**What**: PDF generation captures a canvas screenshot of the rendered HTML. Text is not selectable/searchable in the PDF. RTL text may have rendering artifacts.

### M12. No Input Sanitization on Rich Text Fields
**Location**: Various form components  
**What**: No XSS protection on user-generated content that may be rendered with `dangerouslySetInnerHTML` or similar.

### M13. `dangerouslySetInnerHTML` on `<style>` Tags Doesn't Work
**Location**: Previously in Template.tsx files (now fixed with CSS import)  
**What**: Dynamic style injection via `dangerouslySetInnerHTML` on `<style>` elements fails silently. Already mitigated by CSS import pattern.

### M14. Test/Production Code Inconsistency in VAT Calculation
**Location**: `document.test.ts:84-91` vs `DocumentFormPage.tsx:169-173`  
**What**: Test computes `subtotal * 0.15` without rounding. Production uses `Math.round(subtotal * (vatRate / 100) * 100) / 100`. Tests pass but don't validate actual production behavior.

### M15. Documentation Vacuum
**Location**: No inline API docs, no architecture decision records, no CHANGELOG  
**What**: `logger.ts:142-144` has a remote logging placeholder. No ADRs exist. AGENTS.md is the only architecture documentation. Context loss risk when original developers leave.

---

## Positive Findings (Well-Designed)

1. **Comprehensive RLS**: All 27 tables have RLS enabled with company membership checks
2. **Full Audit Trail**: `audit_events` table with before/after JSON, actor tracking, Activity page UI
3. **Soft Delete + Trash**: All major entities use `deleted_at` with trash_entries for recovery
4. **Typed Error Hierarchy**: `AppError` -> 7 subtypes with Supabase error code mapping
5. **Structured Logging**: 6 pre-configured loggers with child logger support
6. **Error Boundary**: App-wide React error boundary with bilingual UI
7. **created_by/updated_by tracking**: Every entity tracks who modified it
8. **Archive/Reopen workflow**: Projects and tasks support archive without data loss
9. **R2 Proxy Auth**: Edge function validates JWT, membership, and key ownership
10. **Comprehensive Permissions System**: 50+ granular permission keys with role-based defaults
11. **Backup Manifest**: Row counts + R2 object keys for backup verification (even if checksum is pseudo)
12. **No Mock Data Mixing**: Empty `src/data/` directory — no cross-tenant mock data risk

---

## Diagnostic Questions for Team

1. "Has anyone ever restored from a backup? What happened?" → Tests C3
2. "What happens if two people edit the same invoice at the same time?" → Tests C5
3. "Can you show me a test that proves our backup restore actually works?" → Tests C3
4. "If we disable RLS for a migration, what's the blast radius?" → Tests C1, C6, C7
5. "What's the largest invoice amount we've tested? Did rounding match the accountant's expectation?" → Tests H2
6. "If the R2 upload fails during backup, does the user know?" → Tests H4
7. "What happens to a note if its parent work item is hard-deleted?" → Tests M8
8. "Can an admin see backups from another company?" → Tests H9
9. "What does the user see when the API is down? Is it an empty screen or an error?" → Tests H1
10. "If I configure monthly backups, will they actually run monthly?" → Tests H5

---

## Recommended Fix Priority

### Phase 1: Security & Data Integrity (Week 1)
- Remove `create-admin` edge function (C2)
- Add `company_id` to all UPDATE/DELETE queries (C6)
- Add company filtering to notes, issues, attachments services (C7)
- Add `entity_type` filter to trash restore (C8)
- Fix backup RLS to scope by deployment (H9)

### Phase 2: Reliability & Recovery (Week 2)
- Implement actual backup restore or remove the feature (C3)
- Replace `withTransaction()` with real Supabase RPC transactions (C4)
- Add optimistic locking or version checks for concurrent edits (C5)
- Add retry/backoff for transient failures (H11)
- Fix hook error handling to surface errors to UI (H1)

### Phase 3: Financial & Observability (Week 3)
- Adopt a decimal library for currency calculations (H2)
- Implement remote error tracking (Sentry/Datadog) (H12)
- Add real-time subscriptions for collaborative editing (M4)
- Fix backup checksum to use actual SHA-256 (H3)
- Fix settings to update normalized document defaults table (H6)

### Phase 4: Hardening (Week 4)
- Add client-side settings validation (M1)
- Add retry logic for auth profile creation (H11)
- Fix test/production VAT calculation inconsistency (M14)
- Add signature/stamp asset existence checks (M2)
- Write ADRs for key architectural decisions (M15)

---

*Report generated by Unknown Unknown Discovery System applied to SANAD codebase.*
