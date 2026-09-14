# SANAD Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce evidence that SANAD meets every release gate in `docs/25_TESTING_ACCEPTANCE.md` and `docs/29_RELEASE_CHECKLIST.md`, then obtain an independent `ready` decision before any production release.

**Architecture:** Preserve the existing React/Vite frontend, Supabase Auth/Postgres/RLS/Edge Functions, and Cloudflare R2 deployment shape. Establish a fully isolated staging environment first; validate authorization at Edge Function and database layers; then prove every critical journey in CI and staging. Production remains unchanged until staging evidence and explicit production approval exist.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Playwright, Supabase Postgres/Auth/Edge Functions, Cloudflare R2, Vercel, jsPDF, GitHub Actions.

## Global Constraints

- Company data must never mix between companies.
- Shared Data changes must never propagate silently to documents.
- No hard-delete in normal UI; use Trash and restore behavior.
- No rasterized PDF generation.
- Critical permission changes require confirmation.
- Factory Code updates must never delete historical records.
- Document numbers are user-entered and unique per company, not auto-generated.
- Do not run stateful or destructive tests against production data.
- Use separate staging Supabase, R2 bucket, secrets, and disposable test identities.
- Service-role and R2 secrets are server-only; never commit, log, or place them in browser code.
- Do not create paid resources, rotate credentials, change production Auth, apply a production migration, deploy production code, or release without explicit scoped approval.
- Current workspace has no Git repository. Do not initialize Git or commit unless the execution owner explicitly requests it in a Git-backed worktree.

---

## Verified Starting State

- `npm run typecheck`, `npm test` (337 tests), and `npm run build` pass locally.
- All 30 public Supabase tables have RLS enabled, but direct role/company denial evidence is missing.
- `create-admin` has been replaced by a JWT-protected retired response, but two existing system-admin accounts still need authorized provenance review.
- `r2-proxy` source exists; it is not deployed. The latest local attachment workflow changes are not staging-tested.
- `app/src/lib/pdfExport.ts` still imports `html2canvas` and creates raster PDFs, which is a release blocker.
- Supabase is connected. Cloudflare OAuth can list R2 buckets. Vercel MCP authenticates but currently exposes no SANAD team or project.

## File Map

| Path | Responsibility |
| --- | --- |
| `app/e2e/environment.ts` | Requires explicit staging URL and disposable credentials. |
| `app/e2e/fixtures/auth.ts` | Authenticates each Playwright persona. |
| `app/tests/` | Vitest unit/integration tests for services and domain rules. |
| `app/src/lib/services/attachment.ts` | Upload metadata, soft-delete, restore, and client-side permission checks. |
| `app/src/lib/r2Client.ts` | Browser-safe calls to the R2 Edge Function only. |
| `app/src/components/common/AttachmentUploadModal.tsx` | Selects a supported file and exposes upload failures. |
| `app/src/pages/ProjectDetailPage.tsx` | Project attachment upload, list, download, and Trash interaction. |
| `app/src/pages/TaskDetailPage.tsx` | Task attachment upload, list, download, and Trash interaction. |
| `supabase/functions/r2-proxy/index.ts` | JWT validation, permission checks, object-key ownership, R2 operations, and CORS. |
| `supabase/migrations/*.sql` | Versioned schema, RLS, function, index, and constraint changes. |
| `app/src/lib/pdfExport.ts` | Document and work-item PDF generation. |
| `app/src/templates/` | Structured document template inputs and rendering definitions. |
| `.github/workflows/ci.yml` | Reproducible build, test, audit, and secret-scan gate. |
| `.vibeguard/PRODUCTION_READINESS_REVIEW.md` | Independent release decision record; update only from current evidence. |
| `docs/FINAL_TRACEABILITY_MATRIX.md` | Traceability; update only after exact release evidence exists. |

## Task 1: Establish Staging Access and Release Control

**Files:**
- Modify: `app/.env.example`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/runbooks/staging-access-and-secrets.md`
- Test: `app/e2e/environment.ts`

**Interfaces:**
- Consumes: `E2E_STAGING_URL`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`.
- Produces: isolated staging environment variables and a documented secret inventory without secret values.

- [ ] **Step 1: Verify Vercel account access before creating resources**

Run:

```powershell
opencode mcp auth vercel
opencode mcp list
```

