# Production Readiness Review

Review date: 2026-09-14

## Decision

**NOT READY FOR PRODUCTION.**

Scope: Current SANAD production deployment, connected Supabase project, and the release represented by the workspace. This is a strict-risk review because the app handles authentication, company-isolated operational data, file storage, and backups.

## Release Gate Matrix

| Gate | Result | Evidence | Owner / route |
| --- | --- | --- | --- |
| Build and local unit/integration tests | PASS, local only | `npm test`: 337 passing; `npm run build`: passed | Implementer |
| Dependency security | CONDITIONAL | Production audit has 2 Moderate React Router advisories; no Critical/High | Dependency upgrade manager |
| Production Edge Function authorization | FAIL / P0 | Active `create-admin` function has `verify_jwt=false`, uses service-role credentials, and provisions a fixed credential account. Only it is deployed; `r2-proxy` is absent. | Security implementer |
| Database security | FAIL / P1 | Security advisor reports publicly executable `SECURITY DEFINER` RLS helpers, mutable search paths, and disabled leaked-password protection. | Supabase/security implementer |
| Tenant and permission enforcement | UNVERIFIED / P1 | All 30 public tables have RLS, but 33 policies depend on publicly callable helpers. No staged Admin/User/Viewer/no-access matrix or direct cross-company denial evidence exists. | Supabase/security implementer |
| Data integrity and migration replay | UNVERIFIED / P1 | Remote migration list exists, but no clean replay, upgrade reconciliation, invalid cross-company insert, concurrent document-number, or stale-write test is evidenced. | Migration engineer |
| Documents and PDF | FAIL / P0 | `app/src/lib/pdfExport.ts:3,97-121` rasterizes HTML through `html2canvas` and embeds PNGs. This directly violates `docs/02_AI_CODING_AGENT_INSTRUCTIONS.md:20` and `docs/08_PDF_PRINTING_SPEC.md`. | Document/PDF implementer |
| Attachments and R2 | FAIL / P1 | `ProjectDetailPage.tsx:867-868` adds a synthetic in-memory attachment with blank R2 key; `AttachmentUploadModal.tsx:18-24,54` retains only a filename. The deployed function list excludes `r2-proxy`. | Storage implementer |
| Required user journeys | UNVERIFIED / P1 | Stateful Playwright now fails closed without staging variables. No isolated staging deployment or disposable Admin/UserA/ViewerA/UserB exists. | Staging owner |
| Backup and restore | UNVERIFIED / P1 | `production-certification/08-backup-restore.md` records no database/R2 restore drill. | Backup owner |
| Hosting, CI, rollback, observability | FAIL / P1 | No accessible Vercel team/project context, no remote CI run, no deployment/rollback evidence, and Supabase log queries failed with backend errors. | Hosting owner |
| Performance and capacity | UNVERIFIED / P1 | No required staging dataset/concurrency/soak evidence. Advisors report 29 unindexed FKs, 64 RLS init-plan warnings, 130 overlapping permissive policies, and 37 unused indexes. | Performance owner |
| Accessibility, RTL, resilience | UNVERIFIED / P1 | No staging browser, keyboard, zoom, RTL matrix, axe, XSS, or failure-path evidence. | Accessibility/test owner |
| Documentation integrity | FAIL / P1 | `docs/FINAL_TRACEABILITY_MATRIX.md:246-252` says no rasterization, while current source imports `html2canvas`; `docs/END_TO_END_TEST_REPORT.md` calls milestones complete without hosted evidence. | Documentation owner |

## Spec Journey Coverage

The acceptance matrix in `docs/25_TESTING_ACCEPTANCE.md` requires runtime evidence for Auth, company isolation, permissions, Task/Project conversion, Shared Data, latest price, all document types, VAT/QR, selectable Arabic/English PDFs, files, Factory Code, audit, Trash, backup, and licensing.

