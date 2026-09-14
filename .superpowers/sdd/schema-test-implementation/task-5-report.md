# Task 5: Company Document Defaults & Config Lists Tests

## Status: DONE

## What Was Done

### 1. Type Validation Tests (4 tests)

Verified that the TypeScript types match the PostgreSQL schema from migration `002_company_settings.sql`:

- **DocumentDefaults**: All 17 fields validated — `id`, `company_id`, 11 config fields (4 nullable), `created_at`, `updated_at`. Nullable fields (`default_incoterm`, `default_payment_terms`, `default_delivery_terms`, `default_prepared_by`) accept `null`.
- **ConfigListItem**: All 7 fields validated — `id`, `company_id`, `list_name`, `item_value`, `is_default`, `sort_order`, `created_at`.
- **UpdateDocumentDefaultsInput**: All fields optional, only specified fields are set.
- **Non-null optional fields**: DocumentDefaults accepts non-null values for all nullable fields.

### 2. Service Behavior Tests (6 tests)

Used `vi.mocked(getSupabase).mockReturnValueOnce()` to provide per-test Supabase mock instances with controlled chain behavior:

- **getDocumentDefaults** (2 tests):
  - Reads from `company_document_defaults` table with correct `eq('company_id', ...)` filter
  - Returns `null` when record doesn't exist (PGRST116 error code handled)

- **updateDocumentDefaults** (2 tests):
  - **Update path**: When existing record found, calls `.update()` (not `.insert()`)
  - **Insert path**: When no record exists (PGRST116), calls `.insert()` to create new record

- **getConfigList** (2 tests):
  - Reads from `company_config_lists` table filtered by `list_name`
  - Returns empty array when list has no items

### 3. Seed Data Structure Validation (9 tests)

Validates the migration seed data structure (from `002_company_settings.sql` sections 8-9):

| List Type | Item Count | Default | Items |
|-----------|-----------|---------|-------|
| currencies | 4 | SAR | SAR, USD, EUR, GBP |
| vat_rates | 2 | 0 | 0, 15 |
| weight_units | 4 | MT | MT, KG, LB, TON |
| packing_units | 4 | Bags | Bags, Jumbo Bags, Drums, Containers |
| payment_terms | 4 | Net 30 days | Net 30, Net 45, Net 60, Cash on Delivery |
| delivery_terms | 4 | FOB | FOB, CIF, CFR, EXW |

- Exactly 6 list types defined
- Total seed items: 22
- Each list has a default (first item) defined

## Schema Reference

Tables verified against `supabase/migrations/002_company_settings.sql`:

```sql
-- company_document_defaults (lines 68-89)
CREATE TABLE IF NOT EXISTS company_document_defaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  default_language TEXT NOT NULL DEFAULT 'en',
  default_template TEXT NOT NULL DEFAULT 'template-a',
  default_vat_rate NUMERIC NOT NULL DEFAULT 0,
  default_currency TEXT NOT NULL DEFAULT 'SAR',
  default_weight_unit TEXT NOT NULL DEFAULT 'MT',
  default_packing_unit TEXT NOT NULL DEFAULT 'Bags',
  default_incoterm TEXT,           -- nullable
  default_payment_terms TEXT,      -- nullable
  default_delivery_terms TEXT,     -- nullable
  default_prepared_by TEXT,        -- nullable
  show_signature BOOLEAN NOT NULL DEFAULT TRUE,
  show_stamp BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_company_doc_defaults UNIQUE (company_id)
);

-- company_config_lists (lines 94-108)
CREATE TABLE IF NOT EXISTS company_config_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL,
  item_value TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_company_list_item UNIQUE (company_id, list_name, item_value)
);
```

## Mock Strategy

The global Supabase mock in `tests/setup.ts` provides a chainable API mock. For tests needing controlled return values, we use `vi.mocked(getSupabase).mockReturnValueOnce()` to provide per-test mock instances. The `buildSupabaseMock` pattern was replaced with inline mock construction to keep each test self-contained and avoid shared state.

Key pattern for upsert tests:
- Single `vi.fn()` mock for `single()` with chained `mockResolvedValueOnce()` calls
- Same `singleMock` shared between the `.select().eq().single()` and `.update().eq().select().single()` paths

## Test Results

```
✓ tests/lib/services/settings.test.ts (19 tests) 136ms
✓ Full suite: 25 test files, 314 tests — all passing
```

## Commit

```
96a1242 test: add DocumentDefaults & ConfigListItem tests for Task 5
```
