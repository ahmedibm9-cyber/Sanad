# 00 — Environment Baseline

## Runtime
- **OS:** Windows (win32) — PowerShell 5.1
- **Node version:** v24.20.0
- **npm version:** 11.19.0
- **TypeScript version:** 5.9.3
- **Vite version:** 5.4.21
- **Vitest version:** 2.1.9
- **Playwright:** 1.63.0

## Repository
- **Current commit:** 83e1b3e (feat: Fulla data-field renderer)
- **Branch:** main
- **Latest 5 commits:**
  - 83e1b3e feat: Fulla data-field renderer — single HTML source for preview/print/PDF
  - 041d873 feat: rewrite 7 Fulla templates with ported rendering functions + dangerouslySetInnerHTML
  - f3d03ab feat: 7 Fulla native document templates, remove legacy templates, fix build errors
  - 2ba55c1 fix: use exact text selectors in E2E error state tests to avoid strict mode violations
  - 5dd4566 chore: remove debug logging from E2E global-setup

## Build Results
| Command | Result | Duration | Notes |
|---------|--------|----------|-------|
| npm install | PASS | 4s | 8 vulnerabilities (5 moderate, 2 high, 1 critical) |
| tsc --noEmit | PASS | — | 0 errors |
| eslint | FAIL | — | ESLint not installed; no config file exists. `lint` script references missing `eslint` binary |
| vitest run | PASS | 21.53s | 24 test files, 157 tests, 0 failures |
| vite build | PASS | 8.57s | Build succeeds. Warnings: chunk >500KB (index-kH8C6t-c.js = 2,038KB), dynamic import conflicts |

## Vulnerability Summary
| Severity | Count | Details |
|----------|-------|---------|
| Critical | 1 | xlsx (SheetJS) — Prototype Pollution, ReDoS. No fix available |
| High | 1 | xlsx (SheetJS) — same package |
| Moderate | 5 | @vitest/mocker, vitest, esbuild, vite, vite-node, react-router, react-router-dom |
| Low | 1 | (from audit summary count) |

## ESLint Status
- **Not installed.** No `.eslintrc*` or `eslint.config.*` found. `eslint` not in devDependencies.
- The `lint` script in package.json references `eslint` but it does not exist.
- **BLOCKED:** Lint check cannot pass until ESLint is installed and configured.

## Build Warnings
1. `index-kH8C6t-c.js` is 2,038KB (gzip 579KB) — exceeds 500KB recommendation
2. Dynamic import conflicts: `env.ts`, `supabase.ts`, `r2Client.ts` are both statically and dynamically imported
3. 7 template files produce very small chunks (~0.5KB each)

## Baseline Status
- [x] Baseline established before any modifications
- **Date:** 2026-09-10T22:31Z