Expected: Vercel MCP is connected and `vercel_get_git_deployment_context` returns the team that owns SANAD. Stop if no team is returned; do not create a personal-account deployment as a substitute.

- [ ] **Step 2: Write the failing staging-environment test**

Add a Vitest test that clears each required variable and asserts the existing E2E environment loader rejects it:

```ts
it.each(['E2E_STAGING_URL', 'E2E_TEST_EMAIL', 'E2E_TEST_PASSWORD'])(
  'rejects when %s is absent',
  (name) => {
    const environment = { ...process.env }
    delete environment[name]
    expect(() => requireE2EEnvironment(environment)).toThrow(name)
  },
)
```

- [ ] **Step 3: Run the test to verify the safety contract**

Run:

```powershell
npm test -- environment
```

Expected: the test passes only when the loader rejects absent values; it must never fall back to a production URL or built-in credentials.

- [ ] **Step 4: Create isolated resources after platform-owner approval**

Create exactly these resources:

```text
Supabase: a new staging project or Supabase development branch with no production data
R2 bucket: sanad-staging
Vercel: SANAD staging project or preview deployment using the approved Vercel team
Identities: AdminA, UserA, ViewerA, UserB with disposable credentials
Companies: Company A and Company B with only synthetic data
```

Configure server-side staging secrets in Supabase/Vercel secret stores. Do not write secret values to `.env.example`, source files, logs, tickets, or documentation.

- [ ] **Step 5: Record the non-secret staging contract**

Create `docs/runbooks/staging-access-and-secrets.md` with this table and no secret values:

```markdown
| Environment | Required value | Storage location | Owner | Rotation trigger |
| --- | --- | --- | --- | --- |
| staging | Supabase URL and publishable key | Vercel environment variables | Platform owner | suspected exposure |
| staging | R2 endpoint, bucket, access key, secret | Supabase Edge Function secrets | Platform owner | suspected exposure |
| staging | license stub URL and credential | Vercel/Supabase secret store | Product owner | stub change |
| staging | disposable E2E identities | CI secret store | QA owner | every test cycle |
```

- [ ] **Step 6: Verify staging reachability without mutating business data**

Run:

```powershell
opencode mcp list
npx wrangler r2 bucket list
```

Use Playwright only to reach the staging login page. Expected: staging is HTTPS, distinct from production, and renders without console errors.

- [ ] **Step 7: Checkpoint and commit**

Record the staging URL, project identifiers, identity ownership, and access date in the runbook without credentials. If execution occurs in an authorized Git worktree:

```bash
git add app/.env.example app/tests docs/runbooks/staging-access-and-secrets.md
git commit -m "docs: define isolated staging contract"
```

## Task 2: Review Privileged Accounts and Retire Bootstrap Risk

**Files:**
- Modify: `.vibeguard/INCIDENT_REPORT.md`
- Modify: `production-certification/findings.md`
- Test: read-only Supabase Auth and `public.users` account-provenance export

**Interfaces:**
- Consumes: approved administrator identity list and production Auth audit access.
- Produces: an approved provenance decision for every `is_system_admin = true` account and documented session/credential actions.

- [ ] **Step 1: Export a minimal, read-only administrator review set**

Run an approved read-only query that returns IDs, creation timestamps, and system-admin status, not passwords or metadata payloads:

```sql
select id, created_at, is_system_admin
from public.users
where is_system_admin = true
order by created_at;
```

- [ ] **Step 2: Verify every result against an authorized owner record**

For each returned account, capture one of these outcomes in the incident report:

```text
approved administrator with documented owner
remove administrator privilege and revoke sessions
disable account and reset credentials
```

Stop for explicit approval before changing an account, revoking sessions, or resetting credentials.

- [ ] **Step 3: Apply approved remediation using Supabase Auth administration**

For an unapproved account, perform only the approved action. Verify afterward with the same read-only query that it is no longer a system administrator or no longer active.

- [ ] **Step 4: Update incident and certification evidence**

Replace the open status of `CERT-010` only with the approved account-review outcome, query date, operator, and remediation result. Do not include emails, credentials, or raw Auth metadata.

- [ ] **Step 5: Checkpoint and commit**

Confirm `create-admin` remains retired and JWT-protected. If execution occurs in an authorized Git worktree:

```bash
git add .vibeguard/INCIDENT_REPORT.md production-certification/findings.md
git commit -m "docs: close privileged account review"
```

## Task 3: Move RLS Helpers out of the Public API Surface

**Files:**
- Create: `supabase/migrations/<timestamp>_move_rls_helpers_to_private_schema.sql`
- Create: `app/tests/integration/rls-permissions.test.ts`
- Modify: `production-certification/findings.md`
- Test: staging PostgreSQL policy and RPC privilege checks

**Interfaces:**
- Consumes: `public.user_has_company_access(uuid, uuid)` and `public.user_is_company_admin(uuid, uuid)` plus their 33 policy dependencies.
- Produces: non-exposed `private.user_has_company_access(uuid, uuid)` and `private.user_is_company_admin(uuid, uuid)` helpers callable by RLS policies but not by `anon` or `authenticated` RPC clients.

- [ ] **Step 1: Capture the exact staging policy dependency inventory**

Run in staging before writing the migration:

```sql
select schemaname, tablename, policyname, qual, with_check
from pg_policies
where coalesce(qual, '') like '%user_has_company_access%'
   or coalesce(qual, '') like '%user_is_company_admin%'
order by schemaname, tablename, policyname;
```

Expected: the result accounts for every currently dependent policy. Stop if it differs materially from the recorded 33 dependencies.

- [ ] **Step 2: Write failing staging authorization tests**

Add tests for each persona and company:

```ts
const personas = ['adminA', 'userA', 'viewerA', 'userB'] as const

it('denies direct execution of private membership helpers to authenticated users', async () => {
  const { error } = await userA.rpc('user_has_company_access', {
    p_user_id: userAId,
    p_company_id: companyAId,
  })
  expect(error).not.toBeNull()
})

it.each(personas)('enforces company access for %s', async (persona) => {
  await expect(readCompanyBCustomer(clients[persona])).resolves.toMatchObject(
    persona === 'userB' ? { id: companyBCustomerId } : { data: [] },
  )
})
```

- [ ] **Step 3: Run the tests against staging and confirm the expected failures**

Run:

```powershell
E2E_STAGING_URL=<staging-url> npm test -- rls-permissions
```

Expected: the public-RPC assertion fails before the migration; cross-company tests expose any policy defect rather than being skipped.

- [ ] **Step 4: Write the smallest migration after reviewing the inventory**

The migration must perform these operations in one transaction:

```sql
begin;
create schema if not exists private;
-- Recreate both helpers in private with SECURITY DEFINER and SET search_path = pg_catalog.
-- Update every dependency captured in Step 1 to call private.<helper>.
-- Revoke USAGE on private from anon and authenticated.
-- Revoke EXECUTE on obsolete public helpers from PUBLIC, anon, and authenticated.
-- Drop obsolete public helpers only after no policy depends on them.
commit;
```

Do not apply the migration to production in this task.

- [ ] **Step 5: Apply to staging and prove API and policy behavior**

Verify function exposure:

```sql
select has_function_privilege('anon', 'public.user_has_company_access(uuid,uuid)', 'execute') as anon_public_access,
       has_function_privilege('authenticated', 'public.user_is_company_admin(uuid,uuid)', 'execute') as authenticated_public_admin;
```

Expected: both values are `false`; the full Admin/User/Viewer/Company-B matrix passes.

- [ ] **Step 6: Record rollback**

Before production approval, preserve the dependency inventory and a tested rollback migration that recreates the previous public function signatures only if policy behavior regresses. Rollback is staging-only until separately approved.

- [ ] **Step 7: Checkpoint and commit**

Run:

```powershell
npm test -- rls-permissions
npm run typecheck
```

If execution occurs in an authorized Git worktree:

```bash
git add supabase/migrations app/tests/integration/rls-permissions.test.ts production-certification/findings.md
git commit -m "fix: remove public RLS helper RPCs"
```

## Task 4: Apply Database Integrity and Password-Protection Gates

**Files:**
- Create: `supabase/migrations/<timestamp>_add_company_integrity_constraints.sql`
- Create: `app/tests/integration/database-integrity.test.ts`
- Modify: `production-certification/findings.md`
- Test: clean staging migration replay and invalid-write tests

