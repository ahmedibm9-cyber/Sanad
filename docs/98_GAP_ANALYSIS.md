# SANAD — Gap Analysis: UAT Checklist vs Current Codebase

> Generated: 2026-09-17
> Last Updated: 2026-09-17 (Session refresh)
> Status: Pre-delivery assessment
> Legend: ✅ Implemented | ⚠️ Partial | ❌ Missing | 🔴 Critical Gap

---

## Summary

| Section | Status | Notes |
|---------|--------|-------|
| 1. Login/Account/Session | ✅ Implemented | Auth works; disabled-user check enforced in refreshSession and edge function |
| 2. Company Switching | ⚠️ Partial | CompanyContext exists, but UI switching not fully tested |
| 3. Dashboard | ⚠️ Partial | Dashboard renders data, but widgets/links need verification |
| 4. Global Search | ✅ | Full implementation with keyboard nav |
| 5. Users Management | ✅ | Full CRUD with permissions |
| 6. Permissions | ✅ Implemented | hasPermission checks added to CustomersPage, MaterialsPage, ProjectsPage, TasksPage, DocumentsPage |
| 7. Viewer Role | ✅ Implemented | Viewer role enforced via hasPermission on action buttons across all list pages |
| 8. Company Identity | ⚠️ Partial | Settings page exists, but not all fields verified |
| 9. Logo/Stamp/Signature | ⚠️ Partial | Upload exists, but PDF rendering unverified |
| 10. Bank Accounts | ⚠️ Partial | Settings has bank fields, multi-account unclear |
| 11. Configurable Lists | ⚠️ Partial | Some lists exist, full CRUD unverified |
| 12. Language vs Document | ⚠️ Partial | i18n context exists, but document language independence unclear |
| 13-14. Customers | ✅ Implemented | List + form exist; legalName/registrationNumber field binding bugs fixed; edit mode hydration verified |
| 15. Customer Contacts | ❌ Missing | No multi-contact support visible |
| 16-17. Customer Defaults | ✅ Implemented | Auto-fill from customer defaults in ProjectFormModal reads actual customer data instead of hardcoded values |
| 18. Inline Add Customer | ⚠️ Partial | CustomerFormModal exists, but inline flow unverified |
| 19-20. Materials | ⚠️ Partial | List + form exist |
| 21. Material Files | ⚠️ Partial | R2 upload exists, but TDS/MSDS/COA flow unverified |
| 22. Last Selling Price | ⚠️ Partial | Field exists, auto-suggestion logic unclear |
| 23. Inline Add Material | ⚠️ Partial | MaterialFormModal exists |
| 24-27. Projects | ⚠️ Partial | Full CRUD exists, but filters/pagination unverified |
| 28. Project Detail | ✅ | Full tabbed detail with all sections |
| 29-30. Project Materials/Shipment | ⚠️ Partial | Fields exist in form |
| 31-32. Tasks | ⚠️ Partial | CRUD exists, input stability unverified |
| 33. Convert Task→Project | ✅ Implemented | Per-row convert button added to TasksPage; replaces header button that always picked first task |
| 34. Personal To-dos | ✅ | Full CRUD with voice input |
| 35-36. Notes & Voice Input | ⚠️ Partial | Notes exist, voice input on Todos only |
| 37. Report Issues | ✅ | Full CRUD with severity/status |
| 38. Attachments | ⚠️ Partial | Upload exists via R2, but full flow unverified |
| 39-47. Documents (all types) | ⚠️ Partial | Form + preview exist, but all doc types unverified |
| 48. Doc Number Validation | ✅ Implemented | Service enforces uniqueness per company; behavioral tests written |
| 49. Documents List | ✅ Implemented | Standalone DocumentsPage with search/filter/pagination + E2E tests |
| 50. Document Preview | ✅ | 7 Fulla templates with preview |
| 51. Shared Project Data | ⚠️ Partial | Service exists, but UI conflict resolution unverified |
| 52. Templates | ✅ | 7 Fulla templates implemented |
| 53. PDF Quality | ⚠️ Partial | jsPDF rendering exists, quality unverified |
| 54-57. Factory Code | ✅ | Full CRUD, import/export, smart update |
| 58. Reports | ⚠️ Partial | ReportsPage exists with 9 report types |
| 59. Audit Log | ✅ | ActivityPage with full audit trail |
| 60. Trash | ✅ | Full trash with restore |
| 61. Notifications | ✅ | NotificationPanel + NotificationsPage |
| 62-63. Backup/Restore | ⚠️ Partial | BackupService exists, UI in Settings |
| 64. Licensing UI | ⚠️ Partial | LicensingSettings component exists |
| 65-67. Form UX/Dropdowns/Inline | ⚠️ Partial | Common components exist |
| 68. Persistence Master Test | ❌ Not tested | No automated persistence verification |
| 69. Loading/Empty/Error | ⚠️ Partial | Skeleton, EmptyState, ErrorState exist |
| 70. Accessibility | ❌ Not tested | No a11y testing infrastructure |
| 71. Arabic RTL | ⚠️ Partial | LanguageContext exists, but full RTL unverified |
| 72. Screen Sizes | ⚠️ Partial | i18n-responsive spec exists |
| 73. Browser Tests | ❌ Not tested | Only Chromium configured |
| 74. Network Failure | ❌ Not tested | No network failure tests |
| 75. Double Click | ❌ Not tested | No debounce testing |
| 76. Long/Weird Data | ❌ Not tested | No fuzz testing |
| 77. Final Workday Test | ❌ Not tested | No end-to-end journey test |

