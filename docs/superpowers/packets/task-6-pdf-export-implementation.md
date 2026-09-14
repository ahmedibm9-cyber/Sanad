# Implementation Packet — Task 6: Replace Rasterized Document PDFs with Selectable Text

## Task frame

- **Goal:** Replace `html2canvas` rasterized PDF generation with text-based PDF output that supports selectable text, Arabic font embedding, and correct bidirectional layout.
- **Context:** `app/src/lib/pdfExport.ts` currently renders HTML via Fulla templates into a hidden DOM element, captures it with `html2canvas` at 2x scale, and places the raster PNG across PDF pages. This produces non-selectable text, rasterized Arabic, and violates the "no rasterized PDF generation" release gate. The `downloadWorkItemPdf()` function already uses `jsPDF` text methods successfully but is English-only.
- **Constraints:**
  - jsPDF is already a dependency (`^4.2.1`); prefer keeping it.
  - Arabic font must be embedded, not referenced from the system. Noto Sans Arabic is already used in the app (loaded via Google Fonts in `index.html`).
  - The public API `downloadDocumentPdf(docData: DocPreviewData)` must remain unchanged.
  - The Fulla template rendering pipeline (`fullaTemplateRenderer.ts`, `fullaSchemaAdapter.ts`) produces structured data; this task replaces how that data becomes a PDF, not what data is produced.
  - All 7 document types must work: QUOT, PINV, TINV, CINV, PKL, DN, BL.
  - `downloadWorkItemPdf()` is in scope for Arabic support but lower priority.
  - No new paid dependencies. Font must be freely embeddable (OFL license).
- **Done when:**
  - `html2canvas` import is removed from `pdfExport.ts`.
  - Generated PDF contains selectable text (not embedded page images).
  - Arabic document text renders with correct ligatures and RTL direction.
  - Mixed Arabic/English documents render both scripts correctly.
  - Long tables paginate cleanly across multiple pages.
  - `npm test -- pdfExport` passes.
  - `npm run build` passes.
  - `rg -n "html2canvas" dist` returns no matches.
- **Non-goals:**
  - Redesigning the Fulla template HTML/CSS structure.
  - Implementing a full Arabic shaping engine (use pre-shaped text or a library).
  - Changing the template data flow or DocPreviewData schema.
  - Adding print-specific CSS beyond what already exists.

## Complexity

- **Level:** Standard
- **Reason:** Multi-file change (pdfExport.ts, tests, decision doc), dependency decision (Arabic font embedding), moderate ambiguity (multiple PDF engines considered), but confined to one module with no schema/auth/API surface changes. Rollback is simple (git revert).

## Verified evidence

| Evidence | Source | Confidence | Consequence |
|---|---|---|---|
| `html2canvas` is imported and used in `downloadDocumentPdf()` | `app/src/lib/pdfExport.ts:3` | confirmed | Release blocker; must be removed |
| `downloadWorkItemPdf()` already uses jsPDF text methods successfully | `app/src/lib/pdfExport.ts:276-457` | confirmed | Proves jsPDF text-based approach works for English |
| jsPDF `^4.2.1` is a dependency | `package.json` | confirmed | Can be used without adding a new PDF library |
| Fulla templates produce structured HTML with `data-field` attributes | `app/src/templates/fullaTemplateRenderer.ts` | confirmed | Data is available for text-based rendering |
| `DocPreviewData` type has `language: 'en' \| 'ar'` field | `app/src/templates/fullaSchemaAdapter.ts:59` | confirmed | Language-aware rendering is possible |
| Noto Sans Arabic is loaded in `index.html` for the app UI | Codebase search | confirmed | Font file is available for embedding |
| No test file exists at `app/tests/lib/pdfExport.test.ts` | File search | confirmed | Must be created from scratch |
| 7 document types use Fulla templates | `fullaTemplateRenderer.ts` | confirmed | All 7 must be supported in the new renderer |
| `jspdf-autotable` is a dependency | `package.json` | confirmed | Tables can use autoTable for pagination |