| Journey group | Review result |
| --- | --- |
| Login, invalid/disabled/session-expiry, sign-out | Only unauthenticated page reachability was safe to inspect; no controlled identity tests. UNVERIFIED. |
| Multi-company and role matrix | No direct RLS/API denial tests. `App.tsx:42-63` applies authentication but no route permission requirement. UNVERIFIED. |
| To-dos, Tasks, Projects, conversion, statuses | Local mock-backed tests exist; persisted staged workflow and authorization evidence are absent. PARTIAL. |
| Shared data, prices, document numbering | Local logic tests exist; no concurrent/staged atomicity, synchronization, audit, or uniqueness evidence. PARTIAL. |
| Seven document types, Arabic/English templates, print/PDF | PDF requirement fails due raster output; persisted lifecycle and long Arabic artifacts are absent. FAIL. |
| Files, material files, attachments, Factory Code imports | Attachment flow is nonpersistent and deployed R2 proxy is absent. FAIL. |
| Reports, notifications, audit, Trash | UI/service evidence exists, but exports, immutable audit, restore/conflict, and authorization journeys are untested. UNVERIFIED. |
| Backups, restore, licensing | No live license matrix or clean restore drill. UNVERIFIED. |

## Blocking Findings

1. **P0: Unauthenticated `create-admin` Edge Function.** The deployed function has `verify_jwt=false` and uses the service role to create a fixed email/password user. It must be disabled or redeployed with explicit, server-verified administrator authorization; existing accounts created through it require review.
2. **P0: Prohibited rasterized document PDF.** The current implementation produces image-based pages, not selectable/searchable document text.
3. **P1: File functionality is not production-connected.** Project attachments are fabricated in React state, and the required R2 proxy is not deployed.
4. **P1: RLS helper RPC exposure and Auth password protection.** `user_has_company_access` and `user_is_company_admin` remain publicly callable `SECURITY DEFINER` functions; leaked-password protection is disabled.
5. **P1: No safe end-to-end environment.** Staging, disposable identities, CI run evidence, migration replay, restore drill, rollback rehearsal, and browser acceptance evidence are absent.
6. **P1: Existing privileged-account provenance is unknown.** Two system-admin records have not been reviewed following the prior metadata privilege-escalation path.

## Verified Evidence

- Production login URL was reachable and rendered without console errors. A pre-existing authenticated browser session redirected to the dashboard; no state-changing action was taken.
- `npm test` passed: 27 files, 337 tests.
- `npm run build` passed; bundle includes `html2canvas` and emitted a chunk-size warning.
- `npm audit --omit=dev --json` found 0 Critical, 0 High, and 2 Moderate findings.
- Supabase catalog shows RLS enabled for all 30 `public` tables.
- Four applied hardening migrations are present in remote history and local names are aligned.

## Required Exit Evidence

1. Remove or secure `create-admin`; inspect impacted accounts and rotate any predictable credentials.
2. Replace raster PDF generation with a non-raster engine; verify selectable Arabic and English output for all document/template journeys.
3. Deploy and exercise a secured R2 proxy with persisted attachment bytes and cross-company denial tests.
4. Provision isolated staging, R2, license stub, and disposable identities; run the full acceptance specification there.
5. Move RLS helpers out of the public API surface, validate the complete role/company matrix, and enable leaked-password protection.
6. Prove clean migration replay, migration upgrade, backup/restore, rollback, CI, deployment, security headers, observability, accessibility/RTL, and performance gates.
7. Replace stale traceability and E2E reports with evidence from the exact release and staging target.

```yaml
production_readiness:
  decision: not_ready
  scope: Current SANAD production deployment and connected Supabase project
  blockers:
    - Unauthenticated service-role create-admin Edge Function
    - Rasterized PDF generation prohibited by the product specification
    - Nonpersistent attachments and missing deployed R2 proxy
    - No isolated staging or full acceptance-journey evidence
  conditions: []
  warnings:
    - Two Moderate production dependency advisories
    - 59 ESLint warnings
    - Database performance advisor findings
  accepted_risks: []
  verified_evidence:
    - Local tests and production build pass
    - Production login URL reachable without console errors
    - RLS enabled on all public tables
  missing_or_stale_evidence:
    - CI, staging, browser journeys, RLS matrix, R2, restore, rollback, performance, accessibility, observability
    - Current traceability and E2E reports conflict with source
  required_approvals:
    - Platform-owner approval for staging resources
    - User approval for production remediation and eventual release
  owners_and_routes:
    - Security and Edge Function remediation: ai-implementation-strategist
    - Staging and release evidence: ai-next-step-skill-router
  decision_expires_when:
    - Any production function, schema, hosting configuration, or release artifact changes
  recommended_next_skill: ai-next-step-skill-router
```

Status: completed