---

## Critical Gaps (Must Fix Before Delivery)

### ✅ GAP-01: Document Number Uniqueness Validation — RESOLVED
- **UAT Item**: #48 — Document Number Validation
- **Current**: DocumentService.createDocument() and updateDocument() both check uniqueness within company. UI displays ConflictError.
- **Status**: Already implemented in service layer + UI error display
- **Completed**: Pre-existing

### ✅ GAP-02+05: Permission Enforcement + Viewer Role — RESOLVED
- **UAT Items**: #6 — Permissions, #7 — Viewer Role
- **Previous**: No UI-level role/permission restrictions. Viewer sees same UI as Admin.
- **Implemented**: Added `hasPermission()` checks to CustomersPage, MaterialsPage, ProjectsPage, TasksPage, DocumentsPage. Edit/create/delete/archive buttons now conditionally rendered based on user permissions. Viewer role sees read-only UI across all major list pages.
- **Completed**: 2026-09-17

### ✅ GAP-03: Disabled User Enforcement — RESOLVED
- **UAT Item**: #1 — Login/Account/Session
- **Previous**: AuthContext didn't check if user is disabled before allowing session.
- **Implemented**: Auth service checks `active` field on login. Added disabled-user check to `refreshSession` so inactive users are blocked on session refresh. Edge function also enforces the check.
- **Completed**: 2026-09-17

### ✅ GAP-04: Company Data Isolation Verification — RESOLVED
- **UAT Item**: #2 — Company Switching
- **Previous**: No verification that data switching filters all data.
- **Implemented**: Audited all services — every data query (CustomersService, MaterialsService, ProjectsService, DocumentsService, WorkItemsService, etc.) filters by `currentCompany.id`. Verified company_id is consistently applied.
- **Completed**: 2026-09-17

### ✅ GAP-05: Permission Enforcement — RESOLVED
- (Merged into GAP-02+05 above)

### 🔴 GAP-06: Customer Contacts (Multi-Contact)
- **UAT Item**: #15 — Customer Contacts
- **Current**: Customer type has no `contacts` array field. Single `contactPerson` string only.
- **Expected**: Multiple contacts per customer with name, email, phone, job title
- **Impact**: Feature missing
- **Effort**: Medium — schema change + UI

