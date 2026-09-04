# SANAD — MASTER PRODUCT SPECIFICATION

**Document:** `MASTER_PRODUCT_SPEC.md`  
**Product:** SANAD  
**Status:** Authoritative Product-Level Specification  
**Primary Source of Truth:** Client discussion summary + decisions explicitly confirmed by the product owner  
**Purpose:** Give coding agents a stable, complete product definition before implementation begins.

---

# 1. Document Authority

This document is the highest-level product specification for SANAD.

A coding agent MUST:

1. Treat confirmed requirements in this file as authoritative.
2. Never remove, simplify, merge away, or silently ignore a confirmed feature.
3. Never invent product behavior that conflicts with this file.
4. Use dedicated lower-level specifications for implementation details when they exist.
5. Treat items marked **OPEN QUESTION** as unresolved, but not as blockers unless implementation is impossible without them.
6. Prefer configurable behavior wherever the specification explicitly calls for configurability.
7. Avoid unnecessary automation. Consequential actions must remain user-controlled and use confirmation flows.
8. Preserve data integrity and company isolation above convenience.
9. Never treat assistant suggestions as core requirements unless they are explicitly marked as confirmed.

---

# 2. Product Name and Brand Direction

## 2.1 Product Name

**SANAD**

## 2.2 Brand Direction

SANAD should feel:

- Elegant
- Minimal
- Trustworthy
- Professional
- Suitable for export and shipping operations
- Suitable for both Arabic and English interfaces
- Serious enough for enterprise/business use
- Clean rather than decorative

The typography and visual identity must work well in:

- Arabic RTL
- English LTR

Detailed branding and UI design will be defined later in the UI/UX specification.

---

# 3. Product Definition

SANAD is a **self-hosted web application for managing external export and shipping operations and their documents**.

SANAD is NOT intended to become a full ERP.

The core product is designed to help companies:

- Manage export Tasks and Projects.
- Store the shared operational data for each export operation.
- Generate export/shipping documents.
- Reuse common data across generated documents.
- Track files and attachments related to each operation.
- Manage personal To-dos.
- Maintain a company-specific customer and material data set.
- Search and export a shared Saudi Factory Code master database.
- Track user actions through a detailed Audit / Activity Log.
- Manage multiple companies/workspaces in one deployment.
- Enforce permissions per user and per company.
- Generate high-quality printable PDF documents.
- Preserve data with Trash, backups, and central persistence.

---

# 4. Explicitly Out of Scope

The initial SANAD product is NOT:

- Accounting software
- Inventory software
- Procurement software
- CRM software
- Sales management software
- Internal-sales workflow software
- A SaaS multi-tenant platform
- A WhatsApp messaging platform
- A full spreadsheet editor for Factory Code data

Future integrations with other systems may be added, but SANAD itself remains focused on **external export/shipping documentation and operation tracking**.

---

# 5. Platform and Deployment

## 5.1 Application Type

SANAD is a **Web App**.

It should work across modern devices and browsers, with laptop/desktop use being the primary expected usage.

Responsive behavior should still support tablets and mobile devices where practical.

## 5.2 Deployment Model

SANAD is **self-hosted per client**.

Each commercial client receives:

- A separate deployment
- A separate database
- A separate object-storage environment
- Their own application configuration

SANAD is NOT planned as SaaS.

## 5.3 Hosting Targets

Preferred deployment platforms:

- Vercel
- Railway

## 5.4 Primary Database

**Supabase PostgreSQL**

The application must use a central database from the very first beta/usable version.

Local-only persistence is not acceptable as the primary source of truth.

## 5.5 Object Storage

**Cloudflare R2**

R2 should store file/object data such as:

- Uploaded attachments
- Material reference files
- Company logos
- Company stamps
- Company signatures
- Generated or archived document files where applicable
- Factory Code source imports
- Backup artifacts

## 5.6 Separation of Structured Data and Files

Structured application data belongs in Supabase/PostgreSQL.

Binary and file-based assets belong in Cloudflare R2.