## Impact map

- **Confirmed:**
  - `app/src/lib/pdfExport.ts` — primary file to rewrite
  - `app/tests/lib/pdfExport.test.ts` — new test file to create
  - `app/tests/fixtures/pdf/` — test fixture data for Arabic/English documents
  - `docs/decisions/pdf-renderer-decision.md` — ADR documenting the engine choice
  - `html2canvas` dependency removal from `package.json`
- **Likely:**
  - `app/src/templates/fullaTemplateRenderer.ts` — may need a structured-data extraction helper (not a template rewrite)
  - `app/src/templates/fullaSchemaAdapter.ts` — may need to expose a flat data map for PDF text rendering
  - `package.json` — `html2canvas` removal, possible Arabic font file addition
- **Unknown:**
  - Whether jsPDF alone can produce correct Arabic ligatures without an external shaping library
  - Whether `jspdf-autotable` supports Arabic text in table cells
  - Exact bundle-size impact of embedding Noto Sans Arabic TTF (~200-500KB)

## Chosen approach

- **Summary:** Keep jsPDF as the PDF engine. Embed Noto Sans Arabic (OFL license) as a custom font. Create a structured document renderer that maps `DocPreviewData` fields directly to jsPDF text/table calls, replacing the html2canvas capture path. Run a spike first to validate Arabic shaping before full implementation.
- **Why this is the smallest compatible approach:**
  - jsPDF is already a dependency and proven to work for English text (`downloadWorkItemPdf`).
  - No new PDF library needed.
  - The Fulla template data is already structured via `adaptForTemplate()`; we extract it rather than re-render HTML.
  - Arabic font embedding is a documented jsPDF feature (`doc.addFont()`).
- **Alternatives considered:**
  - **pdfmake:** Handles RTL and Arabic natively, but adds a new dependency, requires rewriting all document layouts, and doesn't share the existing jsPDF autoTable pattern. Rejected because the change surface is 3x larger.
  - **@react-pdf/renderer:** React-native PDF generation, but adds a heavy dependency, requires a completely different rendering model, and doesn't support Arabic shaping out of the box. Rejected as over-engineered.
  - **Keep html2canvas + add text layer:** Would require a separate text extraction pass and PDF text overlay. Rejected because it doesn't solve the fundamental rasterization problem.
- **Invalidated if:**
  - jsPDF cannot produce correct Arabic ligatures even with an embedded font (spike fails)
  - `jspdf-autotable` cannot render Arabic text in table cells
  - Arabic font embedding increases bundle size beyond 500KB (unacceptable)

## Execution steps

### Step 1: Write the failing anti-raster test

- **Objective:** Prove the current implementation produces raster PDFs and establish the acceptance contract.
- **Likely files:** `app/tests/lib/pdfExport.test.ts` (create)
- **Behavior/contract change:** Test imports `createDocumentPdf` (a new testable export) and asserts the PDF binary contains text operators (`BT`) and does NOT contain full-page image operators (`/Subtype /Image`).
- **Prerequisites:** None; this is a test-first step.
- **Verification:** Run `npm test -- pdfExport` — test should FAIL (current impl uses html2canvas).
- **Approval/stop condition:** None; this is a test-writing step.
- **Rollback:** Delete the test file.

```ts
// app/tests/lib/pdfExport.test.ts
import { describe, it, expect } from 'vitest'
import { createDocumentPdf } from '../../src/lib/pdfExport'
import type { DocPreviewData } from '../../src/templates/fullaSchemaAdapter'

const englishInvoice: DocPreviewData = {
  id: 'test-1',
  type: 'CINV',
  number: 'CINV-100',
  date: '2026-01-15',
  language: 'en',
  template: 'fulla-commercial-invoice-680',
  company: { nameEn: 'Test Company' },
  customer: { name: 'Test Customer' },
  items: [{ material: 'Widget', description: 'Test Widget', quantity: 10, unit: 'PCS', unitPrice: 5, total: 50 }],
  totals: { subtotal: '50.00', tax_rate: '15%', vat: '7.50', total: '57.50' },
  currency: 'SAR',
}

describe('PDF export', () => {
  it('produces selectable text, not raster images', async () => {
    const buffer = await createDocumentPdf(englishInvoice)
    const bytes = new Uint8Array(buffer)
    const text = new TextDecoder('latin1').decode(bytes)
    // PDF text operators must exist
    expect(text).toContain('BT')
    // Full-page image must not exist
    expect(text).not.toContain('/Subtype /Image')
  })
})
```

