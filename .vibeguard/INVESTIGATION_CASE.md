# SANAD Production Defect & Gap Hunt — Case File

## Case Statement

Systematic forensic hunt for latent bugs, security gaps, data integrity issues, architectural risks, and error handling gaps in the SANAD production application.

**Mode:** Defect Hunt + Gap Hunt  
**Date:** 2026-09-18  
**Repository:** `D:\SANAD`  
**Branch:** `main`  
**Commit:** `2274f09`  
**Worktree:** Clean  
**Environment:** Production at `https://sanad-etl.pages.dev`

---

## Findings Summary

### CRITICAL (3 findings)

| # | Finding | Evidence Grade | File |
|---|---------|---------------|------|
| C1 | `restoreDocument` calls `getDocumentById` which filters `deleted_at IS NULL` — deleted documents cannot be restored | **Confirmed** | `document.ts:332-362` |
| C2 | `document_data` JSONB has ZERO app-level schema validation — any arbitrary JSON can be stored | **Confirmed** | `DocumentFormPage.tsx:361`, `document.ts:163` |
| C3 | Dual `Document` type definitions divergent (camelCase in `types/index.ts` vs snake_case in `services/document.ts`) — massive `as any` bridge needed | **Confirmed** | `types/index.ts:205-224`, `document.ts:19-40` |

### HIGH (12 findings)

| # | Finding | Evidence Grade | File |
|---|---------|---------------|------|
| H1 | Update hooks return `null` instead of throwing — callers can't distinguish success from failure | **Confirmed** | `useData.ts:190,315,464,499,639,715` |
| H2 | No toast/notification system exists — failed operations silently disappear | **Confirmed** | (systemic) |
| H3 | CustomerFormModal and UserFormModal swallow save errors — modal closes on failure | **Confirmed** | `CustomerFormModal.tsx:119-126`, `UserFormModal.tsx:415-416` |
| H4 | Single root ErrorBoundary — one page crash takes down entire app | **Confirmed** | `App.tsx:41-72` |
| H5 | Money amounts use JavaScript floating-point arithmetic — precision loss for decimals | **Confirmed** | `DocumentPreviewPage.tsx:173,193` |
| H6 | `sharedData.ts` synchronization is NOT atomic — concurrent reads see inconsistent data | **Confirmed** | `sharedData.ts:199-371` |
| H7 | `restoreWorkItem` sets `deleted_at=null` but not `active=true` — restored items invisible | **Confirmed** | `workItem.ts:492-528` |
| H8 | ProjectsPage archive/trash/pin/reopen have no user-facing error feedback | **Confirmed** | `ProjectsPage.tsx:165,181,194,203` |
| H9 | No timeout/AbortController on Supabase queries — indefinite hangs on slow networks | **Confirmed** | (systemic) |
| H10 | `company_memberships` has no INSERT/UPDATE/DELETE RLS policies — membership services are broken code paths | **Confirmed** | `001_initial_schema.sql:210-224` |
| H11 | Material table has duplicate price columns (`last_selling_price` and `latest_selling_price`) — app writes to old columns | **Confirmed** | `material.ts:27-29`, `migration 20260916000001` |
| H12 | Document uniqueness check-then-act is not atomic — two concurrent requests could both pass | **Confirmed** | `document.ts:137-147` |

### MEDIUM (15 findings)

| # | Finding | Evidence Grade | File |
|---|---------|---------------|------|
| M1 | `entityType` in `useRestoreTrashEntry` not validated against enum | **Hypothesized** | `useData.ts:935` |
| M2 | `contacts` field untyped `any` in Customer service | **Confirmed** | `customer.ts:25,75` |
| M3 | `currency` defaults silently everywhere — should be required | **Confirmed** | `workItem.ts:247,278` |
| M4 | `work_item_id` nullable on documents but DB is NOT NULL | **Confirmed** | `document.ts:43` |
| M5 | `togglePin` bypasses optimistic locking | **Confirmed** | `workItem.ts:342-360` |
| M6 | No CHECK constraint on `work_items.version` | **Confirmed** | `017_optimistic_locking.sql:5` |
| M7 | Date creation drops timezone — UTC date used instead of local | **Confirmed** | `document.ts:156` |
| M8 | Settings persistence failures silently swallowed | **Confirmed** | `SettingsPage.tsx:201,209` |
| M9 | R2 proxy calls have no timeout or retry | **Confirmed** | `r2Client.ts:108-138` |
| M10 | DocumentFormPage has no loading state during hydration | **Confirmed** | `DocumentFormPage.tsx:160-238` |
| M11 | OfflineBanner is display-only — no action prevention | **Confirmed** | `OfflineBanner.tsx:7` |
| M12 | `sharedData.ts` compares values as strings — floating-point JSONB values may mismatch | **Confirmed** | `sharedData.ts:96-137` |
| M13 | R2 upload errors lose context in MaterialFormModal | **Confirmed** | `MaterialFormModal.tsx:73-108` |
| M14 | No global `unhandledrejection` handler | **Confirmed** | (missing) |
| M15 | No ErrorBoundary around lazy-loaded page imports | **Confirmed** | `App.tsx:8-29` |

