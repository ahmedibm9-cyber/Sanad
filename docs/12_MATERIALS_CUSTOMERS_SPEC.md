# SANAD — Materials & Customers Specification

## Customers

Per-company only.

Recommended standard fields:
- display/company name
- Arabic name optional
- English name optional
- contact person
- phone
- secondary phone
- email
- country
- city
- address
- postal code
- VAT/tax number
- notes

Customers are not shared between companies.

## Materials

Confirmed:
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

Recommended:
- internal code optional
- description Arabic
- description English

## Last selling price

On Project/Task save:
- if a material line has price/currency/unit, update latest selling price for that company/material.
- when later selecting material, suggest latest price.
- user can overwrite.

Do not automatically push a changed global latest price into old Projects.

## Material files

TDS/MSDS/COA stored once.

Project UI may offer a link/reference to the material file without copying the object.

## Search

Customers:
- name
- contact
- phone
- email
- country

Materials:
- name
- grade
- manufacturer
- HS code
- origin

## Delete

Soft delete to Trash.

Do not break historical Project display if a customer/material is later moved to Trash; historical records retain references/snapshots needed to render old documents.