---

# 6. Licensing Architecture

Licensing infrastructure must exist from the first version.

## 6.1 Licensing Model

SANAD uses **online license verification**.

The application will send verification requests to a licensing server controlled by the product owner.

The licensing infrastructure must be designed so that the application can verify whether a license is valid before or during authorized use.

## 6.2 Future Licensing Details

The following will be defined in a dedicated licensing specification:

- License activation
- License key format
- License expiry
- Grace periods
- Deployment binding
- Installation identity
- Failure behavior
- Renewal
- Offline tolerance
- Server response structure
- Security measures

These details are not blockers for the Master Product definition.

---

# 7. Internationalization

SANAD must support:

- Arabic
- English

## 7.1 UI Direction

Arabic:
- RTL layout
- Arabic-aware spacing/alignment

English:
- LTR layout

The interface must not merely translate labels; layout direction must change correctly.

## 7.2 Generated Document Languages

Documents should support separate versions:

- Arabic version
- English version

Separate Arabic and English documents are preferred over forcing both languages into the same document.

A bilingual option may be supported later where useful, but separate language versions are the preferred professional behavior.

---

# 8. Multi-Company / Workspace Architecture

A SANAD deployment can contain multiple Companies / Workspaces.

Examples:

- Fulla
- GBC
- Kayan
- Other client-created companies

## 8.1 Admin Ownership

The top-level Admin is the owner/controller of the SANAD deployment.

The Admin can:

- Create companies
- Configure companies
- Create users
- Assign users to companies
- Assign different permissions per company
- Access all companies
- Access all system-level administration

## 8.2 Strict Company Data Isolation

Every company has its own independent business data.

The following must NEVER automatically leak or migrate between companies:

- Customers
- Materials
- Documents
- Projects
- Tasks
- To-dos where company-related
- Attachments
- Files
- Prices
- Financial fields
- Notes
- Report Issues
- Settings
- Transactions
- Generated documents
- Any company-owned operational data

If two companies share the same real-world customer, that customer must be entered independently in each company.

There is no automatic cross-company synchronization.

## 8.3 Only Shared Master Dataset

The **Saudi Factory Code Master Database** is the only shared business dataset across companies.

---

# 9. Users, Roles, and Permissions

SANAD uses highly configurable permissions.

A single user may belong to multiple companies with different access levels in each.

Example:

A user may be:
- Editor/User in GBC
- Viewer in Fulla
- No access to Kayan

## 9.1 Admin

Admin has full system access.

Admin can:

- View all companies
- Create companies
- Create users
- Configure user access
- Configure permissions
- Restore archived records
- Restore Trash records
- Access Audit Logs
- Access personal To-dos of another user when necessary
- Configure system settings
- Manage licensing-related administration when applicable

## 9.2 User

The normal working role is called **User**.

User permissions are not fixed.

When Admin creates/configures a User, SANAD must provide a **GitHub-token-style permission checklist**.

Permissions can differ per company.

Possible permissions include, but are not limited to:

- View
- Create
- Edit
- Delete/Move to Trash
- Download
- Export
- Generate PDF
- Create Project
- Edit Project
- Archive Project
- Reopen Project
- Create Task
- Convert Task to Project
- Create documents
- Edit documents
- Upload attachments
- Manage customers
- Manage materials
- Manage users
- Manage company settings
- View activity logs
- Restore Trash items
- Manage Factory Code imports

Permissions considered security-critical must still be configurable, but must be clearly marked as critical in the permissions UI.

## 9.3 Viewer

Viewer is primarily read-only.

Viewer can:

- View authorized data
- Search authorized data
- Download if the Download permission is enabled
- Add a Note to a Task/Project
- Submit a Report Issue on a Task/Project

Viewer cannot directly edit the underlying business data.

Viewer download capability must be configurable per company/user.

---

# 10. Core Work Model

SANAD has three distinct work concepts:

1. **To-do**
2. **Task**
3. **Project**

---

# 11. Personal To-dos

