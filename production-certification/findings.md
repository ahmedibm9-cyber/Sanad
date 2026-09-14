# Findings

All findings remain recorded after remediation.

ID: CERT-001
Area: Tooling / CI
Severity: P1
Reproduction: Run `npm run lint` in `app` after `npm ci`.
Expected: The configured lint gate executes successfully.
Actual: `'eslint' is not recognized as an internal or external command`.
Root Cause: `package.json` defines an ESLint script but does not declare ESLint.
Fix: Added the ESLint 10 flat-config toolchain and fixed the six lint errors it surfaced.
Files Changed: `app/package.json`, `app/package-lock.json`, `app/eslint.config.js`, and six source files.
Test Added: Existing local lint gate.
Retest Result: `npm run lint` exits successfully with 59 advisory warnings and no errors.
Status: VERIFIED

ID: CERT-002
Area: Dependency security
Severity: P0
Reproduction: Run `npm audit --json` in `app`.
Expected: No deployed Critical or High dependency vulnerability remains without documented mitigation.
Actual: 1 Critical (`vitest`), 2 High (`vite`, `xlsx`), and 5 Moderate vulnerabilities.
Root Cause: Outdated direct dependencies; `xlsx` has no npm-provided patched version.
Fix: Replaced `xlsx` with `@e965/xlsx@0.20.3`, upgraded Vite, Plugin React, and Vitest, and added the V8 coverage provider.
Files Changed: `app/package.json`, `app/package-lock.json`, `app/src/lib/excelExport.ts`, and `app/src/lib/services/factoryCode.ts`.
Test Added: `app/tests/lib/services/factoryCode.test.ts` verifies Arabic labels and leading-zero Factory Codes through XLSX parsing.
Retest Result: `npm audit --json` and `npm audit --omit=dev --json` report 0 Critical, 0 High, and 2 Moderate React Router findings.
Status: VERIFIED

ID: CERT-003
Area: Test integrity
Severity: P1
Reproduction: Run `npm test`.
Expected: Passing tests produce no unhandled runtime errors.
Actual: Four licensing tests emit jsdom `HTMLCanvasElement.prototype.getContext` not-implemented errors while passing.
Root Cause: The test environment lacks a canvas implementation or explicit mock for the fingerprinting path.
Fix: Added deterministic canvas APIs to the shared Vitest setup.
Files Changed: `app/tests/setup.ts`.
Test Added: Existing licensing suite exercises the fingerprint path.
Retest Result: `npm test` passed: 27 files, 316 tests; no canvas not-implemented errors.
Status: VERIFIED

ID: CERT-004
Area: Deployment / CI
Severity: P1
Reproduction: Baseline repository inventory.
Expected: Repository-controlled CI release gate runs clean install, typecheck, lint, tests, build, and critical security checks.
Actual: No CI workflow was found.
Root Cause: CI has not been implemented in the repository.
Fix: Added a GitHub Actions workflow for clean install, typecheck, lint, coverage tests, build, High/Critical audit enforcement, and targeted bundle credential scanning.
Files Changed: `.github/workflows/ci.yml`.
Test Added: The workflow runs existing local gates.
Retest Result: All equivalent local commands pass; the workflow has not run on a remote GitHub runner. Supabase migration replay is not yet configured.
Status: OPEN

ID: CERT-005
Area: Authentication / prototype residue
Severity: P0
Reproduction: Open the top-bar user menu and select a hard-coded user.
Expected: A browser user cannot change application identity or role without authenticating.
Actual: The menu exposed four hard-coded identities and called `setCurrentUser`, changing client identity and role state.
Root Cause: Prototype user-switcher remained in the production top bar and AppContext exposed a mutable user setter.
Fix: Removed the hard-coded user list and public user setter; the menu now displays authenticated account information only.
Files Changed: `app/src/components/layout/TopBar.tsx`, `app/src/contexts/AppContext.tsx`.
Test Added: Existing full test suite and production build.
Retest Result: `npm test` passed: 316 tests. `npm run typecheck` and `npm run build` passed.
Status: VERIFIED

ID: CERT-006
Area: Browser E2E / staging safety
Severity: P1
Reproduction: Inspect `app/playwright.config.ts`, `app/e2e/global-setup.ts`, and `app/e2e/fixtures/auth.ts`.
Expected: Browser tests require an explicit isolated staging URL and injected disposable test credentials.
Actual: The default configuration targets a deployed Vercel URL and falls back to hard-coded credentials. The suite includes stateful application journeys, so it was not executed against that endpoint.
Root Cause: The prototype E2E harness has no staging environment contract or secret-backed test identity setup.
Fix: Removed the production URL and credential fallbacks. Stateful E2E runs now require `E2E_STAGING_URL`, `E2E_TEST_EMAIL`, and `E2E_TEST_PASSWORD`.
Files Changed: `app/playwright.config.ts`, `app/e2e/environment.ts`, `app/e2e/global-setup.ts`, `app/e2e/fixtures/auth.ts`, `app/.env.example`, and `app/package.json`.
Test Added: The explicit `npm run test:e2e` command.
Retest Result: Configuration can be listed with explicit non-production placeholder variables. Full execution remains BLOCKED_EXTERNAL until an isolated staging URL and disposable identities are available.
Status: BLOCKED_EXTERNAL

