# Dependency Upgrade Report

```yaml
dependency_upgrade:
  objective: security
  baseline: "1 Critical, 2 High, and 5 Moderate npm audit findings"
  stages:
    - "Added executable ESLint 10 gate."
    - "Rejected ExcelJS after it added an unpatched Moderate uuid advisory."
    - "Replaced xlsx with @e965/xlsx@0.20.3 after Factory Code fixture verification."
    - "Upgraded Vite 5.4.21, Plugin React 4.7.0, and Vitest 2.1.9 to 8.3.0, 6.1.1, and 4.1.11."
    - "Added Vitest V8 coverage and the core GitHub Actions verification workflow."
  dependency_changes:
    - "xlsx -> @e965/xlsx@0.20.3 (Apache-2.0)"
    - "vite -> 8.3.0"
    - "@vitejs/plugin-react -> 6.1.1"
    - "vitest -> 4.1.11"
    - "@vitest/coverage-v8 -> 4.1.11"
  breaking_changes_addressed:
    - "Replaced __dirname aliases with fileURLToPath URLs for Vite native config loading."
    - "Replaced an invalid dynamic page import in the integration test with static imports."
  security_and_license_findings:
    - "npm audit now reports 0 Critical, 0 High, and 2 Moderate React Router findings."
    - "ExcelJS was rejected because it increased the audit result to 10 findings."
  checks_run:
    - "npm ci"
    - "npm run typecheck"
    - "npm run lint (0 errors, 59 warnings)"
    - "npm test (27 files, 317 tests)"
    - "npm run test:coverage (9.08% statements)"
    - "npm run build"
    - "npm audit --json"
    - "npm audit --omit=dev --json"
  rollback_points:
    - "Restore the prior package manifest and lockfile together, then run npm ci."
    - "Emergency package rollback reintroduces known vulnerabilities and requires a new audit decision."
  deferred_items:
    - "React Router 7 migration for two Moderate advisories."
    - "Lint warning remediation, coverage thresholds, and production bundle size reduction."
    - "Staging-only browser E2E, migration replay, and deeper secret scanning."
  status: completed_with_warnings
```

## Lockfile Resolution Note

The baseline lockfile contained an outdated Vite peer graph that npm could not replace with normal strict resolution. A temporary regenerated lockfile was accepted only after a strict `npm ci` succeeded in an isolated workspace and confirmed the exact Vite, Plugin React, Vitest, and coverage versions above. The committed workspace was then installed with normal `npm ci` successfully.

## Residual Risks

- The selected `@e965/xlsx` package is a third-party SheetJS-compatible publisher and needs ongoing dependency monitoring.
- The GitHub Actions workflow has not yet run remotely and does not include Supabase migration replay.
- The current Playwright configuration must not run against its default deployed URL until M2/M8 establishes disposable staging identities.
