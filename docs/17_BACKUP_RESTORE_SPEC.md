# SANAD — Backup & Restore Specification

## Objectives

Protect both:
- relational data in Supabase
- files in Cloudflare R2

## Backup types

### Manual online
Authorized user triggers backup saved to R2.

### Automatic online
Scheduled.
Default: daily.
Schedule configurable.

### Offline
Authorized user downloads portable backup package.

## Package

Recommended backup manifest:
- schema/version metadata
- exported relational data
- object inventory
- critical settings
- checksums
- timestamp
- deployment ID

Large R2 objects may be included or referenced depending on backup strategy; production design must ensure an actual disaster recovery path for both DB and files.

## Restore

Consequential.

Flow:
1. choose backup
2. validate compatibility/checksum
3. preview metadata
4. confirmation
5. maintenance lock if needed
6. restore
7. integrity checks
8. audit result

## Retention

Configurable.

Implementation default until client confirms:
- keep 7 daily
- keep 4 weekly

This is an assumption, not a confirmed product requirement.

## Failure

Backup failure must:
- not corrupt current data
- mark backup failed
- notify authorized user
- log technical error
