# Production Readiness Remediation Plan

## Outcome

Make SANAD eligible to pass every mandatory release gate in the production-certification program with repeatable runtime evidence. A PASS is not allowed until the final certification matrix has evidence for every Section 92 gate.

## Confirmed Decisions

- The agent may provision isolated non-production Supabase, R2, license, and HTTPS staging resources, subject to platform cost/approval controls.
- PDF replacement starts with a technical spike comparing server-side Chromium print-to-PDF and native jsPDF with embedded Arabic fonts. Rasterized page capture is not an acceptable end state.
- Replace `xlsx` after a compatibility and security spike; do not accept the current vulnerability as a release exception.

## Scope

- Production readiness gaps recorded as `CERT-001` through `CERT-005`.
- All database, RLS, permissions, documents, PDF, R2, audit, backup, license, browser, accessibility, performance, CI, deployment, and final traceability gates in the certification mission.
- Existing documented SANAD behavior only. No CRM, inventory, WhatsApp, or undocumented product scope.

## Non-Goals

- Production deployment before staging gates pass.
- Destructive migration rollback or mutation of production data.
- Replacing requirements with source-review assertions.
- Treating UI visibility as authorization evidence.

## Architecture Decisions To Implement

| ID | Decision | Alternatives | Acceptance Evidence | Approval |
| --- | --- | --- | --- | --- |
| ADR-01 | Use isolated Supabase staging projects/branches and private R2 staging storage for all destructive and authorization tests. | Local-only testing; rejected because it cannot prove hosted RLS/R2 behavior. | Staging URL, migration history, test identities, isolated bucket, cleanup runbook. | Confirmed, subject to platform cost controls. |
| ADR-02 | Replace generic `exec_transaction(JSONB)` use with narrow, domain-specific RPCs for critical multi-record operations. | Browser-orchestrated compensating writes; rejected for mandatory atomicity. | Forced mid-operation failure leaves project and all selected documents unchanged. | Implementation review required before migration apply. |
| ADR-03 | Enforce company-parent integrity with database constraints where a child has `company_id`, then prove with direct invalid inserts. | RLS-only enforcement; insufficient for data integrity. | Cross-company document/material-file/attachment/note inserts rejected. | Migration safety review required. |
| ADR-04 | Add optimistic-write enforcement using the existing version columns and a stale-write response contract. | Last-write-wins; rejected. | Two-session stale edit produces conflict and preserves both intended changes. | No product approval needed. |
| ADR-05 | Select a non-rasterized PDF engine only after the documented spike. | Keep `html2canvas`; prohibited by product rules. | Selectable/searchable Arabic/English PDF passes small, large, and Delivery Note tests. | Technology choice pending spike. |
| ADR-06 | Move all sensitive R2 operations and credentials outside the browser bundle; Edge Function authorization includes membership and permission checks. | Client-side S3 SDK; prohibited. | Bundle secret scan and cross-company signed URL tests pass. | No product approval needed. |
| ADR-07 | Replace `xlsx` with a maintained, commercially compatible library selected by fixture-based spike. | Time-limited exception; rejected. | Dependency audit has no Critical/High deployed vulnerabilities and SANAD XLSX fixtures retain Arabic/code formatting. | Technology choice pending spike. |

## Milestones

### M0 - Controlled Baseline and Decision Log

Owner: implementer.

1. Reconcile the repository instructions claiming a static prototype with the partial Supabase/R2 implementation; make the implementation status explicit in certification records.
2. Capture package, lockfile, migration, test, build, and deployment inventory.
3. Preserve all findings and attach exact test commands/results.

Exit evidence: baseline record is current; no production-code change occurs before baseline evidence.

### M1 - Supply Chain, Lint, and CI Gate

Owner: implementer; dependency changes receive independent review.

1. Add a supported ESLint configuration compatible with React/TypeScript and make `npm run lint` executable.
2. Run dependency/PDF spreadsheet spikes separately; record compatibility, licenses, upgrade notes, and rollback points.
3. Upgrade Vite/Vitest as a coupled, staged change after authoritative migration guidance is reviewed.
4. Select and migrate from `xlsx` using real Factory Code import/export fixtures.
5. Add CI that executes clean install, typecheck, lint, unit tests, integration tests, migration replay, build, dependency audit, and production bundle secret scan.

