# SANAD — AI Coding Agent Instructions

## Mission

Implement SANAD end-to-end from the documentation in this folder. Do not treat this as a UI mockup exercise.

## Rules

1. Read every relevant specification before modifying code.
2. Do not ask product questions already answered in the docs.
3. Do not remove features to make implementation easier.
4. Do not silently change terminology.
5. Do not merge Task and To-do.
6. Do not turn SANAD into CRM/accounting/inventory/procurement.
7. Do not add WhatsApp.
8. Do not create cross-company shared customer/material/project data.
9. Do not auto-delete Factory Code history.
10. Do not create visible competing revisions of documents.
11. Do not propagate shared-data changes without confirmation.
12. Do not rasterize full pages for PDF generation.
13. Do not implement insecure client-only authorization checks.
14. Do not store secrets in frontend code.
15. Do not hard-code company-specific values that belong in Settings.
16. Do not make all Settings visible in one giant unstructured page.

## Ambiguity protocol

When implementation encounters an unresolved detail:

1. Check `00_MASTER_PRODUCT_SPEC.md`.
2. Check specialist spec.
3. Check `23_DECISIONS_LOG.md`.
4. Check `21_ASSUMPTIONS_DEFAULTS.md`.
5. If still unresolved, use the safest reversible implementation default.
6. Add a code comment and entry to an internal implementation-notes file.
7. Do not block unrelated implementation.

## Build quality

For every feature:
- UI exists.
- Database model exists.
- Authorization exists.
- Validation exists.
- Loading state exists.
- Empty state exists.
- Error state exists.
- Audit event exists where required.
- Tests exist for critical business logic.

## Architecture discipline

Separate:
- UI
- domain/business logic
- persistence/repositories
- permission checks
- document rendering
- storage adapters
- licensing adapter
- audit service
- notification service

Shared Project Data synchronization must be a domain service, not scattered UI code.

## Database discipline

- Use UUID/internal IDs.
- Never expose internal IDs as user-facing Project numbers.
- Every company-owned table must include `company_id` or be reachable through a strict company-owned parent.
- Use Supabase RLS or equivalent server-enforced authorization.
- Use transactions for multi-record critical changes.

## Migration discipline

- Use migrations.
- Never manually mutate production schema as the normal process.
- Seed data only in development/test.
- Never ship dummy data to production.

## Completion discipline

Do not mark a milestone complete because screens render.

A milestone is complete only when its acceptance tests pass.