### LOW (10 findings)

| # | Finding | Evidence Grade | File |
|---|---------|---------------|------|
| L1 | `document_number` default is incomplete prefix (e.g. `QUOT-2026-`) | **Confirmed** | `DocumentFormPage.tsx:32-36` |
| L2 | `trash_entries.entity_id` has no FK constraint | **Confirmed** | `011_trash_entries.sql:12` |
| L3 | `formatDate` doesn't handle timezone-aware display | **Confirmed** | `format.ts:14-21` |
| L4 | TodosPage form has no double-submit guard | **Confirmed** | `TodosPage.tsx:201` |
| L5 | `getAttachmentCount` returns 0 on error — caller thinks no attachments | **Confirmed** | `attachment.ts:284-286` |
| L6 | DocumentsPage uses `console.error` instead of `appLogger` | **Confirmed** | `DocumentsPage.tsx:93` |
| L7 | Error details hidden in production ErrorBoundary | **Confirmed** | `ErrorBoundary.tsx:78` |
| L8 | `getUnreadCount` returns 0 on error — misleading badge | **Confirmed** | `notification.ts:138-139` |
| L9 | Due date comparison ignores time components | **Confirmed** | `Dashboard.tsx:79` |
| L10 | `material_price_events.work_item_id` added without ON DELETE | **Confirmed** | `migration 20260916000001:182-186` |

### POSITIVE FINDINGS (18 items — well-defended areas)

- All 47 tables have RLS enabled
- Service role key is server-side only
- `check_user_permission` self-identity check prevents escalation
- `handle_new_user` trigger hardcodes `is_system_admin=false`
- `exec_transaction` revoked from all roles
- All SECURITY DEFINER functions have restricted `search_path`
- CORS restricted on r2-proxy
- Audit events are append-only and company-scoped
- Views use `security_invoker=true`
- Frontend permission checks are advisory; RLS enforces at DB level
- Company isolation enforced at both app and DB layers
- Filter key whitelisting in `BaseService.findAll()`
- Search input sanitization via `escapeILike()`
- No raw SQL anywhere in frontend codebase
- DocumentFormPage has explicit double-submit guard
- Attachment upload cleans up orphaned R2 objects on failure
- `users_update_own` prevents self-promotion to admin
- `create-admin` edge function is properly retired (410 Gone)

---

## Recommended Priority Actions

### Immediate (Before Next Deploy)

1. **Fix `restoreDocument`** — it is currently broken (C1)
2. **Fix `restoreWorkItem` to set `active: true`** — restored items invisible (H7)
3. **Fix update hooks to throw or return error objects** — callers can't detect failures (H1)

### Short-Term (This Sprint)

4. **Add toast/notification system** — silent failures across entire app (H2)
5. **Fix CustomerFormModal and UserFormModal error swallowing** — users see success on failure (H3)
6. **Add per-route ErrorBoundaries** — one crash takes down entire app (H4)
7. **Validate `entityType` enum in `useRestoreTrashEntry`** — defense-in-depth (M1)
8. **Add timeout/AbortController to Supabase and R2 fetches** — indefinite hangs (H9)

### Medium-Term

9. **Unify Document type definitions** — eliminate massive `as any` bridge (C3)
10. **Add JSONB schema validation for `document_data`** — any garbage stored (C2)
11. **Fix money calculations to use integer arithmetic** — floating-point precision (H5)
12. **Make shared data synchronization atomic** — race condition (H6)
13. **Clean up duplicate material price columns** — H11
14. **Add missing RLS policies for `company_memberships`** — H10
15. **Make document uniqueness check atomic** — H12

---

## Investigation Metadata

**Investigation Mode:** Defect Hunt + Gap Hunt  
**Status:** completed_with_warnings  
**Completion Protocol:** All four evidence lanes completed. Findings graded using Confirmed/Hypothesized/Disproved framework. No speculative fixes applied during investigation.

**Evidence Lanes:**
1. SQL Injection Analysis — 0 confirmed, 4 hypothesized (very low severity)
2. Auth & Permission Audit — 18 confirmed positive, 2 confirmed gaps
3. Data Integrity Audit — 3 critical, 8 high, 10 medium, 4 low
4. Error Handling Audit — 7 high, 12 medium, 10 low

**Recommended Next Skill:** `ai-systematic-debugging` for the CRITICAL `restoreDocument` bug (C1)
