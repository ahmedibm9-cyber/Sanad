# SANAD — Files & Attachments Specification

## Storage

Cloudflare R2.

## File classes

### Company assets
- logo
- stamp
- signature

### Material files
- TDS
- MSDS
- COA

### Work-item attachments
External files such as:
- Certificate of Origin
- government documents
- customer files
- other shipment/project files

### Generated outputs
Optional stored PDF artifacts.

### Factory Code imports
Original Excel source.

### Backups
Backup packages.

## No duplication rule

Material TDS/MSDS/COA remain material files.

When used in ten Projects, do not upload/store ten copies.

## Metadata

Store:
- original name
- MIME type
- bytes
- checksum if useful
- uploader
- upload date
- object key
- category

## Upload rules

- validate allowed type
- size limit configurable/system default
- sanitize display names
- never execute uploaded content
- signed access

## Deletion

Move metadata/reference to Trash where applicable.

Do not immediately purge R2 object if restoration is expected.

Use retention/purge job after explicit hard-delete policy.