To-dos are personal reminders.

They are built into SANAD so users do not need a separate To-do application for simple personal reminders.

## 11.1 To-do Privacy

Each user normally sees only their own To-dos.

Admin may inspect another user's To-dos when necessary because Admin has full system authority.

However, another user's To-dos must NOT appear by default on the Admin dashboard.

The dashboard should show the logged-in user's own To-dos.

## 11.2 V1 To-do Fields

V1 must include exactly:

- Title
- Description
- Due Date
- Due Time
- Priority
- Done / Not Done
- Voice Input

Do not add extra To-do fields in V1 unless a later specification explicitly changes this.

---

# 12. Tasks and Projects

## 12.1 Concept

A Task and a Project are fundamentally the same style of work object.

The main distinction is scale:

- Task = smaller / quicker work
- Project = larger export operation

Both should expose the same major operational capabilities.

## 12.2 Task to Project Conversion

A Task can be converted directly into a Project.

The conversion must:

- Transform the same work item
- Preserve all existing data
- Preserve all existing documents
- Preserve all existing attachments
- Preserve Notes
- Preserve Report Issues
- Preserve operational context
- Avoid creating a duplicate second work item

The UI does not need to emphasize that the Project used to be a Task.

## 12.3 Task/Project Scope

Each Project represents:

- One real external export/shipping operation
- One company
- One shipment

A Project can contain multiple Materials.

All Materials in that Project belong to the same overall shipment.

## 12.4 Required Data Before Work Begins

SANAD should require the Project/Task's core operational information to be completed before normal work begins.

At minimum this includes:

- Name
- Company
- Customer
- Materials
- Quantities

Additional required project fields will be defined in the dedicated Project/Data specification.

The intent is to avoid empty or meaningless Projects.

---

# 13. Task and Project Statuses

Both Task and Project use the same four statuses:

- In Progress
- Cancelled
- Completed
- Archived

## 13.1 Project/Task List Filtering

Status filters must support multi-select.

The filter UI should be a dropdown containing a checklist.

Example selections:

- In Progress + Completed
- In Progress + Cancelled
- Completed + Archived

## 13.2 Project Pinning

Projects can be pinned.

Pinned Projects should appear prominently regardless of status when appropriate.

## 13.3 Archived Display

Archived Projects should appear in a final collapsible/expandable section at the bottom of the Project list.

## 13.4 Reopen

Admin can reopen an Archived Project.

A User may also be granted this ability through permissions.

---

# 14. Project Shared Data Layer

This is a core architectural rule of SANAD.

Each Task/Project has a **Shared Data Layer** containing reusable operational data.

Examples include:

- Customer
- Material
- Quantity
- Price
- Packing
- Shipping details
- Destination
- Other shared document fields

Generated documents must reuse Shared Data instead of requiring repeated manual entry.

## 14.1 Data Entered in a Document

If the user enters a reusable shared field for the first time while creating a document, SANAD should save that information into the Task/Project Shared Data Layer so future documents can reuse it.

## 14.2 Conflict Detection

If a later document contains a different value for a shared field, SANAD must detect the conflict.

Example:

Existing Shared Project Data:
- HDPE 952 = 50 MT

New Tax Invoice:
- HDPE 952 = 48 MT

SANAD must NOT silently decide which value is correct.

## 14.3 Confirmation Flow

SANAD must use separate confirmation steps.

### Step 1 — Update Project Data?

Ask whether the newly entered value should replace the Shared Project Data value.

### Step 2 — Synchronize Existing Documents?

If the user confirms the Project Data update, SANAD should identify existing generated documents affected by the change and show them in a checklist.

The user chooses which affected documents should be synchronized.

## 14.4 In-Place Document Updates

When the user confirms synchronization:

- Update the existing document in place
- Keep the same document/invoice number
- Do not create visible duplicate old/new document versions
- Do not show multiple competing current versions

The application should present one current version of each document.

## 14.5 Audit History

Although visible document version clutter is not wanted, SANAD must still record:

