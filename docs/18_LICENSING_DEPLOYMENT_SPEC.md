# SANAD — Licensing & Deployment Specification

## Deployment model

Self-hosted per client.

Each client pays for/controls their own:
- deployment
- Supabase
- R2
- infrastructure

Vendor supplies SANAD software and license.

## License model

Online verification from V1 infrastructure.

SANAD application sends HTTPS request to vendor-controlled license server.

## Verification request — implementation default

May include:
- license key
- installation/deployment ID
- product version
- non-sensitive instance fingerprint

Do not send business/customer/document data to licensing server.

## Verification response — implementation default

- valid boolean
- expiry
- plan/features if used later
- next verification time
- message/code
- signed response or server-authenticated result

## Security

A self-hosted client controlling source/runtime can theoretically tamper with license checks. Licensing is deterrence/control, not mathematically unbreakable DRM.

Improve resilience by:
- server-side verification
- signed license/response data
- minimizing client-only checks
- code signing/build distribution where applicable
- keeping vendor licensing private keys off client deployment

## Failure behavior

OPEN QUESTION:
- grace period
- offline tolerance
- read-only mode vs lockout

Implementation default:
- if previously valid and license server temporarily unavailable, allow a short grace period rather than immediately destroying usability.
- never delete client data because license is invalid.

## Deployment environments

- local development
- staging
- production

Each uses separate credentials/database/storage where possible.

## Production

Require:
- HTTPS
- backups
- secret management
- migrations
- license server reachable according to policy
