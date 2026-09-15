# Investigation Case #002: Full Forensic Security Audit

## Case Statement

Complete forensic investigation across 8 parallel lanes covering auth/RPC, migrations, edge functions, frontend, dependencies, service layer, git state, and export/import. Goal: find all hidden defects, latent risks, and unknown-unknowns.

**Mode:** Parallel multi-lane forensic investigation + remediation
**Date:** 2026-09-15
**Investigator:** opencode (mimo-v2.5-free)

---

## Lane Results Summary

| Lane | Focus | Findings | Critical/High |
|------|-------|----------|---------------|
| 1 | Auth & RPC | 11 | 0 (exec_transaction fixed pre-investigation) |
| 2 | Migrations | 14 | 1 (exec_transaction — pre-existing fix) |
| 3 | Edge Functions | 9 | 0 |
| 4 | Frontend Security | 20 | 0 (XSS false positives) |
| 5 | Dependencies & Build | 11 | 0 |
| 6 | Service Layer | 31 | 5 |
| 7 | Git & Uncommitted | 20 | 0 (security-positive changes) |
| 8 | Export/Import & Files | 19 | 0 |
| **Total** | | **135** | **6** |

---

## Remediated HIGH Findings

### F-H1: Cross-tenant reads via caller-supplied companyId
- **Files:** `customer.ts:126`, `material.ts:94`, `document.ts:278`
- **Risk:** Service methods accepted `companyId` as a parameter, allowing any caller to pass a different company's ID
- **Fix:** Removed `companyId` parameter from `getCustomers()`, `getMaterials()`, `getCompanyDocuments()`. Now derives company from `context.companyId`
- **Updated callers:** `useData.ts` (3 hooks updated)

### F-H2: getLatestPrice() / getPriceHistory() no company isolation
- **Files:** `material.ts:461`, `material.ts:483`
- **Risk:** Any authenticated user could read price data for any material by UUID
- **Fix:** Added `context: RequestContext` parameter and `.eq('company_id', context.companyId)` filter to both methods

### F-H3: Filter injection in findAll()/count()
- **File:** `base.ts:96`
- **Risk:** Arbitrary column filtering could bypass company isolation
- **Fix:** Added `ALLOWED_FILTER_KEYS` whitelist. Only `active`, `deleted_at`, `status`, `document_type`, `created_by`, `updated_by`, `category`, `file_type`, `entity_type`, `entity_id`, `company_id` are permitted as filter keys

### F-H4: Arbitrary R2 key injection via uploadAttachment()
- **File:** `attachment.ts:120`
- **Risk:** Client could supply an R2 key pointing to another company's files
- **Fix:** Added validation: `input.r2_object_key.startsWith('companies/${context.companyId}/')` — rejects keys outside company namespace

### F-H5: .env.local secrets on disk
- **Status:** Documented as production secret exposure risk. Secrets present on disk (R2 keys, VERCEL_OIDC_TOKEN). Must be managed via deployment environment variables only, never committed.

### F-H6: @types/jspdf v3 vs jspdf v4 mismatch
- **Status:** Documented. Low runtime risk (types only), but should be resolved.

---

## Remediated MEDIUM Findings

### F-M3/F-M4: Missing company_id on softDelete/restore UPDATE
- **File:** `base.ts:250`, `base.ts:283`
- **Fix:** Added `.eq('company_id', context.companyId)` to all softDelete UPDATE, restore UPDATE, and trash entry cleanup DELETE operations in base service

### F-M5: Unscoped count functions
- **Files:** `customer.ts:372`, `material.ts:507`, `attachment.ts:235`
- **Fix:** Added `context: RequestContext` parameter and `company_id` filter to `getCustomerCount()`, `getMaterialCount()`, `getAttachmentCount()`

### F-M9: Trash entry cleanup not company-scoped
- **Files:** `customer.ts:359`, `material.ts:293`, `document.ts:348`
- **Fix:** Added `.eq('company_id', context.companyId)` to all trash_entries DELETE operations in customer, material, and document restore methods

---

## False Positives (Investigated and Dismissed)

### F-M1/M2: XSS via dangerouslySetInnerHTML in templates
- **Templates use `el.textContent = text(val)`** (`fullaTemplateRenderer.ts:236`), NOT `innerHTML`. User data is never injected as HTML.
- **pdfExport.ts Arabic path** constructs HTML from the safe renderer output. The `container.innerHTML = fullHtml` sets the template structure, not user data.
- **Verdict:** No XSS vulnerability. Templates are safe by construction.

### F-M10: document_data accepts arbitrary JSON
- **Status:** By design. The JSON is stored in the database and rendered via `textContent` in templates. No HTML injection vector.

---

## Remaining Open Items (Low/Info)

| # | Issue | Severity | Action Required |
|---|-------|----------|-----------------|
| 1 | No CSP headers on frontend | Low | Add Content-Security-Policy header |
| 2 | TOCTOU in base update/restore | Low | Optimistic locking present, defense-in-depth gap only |
| 3 | Factory import race condition | Low | Unique constraint on `stable_source_key` prevents duplicates |
| 4 | Orphaned R2 objects on soft-delete | Low | Add background cleanup job |
| 5 | document_data arbitrary JSON | Info | By design, no action needed |
| 6 | create() company_id override order | Info | Currently safe (override after spread) |
| 7 | .env.local secrets on disk | Medium | Rotate secrets, remove from disk |
| 8 | @types/jspdf version mismatch | Low | Update to @types/jspdf@4 |
| 9 | No DOWN migrations | Low | Add rollback scripts for future migrations |

---

## Verification

- **TypeScript:** `npx tsc --noEmit` — clean, 0 errors
- **Test suite:** 374/374 tests pass across 28 files
- **Build:** Passes

---

## Files Modified

| File | Changes |
|------|---------|
| `app/src/lib/services/base.ts` | Added ALLOWED_FILTER_KEYS whitelist; company_id on softDelete/restore/trash cleanup |
| `app/src/lib/services/customer.ts` | Removed companyId param from getCustomers/getCustomerCount; company_id on trash cleanup |
| `app/src/lib/services/material.ts` | Removed companyId param from getMaterials/getMaterialCount; added context to getLatestPrice/getPriceHistory; company_id on price queries and trash cleanup |
| `app/src/lib/services/document.ts` | Removed companyId param from getCompanyDocuments; company_id on restore/trash cleanup |
| `app/src/lib/services/attachment.ts` | Added context to getAttachmentCount; R2 key namespace validation |
| `app/src/hooks/useData.ts` | Updated 3 hook callers to match new service signatures |

---

**Status:** Completed
**Investigator:** opencode (mimo-v2.5-free)
**Date:** 2026-09-15