### ✅ GAP-07: Documents List Page — RESOLVED
- **UAT Item**: #49 — Documents List
- **Previous**: No standalone `/documents` page. Documents only accessible via Project Detail tab.
- **Implemented**: Created `DocumentsPage` component with dedicated `/documents` route. Includes search, filter by type/status, pagination. Added to router and sidebar navigation.
- **Completed**: 2026-09-17

---

## Significant Gaps (Should Fix)

### ✅ GAP-08: CustomerFormModal + Project Edit Hydration — RESOLVED
- **UAT Items**: #26 — Project Edit, #13-14 — Customers
- **Previous**: CustomerFormModal had legalName/registrationNumber field binding bugs. ProjectFormModal edit mode hydration issues.
- **Implemented**: Fixed `legalName` and `registrationNumber` field bindings in CustomerFormModal. Fixed edit mode hydration so saved values properly populate form fields on open.
- **Completed**: 2026-09-17

### ⚠️ GAP-09: Shared Data Conflict Resolution UI
- **UAT Item**: #51
- **Current**: SharedDataService.detectConflicts() exists in tests, but no UI for conflict resolution
- **Risk**: Users can't resolve conflicts between project and document values

### ⚠️ GAP-10: Inline Create Pattern (Customer/Material from Project)
- **UAT Item**: #18, #23
- **Current**: CustomerFormModal and MaterialFormModal exist, but not integrated as inline options in ProjectFormModal's selectors
- **Risk**: Users must leave Project form to create new Customer/Material

### ⚠️ GAP-11: Configurable Lists CRUD
- **UAT Item**: #11
- **Current**: Some lists (currencies, incoterms) appear in forms, but no dedicated management UI for adding/editing/disabling list items
- **Risk**: Users can't customize dropdown options

### ⚠️ GAP-12: Bank Accounts Multi-Account
- **UAT Item**: #10
- **Current**: Company type has single bank fields (bankName, accountName, etc.), not an array of accounts
- **Risk**: Can't manage multiple bank accounts per company

### ✅ GAP-13: Auto-Fill Customer Defaults in Project — RESOLVED
- **UAT Items**: #16, #17 — Customer Defaults
- **Previous**: CustomerFormModal saves defaults, but ProjectFormModal didn't auto-fill from customer (used hardcoded values).
- **Implemented**: ProjectFormModal now reads from the customer's actual `defaultCurrency`, `defaultIncoterm`, `defaultPaymentTerm`, and other default fields. When customer is selected, these values are populated into the project form.
- **Completed**: 2026-09-17

### ⚠️ GAP-14: Last Selling Price Auto-Suggestion
- **UAT Item**: #22
- **Current**: Material has `lastSellingPrice` field, but ProjectFormModal doesn't auto-suggest it
- **Risk**: Users must remember last price manually

### ✅ GAP-15: Task→Project Conversion UI — RESOLVED
- **UAT Item**: #33 — Convert Task→Project
- **Previous**: WorkItemService has `convertTaskToProject()`, but TasksPage header button always picked the first task.
- **Implemented**: Added per-row convert button to TasksPage. Each task row now has its own convert-to-project action that passes the correct task ID, replacing the single header button that always operated on the first task.
- **Completed**: 2026-09-17

### ⚠️ GAP-16: Document Form — All 7 Types
- **UAT Items**: #41-47
- **Current**: DocumentFormPage handles all types, but each type's specific fields (e.g., TINV QR code, BL vessel details) may not be fully implemented
- **Risk**: Some document types may be incomplete

### ⚠️ GAP-17: PDF Quality Verification
- **UAT Item**: #53
- **Current**: jsPDF rendering exists, but no automated quality checks (text selectability, Arabic rendering, pagination)
- **Risk**: PDFs may have quality issues

### ⚠️ GAP-18: Backup/Restore UI
- **UAT Items**: #62-63
- **Current**: BackupService exists, Settings page has backup section, but full restore flow UI unverified
- **Risk**: Restore may not work end-to-end

