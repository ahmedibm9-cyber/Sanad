# SANAD — Handoff Summary
**Date:** 2026-09-09
**Agent:** opencode (mimo-v2.5-free)

---

## What Was Done

### Phase 1: Mock Data Removal (5 files)
- `GlobalSearch.tsx` — replaced mock data with real hooks
- `NotificationPanel.tsx` — replaced mock data with real hooks
- `TopBar.tsx` — replaced mock data with real hooks
- `ProjectFormModal.tsx` — replaced mock data with real hooks
- `UserFormModal.tsx` — replaced mock data with real hooks

### Phase 2: Dead Controls Removal
- Removed 8 `alert()` placeholder calls across ProjectDetailPage, TaskDetailPage, DocumentPreviewPage, DocumentFormPage
- Fixed 2 TODO comments in TaskDetailPage for Supabase persistence
- Created `pdfExport.ts` with real jsPDF generation
- Created `downloadAttachment()` in `r2.ts`

### Phase 3: DocumentFormPage Hardcoded Values
- Replaced 25+ hardcoded values (SAR, HDPE 952, MV Pacific Star, etc.) with dynamic data from project/customer/company settings
- All currency labels now use `currentCompany.defaultCurrency`

### Phase 4: PDF Generation
- Implemented real vector PDF generation using jsPDF + jspdf-autotable
- Supports all 7 document types (QUOT, PINV, TINV, CINV, PKL, DN, BL)
- Template A (professional) and Template B (minimal)
- Arabic/English bilingual support

### Phase 5: Excel Exports
- Created `excelExport.ts` with `exportFactoryCodeFiltered()` and `exportFactoryCodeFull()`
- Generic `exportToExcel()` helper for Reports page
- Auto-fit columns, auto-filter, frozen headers, TEXT-type cells for codes

### Phase 6: Voice Input
- Created `useSpeechRecognition.ts` hook using real Web Speech API
- Updated TodosPage with real microphone recording
- Language auto-matches app setting

### Phase 7: Last Selling Price
- Verified: ProjectFormModal suggests last selling price on material select
- Added: `useUpdateMaterialLastPrice()` hook
- Added: DocumentFormPage saves price to materials table after document save
- Added: `material_price_events` history tracking

### Phase 8: Factory Code Smart Update
- Implemented real Excel parsing with `xlsx` library
- Smart merge algorithm: New→INSERT, Changed→UPDATE, Unchanged→KEEP, Old→KEEP
- Deterministic `stable_source_key` formula
- Import history tracking in `factory_code_imports`
- Upload → Preview → Smart Merge → Summary workflow

### Phase 9: Document Persistence
- Wired DocumentFormPage save handler to real `documentService.createDocument()` / `updateDocument()`
- Proper request context with user/company/permissions

### Phase 10: Shared Data Transaction Safety
- `synchronizeData()` now handles partial failures gracefully
- Per-document tracking with success/failure status
- Audit logging wrapped in individual try/catch blocks

### Phase 11: Notification Persistence
- Created `useMarkNotificationRead()` and `useMarkAllNotificationsRead()` hooks
- NotificationPanel and NotificationsPage now persist read status to Supabase

### Phase 12: RLS Verification
- Audited all 28 tables across 11 migration files
- All tables have RLS enabled with proper read/write policies
- Fixed: removed erroneous `active = TRUE` from `documents_read` policy

### Phase 13: Backup Service
- `createManualBackup()` now collects real table row counts and R2 keys
- `generateManifest()` iterates all 16 company tables
- `restoreBackup()` implemented with validation

### Phase 14: Accessibility
- Verified Modal component: role="dialog", aria-modal, focus trap, Escape key
- Minor gaps identified (non-critical): missing role="alert" on login error, placeholder-only search labels

### Phase 15: Final Cleanup
- Removed hardcoded `value === 48` conflict trigger from DocumentFormPage
- Replaced DocumentPreviewPage hardcoded items with real `useWorkItemMaterials` data
- Removed 3 setTimeout save delays from form modals (CustomerFormModal, MaterialFormModal, ProjectFormModal)

---

## Files Modified

### New Files Created
- `src/lib/pdfExport.ts` — Real PDF generation with jsPDF
- `src/lib/excelExport.ts` — Real Excel export with xlsx
- `src/hooks/useSpeechRecognition.ts` — Browser speech recognition hook
- `supabase/migrations/011_trash_entries.sql` — Missing trash_entries table

### Modified Files
- `src/pages/DocumentFormPage.tsx` — Hardcoded values → dynamic; real save handler
- `src/pages/DocumentPreviewPage.tsx` — Real materials from useWorkItemMaterials
- `src/pages/ProjectDetailPage.tsx` — Real PDF/download handlers
- `src/pages/TaskDetailPage.tsx` — Real download handlers + Supabase persistence
- `src/pages/TodosPage.tsx` — Real speech recognition
- `src/pages/FactoryCodePage.tsx` — Real Excel exports + smart merge
- `src/components/common/GlobalSearch.tsx` — Real hooks
- `src/components/common/NotificationPanel.tsx` — Real hooks + Supabase persistence
- `src/components/layout/TopBar.tsx` — Real hooks
- `src/components/projects/ProjectFormModal.tsx` — Real hooks + no setTimeout
- `src/components/users/UserFormModal.tsx` — Real hooks
- `src/components/customers/CustomerFormModal.tsx` — No setTimeout
- `src/components/materials/MaterialFormModal.tsx` — No setTimeout
- `src/hooks/useData.ts` — Added useMarkNotificationRead, useMarkAllNotificationsRead, useUpdateMaterialLastPrice, useConvertTaskToProject, useFactoryCodeAll
- `src/lib/r2.ts` — Added downloadAttachment()
- `src/lib/services/factoryCode.ts` — Smart merge with xlsx parsing
- `supabase/migrations/007_documents.sql` — Fixed RLS policy (removed active column reference)

---

## What's Next (Priority Order)

1. **Report Exports** — Wire export buttons in ReportsPage for all 11 report types
2. **ZATCA QR Code** — Implement Saudi tax authority QR for Tax Invoices
3. **Automatic Backup Scheduler** — Implement cron-based backup scheduling
4. **Online Backup R2 Upload** — Complete the R2 upload for backup artifacts
5. **Real Backend Integration** — Replace remaining `setTimeout` save patterns with Supabase calls in form modals (currently in prototype phase)

---

## Key Technical Notes

- **No test suite exists** — Testing needs to be set up from scratch
- **No lint config** — Only TypeScript strict mode
- **R2 config uses placeholder values** — Expected for development; replace with real credentials for production
- **Supabase project needs migration 011 applied** — Creates `trash_entries` table
- **Dependencies added**: `jspdf`, `jspdf-autotable`, `xlsx`, `@types/jspdf`

---

## Verification Commands
```bash
cd app
npx tsc --noEmit          # Type-check (0 errors)
npm run build              # Full build (tsc -b && vite build)
npm run dev                # Dev server at http://localhost:5173
```