Exit evidence: no deployed Critical/High dependency vulnerability; CI fails on every mandatory local gate; lockfile and manifest are reviewed together.

### M2 - Staging Foundation and Test Identities

Owner: implementer; infrastructure actions require platform confirmation where cost is incurred.

1. Provision a separate Supabase staging project/branch, R2 bucket, license stub, and HTTPS deployment target.
2. Add a documented environment template without secrets and a secure CI secret inventory.
3. Create disposable Admin, UserA, ViewerA, and UserB identities with Company A/B memberships.
4. Add setup/teardown that applies all migrations, seeds only test data, and removes it after verification.

Exit evidence: one command creates an empty environment from migrations; test identities authenticate through deployed SANAD.

### M3 - Schema, Migration, and Company-Integrity Hardening

Owner: single migration writer; no concurrent schema work.

1. Catalog every production table, columns, constraints, indexes, soft-delete behavior, audit fields, RLS state, and policies.
2. Add missing constraints after a preflight query confirms existing rows comply.
3. For company-owned parent/child records, add compound company ownership constraints or equivalent domain-safe enforcement.
4. Add required-field and numeric/check constraints from the approved specs, including positive material quantities and document relationships.
5. Verify the active-document partial unique document-number index under concurrent requests.
6. Replay migrations into an empty database and run an upgrade test against representative historical data.
7. Run `EXPLAIN ANALYZE` using the required realistic dataset before adding any index.

Exit evidence: direct invalid inserts are rejected; migration replay/upgrade reconciliation passes; query plans are documented.

### M4 - Server-Enforced Authorization and Permission Matrix

Owner: implementer; security reviewer validates independently.

1. Establish one canonical permission catalog used by database policies, services, and UI.
2. Implement atomic membership-permission replacement with one confirmation and one before/after audit event for critical changes.
3. Enforce granular permissions in database policies/RPCs/Edge Functions, not only React controls.
4. Add direct authenticated CRUD denial tests for every company-owned table and ID manipulation route.
5. Add the complete Admin/User/Viewer/no-access matrix, including Viewer Notes/Issues and download permissions.
6. Verify immediate revocation behavior on active sessions.

Exit evidence: all unauthorized cross-company and viewer mutation attempts are denied through actual deployed paths.

### M5 - Core Document Data and Workflow Integrity

Owner: implementer.

1. Fix document edit and preview hydration to load the persisted document, project, customer, materials, dates, template, status, overrides, and version.
2. Remove fallback project/customer/default document behavior from persisted document routes; render explicit loading, missing, unauthorized, and error states.
3. Persist document date and status correctly; preserve final state unless an authorized transition changes it.
4. Resolve the `BL` document-type/template requirement without replacing it with an invoice fallback.
5. Correct material price mapping and centralized decimal/VAT rounding.
6. Implement document-only shared-data resolution, selected-document update, and dedicated atomic synchronization RPC.
7. Enforce stale-write detection and double-submit idempotency on document and project mutation paths.

Exit evidence: persisted document create/edit/reload/preview/print tests pass; forced synchronization and concurrent-edit failures preserve data.

### M6 - Non-Raster PDF and Template Certification

Owner: implementer after ADR-05 spike approval.

1. Build the PDF spike against a small English document, long Arabic document, and 30-line document.
2. Select the engine using selectable text, Arabic shaping, pagination, print parity, deployment fit, and operational cost as measured criteria.
3. Replace `html2canvas` full-page capture completely.
4. Implement independent template/layout verification for the seven approved Fulla templates and the BL document workflow.
5. Add automated PDF structural checks and manual screenshot/print evidence for Arabic and long layouts.

Exit evidence: generated PDF text is selectable/searchable; no rasterized full-page images; all required document/template journeys pass.

### M7 - R2, Attachments, Audit, Trash, and Backup

Owner: implementer; staging R2 required.