- Previous value
- New value
- User
- Timestamp
- Affected entity/document

This information belongs in the Audit Log.

---

# 15. Confirmation Philosophy

SANAD must avoid "smart automation" that takes consequential actions without the user's permission.

Confirmation modals should be used for important operations such as:

- Delete / Move to Trash
- Restore
- Shared Project Data change
- Propagate shared changes into existing documents
- Archive
- Reopen
- Permission changes
- Factory Code imports/updates
- Backup restore
- Bulk changes
- Critical settings changes

Confirmation should NOT appear for every normal Save/Edit action.

---

# 16. Materials

SANAD contains a Material Library per company.

Material data must remain isolated per company.

## 16.1 Material Fields

The Material Library should support:

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

Additional material fields may be defined later.

## 16.2 Multiple Materials per Project

A Project may contain multiple Materials.

Each Project Material can have independent:

- Quantity
- Price
- Packing information

## 16.3 Units

SANAD distinguishes between:

### Weight Unit
Primary expected unit:
- MT / Metric Ton

The unit system should remain configurable.

### Packing / Containment Unit
Examples:
- Bags
- Tanks
- Jerry cans
- Other packaging/container types

These values should be configurable from Settings.

---

# 17. Last Selling Price

SANAD should remember the most recently used selling price for each Material.

Example:

Material:
- HDPE 952

Last saved selling price:
- 1,000 SAR / MT

When the Material is added to a later Task/Project, SANAD should suggest the last selling price.

The value is a suggestion, not a forced value.

When a new price is saved, it becomes the latest suggested selling price for future operations.

---

# 18. Material Reference Files

Reference files should be stored once against the Material and reused by reference.

Do NOT duplicate the same material file across multiple Projects.

Examples:

- TDS
- MSDS
- COA

## 18.1 COA

For V1, COA is treated as a fixed Material-level file that can be reused across Projects.

---

# 19. Customers and Suppliers

Customer data is company-specific.

Supplier data may exist as company-specific master data if needed by other screens, but Suppliers are **not part of Project shipment tracking** in the confirmed core workflow.

No Project-to-Supplier relationship is required in the confirmed core scope.

---

# 20. Generated Documents

Tasks and Projects support four primary document actions:

1. Invoice
2. Packing List
3. Delivery Note
4. Bill of Lading

## 20.1 Invoice Action

The Invoice action opens a dropdown with:

- QUOT — Quotation
- PINV — Proforma Invoice
- TINV — Tax Invoice
- CINV — Commercial Invoice

Quotation is launched from the Invoice section, but it has its own field requirements and is not simply the same form as an invoice.

## 20.2 Other Document Types

- PKL — Packing List
- DN — Delivery Note
- BL — Bill of Lading

## 20.3 Document Date and User-Supplied Number

SANAD automatically stores the document creation date.

SANAD must NOT force an automatically generated invoice/document serial number.

The authorized User/Admin can enter the desired Invoice/Document Number manually because the company may need to match a number created by another ERP/accounting system.

When a document number is entered, it must be unique within the same company.

## 20.4 Editable Document Data

Authorized users must be able to edit document information, including the document number/reference where permitted.

---

# 21. Quotation Standard Fields

Quotation should include a professional standard field set, including:

- Company details
- Customer details
- Date
- Quotation Number / Reference
- Material
- Description / Grade
- Quantity
- Unit
- Unit Price
- Currency
- Total
- VAT where applicable
- Delivery Terms
- Incoterm
- Payment Terms
- Validity
- Delivery Time
- Origin
- Packing
- Notes
- Terms & Conditions
- Prepared By
- Signature visibility based on configuration
- Stamp visibility based on configuration

Quotation-specific details will be refined in the Document Engine specification.

---

# 22. Tax and Commercial Invoice Relationship

Tax Invoice and Commercial Invoice use substantially the same business data.

However:

- TINV is presented as Tax Invoice
- CINV is presented as Commercial Invoice
- Their templates/titles are distinct
- The user explicitly chooses Tax or Commercial

