# SANAD — Permissions & Security Specification

## 1. Security model

Authorization is per user, per company, per capability.

## 2. Admin

System-level full authority.

## 3. User

Granular checklist permissions.

## 4. Viewer

Base behavior:
- view
- search
- Note
- Report Issue

Download is separately configurable.

## 5. Permission groups

### Company
- company.view
- company.edit

### Projects
- projects.view
- projects.create
- projects.edit
- projects.archive
- projects.reopen
- projects.pin
- projects.delete

### Tasks
- tasks.view
- tasks.create
- tasks.edit
- tasks.convert_to_project
- tasks.archive
- tasks.delete

### Documents
- documents.view
- documents.create
- documents.edit
- documents.print
- documents.download
- documents.delete

### Customers
- customers.view
- customers.create
- customers.edit
- customers.delete
- customers.export

### Materials
- materials.view
- materials.create
- materials.edit
- materials.delete
- materials.files.manage

### Files
- files.view
- files.upload
- files.download
- files.delete

### Reports
- reports.view
- reports.export_pdf
- reports.export_excel

### Users
- users.view
- users.create
- users.edit
- users.permissions.manage
- users.disable

### Activity
- audit.view

### Trash
- trash.view
- trash.restore
- trash.hard_delete (critical, optional)

### Factory Code
- factory.view
- factory.export
- factory.import_update

### Backup
- backup.create
- backup.restore

### Settings
- settings.view
- settings.edit

## 6. Critical permissions

Mark at least:
- user management
- permission management
- backup restore
- hard delete
- Factory Code import
- company settings
- licensing administration

## 7. Database security

Use Supabase RLS or equivalent.

Never rely on UI hiding.

## 8. File security

Use short-lived signed URLs or authenticated proxy patterns as appropriate.

Do not make private R2 objects publicly listable.

## 9. Audit

Permission changes must record before/after.

## 10. Sessions

Use secure cookies/tokens according to auth framework.

Support sign-out and session revocation.

## 11. Secrets

Never expose:
- Supabase service-role key
- R2 secret
- licensing signing/management secret
- server-only API secrets
