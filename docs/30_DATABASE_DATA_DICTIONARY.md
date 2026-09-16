# SANAD V1 — Database Data Dictionary

> **Authority**: This document is the single source of truth for the SANAD database schema.
> If this document conflicts with existing migration files, **this document wins**.
> Last updated: 2026-09-16

---

## Conventions

| Convention | Rule |
|---|---|
| Primary keys | `uuid` via `extensions.uuid_generate_v4()` |
| Timestamps | `timestamptz` — always UTC |
| Money/quantities | `numeric` (never `float`/`double`) |
| Soft delete | `deleted_at timestamptz` + `deleted_by uuid` on every business entity |
| Optimistic lock | `version integer NOT NULL DEFAULT 1` on mutable entities |
| Company isolation | Every business table has `company_id uuid NOT NULL FK companies(id)` |
| Audit columns | `created_at`, `updated_at`, `created_by`, `updated_by` where applicable |
| Naming | `snake_case` for all identifiers |
| Enums | Stored as `text` with `CHECK` constraints (not PostgreSQL ENUM type) |
| JSONB | Used only for snapshots, metadata, and flexible config — never for structured relational data |

---

## Table of Contents

1. [System / Deployment](#1-system--deployment)
2. [Users & Auth](#2-users--auth)
3. [User Preferences](#3-user-preferences)
4. [Companies](#4-companies)
5. [Company Memberships](#5-company-memberships)
6. [Permission Catalog](#6-permission-catalog)
7. [Membership Permissions](#7-membership-permissions)
8. [Company Settings](#8-company-settings)
9. [Company Assets](#9-company-assets)
10. [Company Bank Accounts](#10-company-bank-accounts)
11. [Company Config Lists](#11-company-config-lists)
12. [Company Document Defaults](#12-company-document-defaults)
13. [Company Template Defaults](#13-company-template-defaults)
14. [Customers](#14-customers)
15. [Customer Contacts](#15-customer-contacts)
16. [Materials](#16-materials)
17. [Material Files](#17-material-files)
18. [Material Price History](#18-material-price-history)
19. [Work Items](#19-work-items)
20. [Work Item Shared Data](#20-work-item-shared-data)
21. [Work Item Materials](#21-work-item-materials)
22. [Shipment Details](#22-shipment-details)
23. [Documents](#23-documents)
24. [Document Items](#24-document-items)
25. [Document Party Snapshots](#25-document-party-snapshots)
26. [Document Type Details](#26-document-type-details)
27. [Document Templates](#27-document-templates)
28. [Todos](#28-todos)
29. [Notes](#29-notes)
30. [Report Issues](#30-report-issues)
31. [Attachments](#31-attachments)
32. [Audit Events](#32-audit-events)
33. [Notifications](#33-notifications)
34. [Notification Preferences](#34-notification-preferences)
35. [Trash Entries](#35-trash-entries)
36. [Backups](#36-backups)
37. [Backup Settings](#37-backup-settings)
38. [Factory Code Records](#38-factory-code-records)
39. [Factory Code Imports](#39-factory-code-imports)
40. [Factory Code Staging](#40-factory-code-staging)
41. [Gap Analysis](#41-gap-analysis)
42. [Relationships Map](#42-relationships-map)
43. [Enum Types](#43-enum-types)
44. [Indexes](#44-indexes)
45. [RLS Policies](#45-rls-policies)

---

## 1. System / Deployment

> **Note**: System tables live outside the multi-tenant model. They describe the SANAD installation itself.

### `deployment_instance`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| installation_id | text | NO | — | Unique installation identifier |
| deployment_name | text | YES | — | Human-readable name |
| environment | text | NO | `'production'` | `production / staging / development` |
| sanad_version | text | NO | — | Semver string |
| created_at | timestamptz | NO | `now()` | |

### `license_state`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| license_key_ref | text | NO | — | Reference to license server |
| status | text | NO | `'active'` | `active / expired / suspended / grace` |
| valid_until | timestamptz | YES | — | License expiry |
| last_verified_at | timestamptz | YES | — | Last successful verification |
| grace_until | timestamptz | YES | — | Grace period end |
| last_error | text | YES | — | Last verification error |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

### `system_settings`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| setting_key | text | NO | — | UNIQUE |
| setting_value | jsonb | NO | `'{}'` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 2. Users & Auth

> User accounts are independent of companies. A user can be a member of multiple companies.

### `users`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | — | PK, FK → `auth.users(id)` |
| auth_user_id | uuid | YES | — | Redundant link to Supabase Auth (for lookup) |
| username | text | YES | — | Unique display handle |
| display_name | text | NO | `''` | |
| email | text | NO | `''` | |
| phone | text | YES | — | Optional contact phone |
| avatar | text | YES | — | R2 key or URL |
| account_status | text | NO | `'active'` | `active / disabled` |
| is_system_admin | boolean | NO | `false` | Global superadmin flag |
| preferred_language | text | NO | `'en'` | UI language (`en` / `ar`) |
| active | boolean | NO | `true` | Soft active flag |
| last_login_at | timestamptz | YES | — | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

**Unique constraints**: `email` (case-insensitive), `username`

---

## 3. User Preferences

> Per-user UI and locale settings. Company-independent.

### `user_preferences`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| user_id | uuid | NO | — | FK → `users(id)`, UNIQUE |
| ui_language | text | NO | `'en'` | `en / ar` |
| timezone | text | NO | `'Asia/Riyadh'` | IANA timezone |
| date_format | text | NO | `'YYYY-MM-DD'` | |
| number_format | text | YES | — | e.g. `'en-US'` or `'ar-SA'` |
| sidebar_collapsed | boolean | NO | `false` | |
| preferred_page_size | integer | NO | `25` | Table rows per page |
| notification_preferences | jsonb | NO | `'{}'` | UI notification prefs |
| reduced_motion | boolean | NO | `false` | Accessibility preference |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

**Important**: `ui_language` ≠ `document_language`. A user can use Arabic UI while generating English documents.

---

## 4. Companies

> Each company is a workspace/tenant. All business data is scoped to a company.

### `companies`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_code | text | NO | — | UNIQUE, short code |
| short_name | text | NO | `''` | |
| name_en | text | NO | — | English display name |
| name_ar | text | NO | `''` | Arabic display name |
| legal_name_en | text | YES | — | |
| legal_name_ar | text | YES | — | |
| status | text | NO | `'active'` | `active / suspended / archived` |
| country | text | YES | — | |
| city | text | YES | — | |
| address | text | YES | — | |
| postal_code | text | YES | — | |
| phone | text | YES | — | |
| email | text | YES | — | |
| website | text | YES | — | |
| cr_number | text | YES | — | Commercial Registration |
| vat_number | text | YES | — | VAT registration |
| bank_name | text | YES | — | Legacy single bank (prefer `company_bank_accounts`) |
| account_name | text | YES | — | |
| account_number | text | YES | — | |
| iban | text | YES | — | |
| swift | text | YES | — | |
| bank_currency | text | YES | `'SAR'` | |
| default_language | text | YES | `'en'` | Document language default |
| default_template | text | YES | `'fulla-commercial-invoice-680'` | |
| default_vat_rate | numeric | YES | `15` | |
| default_currency | text | YES | `'SAR'` | |
| default_weight_unit | text | YES | `'MT'` | |
| default_packing_unit | text | YES | `'bags'` | |
| default_incoterm | text | YES | `'FOB'` | |
| default_payment_terms | text | YES | — | |
| default_delivery_terms | text | YES | — | |
| default_prepared_by | text | YES | — | |
| show_signature | boolean | YES | `true` | |
| show_stamp | boolean | YES | `true` | |
| active | boolean | NO | `true` | |
| created_by | uuid | YES | — | FK → `users(id)` |
| updated_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |
| deleted_at | timestamptz | YES | — | Soft delete |
| deleted_by | uuid | YES | — | FK → `users(id)` |

---

## 5. Company Memberships

> Links users to companies with a base role. Granular permissions are in `membership_permissions`.

### `company_memberships`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| user_id | uuid | NO | — | FK → `users(id)` |
| base_role | text | NO | `'user'` | `admin / user / viewer` |
| status | text | NO | `'active'` | `active / inactive / invited` |
| active | boolean | NO | `true` | |
| joined_at | timestamptz | YES | — | |
| created_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

**Unique constraint**: `(company_id, user_id)`

---

## 6. Permission Catalog

> Master list of all permissions. Seeded, not user-editable.

### `permission_catalog`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| permission_key | text | NO | — | UNIQUE, e.g. `projects.create` |
| group_name | text | NO | `'general'` | UI grouping |
| description_en | text | NO | `''` | |
| description_ar | text | NO | `''` | |
| is_critical | boolean | NO | `false` | Requires confirmation |
| sort_order | integer | NO | `0` | |

---

## 7. Membership Permissions

> Granular per-membership permission overrides.

### `membership_permissions`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| membership_id | uuid | NO | — | FK → `company_memberships(id)` |
| permission_key | text | NO | — | FK → `permission_catalog(permission_key)` |
| allowed | boolean | NO | `false` | |
| granted_by | uuid | YES | — | FK → `users(id)` |
| granted_at | timestamptz | YES | — | |
| created_at | timestamptz | NO | `now()` | |

**Unique constraint**: `(membership_id, permission_key)`

---

## 8. Company Settings

> Key-value settings per company. Flexible JSONB values.

### `company_settings`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| setting_key | text | NO | — | e.g. `theme`, `features` |
| setting_value | jsonb | NO | `'{}'` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |
| version | integer | NO | `1` | Optimistic lock |

**Unique constraint**: `(company_id, setting_key)`

---

## 9. Company Assets

> R2 metadata for logos, stamps, signatures. Binary stored in R2, metadata here.

### `company_assets`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| name | text | NO | — | Display name |
| type | text | NO | — | `logo / stamp / signature` |
| url | text | YES | — | Public URL |
| r2_key | text | YES | — | R2 object key |
| metadata | jsonb | NO | `'{}'` | Width, height, etc. |
| active | boolean | NO | `true` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 10. Company Bank Accounts

> Multiple bank accounts per company.

### `company_bank_accounts`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| bank_name | text | NO | — | |
| account_name | text | NO | — | |
| account_number | text | NO | — | |
| iban | text | YES | — | |
| swift | text | YES | — | |
| bank_address | text | YES | — | |
| currency | text | NO | `'SAR'` | |
| is_primary | boolean | NO | `true` | |
| active | boolean | NO | `true` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 11. Company Config Lists

> Configurable dropdown options per company (currencies, incoterms, packing units, etc.)

### `company_config_lists`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| category | text | NO | — | `currency / vat_rate / weight_unit / packing_unit / incoterm / payment_term / delivery_term` |
| code | text | NO | — | Machine value |
| label_ar | text | NO | — | Arabic display |
| label_en | text | NO | — | English display |
| value | text | YES | — | Additional value if needed |
| active | boolean | NO | `true` | |
| is_default | boolean | NO | `false` | |
| sort_order | integer | NO | `0` | |
| created_at | timestamptz | NO | `now()` | |

**Unique constraint**: `(company_id, category, code)`

---

## 12. Company Document Defaults

> Default document settings per company.

### `company_document_defaults`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)`, UNIQUE |
| default_language | text | NO | `'en'` | `en / ar` |
| default_template | text | NO | `'template-a'` | |
| default_vat_rate | numeric | NO | `0` | |
| default_currency | text | NO | `'SAR'` | |
| default_weight_unit | text | NO | `'MT'` | |
| default_packing_unit | text | NO | `'Bags'` | |
| default_incoterm | text | YES | — | |
| default_payment_terms | text | YES | — | |
| default_delivery_terms | text | YES | — | |
| default_prepared_by | text | YES | — | |
| show_signature | boolean | NO | `true` | |
| show_stamp | boolean | NO | `true` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 13. Company Template Defaults

> Which template to use per document type per company.

### `company_template_defaults`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| document_type | text | NO | — | `QUOT / PINV / TINV / CINV / PKL / DN / BL` |
| template_id | uuid | NO | — | FK → `document_templates(id)` |
| created_at | timestamptz | NO | `now()` | |

**Unique constraint**: `(company_id, document_type)`

---

## 14. Customers

> Customer master data per company.

### `customers`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| customer_code | text | YES | — | Optional internal code |
| legal_name | text | YES | — | Legal entity name |
| name | text | NO | — | Display name (primary) |
| name_ar | text | YES | — | Arabic name |
| contact_person | text | YES | — | Legacy primary contact |
| email | text | YES | — | |
| phone | text | YES | — | |
| phone_secondary | text | YES | — | |
| website | text | YES | — | |
| country | text | YES | — | |
| city | text | YES | — | |
| address | text | YES | — | |
| postal_code | text | YES | — | |
| vat_number | text | YES | — | |
| registration_number | text | YES | — | |
| notes | text | YES | — | |
| active | boolean | NO | `true` | |
| version | integer | NO | `1` | Optimistic lock |
| created_by | uuid | YES | — | FK → `users(id)` |
| updated_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |
| deleted_at | timestamptz | YES | — | Soft delete |

**Commercial defaults** (embedded — consider splitting to `customer_commercial_defaults`):

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| default_currency | text | YES | `'SAR'` | |
| default_vat_treatment | text | YES | `'0'` | VAT rate as text |
| payment_terms | text | YES | `'Net 30 days'` | |
| payment_method_notes | text | YES | — | |
| default_incoterm | text | YES | `'FOB'` | |
| delivery_terms | text | YES | — | |
| default_document_language | text | YES | `'en'` | |
| default_document_template | text | YES | `'template-a'` | |
| commercial_notes | text | YES | — | |

**Logistics defaults** (embedded — consider splitting to `customer_logistics_defaults`):

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| default_dest_country | text | YES | — | |
| default_dest_city | text | YES | — | |
| default_port | text | YES | — | |
| transport_responsibility | text | YES | `'Seller'` | |
| loading_responsibility | text | YES | `'Seller'` | |
| unloading_responsibility | text | YES | `'Buyer'` | |
| default_consignee | text | YES | — | |
| default_notify_party | text | YES | — | |
| packing_instructions | text | YES | — | |
| shipping_notes | text | YES | — | |
| special_handling | text | YES | — | |

---

## 15. Customer Contacts

> Multiple contact persons per customer.

### `customer_contacts`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| customer_id | uuid | NO | — | FK → `customers(id)` |
| name | text | NO | — | |
| job_title | text | YES | — | |
| email | text | YES | — | |
| phone | text | YES | — | |
| is_primary | boolean | NO | `false` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 16. Materials

> Material master data per company.

### `materials`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| material_code | text | YES | — | Optional internal code |
| name | text | NO | — | |
| grade | text | YES | — | |
| category | text | YES | — | |
| manufacturer | text | YES | — | |
| origin_country | text | YES | — | Country of origin |
| hs_code | text | YES | — | Harmonized System code |
| unit | text | NO | `'kg'` | Default unit |
| default_packing | text | YES | — | |
| default_weight_unit | text | YES | — | |
| density | numeric | YES | — | |
| color | text | YES | — | |
| latest_selling_price | numeric | YES | — | |
| latest_selling_currency | text | YES | — | |
| latest_price_at | timestamptz | YES | — | |
| notes | text | YES | — | |
| active | boolean | NO | `true` | |
| version | integer | NO | `1` | Optimistic lock |
| created_by | uuid | YES | — | FK → `users(id)` |
| updated_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |
| deleted_at | timestamptz | YES | — | Soft delete |

---

## 17. Material Files

> Reference files attached to materials (TDS, MSDS, COA). Stored once in R2.

### `material_files`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| material_id | uuid | NO | — | FK → `materials(id)` |
| file_type | text | NO | — | `TDS / MSDS / COA / OTHER` |
| filename | text | NO | — | Stored filename |
| original_name | text | NO | — | Original upload name |
| mime_type | text | YES | — | |
| size | integer | YES | — | Bytes |
| r2_object_key | text | YES | — | R2 storage key |
| checksum | text | YES | — | SHA-256 |
| active | boolean | NO | `true` | |
| uploaded_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 18. Material Price History

> Price change tracking per material. Last record = suggested price.

### `material_price_history`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| material_id | uuid | NO | — | FK → `materials(id)` |
| customer_id | uuid | YES | — | FK → `customers(id)`, NULL = general |
| work_item_id | uuid | YES | — | FK → `work_items(id)` |
| document_id | uuid | YES | — | FK → `documents(id)` |
| price | numeric | NO | — | |
| currency | text | NO | `'SAR'` | |
| unit | text | YES | — | Per-kg, per-MT, etc. |
| recorded_at | timestamptz | NO | `now()` | |
| recorded_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |

---

## 19. Work Items

> Unified entity for both Tasks and Projects. `type` field distinguishes them.
> Task → Project = change `type`, not copy.

### `work_items`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| type | text | NO | — | `task / project` |
| name | text | NO | — | |
| description | text | YES | — | |
| status | text | NO | `'in_progress'` | `in_progress / cancelled / completed / archived` |
| priority | text | YES | `'medium'` | `low / medium / high / critical` |
| pinned | boolean | NO | `false` | |
| customer_id | uuid | YES | — | FK → `customers(id)` |
| parent_id | uuid | YES | — | FK → `work_items(id)`, self-reference |
| destination | text | YES | — | Shipping destination |
| start_date | date | YES | — | |
| due_date | date | YES | — | |
| completed_at | timestamptz | YES | — | |
| archived_at | timestamptz | YES | — | |
| vessel_name | text | YES | — | |
| voyage_number | text | YES | — | |
| port_of_loading | text | YES | — | |
| port_of_discharge | text | YES | — | |
| container_number | text | YES | — | |
| notes | text | YES | — | |
| active | boolean | NO | `true` | |
| version | integer | NO | `1` | Optimistic lock |
| created_by | uuid | YES | — | FK → `users(id)` |
| updated_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |
| deleted_at | timestamptz | YES | — | Soft delete |

---

## 20. Work Item Shared Data

> Shared data layer between documents within a work item.
> When user updates shared data, it propagates to all linked documents.

### `work_item_shared_data`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| work_item_id | uuid | NO | — | FK → `work_items(id)`, UNIQUE |
| currency | text | YES | — | |
| payment_terms | text | YES | — | |
| delivery_terms | text | YES | — | |
| incoterm | text | YES | — | |
| destination_country | text | YES | — | |
| destination_city | text | YES | — | |
| port_of_loading | text | YES | — | |
| port_of_discharge | text | YES | — | |
| transport_responsibility | text | YES | — | |
| loading_responsibility | text | YES | — | |
| unloading_responsibility | text | YES | — | |
| consignee | text | YES | — | |
| notify_party | text | YES | — | |
| shipping_method | text | YES | — | |
| shipping_notes | text | YES | — | |
| general_terms | text | YES | — | |
| updated_at | timestamptz | NO | `now()` | |

---

## 21. Work Item Materials

> Materials line items within a work item (project/task).

### `work_item_materials`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| work_item_id | uuid | NO | — | FK → `work_items(id)` |
| material_id | uuid | NO | — | FK → `materials(id)` |
| item_code | text | YES | — | Line item code |
| description_override | text | YES | — | Override material name |
| grade_snapshot | text | YES | — | Snapshot from material at creation |
| hs_code_snapshot | text | YES | — | |
| origin_snapshot | text | YES | — | |
| packing | text | YES | — | |
| package_count | integer | YES | — | |
| quantity | numeric | NO | `0` | |
| weight_unit | text | YES | — | `MT / KG / LBS` |
| unit_price | numeric | NO | `0` | |
| currency | text | NO | `'SAR'` | |
| line_total | numeric | YES | — | Computed: quantity × unit_price |
| sort_order | integer | YES | `0` | |
| notes | text | YES | — | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 22. Shipment Details

> 1:1 with work_item for shipping/logistics data.

### `shipment_details`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| work_item_id | uuid | NO | — | FK → `work_items(id)`, UNIQUE |
| shipping_method | text | YES | — | |
| place_of_receipt | text | YES | — | |
| port_of_loading | text | YES | — | |
| port_of_discharge | text | YES | — | |
| place_of_delivery | text | YES | — | |
| vessel | text | YES | — | |
| voyage | text | YES | — | |
| container_number | text | YES | — | |
| seal_number | text | YES | — | |
| freight_terms | text | YES | — | |
| marks_and_numbers | text | YES | — | |
| total_packages | integer | YES | — | |
| net_weight | numeric | YES | — | |
| gross_weight | numeric | YES | — | |
| cbm | numeric | YES | — | Cubic meters |
| planned_shipping_date | date | YES | — | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 23. Documents

> Master record for any generated document (quotation, invoice, packing list, etc.)

### `documents`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| work_item_id | uuid | YES | — | FK → `work_items(id)` |
| customer_id | uuid | YES | — | FK → `customers(id)` |
| document_type | text | NO | — | `QUOT / PINV / TINV / CINV / PKL / DN / BL` |
| document_number | text | NO | — | User-entered, unique per company |
| document_date | date | NO | `CURRENT_DATE` | |
| expiration_date | date | YES | — | For quotations |
| document_language | text | NO | `'en'` | `en / ar` |
| template_id | text | YES | `'template-a'` | Template identifier |
| status | text | NO | `'draft'` | `draft / issued / void` |
| currency | text | YES | — | |
| vat_rate | numeric | YES | — | |
| subtotal | numeric | YES | — | |
| vat_amount | numeric | YES | — | |
| total | numeric | YES | — | |
| prepared_by | text | YES | — | |
| show_logo | boolean | YES | `true` | |
| show_signature | boolean | YES | `true` | |
| show_stamp | boolean | YES | `true` | |
| bank_account_id | uuid | YES | — | FK → `company_bank_accounts(id)` |
| notes | text | YES | — | |
| terms | text | YES | — | |
| metadata | jsonb | NO | `'{}'` | Flexible extra data |
| active | boolean | NO | `true` | |
| version | integer | NO | `1` | Optimistic lock |
| created_by | uuid | YES | — | FK → `users(id)` |
| updated_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |
| deleted_at | timestamptz | YES | — | Soft delete |

**Unique constraint**: `(company_id, document_number)`

---

## 24. Document Items

> Line items within a document. Snapshot fields preserve data at time of creation.

### `document_items`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| document_id | uuid | NO | — | FK → `documents(id)` |
| material_id | uuid | YES | — | FK → `materials(id)`, NULL if ad-hoc |
| item_code | text | YES | — | |
| material_name | text | NO | — | Snapshot |
| grade | text | YES | — | Snapshot |
| description | text | YES | — | |
| hs_code | text | YES | — | Snapshot |
| packing | text | YES | — | |
| origin | text | YES | — | Snapshot |
| packages | integer | YES | — | |
| quantity | numeric | NO | `0` | |
| weight_unit | text | YES | — | |
| unit_price | numeric | YES | — | |
| currency | text | YES | — | |
| net_weight | numeric | YES | — | |
| gross_weight | numeric | YES | — | |
| line_total | numeric | YES | — | |
| marks_numbers | text | YES | — | |
| sort_order | integer | NO | `0` | |
| created_at | timestamptz | NO | `now()` | |

---

## 25. Document Party Snapshots

> JSONB snapshots of parties at document creation time.
> Prevents master data changes from altering historical documents.

### `document_party_snapshots`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| document_id | uuid | NO | — | FK → `documents(id)` |
| party_type | text | NO | — | `seller / buyer / consignee / notify_party / bank` |
| snapshot_data | jsonb | NO | `'{}'` | Frozen party data |
| created_at | timestamptz | NO | `now()` | |

**Unique constraint**: `(document_id, party_type)`

**Example `snapshot_data`**:
```json
{
  "name": "ABC Company",
  "address": "123 Main St, Riyadh",
  "vatNumber": "310123456789000",
  "phone": "+966112345678",
  "email": "info@abc.com"
}
```

---

## 26. Document Type Details

> 1:1 extension tables for document-type-specific fields.

### `quotation_details`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| document_id | uuid | NO | — | PK, FK → `documents(id)` |
| validity_days | integer | YES | — | |
| validity_text | text | YES | — | e.g. "Valid for 15 days" |
| offer_notes | text | YES | — | |
| commercial_notes | text | YES | — | |

### `invoice_details`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| document_id | uuid | NO | — | PK, FK → `documents(id)` |
| invoice_reference | text | YES | — | |
| buyer_reference | text | YES | — | |
| tax_treatment | text | YES | — | |
| qr_metadata | jsonb | YES | — | For ZATCA QR compliance |

### `packing_list_details`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| document_id | uuid | NO | — | PK, FK → `documents(id)` |
| invoice_reference | text | YES | — | |
| container_number | text | YES | — | |
| seal_number | text | YES | — | |
| total_packages | integer | YES | — | |
| total_net_weight | numeric | YES | — | |
| total_gross_weight | numeric | YES | — | |
| cbm | numeric | YES | — | |
| marks_numbers | text | YES | — | |

### `delivery_note_details`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| document_id | uuid | NO | — | PK, FK → `documents(id)` |
| receiver | text | YES | — | |
| delivery_location | text | YES | — | |
| shipping_method | text | YES | — | |
| prepare_before | date | YES | — | |
| related_invoice | text | YES | — | |
| received_by | text | YES | — | |
| remarks | text | YES | — | |

### `bill_of_lading_details`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| document_id | uuid | NO | — | PK, FK → `documents(id)` |
| shipper | text | YES | — | |
| consignee | text | YES | — | |
| notify_party | text | YES | — | |
| place_of_receipt | text | YES | — | |
| port_of_loading | text | YES | — | |
| port_of_discharge | text | YES | — | |
| place_of_delivery | text | YES | — | |
| vessel | text | YES | — | |
| voyage | text | YES | — | |
| container_number | text | YES | — | |
| seal_number | text | YES | — | |
| freight_terms | text | YES | — | |
| marks_numbers | text | YES | — | |
| description_of_goods | text | YES | — | |
| packages | integer | YES | — | |
| gross_weight | numeric | YES | — | |
| net_weight | numeric | YES | — | |
| remarks | text | YES | — | |

---

## 27. Document Templates

> Template metadata. Native layouts are in code; this tracks available templates.

### `document_templates`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| template_code | text | NO | — | UNIQUE |
| display_name | text | NO | — | |
| document_type | text | NO | — | `QUOT / PINV / TINV / CINV / PKL / DN / BL` |
| family | text | YES | — | Template family grouping |
| version | integer | NO | `1` | |
| supports_ar | boolean | NO | `true` | |
| supports_en | boolean | NO | `true` | |
| active | boolean | NO | `true` | |
| native | boolean | NO | `false` | true = rendered in code, not PDF |
| created_at | timestamptz | NO | `now()` | |

---

## 28. Todos

> Personal to-do items for users.

### `todos`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| user_id | uuid | NO | — | FK → `users(id)` |
| title | text | NO | — | |
| description | text | YES | — | |
| priority | text | YES | `'medium'` | `low / medium / high / critical` |
| due_date | date | YES | — | |
| is_done | boolean | NO | `false` | |
| completed_at | timestamptz | YES | — | |
| work_item_id | uuid | YES | — | FK → `work_items(id)`, optional link |
| active | boolean | NO | `true` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |
| deleted_at | timestamptz | YES | — | Soft delete |

---

## 29. Notes

> Notes on work items. Voice input produces text here.

### `notes`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| work_item_id | uuid | NO | — | FK → `work_items(id)` |
| content | text | NO | — | Note body |
| author_user_id | uuid | YES | — | FK → `users(id)` (alias: `created_by`) |
| created_by | uuid | YES | — | FK → `users(id)` |
| active | boolean | NO | `true` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |
| deleted_at | timestamptz | YES | — | Soft delete |

---

## 30. Report Issues

> Issues reported on work items.

### `report_issues`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| work_item_id | uuid | NO | — | FK → `work_items(id)` |
| title | text | NO | — | |
| description | text | YES | — | |
| status | text | NO | `'open'` | `open / under_review / resolved / rejected` |
| severity | text | YES | `'medium'` | `low / medium / high / critical` |
| reported_by | uuid | YES | — | FK → `users(id)` |
| assigned_to | uuid | YES | — | FK → `users(id)` |
| resolved_by | uuid | YES | — | FK → `users(id)` |
| resolved_at | timestamptz | YES | — | |
| active | boolean | NO | `true` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 31. Attachments

> External file attachments (not generated documents).

### `attachments`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| work_item_id | uuid | YES | — | FK → `work_items(id)` |
| document_id | uuid | YES | — | FK → `documents(id)` |
| category | text | YES | — | `certificate / government / customer / shipping / other` |
| description | text | YES | — | |
| filename | text | NO | — | Stored filename |
| original_name | text | NO | — | Original upload name |
| mime_type | text | YES | — | |
| size | integer | YES | — | Bytes |
| r2_key | text | YES | — | R2 object key |
| url | text | YES | — | Public URL |
| checksum | text | YES | — | SHA-256 |
| active | boolean | NO | `true` | |
| uploaded_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| deleted_at | timestamptz | YES | — | Soft delete |
| deleted_by | uuid | YES | — | FK → `users(id)` |

---

## 32. Audit Events

> Immutable audit trail. Users cannot delete or modify.

### `audit_events`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | YES | — | FK → `companies(id)`, NULL for global events |
| actor_user_id | uuid | YES | — | FK → `users(id)` (alias: `user_id`) |
| user_id | uuid | YES | — | FK → `users(id)` |
| user_email | text | YES | — | Denormalized for quick display |
| action | text | NO | — | See enum below |
| entity_type | text | NO | — | e.g. `project`, `document`, `customer` |
| entity_id | uuid | NO | — | ID of affected entity |
| entity_reference | text | YES | — | Human-readable reference |
| before_data | jsonb | YES | — | State before change |
| after_data | jsonb | YES | — | State after change |
| changes | jsonb | YES | `'{}'` | Diff payload |
| metadata | jsonb | YES | — | Additional context |
| ip | text | YES | — | Client IP |
| user_agent | text | YES | — | Browser UA |
| created_at | timestamptz | NO | `now()` | |

---

## 33. Notifications

> In-app notifications for users.

### `notifications`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| user_id | uuid | NO | — | FK → `users(id)` |
| company_id | uuid | YES | — | FK → `companies(id)` |
| type | text | NO | — | Notification type key |
| title | text | NO | — | |
| message | text | YES | — | |
| entity_type | text | YES | — | Linked entity type |
| entity_id | uuid | YES | — | Linked entity ID |
| is_read | boolean | NO | `false` | |
| read_at | timestamptz | YES | — | |
| created_at | timestamptz | NO | `now()` | |

---

## 34. Notification Preferences

> Per-user, per-company notification toggle settings.

### `notification_preferences`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| user_id | uuid | NO | — | FK → `users(id)` |
| company_id | uuid | NO | — | FK → `companies(id)` |
| notification_type | text | NO | — | e.g. `task_assigned`, `issue_critical` |
| enabled | boolean | NO | `true` | |
| created_at | timestamptz | NO | `now()` | |

**Unique constraint**: `(user_id, company_id, notification_type)`

---

## 35. Trash Entries

> Metadata for soft-deleted entities. Business records stay in their tables with `deleted_at`.

### `trash_entries`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)` |
| entity_type | text | NO | — | |
| entity_id | uuid | NO | — | |
| entity_reference | text | YES | — | Human-readable |
| entity_data | jsonb | YES | `'{}'` | Snapshot at deletion time |
| deleted_by | uuid | YES | — | FK → `users(id)` |
| deleted_by_email | text | YES | — | Denormalized |
| deleted_at | timestamptz | NO | `now()` | |
| expires_at | timestamptz | YES | — | Auto-purge date |

---

## 36. Backups

> Backup job records.

### `backups`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| deployment_id | uuid | YES | — | |
| company_id | uuid | YES | — | FK → `companies(id)` |
| type | text | NO | — | `manual / automatic` |
| destination | text | NO | — | `online / offline` |
| object_key | text | YES | — | R2 key for backup file |
| status | text | NO | `'pending'` | `pending / running / completed / failed` |
| created_by | uuid | YES | — | FK → `users(id)` |
| created_at | timestamptz | NO | `now()` | |
| completed_at | timestamptz | YES | — | |
| error_message | text | YES | — | |
| metadata_json | jsonb | YES | — | Row counts, file counts, etc. |

---

## 37. Backup Settings

> Per-company backup configuration.

### `backup_settings`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| company_id | uuid | NO | — | FK → `companies(id)`, UNIQUE |
| auto_backup_enabled | boolean | NO | `true` | |
| backup_schedule | text | NO | `'daily'` | `daily / weekly / monthly` |
| retention_days | integer | NO | `30` | |
| last_backup_at | timestamptz | YES | — | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 38. Factory Code Records

> **Global shared data** — not scoped to any company. Import from Excel.

### `factory_code_records`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| stable_source_key | text | NO | — | UNIQUE, hash of source row |
| factory_code | text | YES | — | |
| factory_name | text | YES | — | English name |
| factory_name_ar | text | YES | — | Arabic name |
| city | text | YES | — | |
| region | text | YES | — | |
| activity | text | YES | — | |
| product | text | YES | — | |
| hs_code | text | YES | — | |
| registration_number | text | YES | — | |
| address | text | YES | — | |
| first_seen_import_id | uuid | YES | — | FK → `factory_code_imports(id)` |
| last_seen_import_id | uuid | YES | — | FK → `factory_code_imports(id)` |
| active_in_latest_source | boolean | NO | `true` | false = missing from last import, NOT deleted |
| first_seen_at | timestamptz | NO | `now()` | |
| last_seen_at | timestamptz | NO | `now()` | |
| created_at | timestamptz | NO | `now()` | |
| updated_at | timestamptz | NO | `now()` | |

---

## 39. Factory Code Imports

> Import batch tracking.

### `factory_code_imports`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `uuid_generate_v4()` | PK |
| uploaded_by | uuid | YES | — | FK → `users(id)` |
| source_filename | text | NO | — | Original filename |
| r2_object_key | text | YES | — | R2 key for uploaded file |
| checksum | text | YES | — | File hash |
| row_count | integer | YES | `0` | Total rows in file |
| inserted_count | integer | YES | `0` | New records |
| updated_count | integer | YES | `0` | Updated records |
| unchanged_count | integer | YES | `0` | Unchanged records |
| retained_count | integer | YES | `0` | Records retained |
| started_at | timestamptz | NO | `now()` | |
| completed_at | timestamptz | YES | — | |
| status | text | NO | `'processing'` | `processing / completed / failed` |
| error_message | text | YES | — | |

---

## 40. Factory Code Staging

> Temporary staging table for import pipeline. Cleaned after import completes.

### `factory_code_staging`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK |
| import_id | uuid | YES | — | FK → `factory_code_imports(id)` |
| stable_source_key | text | NO | — | |
| row_number | integer | NO | — | Row in source file |
| raw_data | jsonb | NO | — | Original row data |
| factory_code | text | YES | — | Parsed |
| factory_name | text | YES | — | |
| factory_name_ar | text | YES | — | |
| city | text | YES | — | |
| region | text | YES | — | |
| activity | text | YES | — | |
| product | text | YES | — | |
| hs_code | text | YES | — | |
| registration_number | text | YES | — | |
| status | text | YES | `'pending'` | `pending / valid / invalid / imported` |
| error_message | text | YES | — | |
| created_at | timestamptz | YES | `now()` | |

---

## 41. Gap Analysis

### Tables that exist in DB but NOT in inventory (candidates for removal/review)

| Table | Status |
|-------|--------|
| `client_profiles` | NOT SANAD — separate link-in-bio project. Ignore. |
| `client_links` | NOT SANAD. Ignore. |
| `client_contact` | NOT SANAD. Ignore. |
| `custom_themes` | NOT SANAD. Ignore. |

### Tables in inventory but MISSING from DB

| Table | Priority | Description |
|-------|----------|-------------|
| `deployment_instance` | HIGH | System installation metadata |
| `license_state` | HIGH | License state tracking |
| `system_settings` | HIGH | System-level settings |
| `user_preferences` | HIGH | Per-user UI/locale prefs |
| `customer_contacts` | HIGH | Multiple contacts per customer |
| `work_item_shared_data` | CRITICAL | Shared data layer between documents |
| `shipment_details` | CRITICAL | Shipping/logistics per work item |
| `document_items` | CRITICAL | Line items within documents |
| `document_party_snapshots` | CRITICAL | Freeze party data at document creation |
| `quotation_details` | HIGH | QUOT-specific fields |
| `invoice_details` | HIGH | Invoice-specific fields |
| `packing_list_details` | HIGH | PKL-specific fields |
| `delivery_note_details` | HIGH | DN-specific fields |
| `bill_of_lading_details` | HIGH | BL-specific fields |
| `document_templates` | HIGH | Template metadata |
| `company_template_defaults` | MEDIUM | Per-company template selection |
| `saved_report_views` | LOW | V2 — saved report presets |

### Columns missing from EXISTING tables

| Table | Missing Column | Type | Notes |
|-------|---------------|------|-------|
| `users` | `auth_user_id` | uuid | Link to Supabase Auth |
| `users` | `username` | text | Unique handle |
| `users` | `phone` | text | |
| `users` | `avatar` | text | R2 key |
| `users` | `account_status` | text | `active / disabled` |
| `users` | `last_login_at` | timestamptz | |
| `companies` | `status` | text | `active / suspended / archived` |
| `companies` | `deleted_at` | timestamptz | Soft delete |
| `companies` | `deleted_by` | uuid | |
| `work_items` | `destination` | text | Shipping destination |
| `work_items` | `archived_at` | timestamptz | |
| `materials` | `manufacturer` | text | |
| `materials` | `default_packing` | text | |
| `materials` | `default_weight_unit` | text | |
| `materials` | `latest_selling_price` | numeric | |
| `materials` | `latest_selling_currency` | text | |
| `materials` | `latest_price_at` | timestamptz | |
| `work_item_materials` | `item_code` | text | |
| `work_item_materials` | `description_override` | text | |
| `work_item_materials` | `grade_snapshot` | text | |
| `work_item_materials` | `hs_code_snapshot` | text | |
| `work_item_materials` | `origin_snapshot` | text | |
| `work_item_materials` | `packing` | text | |
| `work_item_materials` | `package_count` | integer | |
| `work_item_materials` | `weight_unit` | text | |
| `work_item_materials` | `line_total` | numeric | |
| `documents` | `expiration_date` | date | |
| `documents` | `currency` | text | |
| `documents` | `vat_rate` | numeric | |
| `documents` | `subtotal` | numeric | |
| `documents` | `vat_amount` | numeric | |
| `documents` | `total` | numeric | |
| `documents` | `bank_account_id` | uuid | |
| `documents` | `notes` | text | |
| `documents` | `terms` | text | |
| `documents` | `show_logo` | boolean | |
| `notes` | `deleted_at` | timestamptz | Soft delete |
| `report_issues` | `resolved_by` | uuid | |
| `attachments` | `category` | text | |
| `attachments` | `description` | text | |
| `attachments` | `checksum` | text | |
| `attachments` | `deleted_at` | timestamptz | |
| `attachments` | `deleted_by` | uuid | |
| `audit_events` | `entity_reference` | text | |
| `audit_events` | `before_data` | jsonb | |
| `audit_events` | `after_data` | jsonb | |
| `audit_events` | `metadata` | jsonb | |
| `audit_events` | `ip` | text | |
| `audit_events` | `user_agent` | text | |
| `audit_events` | `actor_user_id` | uuid | Alias for user_id |
| `notifications` | `read_at` | timestamptz | |
| `material_files` | `file_type` | text | `TDS / MSDS / COA / OTHER` |
| `material_files` | `checksum` | text | |
| `material_files` | `uploaded_by` | uuid | |
| `material_price_events` | `customer_id` | uuid | |
| `material_price_events` | `work_item_id` | uuid | |
| `material_price_events` | `document_id` | uuid | |
| `material_price_events` | `unit` | text | |
| `factory_code_records` | `address` | text | |
| `factory_code_records` | `active_in_latest_source` | boolean | |
| `factory_code_records` | `first_seen_at` | timestamptz | |
| `factory_code_records` | `last_seen_at` | timestamptz | |

---

## 42. Relationships Map

```
auth.users
  └── users (id)

users
  ├── user_preferences (user_id)
  ├── companies (created_by, updated_by, deleted_by)
  ├── company_memberships (user_id, created_by)
  ├── customers (created_by, updated_by)
  ├── materials (created_by, updated_by)
  ├── work_items (created_by, updated_by)
  ├── documents (created_by, updated_by)
  ├── todos (user_id)
  ├── notes (created_by)
  ├── report_issues (reported_by, assigned_to, resolved_by)
  ├── attachments (uploaded_by, deleted_by)
  ├── audit_events (user_id)
  ├── notifications (user_id)
  ├── notification_preferences (user_id)
  ├── trash_entries (deleted_by)
  ├── backups (created_by)
  ├── material_files (uploaded_by)
  ├── material_price_events (created_by)
  └── factory_code_imports (uploaded_by)

companies
  ├── company_memberships (company_id)
  ├── company_settings (company_id)
  ├── company_assets (company_id)
  ├── company_bank_accounts (company_id)
  ├── company_config_lists (company_id)
  ├── company_document_defaults (company_id)
  ├── company_template_defaults (company_id)
  ├── customers (company_id)
  │   └── customer_contacts (customer_id)
  ├── materials (company_id)
  │   ├── material_files (material_id)
  │   └── material_price_history (material_id)
  ├── work_items (company_id)
  │   ├── work_item_shared_data (work_item_id)
  │   ├── work_item_materials (work_item_id)
  │   │   └── materials (material_id)
  │   ├── shipment_details (work_item_id)
  │   ├── notes (work_item_id)
  │   ├── report_issues (work_item_id)
  │   ├── attachments (work_item_id)
  │   └── documents (work_item_id)
  │       ├── document_items (document_id)
  │       ├── document_party_snapshots (document_id)
  │       ├── quotation_details (document_id)
  │       ├── invoice_details (document_id)
  │       ├── packing_list_details (document_id)
  │       ├── delivery_note_details (document_id)
  │       ├── bill_of_lading_details (document_id)
  │       └── attachments (document_id)
  ├── todos (company_id)
  ├── audit_events (company_id)
  ├── notifications (company_id)
  ├── notification_preferences (company_id)
  ├── trash_entries (company_id)
  ├── backups (company_id)
  └── backup_settings (company_id)

permission_catalog
  └── membership_permissions (permission_key)

company_memberships
  └── membership_permissions (membership_id)

factory_code_imports
  └── factory_code_staging (import_id)

document_templates
  └── company_template_defaults (template_id)
```

---

## 43. Enum Types

All enums stored as `text` with CHECK constraints.

### Account Status
```sql
CHECK (account_status IN ('active', 'disabled'))
```

### Company Status
```sql
CHECK (status IN ('active', 'suspended', 'archived'))
```

### Membership Base Role
```sql
CHECK (base_role IN ('admin', 'user', 'viewer'))
```

### Membership Status
```sql
CHECK (status IN ('active', 'inactive', 'invited'))
```

### Work Item Type
```sql
CHECK (type IN ('task', 'project'))
```

### Work Item Status
```sql
CHECK (status IN ('in_progress', 'cancelled', 'completed', 'archived'))
```

### Priority
```sql
CHECK (priority IN ('low', 'medium', 'high', 'critical'))
```

### Document Type
```sql
CHECK (document_type IN ('QUOT', 'PINV', 'TINV', 'CINV', 'PKL', 'DN', 'BL'))
```

### Document Status
```sql
CHECK (status IN ('draft', 'issued', 'void'))
```

### Issue Status
```sql
CHECK (status IN ('open', 'under_review', 'resolved', 'rejected'))
```

### Issue Severity
```sql
CHECK (severity IN ('low', 'medium', 'high', 'critical'))
```

### Asset Type
```sql
CHECK (type IN ('logo', 'stamp', 'signature'))
```

### Material File Type
```sql
CHECK (file_type IN ('TDS', 'MSDS', 'COA', 'OTHER'))
```

### Attachment Category
```sql
CHECK (category IN ('certificate', 'government', 'customer', 'shipping', 'other'))
```

### Backup Type
```sql
CHECK (type IN ('manual', 'automatic'))
```

### Backup Destination
```sql
CHECK (destination IN ('online', 'offline'))
```

### Backup Status
```sql
CHECK (status IN ('pending', 'running', 'completed', 'failed'))
```

### Import Status
```sql
CHECK (status IN ('processing', 'completed', 'failed'))
```

### Staging Status
```sql
CHECK (status IN ('pending', 'valid', 'invalid', 'imported'))
```

### License Status
```sql
CHECK (status IN ('active', 'expired', 'suspended', 'grace'))
```

### Document Party Type
```sql
CHECK (party_type IN ('seller', 'buyer', 'consignee', 'notify_party', 'bank'))
```

### Config List Category
```sql
CHECK (category IN ('currency', 'vat_rate', 'weight_unit', 'packing_unit', 'incoterm', 'payment_term', 'delivery_term'))
```

---

## 44. Indexes

### Required Performance Indexes

```sql
-- Company isolation (most queries filter by company_id)
CREATE INDEX idx_customers_company ON customers(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_materials_company ON materials(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_work_items_company ON work_items(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_company ON documents(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_company ON notes(company_id);
CREATE INDEX idx_report_issues_company ON report_issues(company_id);
CREATE INDEX idx_attachments_company ON attachments(company_id);
CREATE INDEX idx_todos_company ON todos(company_id);
CREATE INDEX idx_audit_events_company ON audit_events(company_id);
CREATE INDEX idx_notifications_company ON notifications(company_id);

-- Work item lookups
CREATE INDEX idx_work_items_customer ON work_items(customer_id);
CREATE INDEX idx_work_items_status ON work_items(status);
CREATE INDEX idx_work_items_type ON work_items(type);
CREATE INDEX idx_work_item_materials_work_item ON work_item_materials(work_item_id);

-- Document lookups
CREATE INDEX idx_documents_work_item ON documents(work_item_id);
CREATE INDEX idx_documents_customer ON documents(customer_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_number ON documents(company_id, document_number);
CREATE INDEX idx_document_items_document ON document_items(document_id);

-- User lookups
CREATE INDEX idx_company_memberships_user ON company_memberships(user_id);
CREATE INDEX idx_company_memberships_company ON company_memberships(company_id);
CREATE INDEX idx_todos_user ON todos(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notes_work_item ON notes(work_item_id);

-- Full text search
CREATE INDEX idx_customers_name_gin ON customers USING gin(name gin_trgm_ops);
CREATE INDEX idx_materials_name_gin ON materials USING gin(name gin_trgm_ops);
CREATE INDEX idx_work_items_name_gin ON work_items USING gin(name gin_trgm_ops);
CREATE INDEX idx_factory_code_name_gin ON factory_code_records USING gin(factory_name gin_trgm_ops);

-- Factory code
CREATE INDEX idx_factory_code_stable_key ON factory_code_records(stable_source_key);
CREATE INDEX idx_factory_code_active ON factory_code_records(active_in_latest_source);

-- Trash
CREATE INDEX idx_trash_entries_company ON trash_entries(company_id);
CREATE INDEX idx_trash_entries_entity ON trash_entries(entity_type, entity_id);

-- Audit
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

---

## 45. RLS Policies

All tables have RLS enabled. Policies follow this pattern:

### Standard Company Isolation Policy

```sql
-- Users can only see data for companies they belong to
CREATE POLICY "company_isolation" ON {table}
  FOR ALL
  USING (company_id IN (
    SELECT cm.company_id FROM company_memberships cm
    WHERE cm.user_id = auth.uid() AND cm.active = true
  ));
```

### Tables requiring special RLS

| Table | Policy |
|-------|--------|
| `users` | Users can read all users (for dropdowns). Only self can update. |
| `permission_catalog` | Read-only for all authenticated users. |
| `membership_permissions` | Only admins of the membership's company can modify. |
| `audit_events` | Read: own company. Write: system only (SECURITY DEFINER functions). |
| `trash_entries` | Read: own company users with `trash.view` permission. Restore: `trash.restore`. |
| `factory_code_records` | Read: all authenticated. Write: admin only via SECURITY DEFINER. |
| `factory_code_imports` | Read: all authenticated. Write: admin only. |
| `factory_code_staging` | Write: system only (import pipeline). |
| `backups` | Read: own company. Create: admin only. |
| `system_settings` | System admin only. |
| `deployment_instance` | System admin only. |
| `license_state` | System admin only. |
| `document_party_snapshots` | Inherits from parent document's company. |
| `work_item_shared_data` | Inherits from parent work_item's company. |
| `shipment_details` | Inherits from parent work_item's company. |

---

## Migration File Sequence

| File | Purpose | Tables |
|------|---------|--------|
| `001_initial_schema.sql` | All CREATE TABLE + CHECK constraints + defaults | All 40+ tables |
| `002_rls_and_permissions.sql` | RLS policies + SECURITY DEFINER functions | All tables |
| `003_indexes_and_search.sql` | Performance indexes + full text search | All tables |
| `004_demo_seed.sql` | Demo data for development/testing | All tables |

---

## NOT in SANAD V1 Scope

The following are explicitly **excluded** from this schema:

- Suppliers / Vendor management
- Purchase Orders / Procurement
- Inventory Stock / Warehouses
- Accounting Journal / General Ledger / Payroll
- Sales Orders / CRM Leads / Opportunities
- WhatsApp / Marketing campaigns
- Multi-file versioning (file versions tracked by R2 key, not DB)
- Saved Report Presets (V2 feature)
