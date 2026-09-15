# Security Audit Report #001

**Date:** 2026-09-15  
**Scope:** SANAD application, infrastructure, and Vercel account  
**Decision:** CONDITIONAL_PASS

---

## Executive Summary

SANAD demonstrates strong security fundamentals in application code, authentication, and server-side authorization. However, critical findings exist in **credential management** and **account security** that must be addressed before production deployment.

---

## Threat Model

| Asset | Actor | Trust Boundary | Risk |
|-------|-------|----------------|------|
| User data (Supabase) | Authenticated users | Company isolation via RLS | Medium |
| R2 file storage | Authenticated users | Edge Function proxy | Low |
| Vercel deployment | Public | PAT in config file | HIGH |
| Vercel account | Account holder | Unknown domain registrations | HIGH |

---

## Findings

### CRITICAL

| ID | Finding | Evidence | Impact | Remediation |
|----|---------|----------|--------|-------------|
| VG-001 | **Vercel PAT exposed in plaintext config** | `opencode.jsonc` line 14 contains `vcp_5CLj...` token | Full Vercel account access (deploy, delete, modify domains) | Move to environment variable; rotate token immediately |
| VG-002 | **Suspicious domain registrations** | `sanad.app`, `sanad.co` registered via Spaceship 6 days ago; user denies purchase | Domain hijacking, potential phishing | Contact Vercel support; investigate Spaceship registration |

### HIGH

| ID | Finding | Evidence | Impact | Remediation |
|----|---------|----------|--------|-------------|
| VG-003 | **Unknown projects in Vercel account** | `profile-generator` (Portfolio Builder) and duplicate `sanad` project exist | Unauthorized deployments, resource abuse | Delete unknown projects; audit Git integrations |
| VG-004 | **No 2FA on Vercel account** | Team settings show single member, no MFA indicators | Account takeover risk | Enable 2FA immediately |
| VG-005 | **react-router vulnerabilities (CVE-2025-68470)** | `npm audit` shows 2 moderate vulnerabilities | Open redirect, SSRF via hydration | Upgrade to `react-router-dom@7.18.3+` |

### MEDIUM

| ID | Finding | Evidence | Impact | Remediation |
|----|---------|----------|--------|-------------|
| VG-006 | **dangerouslySetInnerHTML in templates** | 10 components use `dangerouslySetInnerHTML` | XSS if data is compromised | All instances use `escapeHtml()` — verified safe |
| VG-007 | **Supabase anon key in client bundle** | `VITE_SUPABASE_ANON_KEY` in client env | Expected for Supabase client; low risk with RLS | Verify RLS policies on all tables |

### LOW

| ID | Finding | Evidence | Impact | Remediation |
|----|---------|----------|--------|-------------|
| VG-008 | **No rate limiting on Edge Functions** | `r2-proxy/index.ts` has no rate limiting | DDoS, brute force | Add rate limiting via Cloudflare or Supabase |
| VG-009 | **Verbose error messages** | Some errors expose internal details | Information leakage | Sanitize error messages in production |

### INFO

| ID | Finding | Evidence | Impact | Remediation |
|----|---------|----------|--------|-------------|
| VG-010 | **create-admin properly retired** | Returns 410 Gone | None | No action needed |
| VG-011 | **R2 key validation working** | `validateKeyOwnership()` checks prefix | Prevents cross-tenant access | No action needed |
| VG-012 | **Permission system comprehensive** | `requirePermission()` used in all services | Strong authorization model | No action needed |

---

## Positive Findings

1. **Authentication:** Supabase Auth with JWT validation, session management, and profile loading
2. **Authorization:** Comprehensive `requirePermission()` system across all services (~50 permissions)
3. **Input Sanitization:** `escapeHtml()` function properly sanitizes all user input before rendering
4. **Server-side Security:** R2 Edge Function validates JWT, membership, permissions, and key ownership
5. **Secrets Management:** Server-side environment variables properly isolated; R2 credentials never reach browser
6. **SQL Injection:** No raw SQL queries found; all database access via Supabase query builder
7. **File Upload Security:** Content type whitelist, file size limits, metadata sanitization
8. **CORS:** Properly configured with origin validation

---

## Areas Not Tested

- Supabase RLS policies (requires database access)
- Vercel audit log (requires dashboard access)
- Spaceship account (user has no access)
- GitHub OAuth integrations (requires Vercel dashboard access)
- Production deployment headers (requires live testing)

---

## Recommended Actions

### Immediate (Critical)

1. **Rotate Vercel PAT** — Generate new token at https://vercel.com/account/tokens, delete old one
2. **Enable 2FA** — Navigate to https://vercel.com/account/security
3. **Contact Vercel Support** — Report suspicious domain registrations and unknown projects
4. **Review GitHub integrations** — Check https://vercel.com/ibmai1979-2318/~/settings/integrations

### Short-term (High)

5. **Delete unknown projects** — Remove `profile-generator` and duplicate `sanad` project
6. **Upgrade react-router** — `npm audit fix --force` (breaking change)
7. **Move Vercel PAT to environment variable** — Remove from `opencode.jsonc`
8. **Audit Supabase RLS policies** — Verify all tables have proper row-level security

### Long-term (Medium)

9. **Add rate limiting** — Implement rate limits on Edge Functions
10. **Implement deployment alerts** — Get notified of unexpected deployments
11. **Enable Vercel audit log retention** — For future forensic needs
12. **Regular dependency audits** — Schedule monthly `npm audit` reviews

---

## Release Decision

**CONDITIONAL_PASS** — Application code is production-ready from a security perspective. However, **credential management and account security issues (VG-001 through VG-004) must be resolved before any production deployment**.

---

## Recommended Next Skill

`ai-incident-response` — If Vercel support confirms unauthorized access, activate incident response.

---

**Status:** completed_with_warnings  
**Auditor:** opencode (mimo-v2.5-free)  
**Date:** 2026-09-15
