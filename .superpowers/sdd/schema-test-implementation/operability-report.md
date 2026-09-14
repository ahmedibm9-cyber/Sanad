# SANAD Operability & Deployment Readiness Report

**Date:** 2026-09-11
**Scope:** `D:\SANAD\app` — Observability, operability, and deployment readiness review

---

## 1. Logging (`src/lib/logger.ts`)

### Structure: ✅ Good

- **Log levels defined:** `DEBUG(0)`, `INFO(1)`, `WARN(2)`, `ERROR(3)`, `FATAL(4)`
- **Structured format:** Each log entry includes `timestamp` (ISO 8601), `level`, `prefix`, `message`, and optional `data` + `context` fields.
- **Child loggers:** Supported via `child(context)` — allows context propagation (userId, companyId, entityType, entityId).
- **Pre-configured loggers:** `appLogger`, `dbLogger`, `apiLogger`, `storageLogger`, `authLogger`, `auditLogger`, plus factory functions `createEntityLogger()` and `createOperationLogger()`.
- **Remote telemetry:** Implemented via `sendToRemote()` — sends ERROR/WARN+ logs to configurable `VITE_TELEMETRY_URL` endpoint (fire-and-forget with `keepalive: true`).

### Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **WARNING** | `enableRemote` defaults to `false` — remote telemetry is never active unless explicitly configured via `configureLogger()`. No call to `configureLogger()` found in `main.tsx` or `App.tsx`. Production will have zero remote error reporting. | `logger.ts:35`, `main.tsx` |
| **WARNING** | PII leakage: `authLogger.info('Attempting sign in', { email: credentials.email })` logs user email in plaintext. Also logs `userId` after successful auth. If remote telemetry is enabled, this PII is sent over the network. | `auth.ts:60,86,107,146` |
| **INFO** | `logRequest()` logs `userId` and `companyId` — acceptable for audit, but consider redacting `companyId` in non-audit contexts. | `logger.ts:242-249` |
| **INFO** | No log rotation or size limits. Console-only in browser is fine, but if remote logging is ever enabled, rate limiting should be added. | `logger.ts:163-188` |

---

## 2. Error Handling

### ErrorBoundary (`src/components/common/ErrorBoundary.tsx`): ✅ Good

- Wraps entire `<Routes>` in `App.tsx` — catches all unhandled React render errors.
- Logs via `appLogger.error()` in `componentDidCatch`.
- Hides error details in production (`process.env.NODE_ENV !== 'production'`).
- Provides "Try Again" and "Reload Page" recovery actions.
- Bilingual fallback UI (English + Arabic).

### Error Classes (`src/lib/errors.ts`): ✅ Good

