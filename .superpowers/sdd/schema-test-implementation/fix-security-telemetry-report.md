# Security & Telemetry Production Readiness Fixes

## Summary

Three production-readiness findings addressed: security headers, PII scrubbing in auth logs, and remote telemetry activation.

---

## Fix 1: Security Headers in `vercel.json`

**File:** `D:\SANAD\app\vercel.json`

Added a `headers` section that applies to all routes (`/(.*)`):

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |

Existing SPA rewrite rule preserved.

---

## Fix 2: Scrub PII from Auth Logs

**File:** `D:\SANAD\app\src\lib\auth.ts`

Two log calls were leaking user email addresses in plaintext:

- **Line 60** (signIn): `authLogger.info('Attempting sign in', { email: credentials.email })`
- **Line 107** (signUp): `authLogger.info('Attempting sign up', { email: credentials.email })`

Both replaced with a `redactEmail()` helper that truncates to first character + `***@domain` (e.g., `j***@example.com`).

**File:** `D:\SANAD\app\src\lib\logger.ts` — reviewed, no PII logging found. The `sendToRemote` method does not include email fields.

---

## Fix 3: Enable Remote Telemetry in Production

**File:** `D:\SANAD\app\src\main.tsx`

Added conditional logger configuration:

```ts
import { configureLogger } from './lib/logger'

if (import.meta.env.VITE_TELEMETRY_URL) {
  configureLogger({ enableRemote: true })
}
```

Remote telemetry is gated behind the `VITE_TELEMETRY_URL` env var — only activates when the endpoint is configured. The logger already respects `enableRemote` and only sends `error`/`warn` level logs (line 142 of logger.ts).

---

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean — no type errors |
| `npx vitest run` | **314 tests passed** (25 files) |

---

## Files Modified

1. `D:\SANAD\app\vercel.json` — added `headers` array with 5 security headers
2. `D:\SANAD\app\src\lib\auth.ts` — added `redactEmail()` helper, scrubbed 2 log calls
3. `D:\SANAD\app\src\main.tsx` — imported `configureLogger`, added conditional `enableRemote` activation
