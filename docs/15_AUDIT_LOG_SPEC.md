# SANAD — Audit / Activity Log Specification

## Purpose

Answer:
- who did it?
- what changed?
- when?
- in which company?
- on which record/document?
- what was before and after?

## Actions

At least:
- CREATE
- VIEW
- EDIT
- MOVE_TO_TRASH
- RESTORE
- DOWNLOAD
- PDF_GENERATE
- PDF_DOWNLOAD
- EXPORT
- ARCHIVE
- REOPEN
- PERMISSION_CHANGE
- SETTINGS_CHANGE
- FACTORY_IMPORT
- BACKUP
- RESTORE_BACKUP
- TASK_TO_PROJECT

Do not store routine search terms by default.

## Event fields

- timestamp
- actor user
- company
- action
- entity type
- entity ID
- human reference
- before
- after
- metadata
- IP/user agent only if later needed and privacy policy allows

## Search

- user ID
- user name
- document number
- entity reference
- entity type
- action
- date range
- company

## Sensitive fields

Never audit raw passwords, secrets, private keys or auth tokens.

## Shared Data propagation

Record:
- original document edit
- project shared-data update
- each synchronized document

These can share a correlation ID.

## UI

Human-readable summary with expandable structured details.
