# Environment

## Baseline

Recorded before production-code changes on 2026-09-11.

| Item | Evidence |
| --- | --- |
| Runtime | Node.js v24.20.0 |
| Package manager | npm 11.19.0 |
| Framework | React 18.3.1, Vite 5.4.21 at build time, Vitest 2.1.9 |
| Lockfile | `app/package-lock.json` present; `npm ci` succeeded |
| Git commit | BLOCKED: `git` is not installed and the workspace is not a Git repository |
| TypeScript | `npm run typecheck` passed |
| Lint | `npm run lint` failed: package script invokes `eslint`, but ESLint is not installed |
| Tests | `npm test`: 27 files, 316 tests passed; test output includes four jsdom `HTMLCanvasElement.getContext` not-implemented errors from licensing tests |
| Build | `npm run build` passed; Vite reported dynamic-import and 957.69 kB chunk warnings |
| Dependency scan | `npm audit --json`: 1 critical, 2 high, 5 moderate vulnerabilities |

## Inspected Configuration

- `app/package.json`, `app/package-lock.json`, `app/tsconfig.json`, `app/vite.config.ts`, `app/vitest.config.ts`, `app/vercel.json`, `app/.env.example`, `app/.env.local`
- Repository-controlled Supabase migrations `001_initial_schema.sql` through `017_optimistic_locking.sql` and `20260911045352_company_backup_settings_isolation_and_document_list_index.sql`
- Supabase Edge Function: `supabase/functions/r2-proxy`
- No CI workflow, Docker configuration, or deployment pipeline configuration was found by the baseline inventory.
