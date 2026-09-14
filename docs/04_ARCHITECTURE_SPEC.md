# SANAD — Architecture Specification

## 1. Deployment shape

One client = one independent deployment.

Recommended V1 default:
- Frontend/server web framework: modern React-based full-stack framework with TypeScript.
- Deployment: Vercel or Railway.
- Database/Auth: Supabase.
- Files: Cloudflare R2.
- License verification: separate HTTPS licensing service owned by SANAD vendor.

Framework choice is an implementation default, not a product requirement.

## 2. Logical layers

### Presentation
- app shell
- routes
- forms
- tables
- dialogs
- document preview

### Domain
- work item rules
- project shared data
- document sync
- permissions
- material price suggestion
- Factory Code merge rules
- trash rules

### Application services
- audit service
- notification service
- document service
- storage service
- backup service
- licensing service

### Infrastructure
- Supabase
- R2
- PDF renderer
- Excel generator
- licensing HTTP client

## 3. Auth

Use secure server-supported authentication.

Do not store raw passwords in SANAD application tables.

Admin creates users through supported auth provisioning flow.

## 4. Company authorization

Every request resolves:
- current user
- active company
- membership
- permissions

Authorization must be enforced both:
- application/server layer
- database policy layer

## 5. Storage

R2 object keys should be namespaced.

Example:
`companies/{company_id}/materials/{material_id}/...`
`companies/{company_id}/projects/{project_id}/attachments/...`
`companies/{company_id}/assets/...`
`shared/factory-code/imports/...`
`backups/{deployment_id}/...`

Never trust object paths as authorization by themselves.

## 6. Document architecture

Store document business data as structured records.

Generate rendered outputs from structured data + template.

Do not make the PDF itself the primary editable data source.

## 7. Shared Project Data

Use explicit field ownership/mapping.

A document field may be:
- shared
- document-specific
- derived

The sync engine compares only fields marked shared.

## 8. Transactions

Use transactions for:
- converting Task to Project
- shared-data propagation
- moving complex entities to Trash
- restoring complex entities
- Factory Code import merge
- permission changes where multiple records are affected

## 9. Background work

Where deployment supports it, use jobs/queues for:
- large Excel import
- large Excel export
- backup
- large PDF/report generation

For V1, synchronous execution is acceptable only if operations remain responsive and safe.

## 10. Observability

Log:
- server errors
- failed storage calls
- failed license checks
- failed backup
- failed import
- failed document render

Never put secrets or sensitive file contents into logs.
