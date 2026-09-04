# SANAD — Testing & Acceptance Specification

## 1. Auth
- valid login
- invalid login
- disabled user
- session expiry

## 2. Company isolation
- Company A customer not visible in B
- direct API/DB attempt denied
- same document number allowed in different companies

## 3. Permissions
- User has Edit in A, Viewer in B
- Viewer cannot edit underlying data
- Viewer can Note/Report Issue
- Download permission enforced

## 4. Task/Project
- create with required fields
- multi-material
- convert Task → Project no duplicate
- pin
- status filter multi-select
- archive/reopen permissions

## 5. Shared Data
Scenario:
- PINV qty 50
- TINV proposes qty 48
- choose Document Only
- project remains 50

Second:
- choose Update Project
- select PINV for synchronization
- PINV becomes 48 in place
- same number remains
- audit has 50→48
- no duplicate PINV

## 6. Latest price
- save 1000 SAR/MT
- new Project suggests 1000
- save 1040
- next suggests 1040

## 7. Documents
All types generate Arabic/English.
Duplicate number same company rejected.
Manual number edit works.

## 8. VAT
- default 0
- 0 no QR
- 15 triggers configured QR behavior
- tax calculations accurate

## 9. PDF
- selectable text
- Arabic correct
- no app UI in print
- multipage table
- stamps/signatures
- long data

## 10. Files
- R2 upload
- authorized download
- denied cross-company file
- material file reused without duplication

## 11. Factory Code
- initial import
- new record insert
- changed record update
- missing old record retained
- search 952 across fields
- filtered XLSX
- full XLSX

## 12. Audit
- before/after
- user search
- doc number search
- view/download events

## 13. Trash
- move
- hide from normal list
- restore
- restore uniqueness conflict handled

## 14. Backup
- manual online
- automatic
- offline
- restore dry validation
- restore test environment

## 15. Licensing
- valid
- expired response
- server unavailable behavior
- no business data sent in request

## Definition of Done
Critical tests pass in CI/staging before release.
