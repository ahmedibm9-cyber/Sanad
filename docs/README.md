# SANAD — Project Documentation Pack

This folder is the implementation source pack for SANAD.

## Read order and authority

A coding agent must read the files in this order:

1. `00_MASTER_PRODUCT_SPEC.md`
2. `01_PRD.md`
3. `02_AI_CODING_AGENT_INSTRUCTIONS.md`
4. The specialist specification for the area being implemented
5. `21_ASSUMPTIONS_DEFAULTS.md`
6. `22_OPEN_QUESTIONS_FOR_CLIENT.md`
7. `23_DECISIONS_LOG.md`

If two documents conflict:

1. A later explicit Product Owner decision wins.
2. `00_MASTER_PRODUCT_SPEC.md` wins over all lower-level specs.
3. A specialist spec wins over a generic spec for implementation details.
4. `ASSUMPTIONS_DEFAULTS.md` is temporary behavior only where no confirmed requirement exists.
5. `OPEN_QUESTIONS_FOR_CLIENT.md` never overrides a confirmed requirement.

## Core product identity

**Product:** SANAD  
**Type:** Self-hosted export/shipping operations web application  
**Primary database:** Supabase PostgreSQL  
**Object storage:** Cloudflare R2  
**Licensing:** Online license verification infrastructure from V1  
**Languages:** Arabic RTL + English LTR  
**Primary use:** External export/shipping operations and document generation only

## Documentation map

- `00_MASTER_PRODUCT_SPEC.md` — authoritative product definition.
- `01_PRD.md` — detailed product requirements and acceptance criteria.
- `02_AI_CODING_AGENT_INSTRUCTIONS.md` — how the coding AI must work.
- `03_IMPLEMENTATION_PLAN.md` — build sequence and milestones.
- `04_ARCHITECTURE_SPEC.md` — technical architecture and boundaries.
- `05_DATABASE_SCHEMA.md` — entities, tables, relationships, RLS expectations.
- `06_PROJECT_TASK_WORKFLOW_SPEC.md` — Task/Project behavior and shared-data model.
- `07_DOCUMENT_ENGINE_SPEC.md` — Quotation, invoices, PKL, DN, BL.
- `08_PDF_PRINTING_SPEC.md` — true digital PDF/print requirements.
- `09_UI_UX_SPEC.md` — information architecture and interaction rules.
- `10_PERMISSIONS_SECURITY_SPEC.md` — users, memberships, permissions, security.
- `11_SETTINGS_SPEC.md` — comprehensive company/system settings.
- `12_MATERIALS_CUSTOMERS_SPEC.md` — material library, customer data, last price.
- `13_FACTORY_CODE_MODULE.md` — shared 13,590+ factory-code dataset.
- `14_FILES_ATTACHMENTS_SPEC.md` — R2 files and project/material attachments.
- `15_AUDIT_LOG_SPEC.md` — before/after audit and activity tracking.
- `16_NOTIFICATIONS_REPORTS_SPEC.md` — notifications and reports.
- `17_BACKUP_RESTORE_SPEC.md` — manual/automatic backup and restore.
- `18_LICENSING_DEPLOYMENT_SPEC.md` — self-hosted deployment and online licensing.
- `19_VALIDATION_BUSINESS_RULES.md` — rules and validation.
- `20_ERROR_HANDLING_SPEC.md` — failure behavior and recovery.
- `21_ASSUMPTIONS_DEFAULTS.md` — non-authoritative defaults needed to build now.
- `22_OPEN_QUESTIONS_FOR_CLIENT.md` — unresolved client questions.
- `23_DECISIONS_LOG.md` — confirmed decisions.
- `24_DUMMY_DATA_SPEC.md` — development test data.
- `25_TESTING_ACCEPTANCE.md` — end-to-end test matrix and DoD.
- `26_ENVIRONMENT_SETUP.md` — environments, secrets and local setup.
- `27_DATA_IMPORT_EXPORT_SPEC.md` — Excel/JSON import/export rules.
- `28_BRANDING_GUIDE.md` — SANAD visual direction.
- `29_RELEASE_CHECKLIST.md` — beta/release gate.

## Non-negotiable implementation themes

- Never mix company-owned data between companies.
- Never silently propagate a shared-data change into documents.
- Never hard-delete normal business records through normal UI.
- Never rasterize an entire document page to make a PDF.
- Never make critical permission changes without a confirmation step.
- Never replace the Factory Code database destructively.
- Never make the user maintain duplicated material reference files.
- Never expose old document versions as competing current documents.