---

# 23. VAT and QR Rule

VAT rates must be configurable in Company Settings.

Initial expected values include:

- 0%
- 15%

Default:
- 0%

## 23.1 QR Behavior

If VAT = 0%:
- Do not display the Saudi tax QR.

If VAT = 15%:
- Automatically include the Saudi/ZATCA-related QR on the Tax Invoice.

Detailed legal QR payload requirements will be defined in the Tax Invoice specification.

---

# 24. Bill of Lading Fields

The SANAD-generated Bill of Lading must support at least:

- Shipper
- Consignee
- Notify Party
- Port of Loading
- Port of Discharge
- Vessel
- Voyage
- Container Number
- Seal Number
- Marks & Numbers
- Description of Goods
- Packages
- Gross Weight
- Net Weight

Additional BL fields may be added in the detailed document specification.

---

# 25. Prepared By, Signature, and Stamp

Generated documents should support:

- Prepared By
- Signature
- Stamp

Their visibility should be configurable per document.

## 25.1 Prepared By

Prepared By must be editable.

Its placement should be appropriate for the selected document language.

## 25.2 Signature and Stamp Assets

Signature and Stamp should use transparent PNG assets stored in Company Settings / Company Assets.

They must:

- Render at a realistic printed size
- Not be excessively small
- Not be excessively large
- Look naturally applied to the document
- Slightly overlap surrounding document content where visually appropriate so the result feels like an authentic signed/stamped business document rather than a floating image

---

# 26. Document Templates

SANAD should provide two clean template design families for generated documents.

The two designs should:

- Be minimal
- Be professional
- Be easy to read
- Be visually consistent across Invoice, Packing List, Delivery Note, BL, etc.
- Avoid unnecessary decoration
- Avoid excessive color
- Prioritize information clarity
- Print well on A4
- Use sensible readable type sizes

Each company can select its preferred default template from Settings.

Document design should remain consistent across document types within a template family.

---

# 27. PDF and Print Quality

High-quality PDF output is a critical product requirement.

Generated PDFs must look like digitally generated business documents, not scans or screenshots.

Avoid:

- Rasterized full-page screenshots
- OCR-like appearance
- Low-resolution text
- Blurry borders
- Camera/scanner appearance

Prefer:

- Real selectable/searchable text
- Crisp typography
- Vector-like borders and table lines
- High-resolution assets
- Correct A4 dimensions
- Reliable print layout
- Consistent preview and final output

SANAD should support:

- In-app document preview
- Direct Print
- PDF Download

The custom preview should represent the final output as accurately as possible.

---

# 28. Attachments vs Generated Documents

SANAD distinguishes between:

## Generated Documents
Created by SANAD itself.

Examples:
- Invoice
- Quotation
- Packing List
- Delivery Note
- Bill of Lading

## Attachments
External files uploaded to the Task/Project.

Examples may include:
- Certificate of Origin
- Government documents
- External client files
- Other project-related external files

Attachments exist so each Project maintains a complete working file archive.

---

# 29. Notes and Report Issues

Each Task/Project supports:

- Note
- Report Issue

These apply to the Task/Project as a whole rather than individual documents.

## 29.1 Note

Used for:
- Comments
- Missing information reminders
- Non-critical context
- General observations

## 29.2 Report Issue

Used when something is wrong, important, or requires review.

Report Issue statuses:

- Open
- Under Review
- Resolved
- Rejected

Severity:

- Low
- Medium
- High
- Critical

Viewer can create Notes and Report Issues without gaining permission to edit underlying Project data.

---

# 30. Voice Input

Any appropriate text-entry area should support a voice-input option where practical.

Primary requirement:
- Voice-to-text

Possible sources include:
- Browser/device speech recognition
- Android native speech-to-text
- Windows speech-to-text
- iOS speech-to-text
- Future API-based speech recognition

The architecture should not unnecessarily lock SANAD to a single provider.

Laptop use is expected to be the dominant environment.

