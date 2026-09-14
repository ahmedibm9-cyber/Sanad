# Implementation Packet - SANAD Production Readiness

## Task Frame

- Goal: make SANAD eligible for an evidence-based production `GO` decision against `docs/25_TESTING_ACCEPTANCE.md` and `docs/29_RELEASE_CHECKLIST.md`.
- Context: the public `create-admin` incident is mitigated; the application remains not-ready due to non-raster PDF failure, nonpersistent attachments, missing R2 deployment, incomplete authorization evidence, and absent staging/operations proof.
- Constraints: preserve company isolation; never use production for destructive testing; no hard delete in normal UI; no rasterized PDFs; no production data/credential/migration changes without scoped approval; use separate staging database and bucket.
- Done when: all P0/P1 findings are closed with current staging/production evidence, critical acceptance journeys pass in CI and staging, and an independent readiness review issues `ready`.
- Non-goals: claiming certainty without evidence; substituting UI checks for server authorization; changing product scope.

## Complexity

- Level: Deep.
- Reason: the scope changes security boundaries, database/RLS behavior, external storage, document rendering, migrations, production hosting, and user data.

## Verified Evidence

| Evidence | Source | Consequence |
| --- | --- | --- |
| `create-admin` is now a JWT-protected retired function | `.vibeguard/INCIDENT_REPORT.md` | Immediate public provisioning path is contained; account history still requires review. |
| Current PDF captures HTML into PNG images | `app/src/lib/pdfExport.ts:3,97-121` | Must be replaced before release. |
| Project attachment UI only retains metadata in React state | `app/src/pages/ProjectDetailPage.tsx:867-868` | Must be connected to durable storage and database metadata. |
| R2 proxy source exists but is not deployed | `supabase/functions/r2-proxy/index.ts`; Supabase function inventory | Staging deployment and R2 configuration are prerequisite to file journeys. |
| Public RLS helpers have 33 policy dependencies | `production-certification/findings.md` | Must migrate through private schema only after staged authorization tests. |
| Local tests/build pass but staging acceptance proof is absent | `.vibeguard/PRODUCTION_READINESS_REVIEW.md` | Local checks do not authorize release. |

## Chosen Approach

Build and verify a staging-first vertical slice in this order: infrastructure/test identities, authorization and storage, document/PDF correctness, persistence/transaction integrity, then complete acceptance and operational rehearsal. This preserves the existing React/Supabase/R2 stack and isolates high-risk validation from company data.

Alternatives rejected:

- Testing destructive flows in production: risks real company data.
- Keeping browser-only compensation or generic transaction RPCs: fails atomicity and authorization requirements.
- Retaining `html2canvas`: explicitly prohibited by product rules.

## Execution Steps

1. Establish release control and account remediation.
   - Files: `.vibeguard/INCIDENT_REPORT.md`, Supabase Auth/admin records.
   - Remove the retired endpoint only after dependency check; review bootstrap-created accounts, rotate predictable credentials, and revoke affected sessions.
   - Approval: production Auth/account action required.
   - Verification: function inventory has no provisioning endpoint; no unreviewed privileged/bootstrap account remains.
   - Recovery: retain incident report and export account-review evidence before modifications.

2. Provision isolated staging and test identities.
   - Components: separate Supabase project/branch, Cloudflare R2 staging bucket, staging HTTPS deployment, license stub, CI secret inventory.
   - Create disposable Admin, UserA, ViewerA, and UserB with Company A/B memberships.
   - Approval: platform/cost and secret configuration required.
   - Verification: clean migrations, seeded test data, staging login, and E2E environment variables work.
   - Stop: do not run stateful Playwright before this is complete.

3. Secure RLS, permissions, and migration integrity.
   - Files: `supabase/migrations/*`, `app/src/lib/services/permission.ts`, `app/src/contexts/AuthContext.tsx`, `app/src/App.tsx`, authorization tests.
   - Move membership helpers to a private schema; update all dependent policies; add constraints for company-parent ownership, quantities, document-number uniqueness, permissions, and optimistic writes.
   - Implement atomic permission replacement and narrow domain RPCs where transactions are required.
   - Approval: reviewed staging migration; separate approval before production migration.
   - Verification: direct Admin/User/Viewer/no-access CRUD and cross-company denial tests against staged Supabase, clean replay, upgrade reconciliation, concurrency/stale-write tests.
   - Recovery: tested migration backup and rollback/roll-forward plan before production.