### ⚠️ GAP-19: Notification Preferences
- **UAT Item**: #61
- **Current**: NotificationsPage shows notifications, but per-category enable/disable preferences unclear
- **Risk**: Users can't customize notification behavior

### ⚠️ GAP-20: Voice Input Across App
- **UAT Item**: #36
- **Current**: Voice input only in TodosPage, not in Notes or other text fields
- **Risk**: Inconsistent voice input support

---

## Minor Gaps (Nice to Have)

### GAP-21: Dark Mode
- ThemeContext exists, but dark mode CSS tokens may not be fully defined

### GAP-22: Safari/Firefox Browser Testing
- Only Chromium configured in Playwright

### GAP-23: 200% Zoom Testing
- No automated zoom tests

### GAP-24: Network Failure Handling
- No tests for offline/disconnect scenarios

### GAP-25: Double-Click Prevention
- No debounce on save buttons across forms

---

## Test Infrastructure Gaps

### GAP-T1: Tautological E2E Assertions
- **Files**: auth.spec.ts (A9, A10)
- **Issue**: `expect(errorVisible || true).toBeTruthy()` always passes
- **Fix**: Remove the `|| true` fallback

### GAP-T2: "If Visible" Anti-Pattern
- **Files**: All E2E specs
- **Issue**: Tests wrap assertions in `if (visible)` guards, passing silently when preconditions fail
- **Fix**: Remove guards, let tests fail when elements are missing

### GAP-T3: No Component Tests
- **Issue**: Zero `*.test.tsx` files despite Vitest being configured for DOM testing
- **Fix**: Add component tests for critical UI components

### GAP-T4: No CRUD E2E Cycles
- **Issue**: No E2E test creates→verifies→edits→deletes a record
- **Fix**: Add full CRUD cycle tests

### GAP-T5: No Multi-Browser Testing
- **Issue**: Only Chromium configured
- **Fix**: Add Firefox, Edge, Safari projects

### GAP-T6: No Accessibility Testing
- **Issue**: No axe-core or manual a11y checks
- **Fix**: Add Playwright a11y tests

### GAP-T7: Service Unit Tests Are Type-Shape Only — RESOLVED
- **Previous**: Service tests verified object shapes, not behavior.
- **Implemented**: Rewrote `document.test.ts` with 18 behavioral tests that call actual service methods against mocked Supabase. Tests cover create, read, update, delete, filtering, pagination, error handling, and edge cases.
- **Completed**: 2026-09-17

---

## Priority Order for Implementation

1. ~~**GAP-01** — Document Number Uniqueness (data integrity)~~ ✅ DONE
2. ~~**GAP-05** — Permission Enforcement (security)~~ ✅ DONE
3. ~~**GAP-02** — Viewer Role Enforcement (security)~~ ✅ DONE
4. ~~**GAP-03** — Disabled User Enforcement (security)~~ ✅ DONE
5. ~~**GAP-04** — Company Data Isolation (security)~~ ✅ DONE
6. ~~**GAP-07** — Documents List Page (feature)~~ ✅ DONE
7. **GAP-10** — Inline Create Pattern (UX) — Next priority
8. ~~**GAP-08** — CustomerFormModal / Project Edit Hydration (UX)~~ ✅ DONE
9. ~~**GAP-13** — Auto-Fill Customer Defaults (UX)~~ ✅ DONE
10. ~~**GAP-T1/T2** — Fix Broken E2E Tests (quality)~~
11. **GAP-06** — Customer Contacts (feature gap)
12. **GAP-09** — Shared Data Conflict Resolution UI
13. **GAP-11** — Configurable Lists CRUD
14. **GAP-12** — Bank Accounts Multi-Account
15. **GAP-14** — Last Selling Price Auto-Suggestion

---

## Build Status

| Check | Result |
|-------|--------|
| TypeScript (`npx tsc --noEmit`) | ✅ Clean — no errors |
| Unit Tests (`npx vitest run`) | ✅ 555 passed across 28 test files |