---

# 31. Dashboard

SANAD requires a professional, clean dashboard.

It should:

- Provide useful information without overcrowding
- Avoid confusing or dense visual layouts
- Show the logged-in user's personal To-dos
- Provide relevant operational summaries
- Use widgets/cards where useful

Each relevant dashboard widget should include a clear navigation/redirect action to its underlying page.

Detailed dashboard content will be defined in the UI/UX and Dashboard specifications.

---

# 32. Search

SANAD requires both:

- Global Search
- Module-specific Search

## 32.1 Global Search

A global search bar should appear prominently near the top-level application shell.

It should search across authorized data such as:

- Customers
- Materials
- Projects
- Tasks
- Documents
- Factory Code
- Relevant phone numbers
- Relevant references and codes

Example:
Searching `952` may return:
- Material containing 952
- Factory Code containing 952
- Customer phone containing 952
- Other authorized matching records

## 32.2 Module Search

Each major module should provide its own search so the user can limit results to that module.

Example:
Searching `952` inside Customers should return Customer results only.

---

# 33. Saudi Factory Code Master Database

SANAD contains a shared Saudi Factory Code Master Database.

Initial source size:
- Approximately 13,590 records
- Source file approximately 25 MB

The Master Database is shared across all Companies.

## 33.1 Record-Level Editing

There is NO spreadsheet-like record editing mode in SANAD.

Users should not manually edit Factory Code records row-by-row inside the application.

## 33.2 Search

Factory Code search must be broad and robust.

A search term should match across relevant columns.

Example:
`952` may match:
- Product/material text
- Factory code
- Other fields containing the same value

## 33.3 Filters

Users should be able to filter Factory Code records by available data dimensions.

Detailed filter fields will be defined from the actual source dataset.

## 33.4 Excel Export

Support:

- Export filtered/selected results
- Export the full Factory Code database

## 33.5 Smart Update

The Admin can upload a newer Factory Code source file.

Update rules:

- New records → add
- Existing changed records → update
- Existing unchanged records → keep
- Old records missing from the new file → KEEP

No existing Factory Code data should be deleted merely because it is missing from a later import.

The system must preserve valuable historical data.

---

# 34. Activity / Audit Log

SANAD requires a detailed searchable Activity Log.

Track at least:

- Create
- Read/View
- Edit
- Delete / Move to Trash
- Restore
- Download
- PDF generation/download
- Export
- Archive
- Reopen
- Permission change
- Important settings changes
- Factory Code import/update
- Backup/restore actions
- Other meaningful system operations

Do NOT log every search query by default.

## 34.1 Before and After Data

For edits, log:

- Old value/state
- New value/state
- User
- Date/time
- Entity type
- Entity identifier
- Relevant document/reference number

## 34.2 Searchable Audit Log

Audit Log search should support:

- User ID
- User name
- Invoice/document number
- Serial/reference values
- Entity identifiers
- Related files/documents

The Admin should be able to inspect their own activity as well as other users' activity.

---

# 35. Trash and Soft Delete

All important deleted entities should go to Trash instead of being permanently deleted immediately.

This includes, where applicable:

- Projects
- Tasks
- Documents
- Customers
- Materials
- Attachments
- Other recoverable records

Trash must support restoration for authorized users.

Permanent deletion rules will be defined later and must be treated as high-risk.

---

# 36. Notifications

An in-app Notification Center is required from V1.

Notification types should include at least:

- Task assigned
- Task due soon
- Task overdue
- Project status changed
- Project archived/reopened
- Report Issue created
- Report Issue status changed
- Mention in Note
- Document created
- Document significantly edited
- Document deleted/restored
- Attachment uploaded/removed
- Permission changed
- Factory Code database updated
- Backup succeeded
- Backup failed
- Personal To-do reminder

Notification categories should be configurable in Settings so users can disable categories they do not want.

Future delivery channels such as email/push can be added later.

---

# 37. Reports

Initial reports include:

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

Each report should support:

- PDF export
- Excel export

