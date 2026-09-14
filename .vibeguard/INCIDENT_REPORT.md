# Incident Report: Exposed Account Provisioning Endpoint

Status: mitigated
Severity: P0
Started: 2026-09-14T00:16:06Z
Mitigated: 2026-09-14T00:16:58Z

## User Impact

No confirmed misuse or production data change. Before mitigation, an unauthenticated public endpoint could attempt to create a fixed credential Auth user through the service-role API.

## Timeline

1. Readiness review identified active `create-admin` Edge Function with JWT verification disabled.
2. Retrieved deployed source confirmed service-role account provisioning behavior.
3. User explicitly approved containment.
4. Deployed version 6 of `create-admin` with JWT verification enabled and a retired handler; no provisioning or service-role code remains.
5. Verified deployed source, function metadata, and an unauthenticated `401` response.

## Observed Facts

- Only `create-admin` is deployed as an Edge Function; the required R2 proxy is not deployed.
- Supabase log queries failed with a backend error, so historical endpoint use is unverified.
- The wider production-readiness decision remains `not_ready` in `.vibeguard/PRODUCTION_READINESS_REVIEW.md`.

## Follow-up Actions

1. Review Auth and application records for accounts associated with the former bootstrap workflow; rotate predictable credentials and revoke sessions when approved.
2. Remove the retired endpoint after confirming no legitimate dependency exists.
3. Resolve the remaining production-readiness P0/P1 findings before launch, including non-raster PDF, persistent R2 attachments, staging acceptance testing, and RLS helper exposure.

```yaml
incident_response:
  severity: P0
  status: mitigated
  user_impact: No confirmed misuse; prior unauthenticated account-provisioning path contained.
  timeline:
    - Exposed function identified
    - User approved containment
    - Version 6 retired JWT-protected handler deployed
    - Unauthenticated endpoint returned 401
  observed_facts:
    - Former function used service-role account provisioning
    - Current function has verify_jwt=true and no provisioning code
  hypotheses:
    - Historical endpoint invocation is unknown because log access failed
  actions_and_results:
    - Replaced create-admin with retired handler: effective
  approvals:
    - User approved production containment
  recovery_evidence:
    - Deployed source inspection
    - Function metadata verify_jwt=true
    - Unauthenticated HTTP response 401
  communications:
    - Launch remains unsafe until readiness blockers are resolved
  follow_up_actions:
    - Account provenance review and credential/session remediation
    - Full production readiness remediation
  recommended_next_skill: ai-implementation-strategist
```

Status: completed_with_warnings
