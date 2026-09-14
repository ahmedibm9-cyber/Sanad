# Task 3: Soft Delete (notes.active) Tests — Implementation Report

## Status: DONE

## Changes Made

### 1. `src/lib/services/note.ts` — Type & Method Additions

- **Added `active: boolean`** field to the `Note` interface (line 24).
- **Added `restoreNote` method** (lines 176–210): Sets `active = true` on a soft-deleted note. Checks authorization (author or system admin). Throws `NotFoundError` if note doesn't exist (even soft-deleted notes are fetched via raw select before restore).

### 2. `tests/lib/services/note.test.ts` — 12 Tests Written

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | `Note type includes active field` | `active` exists and is boolean |
| 2 | `Note defaults active to true` | Default value is `true` |
| 3 | `Note can be created with active = false` | Soft-deleted state is representable |
| 4 | `deleteNote sets active = false (soft delete, not hard delete)` | `update({ active: false })` called, no `delete()` call |
| 5 | `getNotes filters by active = true` | Third `.eq()` call uses `'active', true` |
| 6 | `getNotes excludes soft-deleted notes` | Only active notes returned |
| 7 | `restoreNote sets active = true` | `update({ active: true })` called |
| 8 | `restoreNote throws NotFoundError for non-existent note` | Rejects with "Note" in message |
| 9 | `restoreNote throws when user is not author and not admin` | Rejects with "Not authorized" |
| 10 | `deleteNote throws when user is not author and not admin` | Rejects with "Not authorized" |
| 11 | `getNoteById filters by active = true` | Active filter applied |
| 12 | `getNoteById throws NotFoundError for soft-deleted note` | Rejects with "Note" |

## Mock Strategy

Used a **chainable mock builder** (`createChainableMock`) that returns a thenable chain object for all Supabase query-builder methods. Terminal methods (`single`, `maybeSingle`) return `Promise.resolve(finalResult)`. The chain itself is thenable via `.then()` so patterns like `await from().select().eq().order()` resolve correctly.

## Test Results

- **Note tests: 12/12 passing**
- **Full suite: 294 passing, 5 pre-existing failures** (in `settings.test.ts` — unrelated mock structure issues)

## Pre-existing Failures (Not Caused by This Task)

`settings.test.ts` has 5 tests failing with the same `from(...).update is not a function` / `from(...).select(...).eq(...).eq is not a function` pattern. These are broken mocks in the settings test, not regressions.

## Commits

(See git log below)