**Interfaces:**
- Consumes: company-scoped tables, document-number rules, work item ownership, and optimistic locking fields.
- Produces: database-enforced company-parent ownership, per-company document-number uniqueness, and rejected stale writes.

- [ ] **Step 1: Write failing integrity tests**

Add tests that use two isolated authenticated clients:

```ts
it('rejects a document number duplicate in one company', async () => {
  await createDocument(adminA, { companyId: companyAId, number: 'CINV-100' })
  await expect(createDocument(userA, { companyId: companyAId, number: 'CINV-100' })).rejects.toThrow(/duplicate|unique/i)
})

it('allows the same document number in another company', async () => {
  await expect(createDocument(userB, { companyId: companyBId, number: 'CINV-100' })).resolves.toMatchObject({ document_number: 'CINV-100' })
})

it('rejects an attachment whose work item belongs to another company', async () => {
  await expect(insertAttachment(userA, companyAId, companyBWorkItemId)).rejects.toThrow(/row-level security|foreign key|company/i)
})
```

- [ ] **Step 2: Run tests to establish current behavior**

Run:

```powershell
npm test -- database-integrity
```

Expected: at least the cross-company-parent case and any missing uniqueness rule fail before the migration.

- [ ] **Step 3: Write additive, validated constraints**

Use `NOT VALID` first for any constraint that might encounter existing production rows. Validate only after staging data passes. For example, implement a trigger or composite foreign key that guarantees `attachments.company_id` equals the parent `work_items.company_id`; do not rely on client filtering.

For document numbers, add a unique index matching the actual column names and active/Trash semantics discovered in the staging schema:

```sql
create unique index concurrently if not exists documents_company_number_active_key
on public.documents (company_id, document_number)
where active = true;
```

Use a non-transactional migration for `CREATE INDEX CONCURRENTLY`; otherwise retain a transaction.

- [ ] **Step 4: Enable leaked-password protection through approved Supabase Auth configuration**

Enable the Auth setting in the staging project. Verify it through the Supabase security advisor. Do not test with a real compromised password; the advisor state is the acceptance proof.

- [ ] **Step 5: Replay migrations on a clean staging database**

Run the repository migration sequence against a fresh staging branch/project, then execute the integrity tests and existing migration tests:

```powershell
npm test -- migrations database-integrity
```

Expected: clean replay, upgrade replay, invalid cross-company writes denied, duplicate document number denied within a company, and no migration drift.

- [ ] **Step 6: Checkpoint and commit**

If execution occurs in an authorized Git worktree:

```bash
git add supabase/migrations app/tests/integration/database-integrity.test.ts production-certification/findings.md
git commit -m "fix: enforce company data integrity"
```

## Task 5: Deploy and Prove Durable R2 Attachment Workflows

**Files:**
- Modify: `supabase/functions/r2-proxy/index.ts`
- Modify: `app/src/lib/r2Client.ts`
- Modify: `app/src/lib/services/attachment.ts`
- Modify: `app/src/components/common/AttachmentUploadModal.tsx`
- Modify: `app/src/pages/ProjectDetailPage.tsx`
- Modify: `app/src/pages/TaskDetailPage.tsx`
- Create: `app/tests/lib/services/attachment.test.ts`
- Create: `app/e2e/attachments.spec.ts`
- Test: Supabase Edge Function staging deployment and R2 object assertions

**Interfaces:**
- Consumes: `uploadFile(file, workItemId, category, context): Promise<Attachment>`.
- Consumes: `POST /functions/v1/r2-proxy/{upload|download|delete|presign}` with a Supabase JWT and `companyId`.
- Produces: an attachment row whose `r2_object_key` is scoped to `companies/<companyId>/...`, a real R2 object, and a soft-delete/restore lifecycle.

- [ ] **Step 1: Write failing unit tests for the client-side attachment contract**

Mock `uploadToR2` and the Supabase attachment insert. Add these assertions:

```ts
it('uploads bytes before inserting attachment metadata', async () => {
  await service.uploadFile(pdfFile, workItemId, 'general', context)
  expect(uploadToR2).toHaveBeenCalledBefore(insertAttachment)
})

it('rejects an empty file and a 25 MB plus one byte file', async () => {
  await expect(service.uploadFile(emptyFile, workItemId, 'general', context)).rejects.toThrow('between 1 byte and 25 MB')
  await expect(service.uploadFile(oversizedFile, workItemId, 'general', context)).rejects.toThrow('between 1 byte and 25 MB')
})

it('attempts R2 cleanup when metadata insertion fails', async () => {
  insertAttachment.mockRejectedValueOnce(new Error('insert failed'))
  await expect(service.uploadFile(pdfFile, workItemId, 'general', context)).rejects.toThrow('insert failed')
  expect(deleteFromR2).toHaveBeenCalledWith(expect.stringContaining(`companies/${context.companyId}/`), context.companyId)
})
```

- [ ] **Step 2: Run the unit tests to verify failure**

Run:

```powershell
npm test -- attachment
```

Expected: tests fail before implementation changes; do not replace a failing storage test with a UI-only assertion.

- [ ] **Step 3: Complete server boundary validation in `r2-proxy`**

Ensure each operation performs all checks before touching R2:

```text
verify Supabase JWT
extract companyId from request
verify active company membership
require files.upload, files.download, or files.delete for the action
require key prefix companies/<companyId>/ or documented legacy backups/<companyId>/
allow only PDF, DOC, DOCX, XLS, XLSX, JPEG, and PNG
reject zero-byte and files larger than 25 MB
clamp signed URL lifetime to 60 through 900 seconds
return CORS headers only for configured staging/production origins
```

Use the existing `check_user_permission` contract until Task 3 moves the supporting RLS helpers safely. Do not expose service-role credentials to the browser.

- [ ] **Step 4: Deploy only to staging with JWT verification enabled**

Set staging Edge Function secrets in the Supabase secret store:

```text
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET=sanad-staging
CORS_ALLOWED_ORIGINS=<staging HTTPS origin>
```

Deploy with JWT verification enabled. Do not deploy `r2-proxy` to production in this task.

- [ ] **Step 5: Run the staging attachment journey**

Add Playwright coverage:

```ts
test('UserA can upload and download a Company A project attachment', async ({ page }) => {
  await signIn(page, users.userA)
  await openProject(page, projects.companyA)
  await page.getByRole('button', { name: /upload/i }).click()
  await page.locator('input[type=file]').setInputFiles('e2e/fixtures/sample.pdf')
  await page.getByRole('button', { name: /^upload$/i }).click()
  await expect(page.getByText('sample.pdf')).toBeVisible()
})

test('UserB cannot download a Company A attachment by its R2 key', async ({ request }) => {
  const response = await request.post('/functions/v1/r2-proxy/download', {
    data: { companyId: companyBId, key: companyAAttachmentKey },
  })
  expect(response.status()).toBe(403)
})
```

Expected: upload creates one R2 object and one database row, UserA can download, UserB receives `403`, Trash hides the row from normal lists, and restore exposes the same object without a duplicate upload.

- [ ] **Step 6: Verify no secret is shipped in the frontend artifact**

Run the existing bundle secret scan and inspect emitted assets for these names and values:

```powershell
npm run build
rg -n "R2_SECRET_ACCESS_KEY|R2_ACCESS_KEY_ID|SUPABASE_SERVICE_ROLE_KEY" dist
```

Expected: no match containing a secret value. A reference to server-only variable names in documentation is acceptable; a value in `dist` is a release blocker.

- [ ] **Step 7: Checkpoint and commit**

Run:

```powershell
npm test -- attachment
npm run test:e2e -- attachments
```

If execution occurs in an authorized Git worktree:

```bash
git add app/src app/tests app/e2e supabase/functions/r2-proxy
git commit -m "feat: persist company-scoped attachments in R2"
```

## Task 6: Replace Rasterized Document PDFs with Selectable Text

**Files:**
- Modify: `app/src/lib/pdfExport.ts`
- Create: `app/tests/lib/pdfExport.test.ts`
- Create: `app/tests/fixtures/pdf/arabic-long-table.json`
- Create: `docs/decisions/pdf-renderer-decision.md`
- Test: generated PDF text extraction and manual Arabic print samples

**Interfaces:**
- Consumes: `downloadDocumentPdf(docData: DocPreviewData): Promise<void>`.
- Produces: a PDF whose document text is text, not embedded page images, with Arabic-capable embedded fonts and deterministic pagination.

