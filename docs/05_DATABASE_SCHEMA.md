# SANAD — Database Schema Specification

This is the logical schema. Exact SQL types can be selected by the implementation agent.

## 1. Core conventions

Common fields:
- `id` UUID primary key
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `deleted_at` where soft-delete applies

Company-owned rows include `company_id`.

## 2. deployments

- id
- name
- installation_id
- license_status
- license_last_verified_at
- settings_json

## 3. users

Profile data linked to auth provider:
- id
- display_name
- email/username display fields
- preferred_language
- is_system_admin
- active

Passwords remain in auth provider, not this table.

## 4. companies

- id
- names Arabic/English
- legal names
- short name
- company code
- legal/contact/bank/settings fields or normalized child tables
- active

## 5. company_memberships

- id
- company_id
- user_id
- base_role (`user`, `viewer`)
- active

Admin can be represented as system-level authority.

Unique:
- company_id + user_id

## 6. permissions

Permission catalog.

Examples:
- projects.view
- projects.create
- projects.edit
- projects.archive
- projects.reopen
- tasks.create
- documents.create
- documents.edit
- files.download
- users.manage
- settings.manage
- trash.restore
- factory_code.import

## 7. membership_permissions

- membership_id
- permission_key
- allowed

Allows per-company configuration.

## 8. customers

- id
- company_id
- name Arabic/English where applicable
- company/legal name
- contact person
- phone
- email
- address
- city
- country
- tax/VAT fields if relevant
- notes

## 9. materials

- id
- company_id
- name
- grade
- manufacturer
- origin
- hs_code
- default_packing
- last_selling_price
- last_selling_currency
- last_selling_unit

## 10. material_price_events

Recommended supporting table:
- id
- company_id
- material_id
- project/work_item_id
- price
- currency
- unit
- recorded_at

UI may show only latest price.

## 11. material_files

- id
- company_id
- material_id
- file_type (`TDS`, `MSDS`, `COA`, other)
- r2_object_key
- original_name
- mime_type
- size
- uploaded_by

## 12. work_items

Single base record for Tasks and Projects.

- id
- company_id
- type (`task`, `project`)
- name
- customer_id
- status (`in_progress`, `cancelled`, `completed`, `archived`)
- pinned
- shipment metadata
- shared_data_json or normalized shared fields
- archived_at

Task → Project changes `type` in place.

## 13. work_item_materials

- id
- company_id
- work_item_id
- material_id
- description_override
- quantity
- weight_unit
- price
- currency
- packing_unit
- packing_description
- sort_order

## 14. todos

- id
- user_id
- title
- description
- due_date
- due_time
- priority
- is_done

Do not add project sharing to V1 To-dos.

## 15. documents

- id
- company_id
- work_item_id
- document_type
- document_number
- language
- template_key
- document_data_json
- created_date
- prepared_by
- show_signature
- show_stamp
- status if needed for rendering lifecycle
- latest_render_object_key optional

Unique:
- company_id + normalized document_number when non-empty

## 16. notes

- id
- company_id
- work_item_id
- author_user_id
- body
- created_at

## 17. report_issues

- id
- company_id
- work_item_id
- reporter_user_id
- body
- severity
- status
- resolved_by
- resolved_at

## 18. attachments

- id
- company_id
- work_item_id
- category
- r2_object_key
- original_name
- mime_type
- size
- uploaded_by

## 19. notifications

- id
- user_id
- company_id optional
- type
- title
- body
- entity_type
- entity_id
- read_at
- created_at

## 20. notification_preferences

- user_id
- notification_type
- enabled

## 21. audit_events

- id
- company_id nullable for system events
- actor_user_id
- action
- entity_type
- entity_id
- entity_reference
- before_json
- after_json
- metadata_json
- created_at

## 22. trash_entries

Prefer soft deletion on source records plus metadata:
- entity_type
- entity_id
- company_id
- deleted_by
- deleted_at

## 23. factory_code_records

Shared/global:
- id
- stable_source_key or canonical fingerprint
- raw/normalized columns matching source
- first_seen_import_id
- last_seen_import_id
- created_at
- updated_at

Records are not deleted due to source omission.

## 24. factory_code_imports

- id
- uploaded_by
- source_filename
- r2_object_key
- checksum
- row_count
- inserted_count
- updated_count
- unchanged_count
- started_at
- completed_at
- status

## 25. backups

- id
- type (`manual`, `automatic`)
- destination (`r2`, `offline`)
- object_key
- status
- created_by
- created_at
- metadata_json

## 26. company_assets

- id
- company_id
- asset_type (`logo`, `stamp`, `signature`)
- object_key
- active

## 27. company_settings

Can be structured JSON with validated schema or normalized groups.
Must cover identity, legal, contact, banking, document defaults, VAT, units, currencies, notifications, backup.

## 28. RLS requirements

Company-owned rows:
- readable only if membership/permission allows
- writable only if permission allows

Global Factory Code:
- readable by authorized deployment users
- import/update only by allowed admin user

Todos:
- owner-only by default
- system Admin exceptional visibility supported by server-controlled path
