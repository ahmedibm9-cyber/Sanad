# SANAD — PDF & Printing Specification

## Goal

The output must look like a digitally authored PDF/Word template, never like a scan.

## Requirements

- A4 as default page size.
- Text remains real text where renderer supports it.
- Selectable/searchable text.
- Crisp lines and borders.
- Arabic shaping must be correct.
- RTL document layout must be correct.
- English LTR layout must be correct.
- Logos/signatures/stamps remain high quality.
- Avoid canvas screenshot of the whole document.
- Avoid image-only PDF pages.

## Preview

In-app preview should use the same layout rules as final PDF.

Preview controls:
- zoom
- print
- download PDF
- language
- template where permission allows

## Typography

Use print-readable sizing.

Implementation default ranges:
- Document title: about 18–24 pt equivalent depending on design
- Section heading: about 13–16 pt
- Body/table: about 9–11.5 pt
- Footnotes: not below ~8 pt unless unavoidable

Do not mechanically use web `px` assumptions for print; use print-aware CSS/renderer units.

## Pagination

- Do not split table headers from their rows without repeating header.
- Repeat table header on continued pages.
- Keep totals together when possible.
- Avoid orphaned Prepared By/signature blocks.
- Long notes can flow to next page.
- Never scale an entire page down to unreadably small text just to force one page.

## Assets

Logo:
- fit within defined bounding box
- preserve aspect ratio

Stamp/signature:
- transparent PNG
- realistic printed size
- controlled overlap
- never stretch

## Print

Support browser/system print, but print stylesheet must isolate the document from app chrome.

No sidebar, buttons, dashboard, or hidden app pages may appear in printed output.

## PDF QA

Test:
- one-line item
- many items
- Arabic
- English
- long company names
- long customer names
- large totals
- multiple materials
- signatures/stamps
- 1, 2, 3+ pages