- [ ] **Step 1: Write a failing anti-raster test**

Generate a small document PDF as an `ArrayBuffer` through a testable export function such as:

```ts
export async function createDocumentPdf(docData: DocPreviewData): Promise<ArrayBuffer>
```

Assert the PDF has text operators and does not include a full-page PNG data URL:

```ts
const bytes = new Uint8Array(await createDocumentPdf(englishInvoice))
const text = new TextDecoder('latin1').decode(bytes)
expect(text).toContain('BT')
expect(text).not.toContain('/Subtype /Image')
```

- [ ] **Step 2: Run the test to verify the raster implementation fails**

Run:

```powershell
npm test -- pdfExport
```

Expected: it fails while `html2canvas` is imported or a page is placed with `addImage`.

- [ ] **Step 3: Run an Arabic/English renderer spike before selecting a dependency**

Evaluate the existing jsPDF path first with an embedded, licensed Arabic-capable TTF font and jsPDF Arabic shaping support. Render these three inputs:

```text
English invoice with a 40-row table
Arabic invoice with Arabic customer, material, and notes fields
Mixed Arabic/English invoice with numbers, currency, and a stamp/signature image
```

Use a real text extractor and manual Acrobat/browser selection to verify the output. If existing jsPDF cannot produce correct Arabic shaping and selectable text, document the failure and evaluate one approved renderer that supports embedded fonts and Arabic shaping. Do not add a dependency before recording the decision.

- [ ] **Step 4: Obtain PDF-engine and font-license approval**

`docs/decisions/pdf-renderer-decision.md` must state:

```markdown
Chosen engine and version
Arabic font family, source, license, and embedding permission
English/Arabic/long-table test results
Bundle-size and operational tradeoff
Rejected alternative and observed failure
Rollback: retain structured document data; do not overwrite existing generated artifacts
```

Stop for approval if a new package, paid renderer, or font license is required.

- [ ] **Step 5: Implement the selected renderer behind the existing download API**

Keep document data structured. Replace the `html2canvas` import and all PNG page capture logic. Keep the public caller unchanged:

```ts
export async function downloadDocumentPdf(docData: DocPreviewData): Promise<void> {
  const pdf = await createDocumentPdf(docData)
  downloadPdf(pdf, `${docData.number || 'document'}.pdf`)
}
```

Implement all seven types: `QUOT`, `PINV`, `TINV`, `CINV`, `PKL`, `DN`, and `BL`.

- [ ] **Step 6: Prove PDF acceptance requirements in staging**

For each document type and language, verify:

```text
manual document number is preserved
text can be selected and searched
Arabic joins and direction are correct
long tables create clean multiple pages
stamp/signature image does not rasterize body text
print output contains no application navigation or controls
```

Attach generated test artifacts to the exact staging test run, not production customer records.

- [ ] **Step 7: Checkpoint and commit**

Run:

```powershell
npm test -- pdfExport
npm run build
```

If execution occurs in an authorized Git worktree:

```bash
git add app/src/lib/pdfExport.ts app/tests/lib/pdfExport.test.ts app/tests/fixtures/pdf docs/decisions/pdf-renderer-decision.md
git commit -m "fix: generate selectable Arabic document PDFs"
```

## Task 7: Complete Critical Domain and Acceptance Tests

**Files:**
- Create: `app/e2e/company-isolation.spec.ts`
- Create: `app/e2e/permissions.spec.ts`
- Create: `app/e2e/documents.spec.ts`
- Create: `app/e2e/shared-data.spec.ts`
- Create: `app/e2e/factory-code.spec.ts`
- Create: `app/e2e/trash-audit.spec.ts`
- Create: `app/e2e/license-backup.spec.ts`
- Modify: `app/e2e/fixtures/auth.ts`
- Modify: `app/playwright.config.ts`
- Test: Playwright staging suite

**Interfaces:**
- Consumes: disposable identities and isolated synthetic Company A/B data from Task 1.
- Produces: evidence for every acceptance domain in `docs/25_TESTING_ACCEPTANCE.md`.

- [ ] **Step 1: Add role and isolation tests**

Implement the following explicit cases:

```ts
test('Company A customer is absent for UserB', async ({ page }) => {
  await signIn(page, users.userB)
  await page.goto('/customers')
  await expect(page.getByText(companyACustomerName)).toHaveCount(0)
})

test('ViewerA cannot save a project edit', async ({ page }) => {
  await signIn(page, users.viewerA)
  await openProject(page, projects.companyA)
  await expect(page.getByRole('button', { name: /^edit$/i })).toBeDisabled()
})

test('ViewerA can create a note and report an issue', async ({ page }) => {
  await signIn(page, users.viewerA)
  await openProject(page, projects.companyA)
  await createNote(page, 'Viewer evidence note')
  await reportIssue(page, 'Viewer evidence issue')
})
```

- [ ] **Step 2: Add document, shared-data, and VAT/QR tests**

Cover these exact acceptance states:

```text
all seven document types render Arabic and English
duplicate number rejected inside Company A and accepted in Company B
manual document number edit persists
PINV quantity 50, TINV proposes 48, Document Only leaves project at 50
Update Project updates project to 48 and updates selected PINV in place
audit records 50 to 48 without a duplicate PINV
VAT 0 has no QR; VAT 15 follows configured QR behavior and calculations are exact
```

- [ ] **Step 3: Add Factory Code, Trash, audit, license, and backup tests**

Cover these exact acceptance states:

```text
Factory Code import inserts new records, updates changed records, and retains missing old records
search finds 952 across indexed fields
filtered and full XLSX exports preserve values and leading zeroes
Trash hides normal records, restores records, and reports uniqueness conflicts
audit searches by user and document number and records view/download events
license stub proves valid, expired, and unavailable behavior without sending business data
backup performs dry validation and restores only into a clean test environment
```

- [ ] **Step 4: Run focused staging tests first**

Run each spec separately with staging environment variables. Expected: failures identify a real behavioral gap; do not use test retries to hide failed authorization or persistence checks.

- [ ] **Step 5: Run the complete staging suite**

Run:

```powershell
npm run test:e2e
```

Expected: all critical suites pass with artifacts, trace, video, and screenshots retained for the exact staging deployment identifier.

- [ ] **Step 6: Checkpoint and commit**

If execution occurs in an authorized Git worktree:

```bash
git add app/e2e app/playwright.config.ts
git commit -m "test: cover production acceptance journeys"
```

## Task 8: Add Accessibility, RTL, Security, and Performance Evidence

**Files:**
- Create: `app/e2e/accessibility-rtl.spec.ts`
- Create: `app/e2e/security-resilience.spec.ts`
- Create: `docs/runbooks/rollback-and-restore.md`
- Create: `docs/runbooks/production-operations.md`
- Modify: `.github/workflows/ci.yml`
- Test: axe, keyboard, responsive, security, migration replay, and load artifacts

**Interfaces:**
- Consumes: staging deployment, personas, backups, and the full acceptance suite.
- Produces: repeatable operational evidence and release-blocking CI checks.

- [ ] **Step 1: Add keyboard, zoom, mobile, and RTL test cases**

Use Playwright to validate:

```ts
test('Arabic document form remains keyboard-operable at 200 percent zoom', async ({ page }) => {
  await signIn(page, users.userA)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await setLanguage(page, 'ar')
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
})
```

Run axe checks on login, dashboard, project detail, document form, attachment upload, Trash, and settings screens.

- [ ] **Step 2: Add security and resilience checks**

Verify these observable conditions:

```text
unauthenticated R2 proxy request returns 401
cross-company attachment key returns 403
malformed upload payload returns 400 or 413 without an R2 object
unsupported MIME returns 415
expired session returns to login without state mutation
rendered user content cannot inject executable HTML into document preview or notes
```

- [ ] **Step 3: Add CI gates that can run without production access**

CI must run:

```text
npm ci
npm run typecheck
npm run lint
npm test -- --coverage
npm run build
npm audit --omit=dev --audit-level=high
bundle secret scan
staging-only Playwright suite when staging secrets are present
```

Make the staging suite required only in the protected deployment workflow; it must fail closed when required variables are absent.

- [ ] **Step 4: Run backup, restore, and rollback rehearsals**

In a clean non-production environment:

```text
create database and R2 backup
validate manifest and checksums
restore database and objects into a new test environment
run a read-only reconciliation of row counts, document numbers, attachment keys, and Factory Code counts
deploy previous staging artifact and verify login plus read-only project access
```

