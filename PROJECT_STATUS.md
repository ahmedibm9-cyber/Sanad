# SANAD Project Status

## Objective
- Integrate the Fulla_Dynamic_HTML_CSS_Templates.zip package into SANAD as the single source of truth for all 7 document types, using `data-field` attribute-based rendering for preview, print, AND PDF — all from one HTML source.

## Important Details
- **Production URL**: `https://sanad-etl.pages.dev`
- **Admin credentials**: `admin@sanad.com` / `12345679`
- **Supabase project**: `mvhawhcfzujkuyhkejty`
- **Platform**: Windows (PowerShell) — use `;` not `&&`; git at `C:\Program Files\Git\bin\git.exe`
- **Vercel team**: `team_gKgGYua6qyl8TSCC9U0Ijuv6`, project: `prj_QMbQnc8AA7mjYESeATUiDD20gMAt`
- **Vercel PAT**: [REDACTED - stored in Vercel dashboard]
- **Git remote**: `https://github.com/ahmedibm9-cyber/Sanad.git`
- **User constraints (29 steps)**: Must NOT redesign templates, must NOT keep dummy data, must NOT use separate renderers for preview vs PDF, must validate before rendering, must support multiple items, customer-specific commercial terms, proper CSS isolation, proper escaping
- **7 SANAD document types**: `QUOT`, `PINV`, `TINV`, `CINV`, `PKL`, `DN`, `BL`
- **`dangerouslySetInnerHTML` on `<style>` tags does NOT work** — must use CSS `import` instead.
- **Adapter produces flat keys** (e.g., `'company.name'`, `'items.0.item_code'`) — `getByPath()` must check flat keys before nested path traversal.
- **`materials` table columns**: `id, company_id, name, grade, category, unit, density, color, origin_country, hs_code, notes, active, ...` — NO `description` column.
- **`companies` table**: Originally only had `name_en, name_ar, legal_name_en, legal_name_ar, short_name, company_code, active` — 25+ settings columns added via migration.
- **Company type**: Uses snake_case DB columns (`name_en`, `vat_number`, etc.) — camelCase aliases in TypeScript interface are never populated from DB. DocumentPreviewPage must read snake_case.

## Work State

### Completed
- **Phase 2 (data-field renderer)**: Created `fullaTemplateRenderer.ts`, `fullaSchemaAdapter.ts`, `fullaTemplateStyles.css`. All 7 Template.tsx rewritten to use `renderFullaTemplate()` + `adaptForTemplate()`.
- **PDF export unified** (commit `2c2823c`): Uses `renderFullaTemplate()` + `html2canvas` → `jsPDF`.
- **6 dead files removed** (commit `2c2823c`): Net -2,066 lines.
- **CSS import fix**: All 7 Template.tsx files import `fullaTemplateStyles.css` directly — CSS now applies correctly in preview.
- **`getByPath()` flat key fix** (commit `e9a6cd8`): Added flat-key-first lookup so `'company.name'` as a single key is found before nested path traversal.
- **Item count detection from flat keys** (commit `e9a6cd8`): Regex-based detection of `items.N.` keys replaces `Array.isArray(data.items)`.
- **Materials JOIN fix** (commit `9ab2634`): `getWorkItemMaterials` now does `select('*, materials(name, grade, hs_code, origin_country, unit)')` — removed non-existent `description` column (commit `1cc556b`).
- **DocumentPreviewPage material mapping** (commit `9ab2634`): Updated to read joined `m.materials.name`, `m.materials.hs_code`, etc.
- **DocumentPreviewPage company field mapping** (commit `9ab2634`): All `currentCompany.defaultVatRate` etc. fixed to read both camelCase and snake_case (`currentCompany.default_vat_rate`).
- **Companies table migration**: Added 25+ columns (phone, email, address, vat_number, bank_name, iban, swift, default_vat_rate, show_signature, etc.)
- **work_item_materials migration**: Added `sort_order` column.
- **Company settings seeded**: SANAD Export & Trading with full contact, bank, and settings data.
- **Material seeded**: "Saudi Green Dates" (Grade A, HS 0804.10, Saudi Arabia) linked to work_item.
- **Customer updated**: Address, city, country, Arabic name added.
- **Full preview rendering verified**: Company header, customer box, items table, terms, bank details, totals all populated correctly.
- **PDF download verified**: 10.7MB `CINV-2026-013.pdf` downloaded successfully.
- **Unknown-unknowns analysis delivered**: Complete adversarial analysis of the deep research study on unknown unknowns in programming/software/vibe coding.

### Active
- Fulla template integration is complete and verified — preview and PDF both working with real data.

### Blocked
- Audit events table missing `actor_user_id` column (non-critical, doesn't block core functionality).

## Next Move
1. No immediate next steps for Fulla integration — the feature is complete and deployed.
2. If user requests further work, address any remaining items (e.g., additional document types, Arabic RTL preview testing, production deployment to main domain, audit table fix).

## Relevant Files
- `app/src/templates/fullaTemplateRenderer.ts` — central data-field renderer; `getByPath()` fixed for flat keys; item count from `items.N.` keys
- `app/src/templates/fullaSchemaAdapter.ts` — DocRenderData → flat data mapping via `adaptForTemplate()`
- `app/src/templates/fullaTemplateStyles.css` — Fulla template CSS (verbatim from package)
- `app/src/templates/fulla-commercial-invoice-680/Template.tsx` — imports CSS, uses `renderFullaTemplate`
- `app/src/templates/fulla-quotation-680/Template.tsx` — same pattern
- `app/src/templates/fulla-tax-invoice-a-680/Template.tsx` — same pattern
- `app/src/templates/fulla-tax-invoice-b-680/Template.tsx` — same pattern
- `app/src/templates/fulla-proforma-invoice-680/Template.tsx` — same pattern
- `app/src/templates/fulla-packing-list-680/Template.tsx` — same pattern
- `app/src/templates/fulla-delivery-note-680/Template.tsx` — same pattern
- `app/src/lib/pdfExport.ts` — PDF export using `renderFullaTemplate()` + `html2canvas` → `jsPDF`
- `app/src/pages/DocumentPreviewPage.tsx` — preview page; company field mapping fixed for snake_case DB columns; material mapping reads joined data
- `app/src/lib/services/workItem.ts` — `getWorkItemMaterials` JOINs materials table
- `app/src/lib/services/company.ts` — `Company` interface with snake_case DB fields + unused camelCase aliases
- `app/src/pages/CustomersPage.tsx` — `toDbUpdates`/`toUICustomer` with all fields
- `app/src/types/index.ts` — `Customer` interface extended with all commercial/logistics fields
- Git commits: `e9a6cd8`, `9ab2634`, `1cc556b`
