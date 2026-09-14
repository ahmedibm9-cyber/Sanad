# SANAD — Data Import / Export Specification

## Factory Code
Excel import and Excel export are core.

## Reports
Export:
- PDF
- XLSX

## Backup
Portable structured offline backup.

## General Excel quality

When exporting:
- `.xlsx`, not fake HTML `.xls`
- real cell types
- headers
- sensible widths
- freeze header
- autofilter
- wrap long text
- dates as dates where possible
- phone/codes preserved as text if leading zeros may matter
- Arabic text preserved correctly

## CSV
Not preferred where Excel formatting/data-type fidelity matters.

## Customer/material bulk import
Not core-confirmed for V1.
Architecture may allow it later but do not spend core milestone time unless approved.

## Import safety
- validate file
- show preview
- report rejected rows
- no silent destructive overwrite