4. Deliver durable R2 file workflows.
   - Files: `supabase/functions/r2-proxy/index.ts`, `app/src/lib/r2Client.ts`, `app/src/lib/services/attachment.ts`, `app/src/components/common/AttachmentUploadModal.tsx`, `app/src/pages/ProjectDetailPage.tsx`, migration/tests.
   - Deploy a JWT-verified proxy with explicit company membership and permission checks; upload bytes before inserting metadata; preserve R2 references through Trash/restore; validate MIME, size, zero-byte, filename, and key ownership.
   - Approval: staging R2 credentials and function deployment; production secret configuration separately.
   - Verification: upload/download/delete/restore, denied cross-company URL/key use, retry/idempotency, material-file reuse, and no R2 secrets in bundle.
   - Recovery: delete orphaned object only after failed metadata write; retain Trash objects until authorized purge.

5. Replace document PDF generation and complete document persistence.
   - Files: `app/src/lib/pdfExport.ts`, document templates/adapters, `DocumentFormPage.tsx`, `DocumentPreviewPage.tsx`, document/shared-data services and tests.
   - Replace raster capture with a real-text PDF renderer; embed licensed Arabic-capable fonts; retain structured data as source of truth; implement all seven type/template paths including BL.
   - Approval: PDF engine selection after English/Arabic/long-table spike.
   - Verification: searchable/selectable text, Arabic shaping, clean print, long/multi-page tables, stamp/signature, manual unique numbers, document reload/edit/preview, shared-data conflict and selected synchronization.
   - Recovery: preserve existing structured records; do not replace existing generated artifacts until output comparison passes.

6. Complete audit, Trash, Factory Code, backup, license, reporting, and notifications.
   - Files: related services/pages/migrations and test fixtures.
   - Verify durable audit before/after data, Trash uniqueness conflict, Factory Code non-destructive merge/import/export, report exports, license valid/expired/unavailable behavior, and backup/restore.
   - Approval: clean-environment restore only; never restore into production during testing.
   - Verification: `docs/25_TESTING_ACCEPTANCE.md` sections 11-15 pass in staging.

7. Build the acceptance and operations evidence.
   - Files: `app/e2e/*`, Playwright configuration/fixtures, CI workflow, runbooks, certification records.
   - Add risk-based Playwright journeys for all personas and critical outcomes, including errors and RTL; run axe, keyboard, viewport, XSS, and resilience checks.
   - Add CI migration replay, security audit, bundle secret scan, staging E2E, and artifact retention.
   - Verification: staging deployment, backup restore, rollback rehearsal, observability/alerts, performance data set and concurrency results.

8. Independent final certification.
   - Re-run all release gates from a clean checkout and fresh staging setup.
   - Update stale traceability documents only with current evidence.
   - Approval: user/platform owner approves production release only after independent `ready` decision.

## Test and Verification Matrix

- Unit/integration: business rules, document calculations, shared-data transitions, storage validation, Factory Code merge.
- Staged database: migrations, RLS matrix, invalid inserts, unique/conflict behavior, transactions, audit immutability.
- Playwright: login/session behavior; Company A/B isolation; Admin/User/Viewer permissions; Task-to-Project; documents; PDF; attachments; Trash; reports; Factory Code; backup/license failure paths; Arabic RTL and responsive/keyboard flows.
- Operational: R2 object access; backup restore; CI; rollback; logs/alerts; load and soak tests.

## Approval Gates

- Staging project/bucket/licensing resources and associated cost.
- Staging and production secrets.
- Staging and production schema migrations.
- Existing account review, credential rotation, and session revocation.
- PDF-engine selection.
- Any production release.

## Adaptive Checkpoints

- Before each migration/function deployment: inspect live/staging state and back up affected data.
- Before expanding scope: verify the preceding acceptance gate passes.
- Before production: rerun independent readiness review; stop if any P0/P1 or missing current evidence remains.

## Handoff Prompt

Use `ai-data-and-integrations` to execute the staging-foundation and server-enforced authorization/storage phases of this packet. Verify current source and remote state first; do not mutate production, create paid resources, or handle secrets without explicit approval. Stop after a required platform approval, missing access, or a verified blocker, and return precise evidence.
