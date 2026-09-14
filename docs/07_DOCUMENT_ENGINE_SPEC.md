# SANAD — Document Engine Specification

## 1. Goal

Generate professional export/shipping documents from structured Task/Project data while allowing document-specific edits and controlled synchronization.

## 2. Document types

### Invoice menu
- QUOT — Quotation
- PINV — Proforma Invoice
- TINV — Tax Invoice
- CINV — Commercial Invoice

### Separate actions
- PKL — Packing List
- DN — Delivery Note
- BL — Bill of Lading

## 3. Common document metadata

All documents support:
- company
- work item
- document type
- user-entered document number/reference
- automatic creation date
- language
- template
- prepared by
- notes/terms where relevant
- signature visibility
- stamp visibility

## 4. Common company header data

Pull from Company Settings:
- company Arabic name
- company English name
- legal name
- address
- city/country
- phone
- email
- website
- CR
- VAT/tax number
- logo

Only show fields appropriate to the selected template/document.

## 5. Common customer data

- customer name
- legal/company name
- contact where needed
- address
- city/country
- phone/email where needed
- VAT/tax number where relevant
- consignee details where relevant

## 6. Common material line data

- material name
- grade
- description
- HS code
- origin
- quantity
- weight unit
- unit price where commercial document
- currency
- line total where commercial document
- packing information

## 7. Quotation fields

Standard V1:
- quotation number/reference
- date
- valid until / validity
- customer
- item lines
- quantity
- unit
- unit price
- currency
- subtotal
- VAT where applicable
- total
- origin
- packing
- delivery time
- Incoterm
- delivery terms
- payment terms
- notes
- terms & conditions
- prepared by
- signature/stamp controls

Quotation is not just an Invoice title change.

## 8. Proforma Invoice fields

Implementation default standard:
- PINV number
- issue date
- seller
- buyer
- consignee if applicable
- item lines
- HS code
- origin
- quantity
- price
- subtotal
- VAT if applicable
- total
- currency
- Incoterm
- port/place of delivery
- payment terms
- bank details
- validity
- packing
- notes
- prepared by
- signature/stamp

## 9. Tax Invoice fields

- TINV number
- issue date/time where required
- seller legal/tax details
- buyer details
- buyer VAT where applicable
- item lines
- quantity
- unit
- unit price
- taxable amount
- VAT rate
- VAT amount
- total including VAT
- currency
- QR when configured rule triggers
- payment/commercial references where applicable
- prepared by
- signature/stamp

### ZATCA caution
SANAD's confirmed UI rule is 15% → QR and 0% → no QR. Before production tax compliance is claimed, implementation must be checked against current official ZATCA e-invoicing requirements. Current ZATCA Phase 2 requirements are broader than simply drawing a QR code, so the product must not falsely label itself fully ZATCA-compliant until the dedicated compliance work is completed.

## 10. Commercial Invoice fields

Same commercial data family as Tax Invoice, but:
- title = Commercial Invoice
- template variant = commercial
- tax-specific elements appear only when applicable

Typical fields:
- CINV number
- issue date
- exporter/seller
- buyer/consignee
- items
- HS code
- origin
- quantity
- unit price
- currency
- totals
- Incoterm
- payment terms
- shipping/destination data
- prepared by
- signature/stamp

## 11. Packing List fields

Standard V1:
- PKL number
- date
- exporter
- consignee
- invoice reference
- shipment/project reference where useful
- item
- grade/description
- origin
- packages
- packing type
- quantity
- net weight
- gross weight
- container number
- seal number
- marks & numbers
- CBM where available
- notes
- prepared by
- signature/stamp

## 12. Delivery Note fields

Standard V1:
- DN number
- date
- sender/company
- customer/receiver
- delivery address
- related invoice/project reference
- item
- quantity
- unit
- packing/packages
- driver/vehicle fields only if later approved
- receiver name
- received-by/signature area
- notes
- prepared by
- company stamp/signature controls

## 13. Bill of Lading fields

Confirmed minimum:
- BL number/reference
- date
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

Implementation defaults:
- Place of Receipt
- Place of Delivery
- Freight terms
- Number of originals
- remarks

These defaults are removable if client template differs.

## 14. Document number

- User-entered.
- Date automatic and separate.
- No mandatory auto serial.
- Unique per company.
- Editing permitted if authorized and uniqueness remains valid.

## 15. Shared/document-specific fields

Each template form schema marks every field:
- `shared`
- `document_specific`
- `derived`

Only `shared` participates in project synchronization.

## 16. Prepared By / assets

Prepared By editable.

Stamp/signature:
- transparent PNG
- realistic printed scale
- can overlap a small portion of signature/name area naturally
- never cover critical values
- visibility configurable per document

## 17. Two template families

### Template A — Classic Minimal
- strong typographic hierarchy
- thin rules
- compact header
- traditional business-table structure

### Template B — Modern Minimal
- more whitespace
- structured information cards/blocks
- restrained lines
- same information density and print clarity

No decorative color dependency.

## 18. Rendering

The business data model must be independent from HTML/PDF layout so templates can change without changing stored data.
