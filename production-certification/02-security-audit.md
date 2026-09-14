# Security Audit

## Executed Evidence

- Client identity-switcher: fixed and verified as CERT-005.
- R2 boundary review: browser uses `r2Client.ts`, which calls the `r2-proxy` Edge Function with a user JWT. The Edge Function validates membership and company key prefixes.
- Bundle build completed. No secret values were supplied to scan, so an actual secret-content scan can only confirm that no known provided value is present; production secret exposure remains unverified.
- `npm audit --json` found 1 Critical, 2 High, and 5 Moderate vulnerabilities (CERT-002).

## Blocked / Failed

- Direct RLS/IDOR, authenticated permission matrix, signed URL, file upload, security-header, and XSS runtime checks require a deployed staging environment and controlled identities. No staging endpoint or test credentials were provided.
- Dependency release gate fails until CERT-002 is remediated.
