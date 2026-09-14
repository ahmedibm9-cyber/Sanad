# Production Readiness Fixes - Health, Error Handling, Auth-Gated Scheduler

## Summary

Three production readiness findings fixed in the SANAD app.

## Fix 1: Health Endpoint

Created `public/health.json` with static health info:
- `status: "ok"`, `version: "0.1.0"`, `timestamp: "2026-09-11T00:00:00Z"`
- Serves as a simple health check for load balancers/monitoring

## Fix 2: Global Error Handler

Added to `src/main.tsx` after the root render call:
- `unhandledrejection` listener — logs and prevents default (stops console noise)
- `error` listener — logs uncaught errors

## Fix 3: Backup Scheduler Behind Auth

**Before:** `backupScheduler.start()` called at module load in `main.tsx` (unauthenticated).

**After:** Scheduler starts only after successful authentication:
- `src/main.tsx` — removed auto-start and import
- `src/contexts/AuthContext.tsx` — starts scheduler on `SIGNED_IN` event and after `initAuth` finds an existing session; stops on `SIGNED_OUT`

## Verification

- TypeScript: `npx tsc --noEmit` — passed (no errors)
- Tests: `npx vitest run` — 25 test files, 314 tests passed
- Git commit skipped (git not available on PATH)
