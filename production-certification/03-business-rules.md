# Business Rules

## Executed Evidence

- `tests/lib/services/sharedData.test.ts`: 7 passing tests, including project/document audit evidence and rollback failure behavior.
- `tests/lib/services/workItem.test.ts`: 8 passing tests.
- `tests/lib/services/document.test.ts`: 12 passing tests.

## Unverified Gates

Customer/configuration precedence, last-selling-price history, task-to-project conversion, direct persistence of shared-data choices, database atomicity, stale-write concurrency, double-submit, financial cross-layer arithmetic, and timezone behavior require a running database and browser/API workflows. No local Supabase stack or staging environment was available.