Additional reports may be added later.

---

# 38. Backup and Restore

Backup and Restore must be available inside SANAD.

Support:

- Manual Backup
- Automatic Backup
- Offline Backup
- Online Backup

## 38.1 Offline Backup

User can download a backup artifact locally.

JSON or another suitable portable structured backup format may be used.

## 38.2 Online Backup

Online backup artifacts should be stored outside the primary relational database where practical, using Cloudflare R2.

## 38.3 Automatic Backup

Automatic backup schedule must be configurable in Settings.

Default:
- Daily

Detailed retention policies will be defined in the Backup specification.

## 38.4 Restore

Restore is a consequential operation and requires a confirmation flow.

---

# 39. Company Settings

Company Settings should be intentionally comprehensive so normal business/document requirements do not require frequent schema changes.

The settings UX must remain organized and understandable rather than becoming a cluttered "workshop".

Use sections/tabs/groups.

Company Settings should support at least:

## 39.1 Identity
- Company Name Arabic
- Company Name English
- Legal Name Arabic
- Legal Name English
- Short Name
- Company Code
- Logo
- Stamp
- Signature

## 39.2 Registration / Legal
- Commercial Registration Number
- VAT / Tax Number
- Tax Registration fields
- License/registration references where applicable
- Country
- City
- Address
- Postal Code

## 39.3 Contact
- Phone
- Secondary Phone
- Email
- Website

## 39.4 Banking
- Bank Name
- Account Name
- Account Number
- IBAN
- SWIFT/BIC
- Bank Address
- Currency

## 39.5 Document Defaults
- Default Document Language
- Default Template
- Default VAT Rate
- Available VAT Rates
- Available Currencies
- Available Weight Units
- Available Packing Units
- Default Incoterm where applicable
- Default Payment Terms
- Default Delivery Terms
- Prepared By defaults
- Signature visibility defaults
- Stamp visibility defaults

## 39.6 Notification Preferences
- Notification category toggles

## 39.7 Backup Preferences
- Automatic backup enabled/disabled
- Backup schedule
- Retention settings

## 39.8 Permission / Security Configuration
- Company user access
- Role/permission assignments
- Critical permission management

Additional company fields may be added in the detailed Settings specification.

---

# 40. Settings Philosophy

Anything that reasonably varies by company or deployment should be configurable where practical.

However:

- Configurability must not make the UI chaotic.
- Settings must be grouped logically.
- Dangerous settings must be clearly marked.
- Defaults should make first-time use straightforward.
- Common workflows should not require constant Settings changes.

---

# 41. Data Quality and Reliability

Data stability is a critical product requirement.

SANAD must:

- Use central persistence
- Prevent accidental data loss
- Avoid silent destructive updates
- Use database constraints where appropriate
- Enforce company isolation
- Prevent duplicate document numbers within a company
- Use Trash instead of immediate hard deletion
- Provide backups
- Provide Audit Logs
- Provide confirmation for consequential operations

---

# 42. Document Number Uniqueness

Document numbers/references are user-supplied rather than auto-serial-generated.

Rules:

- User/Admin enters the number/reference required by their external workflow
- SANAD stores creation date automatically
- The same document number must not be duplicated inside the same company
- Cross-company duplication is allowed because company datasets are isolated

---

# 43. UI/UX High-Level Principles

Detailed UI design is deferred to a dedicated UI/UX specification.

Confirmed principles:

- Professional
- Minimal
- Easy to use
- Not cluttered
- Not visually confusing
- Strong Arabic RTL
- Strong English LTR
- Clean tables
- Clear actions
- Good dashboard information density
- Responsive where practical
- High-quality document preview
- Settings organized into clear categories
- Use dropdown/checklist patterns where appropriate
- Multi-select status filters
- Clear confirmation modals for consequential actions

---

# 44. Technical Design Principles for Coding Agents

The coding agent should prefer architecture that:

