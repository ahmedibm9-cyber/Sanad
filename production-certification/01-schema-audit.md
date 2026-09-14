# Schema Audit

## Repository Evidence

- Migrations are repository-controlled from `001_initial_schema.sql` through `017_optimistic_locking.sql` plus the dated backup/index migration.
- Documents define a partial unique index on `(company_id, document_number)` for active records in `007_documents.sql`.
- RLS enablement and policies are defined across company-scoped tables in migrations.
- Numeric fields are used in visible migration definitions such as `company_document_defaults.default_vat_rate`.
- `017_optimistic_locking.sql` adds version columns but runtime stale-write enforcement was not demonstrated.

## Blocked

No empty database was provisioned and no Supabase CLI/local database was available. Therefore migration replay, table-by-table catalog inspection, invalid cross-company inserts, query plans, authenticated RLS probes, numeric arithmetic, upgrade migration, and document-number race testing are UNVERIFIED.