Record RTO/RPO measured values and exact rollback commands in `docs/runbooks/rollback-and-restore.md`.

- [ ] **Step 5: Run performance checks**

Use a synthetic staging dataset representative of normal operating volume. Measure dashboard load, project list filtering, document creation, attachment upload, and concurrent unique-number creation. Treat an error, cross-company result, duplicate number, or stale-write acceptance as a failure regardless of latency.

- [ ] **Step 6: Checkpoint and commit**

If execution occurs in an authorized Git worktree:

```bash
git add app/e2e .github/workflows/ci.yml docs/runbooks
git commit -m "test: add release quality and operations gates"
```

## Task 9: Perform Independent Readiness Review and Release Decision

**Files:**
- Modify: `.vibeguard/PRODUCTION_READINESS_REVIEW.md`
- Modify: `docs/FINAL_TRACEABILITY_MATRIX.md`
- Modify: `docs/END_TO_END_TEST_REPORT.md`
- Create: `docs/releases/<release-id>-evidence.md`
- Test: clean checkout verification against staging

**Interfaces:**
- Consumes: immutable CI run URLs, staging deployment identifier, test artifacts, migration version, backup/restore evidence, and security advisor output.
- Produces: `ready`, `conditional_go`, or `not_ready` decision tied to one exact release artifact.

- [ ] **Step 1: Run every release gate from a clean checkout**

Run:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
npm run test:e2e
```

Expected: all commands pass against the same lockfile and staging artifact.

- [ ] **Step 2: Re-run Supabase security and performance advisors**

Expected security state:

```text
no publicly executable SECURITY DEFINER RLS helpers
no mutable search-path advisor finding for changed functions
leaked-password protection enabled
RLS enabled on all public tables
```

Document any remaining performance findings with measured impact, owner, and release decision. Do not mark a finding resolved without current advisor output.

- [ ] **Step 3: Update traceability only from current artifacts**

For every row in `docs/FINAL_TRACEABILITY_MATRIX.md`, link the exact test name, artifact, staging deployment, or verified manual evidence. Remove claims that cannot be linked to evidence.

- [ ] **Step 4: Obtain independent decision**

An agent or reviewer who did not implement the final changes must inspect the release evidence and set exactly one result:

```text
ready: all P0/P1 findings closed and every required gate has evidence
conditional_go: only explicitly accepted non-blocking risks remain
not_ready: any P0/P1, missing evidence, staging failure, or unapproved risk remains
```

- [ ] **Step 5: Stop for explicit production approval**

Before any production migration, secret update, function deployment, Vercel production deployment, or customer-data action, present the independent decision, rollback plan, artifact identifier, and remaining risks to the release owner.

- [ ] **Step 6: Production release and post-deploy verification only after approval**

Apply approved production changes in the same sequence validated in staging. Re-run read-only smoke checks, verify logs/alerts, and confirm no cross-company data or unexpected write occurred. If any check fails, execute the approved rollback/roll-forward procedure and set release status to `not_ready`.

## Plan Self-Review

### Spec coverage

`docs/25_TESTING_ACCEPTANCE.md` sections 1 through 15 are covered by Tasks 1, 3 through 8. `docs/29_RELEASE_CHECKLIST.md` product, security, data, documents, workflows, Factory Code, licensing, UX, and operations gates are covered by Tasks 2 through 9.

### Deliberately deferred decisions

- The PDF engine and Arabic font are selected only after the measured renderer spike and approval in Task 6.
- Production account remediation, staging resource creation, staging/production secrets, migrations, and release remain approval-gated.
- Vercel team/project access is an external prerequisite; no personal-account substitute is permitted.

### Placeholder and type consistency check

The plan names concrete files, contracts, commands, acceptance outcomes, and release stop conditions. Dynamic migration timestamps are required because Supabase migrations must remain ordered and unique; the implementation agent must use the actual timestamp generated at execution time.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-14-sanad-production-readiness.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, and use exclusive ownership for migrations and shared files.
2. **Inline Execution** - Execute sequentially in one session, stopping at every staging, secret, migration, PDF-engine, and production approval gate.

Use `ai-data-and-integrations` first for Task 1 through Task 5 because staging, RLS, migrations, R2, and authorization are the initial critical path.