**Re-plan trigger:** If `createDocumentPdf` cannot be extracted as a testable function without changing the public API, pause and re-plan the export shape.

### Step 2: Run the test to verify failure

- **Objective:** Confirm the current html2canvas implementation fails the anti-raster test.
- **Likely files:** none (command only)
- **Behavior/contract change:** none
- **Prerequisites:** Step 1 complete.
- **Verification:** `npm test -- pdfExport` — test must fail with assertion error (PDF contains `/Subtype /Image` or lacks `BT`).
- **Approval/stop condition:** If test passes unexpectedly, re-evaluate whether html2canvas is actually being called.
- **Rollback:** none

### Step 3: Arabic font and renderer spike

- **Objective:** Determine if jsPDF with Noto Sans Arabic can produce correct Arabic text in a PDF.
- **Likely files:** `app/src/lib/pdfExport.ts` (temporary spike code), `docs/decisions/pdf-renderer-decision.md` (create)
- **Behavior/contract change:** Create a minimal `createDocumentPdf` function that renders a test document with Arabic text using jsPDF + embedded Noto Sans Arabic. Test with:
  - English-only invoice (5-line table)
  - Arabic-only invoice (Arabic customer name, item descriptions, notes)
  - Mixed Arabic/English invoice (numbers, currency, Arabic text)
- **Prerequisites:** Noto Sans Arabic TTF file must be available (download from Google Fonts, convert to base64 for jsPDF).
- **Verification:** Open generated PDFs in a PDF reader. Verify:
  - Text is selectable (not an image)
  - Arabic text displays correctly (ligatures, RTL direction)
  - Mixed content renders both scripts
  - Long tables paginate cleanly
- **Approval/stop condition:** If Arabic ligatures are broken or text is garbled, STOP. Document the failure in `pdf-renderer-decision.md` and evaluate pdfmake as an alternative. Get explicit approval before switching engines.
- **Rollback:** Remove spike code; the test from Step 1 still fails.

**Font embedding approach:**
```ts
// Download NotoSansArabic-Regular.ttf from Google Fonts
// Convert to base64: const fontBase64 = await fetch('/fonts/NotoSansArabic-Regular.ttf').then(r => r.arrayBuffer())
// Then in jsPDF:
const doc = new jsPDF({ unit: 'mm', format: 'a4' })
doc.addFileToVFS('NotoSansArabic-Regular.ttf', fontBase64)
doc.addFont('NotoSansArabic-Regular.ttf', 'NotoArabic', 'normal')
doc.setFont('NotoArabic')
doc.text('مرحبا بالعالم', MARGIN, y)
```

**Arabic shaping concern:** jsPDF does not perform Arabic text shaping (connecting letters, ligatures). Options:
1. Use a shaping library like `arabic-persian-text` or `reshaper.js` to pre-process text before passing to jsPDF.
2. Use a font that includes pre-composed ligatures (not standard).
3. Accept that Arabic text in tables may not have perfect ligatures (pragmatic for export documents).

**Decision point:** After the spike, record in `pdf-renderer-decision.md`:
- Chosen engine and version
- Arabic font family, source, license, embedding permission
- English/Arabic/long-table test results
- Bundle-size and operational tradeoff
- Rejected alternative and observed failure
- Rollback plan

### Step 4: Implement the structured document renderer