- Supports self-hosted deployments
- Supports Supabase cleanly
- Supports Cloudflare R2 cleanly
- Supports online licensing verification
- Supports row-level company isolation
- Supports per-company user permissions
- Supports auditability
- Supports configurable Settings
- Supports modular document templates
- Supports future integrations without making current scope dependent on them
- Avoids coupling business logic directly to UI components
- Keeps shared Project data separate from document rendering
- Treats generated documents as derived operational artifacts connected to Shared Data
- Keeps Factory Code master data separate from company-owned data

---

# 45. Suggested Core Domain Objects

This section is a structural interpretation of confirmed requirements, not a final database schema.

Likely primary domain objects:

- Deployment
- License
- User
- Company
- CompanyMembership
- Permission
- Customer
- Material
- MaterialFile
- MaterialPrice
- ToDo
- WorkItem
  - Task
  - Project
- ProjectMaterial
- ProjectSharedData
- Document
- DocumentType
- Attachment
- Note
- ReportIssue
- Notification
- FactoryCodeRecord
- FactoryCodeImport
- AuditLog
- TrashRecord
- BackupRecord
- CompanySetting

The dedicated Database Schema file will define actual tables and relationships.

---

# 46. Confirmed Product Priorities

The highest priorities are:

1. Data stability
2. Shared Project Data reuse
3. High-quality generated documents
4. Simple professional UX
5. Multi-company data isolation
6. Granular permissions
7. Auditability
8. Reliable Task/Project workflow
9. Factory Code search and updates
10. Backup and recovery
11. Configurability without clutter
12. Self-hosted licensing readiness

---

# 47. Open Questions

These questions remain open and should be tracked for later clarification without blocking unrelated development.

## OQ-01 — Exact Document Number Display Format
Document numbers are manually entered, but the final visual formatting rules around type labels and dates may be refined later.

## OQ-02 — Detailed Tax / ZATCA Payload
Exact Saudi legal/technical QR payload requirements and mandatory tax fields will be finalized in the Tax Invoice specification.

## OQ-03 — Exact Proforma Invoice Fields
Detailed PINV-specific fields require document-level specification.

## OQ-04 — Exact Tax Invoice Fields
Detailed TINV-specific fields require document-level specification.

## OQ-05 — Exact Commercial Invoice Fields
Detailed CINV-specific fields require document-level specification.

## OQ-06 — Exact Packing List Fields
Detailed PKL fields and weight/package calculation behavior require document-level specification.

## OQ-07 — Detailed Delivery Note Fields
DN fields require document-level specification.

## OQ-08 — Additional Bill of Lading Fields
Core fields are defined, but any client-specific fields remain open.

## OQ-09 — Final Document Template Approval
SANAD will produce two minimal professional template families; final visual selection requires approval.

## OQ-10 — Licensing Policy Details
Activation, expiry, grace period, verification frequency, deployment binding, and renewal rules require a dedicated licensing decision.

## OQ-11 — Detailed Project Data Fields
Core mandatory fields are known, but the complete operational field set needs a dedicated Project/Data specification.

## OQ-12 — Backup Retention
Automatic backup exists; exact retention counts/durations remain open.

---

# 48. Optional Suggestions — Not Core Requirements

The following are suggestions only unless explicitly approved later.

## OS-01 — Price History
In addition to Last Selling Price, SANAD could store a lightweight historical list of past selling prices per Material.

This is not required for V1 unless approved.

## OS-02 — License Grace Period
Online licensing could support a short grace period when the licensing server is temporarily unreachable.

Not yet approved.

## OS-03 — Health / Readiness Indicator
A Project could later show whether required operational data/documents are complete.

Not part of the confirmed core scope.

---

# 49. Final Master Rule

SANAD should make an export/shipping operation easy to understand and execute without duplicating data, losing documents, mixing companies, or forcing users to fight the software.

When behavior is uncertain, prefer:

- User control
- Clear confirmation
- Data preservation
- Company isolation
- Configurability
- Simple UX
- High-quality output
- Auditability

over hidden automation or convenience that risks data integrity.
