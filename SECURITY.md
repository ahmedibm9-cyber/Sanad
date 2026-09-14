# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability in SANAD, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email: [INSERT SECURITY EMAIL]
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment** within 48 hours
- **Assessment** within 1 week
- **Resolution** timeline based on severity

## Security Measures

### Authentication
- Supabase Auth with JWT tokens
- Session persistence across reloads
- Automatic redirect for unauthenticated users

### Authorization
- Row Level Security (RLS) on all database tables
- 81 granular permissions across 14 groups
- Company-level data isolation
- `SECURITY DEFINER` functions for safe RLS checks

### Data Protection
- No secrets or API keys in client code
- Environment variables for configuration
- Soft delete (no hard delete in normal UI)
- Audit trail for all data changes

### API Security
- Supabase RLS policies enforce access control
- Company isolation prevents cross-tenant data access
- Auth token validation on every request

## Best Practices for Contributors

- Never commit secrets, API keys, or credentials
- Use environment variables for configuration
- Follow least-privilege principle for permissions
- Validate all user input
- Use parameterized queries (handled by Supabase client)
- Review RLS policies when adding new tables
