/* ──────────────────────────────────────────────────────────────
 * Fulla Template Renderer — single source of truth for all 7 docs
 *
 * Uses data-field attributes from the template package.
 * One renderer for preview, print, AND PDF.
 * ────────────────────────────────────────────────────────────── */

/* ── HTML Templates (verbatim from Fulla_Dynamic_HTML_CSS_Templates) ── */

const TEMPLATES: Record<string, string> = {
  /* ── Invoice (shared by QUOT / PINV / TINV-A / TINV-B / CINV) ── */
  'invoice': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice</title></head><body>
<div class="page invoice-page"><div class="sheet">
  <header class="invoice-head">
    <div class="company-block"><div class="company-name">Fulla Trading Company</div><div class="company-info">Al Suliy District · Riyadh K.S.A<br>Phone: +96611235998<br>Mob: +966506247907<br>Email: a.masoud@fulla.sa<br>Website: www.Fulla.sa<br>VAT: 312339846000003<br>CR: 1010233879</div></div>
    <img class="fulla-logo" src="assets/fulla-logo.jpg" alt="FULLA">
    <div class="invoice-title ">TAX INVOICE</div>
    <div class="invoice-meta">
      <div class="meta-row"><span class="meta-label">Date</span><span class="meta-val dynamic-slot" data-field="date"></span></div>
      <div class="meta-row"><span class="meta-label">Expiration Date</span><span class="meta-val dynamic-slot" data-field="expiration_date"></span></div>
      <div class="meta-row boxed"><span class="meta-label">Invoice #</span><span class="meta-val dynamic-slot" data-field="invoice_number"></span></div>
      <div class="meta-row boxed"><span class="meta-label">Customer ID</span><span class="meta-val dynamic-slot" data-field="customer_id"></span></div>
    </div>
  </header>
  <section class="customer-box">
    <div class="section-caption">CUSTOMER</div>
    <div class="customer-row"><b>Buyer:</b><span class="customer-value strong dynamic-slot" data-field="customer.name"></span></div>
    <div class="customer-row"><span>Address:</span><span class="customer-value dynamic-slot" data-field="customer.address"></span></div>
    <div class="customer-row"><span>Contact:</span><span class="customer-value dynamic-slot" data-field="customer.contact"></span></div>
    <div class="customer-row"><span>Contact No:</span><span class="customer-value dynamic-slot" data-field="customer.phone"></span></div>
  </section>
  <table class="invoice-items">
    <thead><tr><th class="code">Item Code</th><th class="desc">Description</th><th class="qty">Quantity<br><span style="font-size:8px">U.O.M</span></th><th class="price">Price<br><span class="dynamic-slot header-slot" data-field="currency"></span></th><th class="total">Total amount</th></tr></thead>
    <tbody data-items-body="invoice">
      <tr data-item-row="0"><td class="code dynamic-slot" data-field="items.0.item_code"></td><td class="desc"><div class="item-name dynamic-slot" data-field="items.0.description"></div><div class="item-desc-line"><span data-show-if="items.0.hs_code">HS Code: </span><span class="dynamic-slot" data-field="items.0.hs_code"></span></div><div class="item-desc-line"><span data-show-if="items.0.packing">Packing: </span><span class="dynamic-slot" data-field="items.0.packing"></span></div><div class="item-desc-line"><span data-show-if="items.0.origin">ORIGIN: </span><span class="dynamic-slot" data-field="items.0.origin"></span></div></td><td class="qty"><div class="qty-main dynamic-slot" data-field="items.0.quantity"></div><div class="unit-small dynamic-slot" data-field="items.0.uom"></div></td><td class="price"><div class="price-main dynamic-slot" data-field="items.0.price"></div></td><td class="total"><div class="total-main dynamic-slot" data-field="items.0.amount"></div></td></tr>
    </tbody>
  </table>
  <section class="terms-wrap"><div class="terms-left"><div class="terms-caption">TERMS OF SALE AND OTHER COMMENTS</div>
    <div class="terms-row"><span>Payment terms:</span><span class="dynamic-slot" data-field="terms.payment"></span></div>
    <div class="terms-row"><span>Delivery Terms:</span><span class="dynamic-slot" data-field="terms.delivery"></span></div>
    <div class="terms-row"><span>Shipping:</span><span class="dynamic-slot" data-field="terms.shipping"></span></div>
    <div class="terms-row"><span></span><span class="dynamic-slot" data-field="terms.shipping_extra"></span></div>
    <div class="validation dynamic-slot" data-field="terms.validity"></div>
    <div class="bank-title"><span class="dynamic-slot" data-field="bank.name"></span><span data-show-if="bank.currency"> — </span><span class="dynamic-slot" data-field="bank.currency"></span></div>
    <div class="bank-row"><span>Account Name: </span><span class="dynamic-slot" data-field="bank.account_name"></span></div>
    <div class="bank-row"><span>IBAN: </span><span class="dynamic-slot" data-field="bank.iban"></span></div>
    <div class="bank-row"><span>SWIFT: </span><span class="dynamic-slot" data-field="bank.swift"></span></div>
  </div><div><table class="totals">
    <tr><td>Subtotal</td><td class="dynamic-slot" data-field="totals.subtotal"></td></tr>
    <tr><td>Tax rate</td><td class="dynamic-slot" data-field="totals.tax_rate"></td></tr>
    <tr><td>VAT (<span class="dynamic-slot inline-slot" data-field="totals.tax_rate"></span>)</td><td class="dynamic-slot" data-field="totals.vat"></td></tr>
    <tr class="grand"><td>TOTAL</td><td class="dynamic-slot" data-field="totals.total"></td></tr>
    <tr class="currency"><td>Currency</td><td class="dynamic-slot" data-field="currency"></td></tr>
  </table></div></section>
  <div class="arabic-note"><img src="assets/arabic-note.jpg" alt="Arabic note"></div>
  <div class="manager">Export Manager<br><span class="dynamic-slot" data-field="approved_by"></span></div>
  <img class="stamp" src="assets/stamp-signature.jpg" alt="Stamp and signature">
</div></div></body></html>`,

  'quotation': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quotation</title></head><body>
<div class="page invoice-page quotation-page"><div class="sheet">
  <header class="invoice-head">
    <div class="company-block"><div class="company-name">Fulla Trading Company</div><div class="company-info">Al Suliy District · Riyadh K.S.A<br>Phone: +96611235998<br>Mob: +966506247907<br>Email: a.masoud@fulla.sa<br>Website: www.Fulla.sa<br>VAT: 312339846000003<br>CR: 1010233879</div></div>
    <img class="fulla-logo" src="assets/fulla-logo.jpg" alt="FULLA">
    <div class="invoice-title ">QUOTATION / <span class="title-ar" dir="rtl">عرض سعر</span></div>
    <div class="invoice-meta">
      <div class="meta-row"><span class="meta-label">Date</span><span class="meta-val dynamic-slot" data-field="date"></span></div>
      <div class="meta-row"><span class="meta-label">Expiration Date</span><span class="meta-val dynamic-slot" data-field="expiration_date"></span></div>
      <div class="meta-row boxed"><span class="meta-label">Invoice #</span><span class="meta-val dynamic-slot" data-field="invoice_number"></span></div>
      <div class="meta-row boxed"><span class="meta-label">Customer ID</span><span class="meta-val dynamic-slot" data-field="customer_id"></span></div>
    </div>
  </header>
  <section class="customer-box">
    <div class="section-caption">CUSTOMER</div>
    <div class="customer-row"><b>Buyer:</b><span class="customer-value strong dynamic-slot" data-field="customer.name"></span></div>
    <div class="customer-row"><span>Address:</span><span class="customer-value dynamic-slot" data-field="customer.address"></span></div>
    <div class="customer-row"><span>Contact:</span><span class="customer-value dynamic-slot" data-field="customer.contact"></span></div>
    <div class="customer-row"><span>Contact No:</span><span class="customer-value dynamic-slot" data-field="customer.phone"></span></div>
  </section>
  <table class="invoice-items">
    <thead><tr><th class="code">Item Code</th><th class="desc">Description</th><th class="qty">Quantity<br><span style="font-size:8px">U.O.M</span></th><th class="price">Price<br><span class="dynamic-slot header-slot" data-field="currency"></span></th><th class="total">Total amount</th></tr></thead>
    <tbody data-items-body="invoice">
      <tr data-item-row="0"><td class="code dynamic-slot" data-field="items.0.item_code"></td><td class="desc"><div class="item-name dynamic-slot" data-field="items.0.description"></div><div class="item-desc-line"><span data-show-if="items.0.hs_code">HS Code: </span><span class="dynamic-slot" data-field="items.0.hs_code"></span></div><div class="item-desc-line"><span data-show-if="items.0.packing">Packing: </span><span class="dynamic-slot" data-field="items.0.packing"></span></div><div class="item-desc-line"><span data-show-if="items.0.origin">ORIGIN: </span><span class="dynamic-slot" data-field="items.0.origin"></span></div></td><td class="qty"><div class="qty-main dynamic-slot" data-field="items.0.quantity"></div><div class="unit-small dynamic-slot" data-field="items.0.uom"></div></td><td class="price"><div class="price-main dynamic-slot" data-field="items.0.price"></div></td><td class="total"><div class="total-main dynamic-slot" data-field="items.0.amount"></div></td></tr>
    </tbody>
  </table>
  <section class="terms-wrap"><div class="terms-left"><div class="terms-caption">TERMS OF SALE AND OTHER COMMENTS</div>
    <div class="terms-row"><span>Payment terms:</span><span class="dynamic-slot" data-field="terms.payment"></span></div>
    <div class="terms-row"><span>Delivery Terms:</span><span class="dynamic-slot" data-field="terms.delivery"></span></div>
    <div class="terms-row"><span>Shipping:</span><span class="dynamic-slot" data-field="terms.shipping"></span></div>
    <div class="terms-row"><span></span><span class="dynamic-slot" data-field="terms.shipping_extra"></span></div>
    <div class="validation dynamic-slot" data-field="terms.validity"></div>
    <div class="bank-title"><span class="dynamic-slot" data-field="bank.name"></span><span data-show-if="bank.currency"> — </span><span class="dynamic-slot" data-field="bank.currency"></span></div>
    <div class="bank-row"><span>Account Name: </span><span class="dynamic-slot" data-field="bank.account_name"></span></div>
    <div class="bank-row"><span>IBAN: </span><span class="dynamic-slot" data-field="bank.iban"></span></div>
    <div class="bank-row"><span>SWIFT: </span><span class="dynamic-slot" data-field="bank.swift"></span></div>
  </div><div><table class="totals">
    <tr><td>Subtotal</td><td class="dynamic-slot" data-field="totals.subtotal"></td></tr>
    <tr><td>Tax rate</td><td class="dynamic-slot" data-field="totals.tax_rate"></td></tr>
    <tr><td>VAT (<span class="dynamic-slot inline-slot" data-field="totals.tax_rate"></span>)</td><td class="dynamic-slot" data-field="totals.vat"></td></tr>
    <tr class="grand"><td>TOTAL</td><td class="dynamic-slot" data-field="totals.total"></td></tr>
    <tr class="currency"><td>Currency</td><td class="dynamic-slot" data-field="currency"></td></tr>
  </table></div></section>
  <div class="arabic-note"><img src="assets/arabic-note.jpg" alt="Arabic note"></div>
  <div class="manager">Export Manager<br><span class="dynamic-slot" data-field="approved_by"></span></div>
  <img class="stamp" src="assets/stamp-signature.jpg" alt="Stamp and signature">
</div></div></body></html>`,

  'commercial': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Commercial Invoice</title></head><body>
<div class="page invoice-page commercial-page"><div class="sheet">
  <header class="invoice-head">
    <div class="company-block"><div class="company-name">Fulla Trading Company</div><div class="company-info">Al Suliy District · Riyadh K.S.A<br>Phone: +96611235998<br>Mob: +966506247907<br>Email: a.masoud@fulla.sa<br>Website: www.Fulla.sa<br>VAT: 312339846000003<br>CR: 1010233879</div></div>
    <img class="fulla-logo" src="assets/fulla-logo.jpg" alt="FULLA">
    <div class="invoice-title commercial">COMMERCIAL<br>INVOICE</div>
    <div class="invoice-meta">
      <div class="meta-row"><span class="meta-label">Date</span><span class="meta-val dynamic-slot" data-field="date"></span></div>
      <div class="meta-row"><span class="meta-label">Expiration Date</span><span class="meta-val dynamic-slot" data-field="expiration_date"></span></div>
      <div class="meta-row boxed"><span class="meta-label">Invoice #</span><span class="meta-val dynamic-slot" data-field="invoice_number"></span></div>
      <div class="meta-row boxed"><span class="meta-label">Customer ID</span><span class="meta-val dynamic-slot" data-field="customer_id"></span></div>
    </div>
  </header>
  <section class="customer-box">
    <div class="section-caption">CUSTOMER</div>
    <div class="customer-row"><b>Buyer:</b><span class="customer-value strong dynamic-slot" data-field="customer.name"></span></div>
    <div class="customer-row"><span>Address:</span><span class="customer-value dynamic-slot" data-field="customer.address"></span></div>
    <div class="customer-row"><span>Contact:</span><span class="customer-value dynamic-slot" data-field="customer.contact"></span></div>
    <div class="customer-row"><span>Contact No:</span><span class="customer-value dynamic-slot" data-field="customer.phone"></span></div>
  </section>
  <table class="invoice-items">
    <thead><tr><th class="code">Item Code</th><th class="desc">Description</th><th class="qty">Quantity<br><span style="font-size:8px">U.O.M</span></th><th class="price">Price<br><span class="dynamic-slot header-slot" data-field="currency"></span></th><th class="total">Total amount</th></tr></thead>
    <tbody data-items-body="invoice">
      <tr data-item-row="0"><td class="code dynamic-slot" data-field="items.0.item_code"></td><td class="desc"><div class="item-name dynamic-slot" data-field="items.0.description"></div><div class="item-desc-line"><span data-show-if="items.0.hs_code">HS Code: </span><span class="dynamic-slot" data-field="items.0.hs_code"></span></div><div class="item-desc-line"><span data-show-if="items.0.packing">Packing: </span><span class="dynamic-slot" data-field="items.0.packing"></span></div><div class="item-desc-line"><span data-show-if="items.0.origin">ORIGIN: </span><span class="dynamic-slot" data-field="items.0.origin"></span></div></td><td class="qty"><div class="qty-main dynamic-slot" data-field="items.0.quantity"></div><div class="unit-small dynamic-slot" data-field="items.0.uom"></div></td><td class="price"><div class="price-main dynamic-slot" data-field="items.0.price"></div></td><td class="total"><div class="total-main dynamic-slot" data-field="items.0.amount"></div></td></tr>
    </tbody>
  </table>
  <section class="terms-wrap"><div class="terms-left"><div class="terms-caption">TERMS OF SALE AND OTHER COMMENTS</div>
    <div class="terms-row"><span>Payment terms:</span><span class="dynamic-slot" data-field="terms.payment"></span></div>
    <div class="terms-row"><span>Delivery Terms:</span><span class="dynamic-slot" data-field="terms.delivery"></span></div>
    <div class="terms-row"><span>Shipping:</span><span class="dynamic-slot" data-field="terms.shipping"></span></div>
    <div class="terms-row"><span></span><span class="dynamic-slot" data-field="terms.shipping_extra"></span></div>
    <div class="validation dynamic-slot" data-field="terms.validity"></div>
    <div class="bank-title"><span class="dynamic-slot" data-field="bank.name"></span><span data-show-if="bank.currency"> — </span><span class="dynamic-slot" data-field="bank.currency"></span></div>
    <div class="bank-row"><span>Account Name: </span><span class="dynamic-slot" data-field="bank.account_name"></span></div>
    <div class="bank-row"><span>IBAN: </span><span class="dynamic-slot" data-field="bank.iban"></span></div>
    <div class="bank-row"><span>SWIFT: </span><span class="dynamic-slot" data-field="bank.swift"></span></div>
  </div><div><table class="totals">
    <tr><td>Subtotal</td><td class="dynamic-slot" data-field="totals.subtotal"></td></tr>
    <tr><td>Tax rate</td><td class="dynamic-slot" data-field="totals.tax_rate"></td></tr>
    <tr><td>VAT (<span class="dynamic-slot inline-slot" data-field="totals.tax_rate"></span>)</td><td class="dynamic-slot" data-field="totals.vat"></td></tr>
    <tr class="grand"><td>TOTAL</td><td class="dynamic-slot" data-field="totals.total"></td></tr>
    <tr class="currency"><td>Currency</td><td class="dynamic-slot" data-field="currency"></td></tr>
  </table></div></section>
  <div class="arabic-note"><img src="assets/arabic-note.jpg" alt="Arabic note"></div>
  <div class="manager">Export Manager<br><span class="dynamic-slot" data-field="approved_by"></span></div>
  <img class="stamp" src="assets/stamp-signature.jpg" alt="Stamp and signature">
</div></div></body></html>`,

  'packing-list': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Packing List</title></head><body>
<div class="page packing-page"><div class="sheet">
<header class="packing-head"><div class="company-block"><div class="company-name">Fulla Trading Company</div><div class="company-info">Al Suliy District · Riyadh K.S.A<br>Phone: +96611235998<br>Mob: +966506247907<br>Email: a.masoud@fulla.sa<br>Website: www.Fulla.sa<br>VAT: 312339846000003<br>CR: 1010233879</div></div><img class="fulla-logo" src="assets/fulla-logo.jpg" alt="FULLA"><div class="packing-title">PACKING LIST</div><div class="packing-no dynamic-slot" data-field="packing_list_number"></div><div class="packing-date dynamic-slot" data-field="date"></div></header>
<section class="packing-info"><div class="packing-info-left"><div class="packing-info-top"><div class="pi-cell"><div class="pi-label">Packing List No·</div><div class="pi-value dynamic-slot" data-field="packing_list_number"></div></div><div class="pi-cell"><div class="pi-label">Date</div><div class="pi-value dynamic-slot" data-field="date"></div></div></div><div class="consignee"><div class="pi-label">Consignee</div><div class="dynamic-slot" data-field="customer.name"></div><div class="dynamic-slot" data-field="customer.address_line1"></div><div class="dynamic-slot" data-field="customer.address_line2"></div><div class="dynamic-slot" data-field="customer.phone"></div></div></div><div class="marks"><div class="pi-label">Invoice Reference</div><div class="pi-value dynamic-slot" data-field="invoice_reference"></div><div class="pi-label" style="margin-top:7px">Marks &amp; Numbers</div><div class="pi-value dynamic-slot" data-field="marks_numbers"></div></div></section>
<table class="packing-items"><thead><tr><th class="marks-col">Marks</th><th class="code-col">Item Code</th><th class="desc-col">Item Name / Description of Goods</th><th class="pack-col">Packages</th><th class="qty-col">Quantity</th><th class="net-col">Net KG</th><th class="gross-col">Gross<br>KG</th></tr></thead><tbody data-items-body="packing"><tr data-item-row="0"><td class="marks-col dynamic-slot" data-field="items.0.marks"></td><td class="code-col dynamic-slot" data-field="items.0.item_code"></td><td class="desc-col"><div class="item-name dynamic-slot" data-field="items.0.description"></div><div class="item-desc-line"><span data-show-if="items.0.hs_code">HS: </span><span class="dynamic-slot" data-field="items.0.hs_code"></span><span data-show-if="items.0.packing"> · Packing: </span><span class="dynamic-slot" data-field="items.0.packing"></span><span data-show-if="items.0.origin"> · Origin: </span><span class="dynamic-slot" data-field="items.0.origin"></span></div></td><td class="pack-col dynamic-slot" data-field="items.0.packages"></td><td class="qty-col"><span class="dynamic-slot" data-field="items.0.quantity"></span><span data-show-if="items.0.uom"> </span><span class="dynamic-slot" data-field="items.0.uom"></span></td><td class="net-col dynamic-slot" data-field="items.0.net_kg"></td><td class="gross-col dynamic-slot" data-field="items.0.gross_kg"></td></tr></tbody></table>
<section class="container-row"><div class="container-cell">Container<div class="v dynamic-slot" data-field="container.type"></div></div><div class="container-cell">Seal<div class="v dynamic-slot" data-field="container.seal"></div></div><div class="container-cell">Packages<div class="v dynamic-slot" data-field="container.packages"></div></div><div class="container-cell">CBM<div class="v dynamic-slot" data-field="container.cbm"></div></div></section>
<div class="packing-manager">Export Manager<br><span class="dynamic-slot" data-field="approved_by"></span></div><img class="packing-stamp" src="assets/stamp-signature.jpg" alt="Stamp and signature">
</div></div></body></html>`,

  'delivery-note': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Delivery Note</title></head><body>
<div class="page delivery-page"><div class="sheet">
<header class="delivery-banner"><div class="big">DELIVERY NOTE</div><div class="small">Export Material Issue Voucher</div></header>
<div class="delivery-brand"><img src="assets/delivery-logo.jpg" alt="FULLA - Fulla Trading Company"></div>
<section class="delivery-summary"><div class="label">Delivery Note No·</div><div class="dynamic-slot" data-field="delivery_note_number"></div><div class="label">Date</div><div class="dynamic-slot" data-field="date"></div><div class="label">Customer / Importer</div><div class="dynamic-slot" data-field="customer.name"></div><div class="label">Shipping Method</div><div class="dynamic-slot" data-field="shipping_method"></div><div class="label">Destination (Country)</div><div class="dynamic-slot" data-field="destination"></div><div class="label">Deliver / Prepare Before</div><div class="dynamic-slot" data-field="prepare_before"></div></section>
<section class="delivery-details"><div class="delivery-details-title">DELIVERY DETAILS</div><div class="detail-row"><div class="label">Invoice No·:</div><div class="value strong dynamic-slot" data-field="invoice_number"></div></div><div class="detail-row"><div class="label">Document No·:</div><div class="value dynamic-slot" data-field="document_number"></div></div><div class="detail-row"><div class="label">Date:</div><div class="value dynamic-slot" data-field="date"></div></div><div class="detail-row"><div class="label">Customer / Consignee:</div><div class="value dynamic-slot" data-field="customer.name"></div></div><div class="detail-row"><div class="label">Invoice No·:</div><div class="value dynamic-slot" data-field="customer_invoice_number"></div></div><div class="detail-row"><div class="label">Destination:</div><div class="value dynamic-slot" data-field="destination"></div></div><div class="detail-row"><div class="label">Shipping Method:</div><div class="value dynamic-slot" data-field="shipping_method"></div></div><div class="detail-row"><div class="label">Prepare Before:</div><div class="value dynamic-slot" data-field="prepare_before"></div></div></section>
<table class="delivery-items"><thead><tr><th class="n">#</th><th class="code">Item Code</th><th class="name">Item Name / Material<br>Description</th><th class="unit">Unit</th><th class="q">Quantity<br>Delivered</th><th class="origin">Country of<br>Origin</th><th class="remarks">Remarks</th></tr></thead><tbody><tr data-item-row="0"><td class="n">1</td><td class="code dynamic-slot" data-field="items.0.item_code"></td><td class="name dynamic-slot" data-field="items.0.description"></td><td class="unit dynamic-slot" data-field="items.0.uom"></td><td class="q dynamic-slot" data-field="items.0.quantity"></td><td class="origin dynamic-slot" data-field="items.0.origin"></td><td class="remarks dynamic-slot" data-field="items.0.remarks"></td></tr></tbody></table>
<section class="approvals"><div class="approvals-title">Approvals &amp; Signatures</div><div class="approvals-grid"><div class="approval-col"><div class="approval-head">Approved by (Export Manager)</div><div class="approval-name dynamic-slot" data-field="approved_by"></div></div><div class="approval-col"><div class="approval-head">Received by (Customer / Carrier)</div><div class="approval-name dynamic-slot" data-field="received_by"></div></div></div></section>
</div></div></body></html>`,
}

/* ── Template title overrides (applied after cloning) ── */
const TITLE_OVERRIDES: Record<string, { pageClass?: string; titleHtml?: string }> = {
  'invoice-tax-a': {
    titleHtml: 'TAX INVOICE',
  },
  'invoice-tax-b': {
    titleHtml: 'TAX INVOICE',
  },
  'invoice-proforma': {
    titleHtml: 'PROFORMA INVOICE',
  },
  'invoice-commercial': {
    pageClass: 'invoice-page commercial-page',
    titleHtml: 'COMMERCIAL<br>INVOICE',
  },
  'quotation': {
    titleHtml: 'QUOTATION / <span class="title-ar" dir="rtl">عرض سعر</span>',
  },
}

/* ── Data-field fill logic (mirrors fulla-template.js) ── */

function getByPath(obj: unknown, path: string): unknown {
  if (!path) return undefined
  return path.split('.').reduce<unknown>((v, k) => {
    if (v == null || typeof v !== 'object') return undefined
    return (v as Record<string, unknown>)[k]
  }, obj)
}

function text(v: unknown): string {
  return v == null ? '' : String(v)
}

/** Escape HTML entities to prevent XSS from user-supplied data. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Fill all [data-field] elements in a DOM tree with values from `data`.
 * Operates on a parsed DocumentFragment inside a detached DOM.
 */
function fillDataFields(root: DocumentFragment, data: Record<string, unknown>): void {
  root.querySelectorAll<HTMLElement>('[data-field]').forEach(el => {
    const field = el.getAttribute('data-field')!
    const val = getByPath(data, field)
    el.textContent = text(val)
  })

  root.querySelectorAll<HTMLElement>('[data-show-if]').forEach(el => {
    const field = el.getAttribute('data-show-if')!
    const val = getByPath(data, field)
    const show = val !== undefined && val !== null && val !== ''
    el.style.display = show ? 'inline' : 'none'
  })
}

/**
 * Clone item rows for the invoice-family templates.
 * The template has 1 row (index 0). We clone it (n-1) times and renumber indices.
 */
function cloneInvoiceRows(tbody: HTMLElement, itemCount: number): void {
  const templateRow = tbody.querySelector<HTMLElement>('[data-item-row="0"]')
  if (!templateRow) return

  const existingRows = tbody.querySelectorAll<HTMLElement>('[data-item-row]')
  const existingCount = existingRows.length

  if (itemCount > existingCount) {
    const cloned = templateRow.cloneNode(true) as HTMLElement
    for (let i = existingCount; i < itemCount; i++) {
      const row = cloned.cloneNode(true) as HTMLElement
      row.setAttribute('data-item-row', String(i))
      row.querySelectorAll<HTMLElement>('[data-field]').forEach(el => {
        const field = el.getAttribute('data-field')!
        el.setAttribute('data-field', field.replace(/items\.0\./, `items.${i}.`))
      })
      row.querySelectorAll<HTMLElement>('[data-show-if]').forEach(el => {
        const field = el.getAttribute('data-show-if')!
        el.setAttribute('data-show-if', field.replace(/items\.0\./, `items.${i}.`))
      })
      tbody.appendChild(row)
    }
  }
}

/**
 * Clone item rows for the delivery-note template.
 * Delivery note has 1 row but numbers items sequentially (1, 2, 3...).
 */
function cloneDeliveryRows(tbody: HTMLElement, itemCount: number): void {
  const templateRow = tbody.querySelector<HTMLElement>('[data-item-row="0"]')
  if (!templateRow) return

  const existingRows = tbody.querySelectorAll<HTMLElement>('[data-item-row]')
  const existingCount = existingRows.length

  if (itemCount > existingCount) {
    const cloned = templateRow.cloneNode(true) as HTMLElement
    for (let i = existingCount; i < itemCount; i++) {
      const row = cloned.cloneNode(true) as HTMLElement
      row.setAttribute('data-item-row', String(i))
      const numCell = row.querySelector<HTMLElement>('.n')
      if (numCell) numCell.textContent = String(i + 1)
      row.querySelectorAll<HTMLElement>('[data-field]').forEach(el => {
        const field = el.getAttribute('data-field')!
        el.setAttribute('data-field', field.replace(/items\.0\./, `items.${i}.`))
      })
      row.querySelectorAll<HTMLElement>('[data-show-if]').forEach(el => {
        const field = el.getAttribute('data-show-if')!
        el.setAttribute('data-show-if', field.replace(/items\.0\./, `items.${i}.`))
      })
      tbody.appendChild(row)
    }
  }
}

/* ── Public API ── */

export type FullaTemplateId =
  | 'invoice'
  | 'invoice-tax-a'
  | 'invoice-tax-b'
  | 'invoice-proforma'
  | 'invoice-commercial'
  | 'quotation'
  | 'packing-list'
  | 'delivery-note'

/**
 * Render a Fulla template to an HTML string.
 *
 * @param templateId - which template to render
 * @param data       - flat key-value data object (output of fullaSchemaAdapter)
 * @returns complete HTML string ready for dangerouslySetInnerHTML or html2canvas
 */
export function renderFullaTemplate(
  templateId: FullaTemplateId,
  data: Record<string, unknown>,
): string {
  // Pick base template
  const isInvoiceFamily = templateId.startsWith('invoice') || templateId === 'quotation'
  const baseKey = templateId === 'quotation'
    ? 'quotation'
    : templateId === 'packing-list'
      ? 'packing-list'
      : templateId === 'delivery-note'
        ? 'delivery-note'
        : 'invoice'

  let html = TEMPLATES[baseKey]
  if (!html) {
    console.error(`[fullaTemplateRenderer] Unknown template: ${templateId}`)
    return ''
  }

  // Parse into detached DOM
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const page = doc.querySelector<HTMLElement>('.page')
  if (!page) return html

  // Apply title/class overrides
  const override = TITLE_OVERRIDES[templateId]
  if (override) {
    if (override.pageClass) {
      page.className = `page ${override.pageClass}`
    }
    if (override.titleHtml) {
      const titleEl = page.querySelector<HTMLElement>('.invoice-title')
      if (titleEl) titleEl.innerHTML = override.titleHtml
    }
  }

  // Clone item rows before filling
  const isInvoice = isInvoiceFamily && !templateId.startsWith('quotation')
  const isPacking = templateId === 'packing-list'
  const isDelivery = templateId === 'delivery-note'

  if (isInvoice || isPacking) {
    const bodySelector = isPacking ? '[data-items-body="packing"]' : '[data-items-body="invoice"]'
    const tbody = page.querySelector<HTMLElement>(bodySelector)
    const itemCount = Array.isArray(data.items) ? data.items.length : 0
    if (tbody && itemCount > 0) {
      cloneInvoiceRows(tbody, itemCount)
    }
  } else if (isDelivery) {
    const tbody = page.querySelector<HTMLElement>('tbody')
    const itemCount = Array.isArray(data.items) ? data.items.length : 0
    if (tbody && itemCount > 0) {
      cloneDeliveryRows(tbody, itemCount)
    }
  }

  // Fill data fields
  // We need to create a proper DocumentFragment from the page
  const fragment = doc.createDocumentFragment()
  fragment.appendChild(page.cloneNode(true))
  fillDataFields(fragment, data)

  // Return the filled page HTML
  const filledPage = fragment.querySelector<HTMLElement>('.page')
  return filledPage ? filledPage.outerHTML : ''
}

/**
 * Get the CSS needed for the template.
 * This is the fulla-template.css content, inlined for portability.
 */
export function getFullaTemplateCSS(): string {
  // The CSS is imported at the component level via fullaDocStyles.css
  // This function returns it for PDF export where CSS may not be loaded
  return FULLA_TEMPLATE_CSS
}

/* ── Inlined CSS (fulla-template.css) ── */
const FULLA_TEMPLATE_CSS = `
:root{
  --ink:#111;
  --line:#506066;
  --accent:#0a4549;
  --green:#12634c;
  --pale:#f4eed1;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#e9ecef;font-family:Arial,Helvetica,Tahoma,sans-serif;color:var(--ink)}
body{padding:16px}
.page{
  position:relative;
  width:794px;
  height:1123px;
  margin:0 auto 24px;
  background:#fff;
  overflow:hidden;
  box-shadow:0 2px 18px rgba(0,0,0,.14);
  font-size:12px;
  line-height:1.15;
}
.page *{print-color-adjust:exact;-webkit-print-color-adjust:exact}
@page{size:A4;margin:0}
@media print{
  html,body{background:#fff;padding:0;margin:0}
  .page{width:210mm;height:297mm;margin:0;box-shadow:none;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .no-print{display:none!important}
}

/* ---------- Common invoice / quotation ---------- */
.invoice-page .sheet{position:absolute;left:30px;right:30px;top:20px}
.invoice-head{height:119px;position:relative;border-bottom:3px solid var(--accent)}
.company-block{position:absolute;left:0;top:0;width:270px}
.company-name{font-size:19px;font-weight:800;line-height:1.0;margin-bottom:6px;letter-spacing:-.2px}
.company-info{font-size:8.5px;line-height:1.42;color:#222}
.fulla-logo{position:absolute;left:302px;top:23px;width:185px;height:53px;object-fit:cover;object-position:center}
.invoice-title{position:absolute;right:0;top:2px;width:250px;text-align:right;font-size:20px;font-weight:900;color:var(--accent);line-height:1.0;letter-spacing:.15px}
.invoice-title.commercial{line-height:.93}
.title-ar{font-family:Tahoma,Arial,sans-serif;white-space:nowrap}
.invoice-meta{position:absolute;right:0;top:28px;width:240px;font-size:11px}
.meta-row{display:grid;grid-template-columns:87px 1fr;min-height:19px;align-items:center}
.meta-label{font-weight:700;padding-left:0}
.meta-val{text-align:right;white-space:nowrap}
.meta-row.boxed .meta-val{border:1px solid #9ba3a5;padding:2px 5px;min-height:19px}

.customer-box{margin-top:9px;height:93px;border:1px solid var(--line);padding:7px 7px 4px}
.section-caption{font-size:11px;font-weight:800;margin-bottom:2px;letter-spacing:.2px}
.customer-row{display:grid;grid-template-columns:68px 1fr;min-height:18px;align-items:start}
.customer-row b{font-size:11px}
.customer-value{font-size:11px}
.customer-value.strong{font-weight:700}

.invoice-items{width:100%;border-collapse:collapse;margin-top:8px;table-layout:fixed}
.invoice-items th,.invoice-items td{border:1px solid var(--line);padding:4px 5px;vertical-align:top}
.invoice-items th{height:36px;background:#f5f6f7;text-align:center;font-size:12px;font-weight:800}
.invoice-items td{height:73px;font-size:11px}
.invoice-items .code{width:96px;text-align:center;font-weight:600}
.invoice-items .desc{width:337px;text-align:center}
.invoice-items .qty{width:80px;text-align:center}
.invoice-items .price{width:96px;text-align:center}
.invoice-items .total{width:125px;text-align:right}
.item-name{font-weight:800;font-size:12px;margin:2px 0 5px}
.item-desc-line{font-size:11px;line-height:1.25}
.qty-main{font-weight:800;font-size:12px;margin-top:16px}
.unit-small{font-size:8px;font-weight:800;margin-top:2px}
.price-main{font-weight:700}
.total-main{font-weight:700}

.terms-wrap{display:grid;grid-template-columns:1fr 271px;margin-top:8px;height:201px;border:1px solid var(--line)}
.terms-left{padding:4px 8px 6px;border-right:1px solid var(--line)}
.terms-caption{font-size:12px;font-weight:800;margin-bottom:7px}
.terms-row{display:grid;grid-template-columns:103px 1fr;font-size:11px;line-height:1.35;min-height:20px}
.validation{margin:4px 0 8px 103px;font-size:11px}
.bank-title{font-size:12px;font-weight:800;margin:2px 0 4px 5px}
.bank-row{font-size:11px;line-height:1.35;margin-left:5px}
.totals{width:100%;border-collapse:collapse;table-layout:fixed;margin:4px 8px 0 8px;width:calc(100% - 16px)}
.totals td{border:1px solid var(--line);height:25px;padding:4px 6px;font-size:11px}
.totals td:first-child{width:50%}
.totals td:last-child{text-align:right}
.totals .grand td{font-weight:900;font-size:17px;height:32px}
.totals .currency td:last-child{font-weight:800}

.arabic-note{height:25px;margin-top:5px;display:flex;align-items:center}
.arabic-note img{width:225px;height:21px;object-fit:cover}
.manager{border-top:1px solid #777;padding-top:4px;font-size:12px;font-weight:800;line-height:1.35}
.stamp{position:absolute;left:0;top:618px;width:152px;height:130px;object-fit:cover}

/* ---------- Packing list ---------- */
.packing-page .sheet{position:absolute;left:26px;right:27px;top:21px}
.packing-head{height:119px;position:relative;border-bottom:3px solid var(--accent)}
.packing-head .company-block{left:0;top:0}
.packing-head .fulla-logo{left:338px;top:1px;width:175px;height:54px}
.packing-title{position:absolute;right:0;top:0;width:230px;text-align:right;font-size:21.5px;font-weight:900;color:var(--accent)}
.packing-no{position:absolute;right:0;top:26px;font-weight:800;font-size:11px}
.packing-date{position:absolute;right:0;top:42px;font-size:9px}
.packing-info{margin-top:10px;border:1px solid var(--line);height:120px;display:grid;grid-template-columns:491px 249px}
.packing-info-left{border-right:1px solid var(--line);display:grid;grid-template-rows:37px 1fr}
.packing-info-top{display:grid;grid-template-columns:291px 200px;border-bottom:1px solid var(--line)}
.pi-cell{padding:4px}
.pi-cell + .pi-cell{border-left:1px solid var(--line)}
.pi-label{font-weight:800;font-size:11px}
.pi-value{font-size:11px;margin-top:1px}
.consignee{padding:4px;font-size:11px;line-height:1.28}
.consignee .pi-label{margin-bottom:1px}
.marks{padding:4px;font-size:11px}

.packing-items{width:740px;border-collapse:collapse;table-layout:fixed;margin-top:9px}
.packing-items th,.packing-items td{border:1px solid var(--line);vertical-align:top;padding:4px}
.packing-items th{background:#f5f6f7;height:36px;font-weight:800;text-align:left;font-size:11px}
.packing-items td{height:68px;font-size:11px}
.packing-items .marks-col{width:64px}
.packing-items .code-col{width:97px;text-align:center}
.packing-items .desc-col{width:299px}
.packing-items .pack-col{width:66px;text-align:center}
.packing-items .qty-col{width:89px;text-align:center}
.packing-items .net-col{width:61px;text-align:center}
.packing-items .gross-col{width:64px;text-align:center}
.packing-items .desc-col .item-name{text-align:left;margin:0 0 18px}
.packing-items .desc-col .item-desc-line{text-align:left}

.container-row{margin-top:12px;border:1px solid var(--line);height:37px;display:grid;grid-template-columns:217px 106px 303px 114px;font-size:11px}
.container-cell{padding:4px;border-right:1px solid var(--line)}
.container-cell:last-child{border-right:none}
.container-cell .v{font-weight:800;margin-top:2px}
.packing-manager{margin-top:14px;border-top:1px solid #777;padding-top:5px;font-size:12px;font-weight:800;line-height:1.4}
.packing-stamp{position:absolute;left:0;top:480px;width:152px;height:130px;object-fit:cover}

/* ---------- Delivery note ---------- */
.delivery-page .sheet{position:absolute;left:26px;right:27px;top:23px}
.delivery-banner{height:79px;background:var(--green);color:#fff;text-align:center;padding-top:16px}
.delivery-banner .big{font-size:20px;font-weight:800;letter-spacing:.2px}
.delivery-banner .small{font-size:12px;margin-top:7px}
.delivery-brand{height:97px;border-bottom:2px solid var(--accent);display:flex;align-items:center;justify-content:center}
.delivery-brand img{width:240px;height:75px;object-fit:cover}
.delivery-summary{margin-top:9px;border:1px solid var(--line);height:67px;display:grid;grid-template-columns:172px 287px 190px 91px;grid-template-rows:repeat(3,1fr);font-size:11px;background:var(--pale)}
.delivery-summary>div{padding:3px 4px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.delivery-summary>div:nth-child(4n){border-right:none}
.delivery-summary>div:nth-last-child(-n+4){border-bottom:none}
.delivery-summary .label{font-weight:800}
.delivery-details{margin-top:11px;height:225px;border:1px solid var(--line);padding:8px 9px}
.delivery-details-title{font-weight:900;font-size:12px;border-bottom:1px solid #333;padding-bottom:6px;margin-bottom:8px}
.detail-row{display:grid;grid-template-columns:235px 1fr;min-height:22px;font-size:11px;align-items:center}
.detail-row .label{font-weight:800}
.detail-row .value.strong{font-weight:900}
.delivery-items{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:11px}
.delivery-items th,.delivery-items td{border:1px solid var(--line);height:23px;padding:4px;font-size:11px}
.delivery-items th{height:36px;background:#f4f5f6;text-align:left;color:white;font-weight:800}
.delivery-items .n{width:29px;text-align:center}
.delivery-items .code{width:133px}
.delivery-items .name{width:185px}
.delivery-items .unit{width:75px;text-align:center}
.delivery-items .q{width:88px;text-align:center}
.delivery-items .origin{width:89px;text-align:center}
.delivery-items .remarks{width:140px}
.delivery-items tr.total td{height:25px}
.delivery-items tr.total .total-label{background:var(--green);color:#fff;text-align:right;font-weight:900}
.delivery-items tr.total .total-value{text-align:center;font-weight:800}
.approvals{margin-top:28px;border:1px solid var(--line);height:78px;font-size:12px}
.approvals-title{height:22px;border-bottom:1px solid var(--line);padding:3px 4px;color:white;font-weight:800;background:#f5f6f7}
.approvals-grid{display:grid;grid-template-columns:1fr 1fr;height:56px}
.approval-col{display:grid;grid-template-rows:22px 1fr;text-align:center;border-right:1px solid var(--line)}
.approval-col:last-child{border-right:none}
.approval-head{border-bottom:1px solid var(--line);padding:4px;font-weight:800}
.approval-name{padding-top:5px;font-size:16px}

/* ---------- Dynamic generation slots ---------- */
.dynamic-slot:empty{min-height:1em}
.header-slot{display:inline-block;min-width:26px;min-height:8px}
.inline-slot{display:inline}
[data-show-if]{display:none}

/* Commercial/quotation specific */
.commercial-page .invoice-meta{top:48px}
.quotation-page .title-ar{font-size:15px}
`