- **Objective:** Replace html2canvas capture with direct jsPDF text rendering for all 7 document types.
- **Likely files:** `app/src/lib/pdfExport.ts`
- **Behavior/contract change:**
  - Remove `html2canvas` import.
  - Remove `getFullaCssText()` (inline CSS no longer needed).
  - Remove the hidden DOM element creation and canvas capture.
  - Create `createDocumentPdf(docData: DocPreviewData): Promise<ArrayBuffer>` as a testable export.
  - Implement `renderDocumentPage(doc, docData, pageType)` that maps structured data to jsPDF calls.
  - Support all 7 template types by switching on `docData.template`.
  - Use `jspdf-autotable` for item tables (already proven in `downloadWorkItemPdf`).
  - Embed Noto Sans Arabic font and use it when `docData.language === 'ar'`.
  - Keep `downloadDocumentPdf` as a thin wrapper: `createDocumentPdf` + `save`.
- **Prerequisites:** Step 3 spike passed; font embedding works.
- **Verification:** `npm test -- pdfExport` — all tests pass. `npm run build` succeeds.
- **Approval/stop condition:** If a document type cannot be rendered correctly, document the specific issue and get approval for a partial rollout (e.g., invoice types only, with other types falling back to a text-only stub).
- **Rollback:** Revert `pdfExport.ts` to the html2canvas version; all tests revert to failing.

**Renderer structure:**
```ts
export async function createDocumentPdf(docData: DocPreviewData): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const isAr = docData.language === 'ar'

  // Embed Arabic font if needed
  if (isAr) {
    doc.addFileToVFS('NotoSansArabic-Regular.ttf', ARABIC_FONT_BASE64)
    doc.addFont('NotoSansArabic-Regular.ttf', 'NotoArabic', 'normal')
  }

  // Render based on template type
  const templateId = resolveTemplateId(docData.template)
  switch (templateId) {
    case 'invoice': renderInvoice(doc, docData, isAr); break
    case 'packing-list': renderPackingList(doc, docData, isAr); break
    case 'quotation': renderQuotation(doc, docData, isAr); break
    // ... other types
  }

  addPageFooter(doc, docData.number)
  return doc.output('arraybuffer')
}
```

### Step 5: Remove html2canvas and update dependency

- **Objective:** Remove the rasterization dependency and verify the bundle.
- **Likely files:** `app/src/lib/pdfExport.ts`, `package.json`
- **Behavior/contract change:** Remove `import html2canvas from 'html2canvas'` and any remaining references. Run `npm uninstall html2canvas`.
- **Prerequisites:** Step 4 complete; all tests pass without html2canvas.
- **Verification:**
  - `npm test -- pdfExport` — passes
  - `npm run build` — passes
  - `rg -n "html2canvas" dist` — no matches
  - `rg -n "html2canvas" app/src` — no matches
- **Approval/stop condition:** If any test fails after removal, restore html2canvas and re-plan.
- **Rollback:** `npm install html2canvas@1.4.1` and revert the import removal.

### Step 6: Add comprehensive test fixtures

- **Objective:** Cover Arabic, mixed, long-table, and all 7 document types with test data.
- **Likely files:** `app/tests/fixtures/pdf/arabic-long-table.json`, `app/tests/fixtures/pdf/mixed-language.json`, `app/tests/lib/pdfExport.test.ts` (extend)
- **Behavior/contract change:** Add test fixtures and assertions for:
  - Arabic document text extraction (verify Arabic characters present)
  - Mixed Arabic/English document
  - Long table (40+ rows) pagination
  - Each document type produces valid PDF
  - `downloadWorkItemPdf` still works (regression)
- **Prerequisites:** Step 4 complete.
- **Verification:** `npm test -- pdfExport` — all new tests pass.
- **Approval/stop condition:** None.
- **Rollback:** Delete test fixtures and test cases.

### Step 7: Manual verification and checkpoint

- **Objective:** Verify the output visually and document the decision.
- **Likely files:** `docs/decisions/pdf-renderer-decision.md` (finalize)
- **Behavior/contract change:** Generate sample PDFs for each document type in both languages. Verify manually:
  - Text is selectable in Adobe Reader / browser
  - Arabic ligatures render correctly
  - Long tables create clean page breaks
  - Stamp/signature images embed correctly (not rasterizing body text)
  - Print output contains no application navigation
