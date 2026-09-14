# Incident State: Exposed Account Provisioning Endpoint

Status: mitigated
Severity: P0
Incident lead: OpenCode
Started: 2026-09-14T00:16:06Z

## Observed Facts

- The deployed Supabase Edge Function `create-admin` was active with JWT verification disabled.
- Its retrieved source used the service-role key to create a fixed credential Auth user.
- The production-readiness review found no evidence that the endpoint is required by the deployed application.

## Scope and Impact

- Affected component: public Supabase Edge Function endpoint.
- Potential impact: unauthorized account provisioning and exposure of predictable credential bootstrap behavior.
- No exploitation or data change has been established. Existing administrator provenance remains unreviewed.

## Approved Containment

- User approved replacement of `create-admin` with a JWT-protected retired endpoint.
- No database, account, password, or unrelated production configuration changes are authorized in this containment action.

## Next Verification

- Verified at 2026-09-14T00:16:58Z: deployed version 6 has `verify_jwt=true`; its only behavior is a retired `410` response after JWT validation; unauthenticated HTTP access returns `401`.
- Remaining risk: historical invocation and account impact cannot be assessed from Supabase logs because log queries returned a backend error.
