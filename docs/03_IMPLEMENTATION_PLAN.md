# SANAD — Implementation Plan

## Phase 0 — Repository and foundations

Deliver:
- Web app shell
- TypeScript
- environment configuration
- Supabase connection
- Cloudflare R2 adapter
- migrations
- test setup
- logging
- error boundary
- localization skeleton
- Arabic RTL / English LTR
- licensing adapter interface

Exit criteria:
- App runs locally and in staging.
- Test DB and storage work.
- No secrets leak to client bundle.

## Phase 1 — Authentication, companies and permissions

Deliver:
- Login
- Admin bootstrap
- Companies
- User accounts
- Company memberships
- role/permission checklist
- per-company permission resolution
- RLS policies
- company switcher

Exit criteria:
- Same user can have different access in two companies.
- Unauthorized company access fails at server/database level.

## Phase 2 — Master data

Deliver:
- Customers
- Materials
- Material files
- last selling price
- company assets/settings
- currencies
- units
- VAT rates

Exit criteria:
- Company isolation tests pass.
- Selecting a material can suggest last price.

## Phase 3 — To-dos, Tasks and Projects

Deliver:
- Personal To-dos
- Task
- Project
- conversion Task → Project
- statuses
- pinning
- archived collapsible group
- multiple materials
- Notes
- Report Issues
- Shared Project Data layer

Exit criteria:
- Convert Task without duplication.
- Multi-status filter works.
- Viewer can Note/Report Issue but not edit project data.

## Phase 4 — Document engine

Deliver:
- Document model
- QUOT
- PINV
- TINV
- CINV
- PKL
- DN
- BL
- Arabic/English
- editable number/reference
- two template families
- prepared by/signature/stamp controls

Exit criteria:
- User can generate all document types.
- Duplicate document number in same company rejected.
- Same number may exist in another company.

## Phase 5 — Shared-data synchronization

Deliver:
- conflict detection
- confirmation step 1
- affected-document analysis
- checklist confirmation step 2
- in-place updates
- audit before/after

Exit criteria:
- No silent propagation.
- No visible duplicate versions.
- Same document reference preserved after sync.

## Phase 6 — PDF/Print

Deliver:
- preview
- print
- PDF download
- A4 pagination
- selectable/searchable text
- Arabic font support
- asset rendering

Exit criteria:
- PDFs are not screenshots.
- Tables do not clip under normal supported cases.

## Phase 7 — Factory Code

Deliver:
- source import
- normalization
- smart update
- broad search
- filters
- filtered Excel export
- full Excel export
- import audit

Exit criteria:
- Missing records in newer import are retained.
- Changed records update.
- New records insert.

## Phase 8 — Audit, Trash, Notifications and Reports

Deliver:
- comprehensive audit
- Trash/restore
- notifications
- reports
- PDF/Excel reports

## Phase 9 — Backup/Restore and licensing

Deliver:
- manual backup
- automatic backup schedule
- R2 backup artifacts
- offline backup download
- restore
- online license verification
- license-failure UI

## Phase 10 — Hardening

Deliver:
- full E2E tests
- performance review
- security review
- accessibility review
- PDF QA
- Arabic QA
- backup restore drill
- deployment docs
- production seed clean-up

## Release sequencing

Use feature flags only when necessary. Do not ship a partially implemented feature as if complete.