- **Prerequisites:** Steps 1-6 complete.
- **Verification:** `npm test`, `npm run typecheck`, `npm run build` all pass.
- **Approval/stop condition:** If Arabic rendering is unacceptable, document the specific issue and get approval for the current state or a targeted fix.
- **Rollback:** Full revert of `pdfExport.ts` changes.

## Test and verification matrix

- **Focused tests:**
  - `npm test -- pdfExport` — anti-raster assertion, all 7 document types, Arabic/mixed/English, long table pagination
- **Integration tests:**
  - `npm test` (full suite) — ensure no regression in other tests
- **User-flow/E2E checks:**
  - Manual: open staging, create a document, download PDF, verify text selection and Arabic rendering
- **Security/performance checks:**
  - `rg -n "html2canvas" dist` — verify no raster dependency shipped
  - Bundle size check: `ls -la dist/assets/` — verify PDF-related chunk is reasonable
- **Broader regression checks:**
  - `npm run typecheck` — no type errors
  - `npm run lint` — no new lint errors
  - `npm run build` — successful build

## Risks and gates

- **Risk:** jsPDF cannot produce correct Arabic ligatures.
  - **Prevention/detection:** Spike in Step 3 validates before implementation.
  - **Approval:** If spike fails, stop and get approval to switch to pdfmake.
  - **Recovery:** Revert to html2canvas; document the failure.
- **Risk:** Arabic font embedding increases bundle size beyond acceptable limit.
  - **Prevention/detection:** Check `dist/assets/` size after Step 5.
  - **Approval:** If >500KB increase, evaluate font subsetting or alternative font.
  - **Recovery:** Use a subset of Noto Sans Arabic (only Arabic characters, not full Unicode).
- **Risk:** `jspdf-autotable` does not support Arabic text in table cells.
  - **Prevention/detection:** Test in Step 3 with Arabic item descriptions.
  - **Approval:** If broken, use jsPDF `doc.text()` for table cells instead of autoTable.
  - **Recovery:** Fall back to manual table rendering with `doc.text()`.
- **Risk:** Existing `downloadWorkItemPdf` regression.
  - **Prevention/detection:** Existing tests cover this function.
  - **Approval:** None; regression is a blocker.
  - **Recovery:** Fix the specific regression before proceeding.

## Adaptive checkpoints

- **Before first edit:** Verify `npm test` passes (baseline: 337 tests). Verify `html2canvas` is currently imported in `pdfExport.ts`.
- **Before Step 3 (spike):** Verify Noto Sans Arabic TTF is available and jsPDF `addFileToVFS` / `addFont` work.
- **Before Step 5 (remove html2canvas):** Verify all tests pass with the new renderer. Run `npm test -- pdfExport` explicitly.
- **Before Step 7 (manual verification):** Run full test suite, typecheck, and build. All must pass.
- **Before final handoff:** Run `rg -n "html2canvas" dist` and confirm no matches.

## Parallel work

- None. This is a sequential task within a single file and its tests. Do not parallelize.

## Non-goals

- Redesigning Fulla template HTML/CSS.
- Changing `DocPreviewData` schema or template data flow.
- Implementing a full Arabic shaping engine (use pragmatic approach).
- Adding print-specific CSS beyond existing `@media print` rules.
- Changing `downloadWorkItemPdf` beyond Arabic font support.

## Handoff prompt

Use `ai-production-feature-builder` to execute this packet. Verify repository state first (run `npm test` to confirm 337 tests pass), remain within the stated scope, update the packet when a re-plan trigger occurs (especially if the Arabic font spike fails), and return evidence for every completed step. The critical decision gate is Step 3 — if jsPDF cannot produce correct Arabic text, stop and get approval before switching engines.

## Recommended next skill

`ai-production-feature-builder` — this is a code implementation task with clear acceptance criteria and a test-first approach.