ID: CERT-007
Area: Database authorization / tenant integrity
Severity: P0
Reproduction: Read `public.exec_transaction(jsonb)` through the database catalog and inspect its grants.
Expected: Untrusted users cannot invoke a generic privileged mutation endpoint or bypass RLS.
Actual: `public.exec_transaction(jsonb)` is `SECURITY DEFINER`, has no fixed `search_path`, accepts arbitrary table names and insert/update/delete operations, and is executable by `PUBLIC`, `anon`, and `authenticated`.
Root Cause: A generic transaction executor was deployed in the exposed `public` schema without explicit grant revocation. The live definition also lacked an authorization check and fixed `search_path`; the repository's `016_transaction_rpc.sql` differs from the live definition, indicating migration drift.
Fix: Revoked `EXECUTE` from `PUBLIC`, `anon`, and `authenticated` under explicit approval. Full replacement with narrow authorized RPCs remains pending.
Files Changed: `supabase/migrations/20260913195414_revoke_public_exec_transaction.sql`.
Test Added: Direct database privilege query.
Retest Result: `anon_can_execute=false`, `authenticated_can_execute=false`, and the public-execution advisor no longer lists `exec_transaction`. The last 24 hours of logs contain no `exec_transaction` match; this does not prove earlier non-exploitation.
Status: VERIFIED

ID: CERT-008
Area: Authentication / privilege escalation
Severity: P0
Reproduction: Inspect `public.handle_new_user()` through the database catalog.
Expected: A user-controlled signup payload cannot grant system-administrator privileges.
Actual: The `SECURITY DEFINER` trigger sets `public.users.is_system_admin` from `NEW.raw_user_meta_data->>'is_system_admin'`, which is user-controlled Supabase Auth metadata.
Root Cause: Authorization state is derived from mutable user metadata instead of a trusted administrative workflow.
Fix: Removed the metadata-derived assignment, set a fixed search path, and revoked `PUBLIC`, `anon`, and `authenticated` execution under explicit approval. Existing accounts were not changed.
Files Changed: `supabase/migrations/20260913215706_harden_new_user_trigger.sql`.
Test Added: Direct database definition and privilege query.
Retest Result: The live function has `search_path=pg_catalog`, sets `is_system_admin` to `false`, and reports `anon_can_execute=false` and `authenticated_can_execute=false`. Historical administrator-account impact remains unverified.
Status: VERIFIED

ID: CERT-009
Area: Database function exposure
Severity: P1
Reproduction: Inspect `public.rls_auto_enable()` grants and the `ensure_rls` event trigger.
Expected: The event-trigger helper is not directly callable through the Data API.
Actual: The `SECURITY DEFINER` event-trigger function was executable by `PUBLIC`, `anon`, and `authenticated` through RPC.
Root Cause: The function's trigger-only use did not have explicit execution revocations.
Fix: Revoked `EXECUTE` from `PUBLIC`, `anon`, and `authenticated` under explicit approval.
Files Changed: `supabase/migrations/20260913224256_revoke_public_rls_auto_enable.sql`.
Test Added: Direct database privilege and event-trigger-state query.
Retest Result: `anon_can_execute=false`, `authenticated_can_execute=false`, and `ensure_rls` remains enabled. The public-execution advisor no longer lists this function.
Status: VERIFIED

ID: CERT-010
Area: Authentication / privileged-account review
Severity: P1
Reproduction: Count `public.users.is_system_admin=true` after the signup-trigger containment.
Expected: Existing system-administrator assignments have documented, authorized provenance.
Actual: Two existing system-administrator accounts remain, but their creation path has not been audited.
Root Cause: The prior mutable-metadata privilege path existed without a historical account review process.
Fix: Pending a privacy-conscious administrator provenance review and an approved server-side administrator provisioning workflow.
Files Changed: None.
Test Added: Read-only aggregate account count query.
Retest Result: `system_admin_count=2` across 54 users; individual account provenance was not inspected.
Status: OPEN

ID: CERT-011
Area: Database authorization / exposed RLS helpers
Severity: P1
Reproduction: Inspect grants and API exposure for `public.user_has_company_access(uuid, uuid)` and `public.user_is_company_admin(uuid, uuid)`.
Expected: RLS helper functions are not directly callable through public RPC endpoints.
Actual: Both `SECURITY DEFINER` helpers remain executable by `anon` and `authenticated`, exposing membership and administrator relationship checks through RPC.
Root Cause: The helpers were created in the exposed `public` schema to bypass RLS recursion and are referenced by 33 policies.
Fix: Set `search_path=pg_catalog` and fully qualified the membership table under explicit approval. Moving the helpers to a private schema and updating every dependent policy is pending isolated staging validation.
Files Changed: `supabase/migrations/20260914000024_harden_membership_rls_helpers.sql`.
Test Added: Direct database definition, privilege, dependency, and active-membership behavior queries.
Retest Result: Both helpers retain their grants, signatures, `SECURITY DEFINER` behavior, and all 33 policy dependencies; both have `search_path=pg_catalog` and return `true` for active sample membership/admin rows. Direct RPC exposure remains.
Status: OPEN

ID: CERT-012
Area: Authentication / password protection
Severity: P1
Reproduction: Run Supabase security advisors.
Expected: Compromised passwords are rejected during authentication flows.
Actual: Supabase leaked-password protection is disabled.
Root Cause: Auth dashboard security setting is not enabled.
Fix: Pending an authorized Supabase dashboard configuration change.
Files Changed: None.
Test Added: Supabase security advisor query.
Retest Result: Advisor continues to report `auth_leaked_password_protection`.
Status: BLOCKED_EXTERNAL
