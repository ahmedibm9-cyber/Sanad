/* ── Fulla Packing List Renderer (ported from Fulla HTML app) ── */
import { S, n, fmt, esc } from './fullaUtils'
import type { FullaSettings, FullaCustomer, FullaInvoice, FullaLine } from './fullaInvoiceRenderer'
import { coHead, logo, footer, bankDetailsHtml, printCustomerName } from './fullaInvoiceRenderer'

/* ── Packing Data ──────────────────────────────────────────── */
export interface FullaPacking {
  id?: string
  number: string
  date: string
  reference?: string
  invoiceId?: string
  customerId: string
  customerName?: string
  marks?: string
  container?: string
  seal?: string
  packages?: string
  net: number
  gross: number
  measurement?: string
  notes?: string
  lines: FullaPackingLine[]
}

export interface FullaPackingLine {
  id?: string
  itemId?: string
  code?: string
  description?: string
  hs?: string
  packing?: string
  origin?: string
  unit?: string
  qty: number
  packages?: number
  net?: number
  gross?: number
}

/* ── Pack Table ────────────────────────────────────────────── */
function packTable(v: FullaInvoice, p: FullaPacking, lang: 'en' | 'ar' = 'en'): string {
  const lines = v.lines || []
  const single = lines.length === 1

  const thMarks = lang === 'ar' ? 'العلامات' : 'Marks'
  const thCode = lang === 'ar' ? 'كود الصنف' : 'Item Code'
  const thDesc = lang === 'ar' ? 'الوصف' : 'Description of Goods'
  const thPkgs = lang === 'ar' ? 'العبوات' : 'Packages'
  const thQty = lang === 'ar' ? 'الكمية' : 'Quantity'
  const thNet = lang === 'ar' ? 'الوزن صافي (كغ)' : 'Net KG'
  const thGross = lang === 'ar' ? 'الوزن brut (كغ)' : 'Gross KG'

  const rows = lines.map((l) => {
    const pk = n(l.qty) * n(l.packages)
    const nw = n(l.qty) * n(l.net)
    const gw = n(l.qty) * n(l.gross)

    const pkTxt = single && String(p.packages || '').trim() ? esc(p.packages || '') : (pk ? fmt(pk, 0) : '—')
    const nwVal = single && n(p.net) ? n(p.net) : (nw || 0)
    const gwVal = single && n(p.gross) ? n(p.gross) : (gw || 0)
    const nwTxt = nwVal ? fmt(nwVal) + ' KG' : '—'
    const gwTxt = gwVal ? fmt(gwVal) + ' KG' : '—'

    return `<tr><td>${esc(p.marks || '')}</td><td class="c">${esc(l.code || '')}</td><td><b>${esc(l.description || '')}</b><br>HS: ${esc(l.hs || '')} · Packing: ${esc(l.packing || '')} · Origin: ${esc(l.origin || '')}</td><td class="c">${pkTxt}</td><td class="c">${fmt(l.qty, 0)} ${esc(l.unit || '')}</td><td class="r">${nwTxt}</td><td class="r">${gwTxt}</td></tr>`
  }).join('')

  return `<table class="bd avoid doc-items" style="font-size:9.5px"><thead><tr style="background:#eee"><th>${thMarks}</th><th>${thCode}</th><th>${thDesc}</th><th>${thPkgs}</th><th>${thQty}</th><th>${thNet}</th><th>${thGross}</th></tr></thead><tbody>${rows}</tbody></table>`
}

