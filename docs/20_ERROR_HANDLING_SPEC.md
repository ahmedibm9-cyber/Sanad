# SANAD — Error Handling Specification

## Principles

- Never fail silently.
- Never lose user-entered data unnecessarily.
- Never expose stack traces/secrets to end user.
- Give actionable messages.

## Form save failure

- keep form contents
- show failure
- allow retry
- avoid duplicate create on retry

## Shared sync failure

Use transaction.

If propagation fails:
- roll back affected transaction where possible
- do not leave half of selected documents synchronized
- inform user

## PDF failure

- keep document saved
- show render failure
- allow retry
- log technical details server-side

## R2 upload failure

- do not create a successful attachment record pointing to missing object
- retry or rollback metadata

## Factory import failure

- preserve existing dataset
- mark import failed
- never partially delete
- if batch merge cannot be atomic, use staging table and commit only after validation

## Backup failure

- current app remains usable
- notify authorized user
- log

## License server unavailable

Follow licensing grace policy.
Never delete data.

## Auth/session expiry

- redirect to login
- preserve safe unsaved draft locally only where appropriate
- never leak prior user's cached company data

## Permission denied

Clear message:
- operation not allowed
- no sensitive details about inaccessible record
