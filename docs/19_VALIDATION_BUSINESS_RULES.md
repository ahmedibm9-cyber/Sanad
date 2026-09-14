# SANAD — Validation & Business Rules

## Company

- company name required
- company-owned uniqueness rules scoped to company

## Customer

- name required
- no cross-company auto-sharing

## Material

- material name required
- quantity > 0 when used in Project
- selling price cannot be negative
- VAT cannot be negative

## Task/Project

- company required
- name required
- customer required
- at least one material
- quantity per material required and > 0
- status only one of four confirmed values

## Document

- type required
- company/work item required
- creation date automatic
- document number user-entered before final issuance/export where required
- document number unique within company
- language required
- template required/defaulted

## Shared Data

- compare normalized values
- never silently overwrite conflict
- propagation requires second confirmation
- synchronized document keeps same number

## Tax

- VAT default 0
- configured VAT list
- current product rule: 15 triggers QR in Tax Invoice
- compliance engine must not claim full ZATCA compliance without dedicated verification

## File

- approved MIME/type
- size within configured limit
- metadata required

## Factory Code

- imported header mapping validated
- no deletion from source omission

## Trash

- normal delete = soft delete
- restoration subject to permission and uniqueness conflicts

## Permission

- deny by default
- server/database enforcement

## Backup Restore

- checksum/version validation before restore