/* ── Packing Paper ─────────────────────────────────────────── */
export function packingPaper(
  p: FullaPacking,
  template: string,
  s: FullaSettings,
  lang: 'en' | 'ar' = 'en'
): string {
  const v: FullaInvoice = { number: '', date: '', type: 'commercial', customerId: '', lines: [], notes: '', terms: '', discount: 0, currency: '' }
  const c: FullaCustomer = { id: '', code: '', companyEn: p.customerName || '', companyAr: '', vat: '', cr: '', country: '', city: '', address1: '', address2: '', contact: '', phone: '', mobile: '', email: '', website: '', currency: '', pol: '', pod: '', paymentTerms: '', deliveryTerms: '', shippingTerms: '' }

  // Determine accent and title
  const configs: Record<string, [string, string]> = {
    detailed: ['#0f4c5c', 'PACKING LIST'],
    container: ['#0f4c5c', 'CONTAINER PACKING LIST'],
    minimal: ['#333', 'PACKING LIST'],
    warehouse: ['#6a4c2d', 'WAREHOUSE PACKING LIST'],
    export: ['#176b7b', 'EXPORT PACKING LIST'],
    weights: ['#454545', 'WEIGHT & PACKING SUMMARY'],
    manifest: ['#5b477c', 'PACKING MANIFEST'],
    'clean-grid': ['#2d5866', 'CLEAN GRID PACKING LIST'],
    'bilingual-pack': ['#0f4c5c', lang === 'ar' ? 'قائمة التعبئة' : 'PACKING LIST'],
    'executive-pack': ['#263b55', 'EXECUTIVE PACKING LIST'],
  }
  const cfg = configs[template] || configs.detailed
  const enOnly = lang === 'en'

  // Weights template (simplified)
  if (template === 'weights') {
    let html = `<div class="paper print-layout tpl-${template}">`
    html += `<div class="doc-header c" style="border-bottom:4px solid ${cfg[0]}">${logo(s)}<div class="title">${cfg[1]}</div></div>`
    html += `<div class="doc-customer"><b>Consignee:</b> ${esc(printCustomerName(c))} · ${esc(c.country)}<br><b>Reference:</b> ${esc(p.reference || '')} · <b>Date:</b> ${esc(p.date)}</div>`
    html += `<table class="bd doc-summary"><tr><td>Total Packages<br><b>${esc(p.packages || '-')}</b></td><td>Net Weight<br><b>${fmt(p.net)} KG</b></td><td>Gross Weight<br><b>${fmt(p.gross)} KG</b></td><td>Measurement<br><b>${esc(p.measurement || '-')}</b></td></tr></table>`
    html += packTable(v, p, lang)
    html += `<div class="doc-terms">Container: ${esc(p.container || '-')} · Seal: ${esc(p.seal || '-')}<br>${esc(p.notes || '')}</div>`
    html += footer('', s)
    html += '</div>'
    return html
  }

  // Metrics table
  const metrics = `<table class="bd doc-summary"><tr><td>Total Packages<br><b>${esc(p.packages || '-')}</b></td><td>Net Weight<br><b>${fmt(p.net)} KG</b></td><td>Gross Weight<br><b>${fmt(p.gross)} KG</b></td><td>Measurement<br><b>${esc(p.measurement || '-')}</b></td></tr></table>`

  const bilingual = template === 'bilingual-pack' && !enOnly

  // Standard packing layout
  let html = `<div class="paper print-layout tpl-${template}">`

  // Header
  html += `<div class="doc-header" style="display:flex;justify-content:space-between;border-bottom:4px solid ${cfg[0]};padding-bottom:9px">`
  html += `<div>${coHead(s)}</div>`
  html += `<div class="c">${logo(s)}<div class="title" style="color:${cfg[0]}">${cfg[1]}</div></div>`
  html += '</div>'

  // Customer + Details
  html += '<div class="doc-customer" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0">'
  html += `<div style="border:1px solid ${cfg[0]};padding:9px"><b>CONSIGNEE${bilingual ? ' / المرسل إليه' : ''}</b><br>${esc(printCustomerName(c))}<br>${esc(c.address1)}<br>${esc(c.country)}<br>${esc(c.contact)} · ${esc(c.phone)}</div>`
  html += `<div style="border:1px solid ${cfg[0]};padding:9px"><b>PACKING DETAILS</b><br>No: ${esc(p.number)}<br>Date: ${esc(p.date)}<br>Invoice: ${esc(v.number)}<br>Container / Seal: ${esc(p.container || '-')} / ${esc(p.seal || '-')}</div>`
  html += '</div>'

  // Items table
  html += packTable(v, p, lang)

  // Metrics
  html += metrics

  // Terms / Marks
  html += `<div class="doc-terms"><b>Marks:</b> ${esc(p.marks || '')}<br><span style="white-space:pre-line">${esc(p.notes || '')}</span></div>`

  // Footer (executive-pack only)
  if (template === 'executive-pack') {
    html += footer('', s)
  }

  html += '</div>'
  return html
}

export { packTable }