1. Move/remove any server R2 implementation reachable from the browser build; verify no credential-capable SDK path is bundled.
2. Validate MIME/content, size, zero-byte, path traversal, Unicode, duplicate filenames, and dangerous file upload cases at the server boundary.
3. Link upload metadata only after durable object storage succeeds; make retries idempotent and clean up orphaned objects safely.
4. Enforce R2 key ownership and `files.*` permissions in the Edge Function, including backups and private assets.
5. Implement attachment and material-file persistence instead of local placeholder records.
6. Test trash/restore/purge, material-file deduplication, audit immutability, audit before/after presentation, and notifications.
7. Implement independent database-plus-R2 backup artifacts and execute a clean-environment restore drill.

Exit evidence: cross-company R2 access is denied; restored files work; restored deployment renders prior documents; audit records are immutable.

### M8 - Browser, Accessibility, RTL, and Resilience

Owner: implementer; accessibility reviewer validates.

1. Add Playwright staging fixtures for each test identity and all critical journeys.
2. Execute keyboard, dialog focus, 200% zoom, RTL page matrix, and required viewport matrix.
3. Run axe scans; resolve every Critical/Serious issue.
4. Test XSS payloads, network interruption/retry, voice recognition failures, date-only timezone behavior, and stale global-search responses.
5. Add browser console/network failure assertions to E2E suites.

Exit evidence: accessibility, RTL, 1366x768, responsive, XSS, and failure-state evidence is stored in certification records.

### M9 - Performance, Reliability, License, and Deployment Rehearsal

Owner: implementer; staging required.

1. Seed the approved 5k/20k/50k/20k dataset distribution.
2. Measure stated operations at median/p95/error rate, then optimize only measured bottlenecks.
3. Run 10/25/50/100 concurrent read scenarios, realistic write scenarios, and an hours-long soak test.
4. Execute license matrix and request privacy capture.
5. Exercise controlled R2/DB/PDF/backup/license failures and verify redacted diagnostics.
6. Deploy to staging, run critical E2E, and rehearse application rollback with migration compatibility safeguards.

Exit evidence: performance/soak results, deployment result, rollback result, and observability evidence are recorded.

### M10 - Final Certification

Owner: independent readiness reviewer.

1. Re-run every Section 92 gate from a clean checkout and fresh staging setup.
2. Reconcile findings, skipped tests, warnings, browser errors, dependencies, and open requirements.
3. Produce the final atomic traceability matrix with no P0/P1 findings and no missing/incorrect/unverified active requirements.

Exit evidence: an independent `PASS` decision with commands, artifacts, screenshots, database logs, and deployment evidence.

## Critical Path

M0 -> M1 -> M2 -> M3 -> M4 -> M5 -> M6/M7 -> M8 -> M9 -> M10.

M6 and M7 may proceed in parallel after M2/M3. M8 can begin its local fixture work after M5 but requires M2 for staging evidence. M9 must wait for M2, M3, M4, M5, M6, and M7.

## Approval Gates

| Gate | Required Before | Decision Owner |
| --- | --- | --- |
| Cloud project/bucket creation and potential cost | M2 | User/platform owner |
| PDF engine selection after spike | M6 | User after evidence review |
| Spreadsheet-library selection after spike | M1 | User after evidence review |
| Schema migration apply to shared/staging environment | M3 | User/platform owner |
| Any production deployment or production data operation | M10 or later | User/platform owner |

## Risks and Controls

| Risk | Control |
| --- | --- |
| Static prototype assumptions conflict with partial backend code | Treat source as incomplete; prove all behavior at runtime before certification. |
| Generic security-definer transaction RPC | Replace with narrow domain RPCs; audit privileges and search path before use. |
| Cross-company data corruption | Preflight migrations, compound integrity constraints, direct authenticated tests, reconciliation. |
| PDF Arabic/print quality failure | Spike first; require manual artifact inspection before adoption. |
| Dependency upgrade regressions | Upgrade in isolated stages with lockfile review, test/build checkpoints, and rollback commits. |
| Cloud cost/secret exposure | Isolated staging resources, cost confirmation, secret manager/CI secrets, no client secret values. |
| Backup test damages data | Restore only into a clean isolated environment; preserve original backup artifact and manifests. |

## First Vertical Slice

M1 dependency/lint/CI readiness: select supported upgrades/replacement candidates, add lint enforcement, and produce a passing local CI-equivalent pipeline without changing product behavior.
