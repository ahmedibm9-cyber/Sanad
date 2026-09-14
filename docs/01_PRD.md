# SANAD — Product Requirements Document

## 1. Product objective

SANAD centralizes the preparation, tracking and storage of external export/shipping operations and their documents. A user should be able to create a Task or Project, capture the operation data once, generate the required documents, attach external files, follow status and issues, and later search or audit the operation without re-entering the same information.

## 2. Primary users

### Admin
Owns the deployment, companies, users, permissions, settings, Factory Code updates, logs, Trash, backups and licensing administration.

### User
Operational staff member. Access is configured per company using granular permissions.

### Viewer
Read/search oriented role. May download if allowed, add a Note and submit a Report Issue, but cannot change underlying business records.

## 3. Organizations / companies

- One SANAD deployment can contain multiple companies/workspaces.
- Company-owned data is strictly isolated.
- A person may belong to multiple companies with different roles/permissions.
- Only the Factory Code master dataset is shared across companies.

### Acceptance
- A record created under Company A never appears in Company B unless independently recreated there.
- User A can be Editor/User in one company and Viewer in another.
- Admin can see all companies.

## 4. Work objects

SANAD contains:
- To-do
- Task
- Project

### To-do
Private personal reminder with exactly:
- Title
- Description
- Due Date
- Due Time
- Priority
- Done/Not Done
- Voice Input

### Task
A small work operation with the same major functional capabilities as a Project.

### Project
A larger export operation representing exactly one shipment and one company. It can contain multiple materials.

### Task → Project
The same record is converted in place. No duplicate Task is left behind.

## 5. Task/Project statuses

Exactly:
- In Progress
- Cancelled
- Completed
- Archived

Filters must support selecting multiple statuses using a checklist dropdown.

Archived Projects appear in a collapsible section at the bottom.

Projects can be pinned.

## 6. Project startup data

Normal work should not begin on an empty operation.

At minimum require:
- Name
- Company
- Customer
- One or more materials
- Quantity per material

Additional operational fields are defined in specialist specs and may be required based on document type.

## 7. Shared Project Data Layer

The Task/Project stores reusable data shared across generated documents.

When the first document introduces reusable data, store that value in Shared Project Data.

When a later document changes a shared value:

1. Detect the conflict.
2. Ask whether to update Shared Project Data.
3. If confirmed, show affected existing documents in a checklist.
4. Ask which existing documents should be synchronized.
5. Update selected documents in place.
6. Keep the same document number/reference.
7. Record old/new values in the Audit Log.

There must be only one visible current version of each document.

## 8. Documents

Four top-level generation actions:

### Invoice action dropdown
- QUOT — Quotation
- PINV — Proforma Invoice
- TINV — Tax Invoice
- CINV — Commercial Invoice

Quotation has a different field model from invoices, even though it is launched from Invoice.

### Other actions
- PKL — Packing List
- DN — Delivery Note
- BL — Bill of Lading

### Document number
- Creation date is stored automatically.
- Number/reference is entered by User/Admin.
- No forced serial is generated.
- Number must be unique within the same company.
- The number can be edited by an authorized user, subject to uniqueness.

## 9. Document languages

Preferred output:
- Separate Arabic document
- Separate English document

UI:
- Arabic RTL
- English LTR

## 10. Document templates

Provide two minimal professional template families.

A company chooses a default template in Settings.

Templates across QUOT/PINV/TINV/CINV/PKL/DN/BL should look like one coherent visual system.

## 11. PDF

Requirements:
- Real searchable/selectable text.
- Crisp table borders.
- A4 print quality.
- No whole-page screenshot/raster PDF.
- Preview should closely match print and downloaded PDF.
- Direct Print and PDF Download.

## 12. Tax behavior

VAT rates configurable in Company Settings.

Initial defaults:
- 0%
- 15%

Default VAT = 0%.

Confirmed SANAD behavior:
- 0% → no tax QR.
- 15% → add the configured Saudi/ZATCA QR behavior automatically to Tax Invoice.

Legal compliance details must be isolated in the Tax Invoice implementation and reviewed against current ZATCA requirements before production use.

## 13. Material library

Per-company material data:
- Material Name
- Grade
- Manufacturer
- Origin
- HS Code
- Default Packing
- Last Selling Price
- TDS
- MSDS
- COA

Material reference files are stored once, not copied into every Project.

### Last Selling Price
When a material is used in a later Task/Project, suggest the most recently saved selling price. User can override it.

## 14. Project materials

A Project:
- Has one shipment.
- Can have many materials.
- Each material can have its own quantity, price and packing.

## 15. Notes and issues

On whole Task/Project:
- Note
- Report Issue

Report Issue:
- Open
- Under Review
- Resolved
- Rejected

Severity:
- Low
- Medium
- High
- Critical

Viewer can create them without editing operational data.

## 16. Factory Code

Shared global master dataset.

Capabilities:
- Broad search across fields.
- Filters based on real source columns.
- Export filtered result to Excel.
- Export full dataset to Excel.
- Admin upload of a new source version.
- Smart non-destructive update:
  - add new records
  - update changed records
  - keep unchanged records
  - never delete historical records because a newer source omitted them

No row-by-row edit mode.

## 17. Audit

Track:
- create
- view
- edit
- delete-to-trash
- restore
- download
- PDF
- export
- archive/reopen
- permission changes
- Factory Code update
- backup/restore
- important settings changes

For edits, store before and after.

Do not log every search query.

## 18. Trash

All normal deleted business records go to Trash.

Authorized users can restore.

Hard deletion must be treated as an exceptional admin maintenance action, not normal workflow.

## 19. Notifications

In-app from V1.

Categories include:
- assigned task
- due soon
- overdue
- project status
- archive/reopen
- Report Issue activity
- mention
- document created/edited/deleted/restored
- attachment changes
- permissions
- Factory Code update
- backup success/failure
- personal To-do reminder

Categories configurable.

## 20. Reports

Initial:
- Projects by Status
- Projects by Date
- Projects by Company
- Projects by Customer
- Documents Register
- Tasks
- Overdue Tasks
- User Activity
- Customer Export History
- Material Export History
- Audit Report

Each supports PDF and Excel export.

## 21. Backup

- Manual
- Automatic
- Offline
- Online

Supabase = primary relational data.
Cloudflare R2 = object storage and online backup artifacts.

Default automatic schedule: daily, configurable.

## 22. Licensing

Infrastructure exists in V1.
Validation is online against a product-owner licensing server.

Detailed licensing policy in specialist spec.

## 23. Out of scope

- WhatsApp
- CRM
- accounting
- inventory
- procurement
- internal sales workflow
- SaaS multi-client hosting
- spreadsheet-style Factory Code editing

## 24. Product-level Definition of Done

SANAD beta is usable only when:
- Login/auth works reliably.
- Company isolation works.
- Permissions work per company.
- Task/Project creation works.
- Shared Data conflict flow works.
- All required document types can be generated.
- PDFs are true digital PDFs.
- Files store in R2.
- Audit before/after works.
- Trash/restore works.
- Factory Code import/search/export works.
- Backup path works.
- Licensing verification path exists.