- **Typed hierarchy:** `AppError` → `ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `StorageError`, `DatabaseError`, `LicensingError`.
- **Operational vs programming errors:** `isOperational` flag distinguishes expected errors from bugs.
- **Supabase error mapping:** `handleSupabaseError()` converts Postgres error codes (`23505`, `23503`, `42501`, `PGRST116`) to typed AppErrors.
- **Production-safe responses:** `formatErrorResponse()` returns generic "An unexpected error occurred" in production, full message in development.

### Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **WARNING** | `ErrorBoundary` only catches render-phase errors. Errors in `useEffect`, event handlers, and async code are NOT caught by React error boundaries. No global `window.onerror` or `unhandledrejection` handler is registered. | `App.tsx` |
| **WARNING** | `DatabaseError` constructor stores `query` in `details` — if SQL queries contain sensitive data, this could leak through `formatErrorResponse()` in development mode. | `errors.ts:107-110` |
| **INFO** | `logError()` delegates to `appLogger.error()` — consistent with the logging system. | `errors.ts:204-206` |

---

## 3. Health Checks

### Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **BLOCKER** | No health check endpoint exists. No `/health`, `/api/health`, or `/status` route. Vercel and load balancers typically probe a health endpoint to determine deployment readiness. Without one, Vercel will rely on successful build output, but any runtime failure (e.g., Supabase misconfiguration) will not be detectable without user-facing errors. | N/A |
| **BLOCKER** | No status page or monitoring dashboard. No integration with any uptime monitoring service (e.g., UptimeRobot, BetterStack). | N/A |

---

## 4. Deployment Config (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

### Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **WARNING** | SPA rewrite only. No `headers` configured — no security headers (CSP, HSTS, X-Frame-Options) for production. The `vite.config.ts` custom plugin sets headers for the **dev server only** (`configureServer`), not for production builds. | `vercel.json`, `vite.config.ts:8-18` |
| **WARNING** | No `Cache-Control` headers for static assets (`/assets/*`). Vite's default output uses hashed filenames which are safe to cache, but explicit long-lived caching headers would improve performance. | `vercel.json` |
| **WARNING** | No `functions` config — Edge Functions (e.g., `r2-proxy`) will use Vercel's default runtime. No explicit memory/time limits set. | `vercel.json` |
| **INFO** | Rewrite correctly excludes `/assets/` from SPA fallback — static assets served directly. | `vercel.json:2` |

---

## 5. Environment Variables (`src/lib/env.ts`)

### Structure: ✅ Good

- **Type-safe:** Both `ClientEnvironment` and `ServerEnvironment` interfaces define all vars.
- **Validation:** `validateRequired()` throws on missing required vars; `validateUrl()` checks URL format.
- **Lazy initialization:** `_clientEnv` / `_serverEnv` cached after first validation.
- **Documentation:** `.env.example` (66 lines) documents every variable with comments and sections.
- **Security:** Server-only vars (`SUPABASE_SERVICE_ROLE_KEY`, `R2_SECRET_ACCESS_KEY`) use `process.env` (not `import.meta.env`), preventing browser bundling.

### Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **WARNING** | `.env.local` contains real Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and is present in the workspace. While `.gitignore` covers it (`app/.gitignore:3` and root `.gitignore:4`), the anon key is a public-by-design JWT — this is expected behavior, not a leak. However, `SUPABASE_SERVICE_ROLE_KEY` is empty in `.env.local`, meaning R2/storage operations requiring server-side auth will fail at runtime. | `.env.local` |
| **WARNING** | `env` object exposes `get r2AccessKeyId()` and `get r2SecretAccessKey()` as client-side getters (`env.ts:117-118`). These read from `process.env` which is server-only, but the TypeScript types make them appear available to client code. A developer could accidentally call `env.r2AccessKeyId` in a browser context without a compile error (since `process.env` won't exist at build time for Vite client bundles). | `env.ts:116-118` |
| **INFO** | `VITE_TELEMETRY_URL` is referenced in `logger.ts:167` but NOT listed in `.env.example`. If remote telemetry is intended, it should be documented. | `logger.ts:167`, `.env.example` |

---

## 6. Build Verification

**Result:** ✅ Build succeeds in ~12.4 seconds.

### Output Summary

| Asset | Size | Gzip |
|-------|------|------|
| `index-DPIlSiAU.js` (main bundle) | **2,052.46 KB** | **575.39 KB** |
| `r2-BMx06xO6.js` | 200.72 KB | 65.68 KB |
| `index.es-DrjMbCKs.js` | 150.81 KB | 51.59 KB |
| `purify.es-DDpmou9H.js` | 29.05 KB | 11.18 KB |
| `index.browser-D6Z2QBa3.js` | 5.25 KB | 2.17 KB |
| CSS (`index-Cq5m03cg.css`) | 52.78 KB | 8.79 KB |
| 7 template chunks | ~0.33 KB each | ~0.25 KB each |

### Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **BLOCKER** | Main bundle is **2,052 KB** (575 KB gzipped) — exceeds the 500 KB warning threshold by 4x. This will cause slow initial page loads, especially on mobile networks in the MENA region (primary market for Arabic RTL app). Vite's own warning: "Some chunks are larger than 500 kB after minification." | Build output |
| **WARNING** | Three dynamic import warnings — `r2Client.ts`, `supabase.ts`, and `r2.ts` are dynamically imported by some files but statically imported by others, defeating code-splitting. | Build output |
| **WARNING** | Only `DocumentPreviewPage` uses `React.lazy()` (7 template components). All 19 page components are eagerly imported in `App.tsx` — no route-level code splitting. | `App.tsx:1-24` |

---

## 7. Performance

### Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **BLOCKER** | **No route-level lazy loading.** All 19 pages are statically imported in `App.tsx`. Every page's code is loaded upfront on initial visit, even if the user only visits `/dashboard`. Combined with the 2 MB main bundle, this means the entire application is downloaded before the first meaningful paint. | `App.tsx:1-24` |
| **WARNING** | `backupScheduler.start()` is called at module load time in `main.tsx:12`. This runs immediately on page load regardless of whether the user is authenticated or on the login page. If the scheduler performs network requests, it will fire unauthorized requests on `/login`. | `main.tsx:12` |
| **WARNING** | No `loading.tsx` or route-level `Suspense` boundaries. When lazy loading is eventually added, there's no fallback UI defined at the router level. | `App.tsx` |
| **INFO** | Supabase client is lazily instantiated via `getSupabase()` singleton pattern — no duplicate client creation. | `supabase.ts` |

---

## 8. TypeScript Configuration

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

### Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **INFO** | `strict: true` is enabled — includes `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`, `alwaysStrict`. This is good. | `tsconfig.json:14` |
| **INFO** | `noUnusedLocals` and `noUnusedParameters` are both `false` — dead code won't cause build failures. Consider enabling for cleaner code, but not critical. | `tsconfig.json:15-16` |
| **INFO** | `noFallthroughCasesInSwitch: true` — prevents silent fallthrough bugs in switch statements. | `tsconfig.json:17` |

---

## Summary

| Severity | Count | Items |
|----------|-------|-------|
| **BLOCKER** | 3 | No health endpoint; 2 MB main bundle; No route-level lazy loading |
| **WARNING** | 8 | Remote telemetry disabled by default; PII in auth logs; No global error handler; No security headers in production; No cache headers; Empty service role key; env.ts exposes server vars to client; Dynamic import warnings; Backup scheduler runs on load; No route Suspense |
| **INFO** | 6 | Logger structure; Error hierarchy; .env.example docs; TS strict mode; Supabase singleton; VITE_TELEMETRY_URL undocumented |

---

## Priority Recommendations

### Immediate (BLOCKERS)

1. **Add route-level `React.lazy()` + `Suspense` in `App.tsx`** — This alone will split the 2 MB bundle into ~19 smaller chunks, dramatically improving initial load time.

2. **Add a `/health` endpoint** — Even a static JSON response (`{"status":"ok","version":"..."}`) in a Supabase Edge Function or a Vercel serverless function.

3. **Set `build.rollupOptions.output.manualChunks`** in `vite.config.ts` to split vendor libraries (Supabase, AWS SDK, React, etc.) into separate cached chunks.

### Before Production

4. **Enable remote telemetry** — Call `configureLogger({ enableRemote: true })` in production builds and set `VITE_TELEMETRY_URL`.

5. **Add security headers to `vercel.json`** — At minimum: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`.

6. **Add global `unhandledrejection` + `window.onerror` handlers** in `main.tsx` to catch async errors outside React.

7. **Scrub PII from auth logs** — Replace `{ email: credentials.email }` with `{ email: '***' }` or a hashed version.

8. **Move `backupScheduler.start()` behind an auth check** — Only start after successful login, not at module load.

9. **Populate `SUPABASE_SERVICE_ROLE_KEY`** in `.env.local` — currently empty, will cause runtime failures for R2/storage operations.
