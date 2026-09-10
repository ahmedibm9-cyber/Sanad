/* ── Fulla Invoice Renderer (ported from Fulla HTML app) ── */
import { S, n, fmt, esc } from './fullaUtils'

/* ── Fulla-compatible data types ──────────────────────────── */
export interface FullaSettings {
  companyEn: string
  companyAr: string
  addressEn: string
  addressAr: string
  phone: string
  mobile: string
  email: string
  website: string
  vatNumber: string
  crNumber: string
  companyPrintFields?: string
  logo?: string
  stamp?: string
  signature?: string
  defaultBankId?: string
  banks?: FullaBank[]
}

export interface FullaBank {
  id: string
  name: string
  accountName: string
  currency: string
  iban: string
  swift: string
  accountNumber: string
  branch: string
  active?: boolean
}

export interface FullaCustomer {
  id: string
  code: string
  companyEn: string
  companyAr: string
  vat: string
  cr: string
  country: string
  city: string
  address1: string
  address2: string
  contact: string
  phone: string
  mobile: string
  email: string
  website: string
  currency: string
  pol: string
  pod: string
  paymentTerms: string
  deliveryTerms: string
  shippingTerms: string
}

export interface FullaLine {
  id?: string
  itemId?: string
  code?: string
  nameEn?: string
  nameAr?: string
  description?: string
  unit?: string
  packing?: string
  hs?: string
  origin?: string
  qty: number
  price: number
  vat: number
  packages?: number
  net?: number
  gross?: number
}

export interface FullaInvoice {
  id?: string
  number: string
  date: string
  type: string // 'tax' | 'commercial' | 'quotation' | 'proforma'
  customerId: string
  customerName?: string
  customerNameAr?: string
  lines: FullaLine[]
  notes: string
  terms: string
  discount: number
  currency: string
  bankId?: string
  expirationDate?: string
  preparedBy?: string
  stampUrl?: string
  signatureUrl?: string
  manufacturerName?: string
  manufacturerAddress?: string
}

/* ── Helper functions ─────────────────────────────────────── */
function hasLatinText(s: string): boolean {
  return /[a-zA-Z]/.test(s)
}

function printCustomerName(c: FullaCustomer): string {
  if (!c) return '-'
  if (hasLatinText(c.companyEn)) return c.companyEn
  if (hasLatinText(c.companyAr)) return c.companyAr
  return c.companyEn || c.companyAr || '-'
}

function printCustomerNameAr(c: FullaCustomer): string {
  if (!c) return '-'
  return c.companyAr || c.companyEn || '-'
}

function formatDateFulla(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr
}

function totals(v: FullaInvoice) {
  let sub = 0, vat = 0
  ;(v.lines || []).forEach((l) => {
    const a = n(l.qty) * n(l.price)
    sub += a
    vat += a * n(l.vat) / 100
  })
  const d = n(v.discount)
  const net = Math.max(0, sub - d)
  if (sub && d) vat *= net / sub
  return { sub, discount: d, net, vat, total: net + vat }
}

function vatRates(v: FullaInvoice): number[] {
  return [...new Set((v.lines || []).map((l) => n(l.vat)).filter((x) => x > 0).map((x) => Number(x.toFixed(4))))].sort((a, b) => a - b)
}

function vatRateText(v: FullaInvoice, dec = 3): string {
  const r = vatRates(v)
  if (!r.length) return '0.' + '0'.repeat(dec) + '%'
  return r.map((x) => Number.isInteger(x) ? x + '%' : fmt(x, dec) + '%').join(' + ')
}

/* ── Company Header ───────────────────────────────────────── */
function coHead(s: FullaSettings): string {
  const fields = S(s.companyPrintFields).split(',').map((x) => x.trim()).filter(Boolean)
  const showPhone = fields.length === 0 || fields.includes('phone')
  const showEmail = fields.length === 0 || fields.includes('email')
  const showWebsite = fields.length === 0 || fields.includes('website')
  const showVat = fields.length === 0 || fields.includes('vat')
  const showCr = fields.length === 0 || fields.includes('cr')

  let html = `<b style="font-size:18px">${esc(s.companyEn)}</b><br>`
  if (s.companyAr) html += `<b dir="rtl" style="font-size:15px">${esc(s.companyAr)}</b><br>`
  if (s.addressEn) html += `<span class="sm">${esc(s.addressEn)}</span><br>`
  if (s.addressAr) html += `<span dir="rtl" class="sm">${esc(s.addressAr)}</span><br>`
  const contactParts: string[] = []
  if (showPhone && s.phone) contactParts.push(`<b>Tel:</b> ${esc(s.phone)}`)
  if (showPhone && s.mobile) contactParts.push(`<b>Mob:</b> ${esc(s.mobile)}`)
  if (showEmail && s.email) contactParts.push(esc(s.email))
  if (showWebsite && s.website) contactParts.push(esc(s.website))
  if (contactParts.length) html += `<span class="sm">${contactParts.join(' · ')}</span><br>`
  const idParts: string[] = []
  if (showVat && s.vatNumber) idParts.push(`VAT: ${esc(s.vatNumber)}`)
  if (showCr && s.crNumber) idParts.push(`CR: ${esc(s.crNumber)}`)
  if (idParts.length) html += `<span class="sm">${idParts.join(' · ')}</span>`

  return `<div class="doc-header company-letterhead-v675">${html}</div>`
}

/* ── Logo ─────────────────────────────────────────────────── */
function logo(s: FullaSettings): string {
  if (s.logo) {
    return `<div class="company-logo-wrap" style="text-align:center"><img src="${esc(s.logo)}" style="max-height:72px;max-width:160px;object-fit:contain" /></div>`
  }
  return `<div class="logo">FULLA</div>`
}

/* ── Document Details Box ─────────────────────────────────── */
function documentDetailsHtml(
  v: FullaInvoice,
  _c: FullaCustomer | undefined,
  accent: string,
  borderless: boolean,
  lang: 'en' | 'ar' = 'en'
): string {
  const bw = borderless ? 'border-width:0 0 1px' : ''
  const title = lang === 'ar' ? 'تفاصيل المستند' : 'Document Details'
  let rows = ''
  rows += `<div class="detail-row"><div class="detail-label">${lang === 'ar' ? 'رقم' : 'No.'}</div><div class="detail-value">${esc(v.number)}</div></div>`
  rows += `<div class="detail-row"><div class="detail-label">${lang === 'ar' ? 'التاريخ' : 'Date'}</div><div class="detail-value">${esc(v.date)}</div></div>`
  if (v.expirationDate) {
    rows += `<div class="detail-row"><div class="detail-label">${lang === 'ar' ? 'صالح حتى' : 'Valid Until'}</div><div class="detail-value">${esc(v.expirationDate)}</div></div>`
  }
  return `<div class="doc-details-box" style="border:1px solid ${accent};padding:8px;${bw}"><div class="detail-title">${title}</div>${rows}</div>`
}

/* ── Manufacturer Details ─────────────────────────────────── */
function manufacturerDetailsHtml(v: FullaInvoice, accent: string, lang: 'en' | 'ar' = 'en'): string {
  if (!v.manufacturerName) return ''
  const title = lang === 'ar' ? 'تفاصيل المصنع' : 'Manufacturer Details'
  let rows = ''
  rows += `<div class="detail-row"><div class="detail-label">${lang === 'ar' ? 'المصنع' : 'Manufacturer'}</div><div class="detail-value">${esc(v.manufacturerName)}</div></div>`
  if (v.manufacturerAddress) {
    rows += `<div class="detail-row"><div class="detail-label">${lang === 'ar' ? 'العنوان' : 'Address'}</div><div class="detail-value">${esc(v.manufacturerAddress)}</div></div>`
  }
  return `<div class="doc-details-box" style="border:1px solid ${accent};padding:8px;margin-top:8px"><div class="detail-title">${title}</div>${rows}</div>`
}

/* ── Bank Details ─────────────────────────────────────────── */
function bankDetailsHtml(bank: FullaBank | undefined, compact = false): string {
  if (!bank || (!bank.name && !bank.iban && !bank.swift)) return ''
  const parts: string[] = []
  if (bank.name) parts.push(`<b>${esc(bank.name)}</b>${bank.currency ? ' - ' + esc(bank.currency) : ''}`)
  if (bank.accountName) parts.push(`Account Name: ${esc(bank.accountName)}`)
  if (bank.iban) parts.push(`IBAN: <span class="mono">${esc(bank.iban)}</span>`)
  if (bank.accountNumber) parts.push(`Account No.: <span class="mono">${esc(bank.accountNumber)}</span>`)
  if (bank.swift) parts.push(`SWIFT: <span class="mono">${esc(bank.swift)}</span>`)
  if (bank.branch) parts.push(`Branch: ${esc(bank.branch)}`)
  return `<div class="bank-print" style="margin-top:${compact ? '5px' : '9px'};font-size:${compact ? '9px' : '10.5px'};line-height:1.55">${parts.join('<br>')}</div>`
}

/* ── Items Table ──────────────────────────────────────────── */
function invTable(v: FullaInvoice, bilingual = false, lang: 'en' | 'ar' = 'en'): string {
  const lines = v.lines || []
  if (!lines.length) return ''

  const thCode = lang === 'ar' ? 'كود الصنف' : 'Item Code'
  const thDesc = lang === 'ar' ? 'الوصف' : 'Description'
  const thQty = lang === 'ar' ? 'الكمية' : 'Qty'
  const thUnit = lang === 'ar' ? 'الوحدة' : 'U.O.M'
  const thPrice = lang === 'ar' ? 'السعر' : 'Price'
  const thTotal = lang === 'ar' ? 'الإجمالي' : 'Total'

  let rows = lines.map((l) => {
    const lineTotal = n(l.qty) * n(l.price)
    let desc = `<b>${esc(l.description || l.nameEn || '')}</b>`
    if (l.nameAr && bilingual) desc += `<br><span dir="rtl">${esc(l.nameAr)}</span>`
    if (l.packing) desc += ` · ${esc(l.packing)}`
    if (l.hs) desc += ` · HS: ${esc(l.hs)}`
    if (l.origin) desc += ` · ${esc(l.origin)}`
    return `<tr><td>${esc(l.code || '')}</td><td>${desc}</td><td class="c">${fmt(l.qty, 0)}</td><td class="c">${esc(l.unit || '')}</td><td class="r">${fmt(l.price)}</td><td class="r">${fmt(lineTotal)}</td></tr>`
  }).join('')

  return `<table class="bd avoid doc-items" style="font-size:9.5px"><thead><tr style="background:#eee"><th>${thCode}</th><th>${thDesc}</th><th class="c">${thQty}</th><th class="c">${thUnit}</th><th class="r">${thPrice}</th><th class="r">${thTotal}</th></tr></thead><tbody>${rows}</tbody></table>`
}

/* ── Totals Box ───────────────────────────────────────────── */
function totBox(v: FullaInvoice, bilingual = false, lang: 'en' | 'ar' = 'en'): string {
  const t = totals(v)
  const cur = v.currency || ''
  const labelSub = lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'
  const labelDisc = lang === 'ar' ? 'الخصم' : 'Discount'
  const labelVat = lang === 'ar' ? 'الضريبة' : 'VAT'
  const labelTotal = lang === 'ar' ? 'الإجمالي' : 'Grand Total'

  let rows = ''
  rows += `<tr><td>${labelSub}</td><td class="r">${fmt(t.sub)} ${esc(cur)}</td></tr>`
  if (t.discount) {
    rows += `<tr><td>${labelDisc}</td><td class="r">-${fmt(t.discount)} ${esc(cur)}</td></tr>`
  }
  rows += `<tr><td>${labelVat} (${vatRateText(v)})</td><td class="r">${fmt(t.vat)} ${esc(cur)}</td></tr>`
  rows += `<tr><td><b>${labelTotal}</b></td><td class="r"><b>${fmt(t.total)} ${esc(cur)}</b></td></tr>`

  return `<table class="bd doc-summary" style="width:280px;float:right;margin-top:8px"><tbody>${rows}</tbody></table><div style="clear:both"></div>`
}

/* ── Footer (Kind Regards + QR) ───────────────────────────── */
function footer(qrImgUrl: string, s?: FullaSettings): string {
  let html = '<div class="doc-footer" style="margin-top:15px">'

  // Signature block
  html += '<div style="display:flex;justify-content:space-between;align-items:end;gap:20px">'
  html += '<div style="flex:1"><div class="sm"><b>Kind Regards,</b></div>'
  html += '<div style="margin-top:40px;border-top:1px solid #444;width:180px;text-align:center;padding-top:4px" class="sm"><b>Signatory</b></div>'
  html += '</div>'

  // Stamp
  if (s?.stamp) {
    html += `<div style="text-align:center"><img src="${esc(s.stamp)}" class="stamp-image" /></div>`
  }

  // QR code
  if (qrImgUrl) {
    html += `<div style="text-align:right"><img src="${esc(qrImgUrl)}" class="qr" /></div>`
  }

  html += '</div></div>'
  return html
}

/* ── Classic Invoice Variant ──────────────────────────────── */
function classicInv(v: FullaInvoice, s: FullaSettings, lang: 'en' | 'ar' = 'en'): string {
  const c: FullaCustomer = { id: '', code: '', companyEn: v.customerName || '', companyAr: v.customerNameAr || '', vat: '', cr: '', country: '', city: '', address1: '', address2: '', contact: '', phone: '', mobile: '', email: '', website: '', currency: '', pol: '', pod: '', paymentTerms: '', deliveryTerms: '', shippingTerms: '' }
  const enOnly = lang === 'en'
  const docTitle = v.type === 'quotation' ? 'QUOTATION' :
    v.type === 'tax' ? 'TAX INVOICE' :
    v.type === 'commercial' ? 'COMMERCIAL INVOICE' :
    v.type === 'proforma' ? 'PROFORMA INVOICE' : 'INVOICE'

  let html = '<div class="paper print-layout">'

  // 3-column header grid
  html += '<div class="doc-header" style="display:grid;grid-template-columns:minmax(0,1.25fr) auto minmax(165px,0.8fr);gap:14px;align-items:start;border-bottom:4px solid #0f4c5c;padding-bottom:9px">'
  html += `<div>${coHead(s)}</div>`
  html += `<div style="text-align:center">${logo(s)}<div class="title" style="margin-top:8px;color:#0f4c5c">${docTitle}</div></div>`
  html += `<div style="text-align:right"><table class="bd" style="font-size:9.5px"><tr><td>No.</td><td><b>${esc(v.number)}</b></td></tr><tr><td>Date</td><td>${esc(v.date)}</td></tr>${v.expirationDate ? `<tr><td>Valid Until</td><td>${esc(v.expirationDate)}</td></tr>` : ''}</table></div>`
  html += '</div>'

  // Customer section (2-column grid)
  html += '<div class="doc-customer" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0">'
  html += `<div style="border:1px solid #444;padding:9px"><b>CUSTOMER</b><br>${esc(printCustomerName(c))}<br>${esc(c.address1)}<br>${esc(c.country)}<br>${esc(c.contact)} · ${esc(c.phone)}</div>`
  html += documentDetailsHtml(v, c, '#444', false, lang)
  html += '</div>'

  // Items table
  html += `<div class="doc-items">${invTable(v, !enOnly, lang)}</div>`

  // Totals
  html += totBox(v, !enOnly, lang)

  // Notes
  if (v.notes) {
    html += `<div class="doc-terms" style="margin-top:10px;white-space:pre-line">${esc(v.notes)}</div>`
  }

  // Bank details
  const bank = (s.banks || []).find((b) => b.id === v.bankId) || (s.banks || [])[0]
  html += bankDetailsHtml(bank)

  // Footer
  html += footer('', s)

  html += '</div>'
  return html
}

/* ── Invoice Variant (corporate, compact, elegant, etc.) ─── */
function invoiceVariant(
  v: FullaInvoice,
  template: string,
  s: FullaSettings,
  lang: 'en' | 'ar' = 'en'
): string {
  const configs: Record<string, { accent: string; soft: string; gold: string }> = {
    modern: { accent: '#0f4c5c', soft: '#edf3f8', gold: '#0f4c5c' },
    bilingual: { accent: '#444', soft: '#f7f7f7', gold: '#444' },
    corporate: { accent: '#1a3a4a', soft: '#edf2f4', gold: '#b99a3b' },
    compact: { accent: '#333', soft: '#f5f5f5', gold: '#666' },
    elegant: { accent: '#2c3e50', soft: '#f8f9fa', gold: '#c0a55a' },
    borderless: { accent: '#333', soft: '#fff', gold: '#777' },
    blueband: { accent: '#0b5f86', soft: '#eaf6fb', gold: '#66a5c2' },
    grayscale: { accent: '#333', soft: '#f5f5f5', gold: '#777' },
    'export-grid': { accent: '#246b55', soft: '#edf6f1', gold: '#3a8a6a' },
  }
  const cfg = configs[template] || configs.modern
  const enOnly = lang === 'en'
  const docTitle = v.type === 'quotation' ? 'QUOTATION' :
    v.type === 'tax' ? 'TAX INVOICE' :
    v.type === 'commercial' ? 'COMMERCIAL INVOICE' :
    v.type === 'proforma' ? 'PROFORMA INVOICE' : 'INVOICE'

  let html = `<div class="paper print-layout tpl-${template}">`

  // Header
  if (template === 'modern') {
    html += `<div class="doc-header" style="display:flex;gap:20px;border-bottom:5px solid ${cfg.accent};padding-bottom:12px">`
    html += `<div style="flex:1">${coHead(s)}</div>`
    html += `<div style="text-align:center">${logo(s)}</div>`
    html += '</div>'
    html += `<div style="display:flex;justify-content:space-between;align-items:end;margin:18px 0">`
    html += `<div><div class="title" style="text-align:left;color:${cfg.accent}">${docTitle}</div><div class="sm">Export Commercial Document</div></div>`
    html += `<div><table class="bd" style="font-size:9.5px"><tr><td>No.</td><td><b>${esc(v.number)}</b></td></tr><tr><td>Date</td><td>${esc(v.date)}</td></tr></table></div>`
    html += '</div>'
  } else {
    html += `<div class="doc-header" style="border-bottom:3px solid ${cfg.accent};padding-bottom:8px">`
    html += `<div style="display:flex;justify-content:space-between;align-items:start">`
    html += `<div style="flex:1">${coHead(s)}</div>`
    html += `<div style="text-align:center;flex:1">${logo(s)}<div class="title" style="color:${cfg.accent};margin-top:8px">${docTitle}</div></div>`
    html += `<div style="text-align:right"><table class="bd" style="font-size:9.5px"><tr><td>No.</td><td><b>${esc(v.number)}</b></td></tr><tr><td>Date</td><td>${esc(v.date)}</td></tr></table></div>`
    html += '</div></div>'
  }

  // Customer
  const c: FullaCustomer = { id: '', code: '', companyEn: v.customerName || '', companyAr: v.customerNameAr || '', vat: '', cr: '', country: '', city: '', address1: '', address2: '', contact: '', phone: '', mobile: '', email: '', website: '', currency: '', pol: '', pod: '', paymentTerms: '', deliveryTerms: '', shippingTerms: '' }
  html += `<div class="doc-customer" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0">`
  html += `<div style="border:1px solid ${cfg.accent};padding:9px;background:${cfg.soft}"><b>CUSTOMER</b><br>${esc(printCustomerName(c))}<br>${esc(c.address1)}<br>${esc(c.country)}<br>${esc(c.contact)} · ${esc(c.phone)}</div>`
  html += documentDetailsHtml(v, c, cfg.accent, template === 'borderless', lang)
  html += '</div>'

  // Items
  html += `<div class="doc-items">${invTable(v, !enOnly, lang)}</div>`

  // Totals
  html += totBox(v, !enOnly, lang)

  // Notes
  if (v.notes) {
    html += `<div class="doc-terms" style="margin-top:10px;white-space:pre-line">${esc(v.notes)}</div>`
  }

  // Bank
  const bank = (s.banks || []).find((b) => b.id === v.bankId) || (s.banks || [])[0]
  html += bankDetailsHtml(bank)

  // Manufacturer
  html += manufacturerDetailsHtml(v, cfg.accent, lang)

  // Footer
  html += footer('', s)

  html += '</div>'
  return html
}

/* ── Main Invoice Paper Dispatcher ─────────────────────────── */
export function invoicePaper(
  v: FullaInvoice,
  template: string,
  s: FullaSettings,
  lang: 'en' | 'ar' = 'en'
): string {
  if (['classic', 'modern', 'bilingual'].includes(template)) {
    if (template === 'classic') return classicInv(v, s, lang)
    // modern and bilingual use the variant renderer with appropriate config
    return invoiceVariant(v, template, s, lang)
  }
  return invoiceVariant(v, template, s, lang)
}

/* ── Quotation Paper (wraps invoicePaper) ─────────────────── */
export function quotePaper(
  v: FullaInvoice,
  template: string,
  s: FullaSettings,
  lang: 'en' | 'ar' = 'en'
): string {
  const quoteV = { ...v, type: 'quotation' }
  return invoicePaper(quoteV, template, s, lang)
}

export {
  coHead,
  logo,
  footer,
  totBox,
  invTable,
  classicInv,
  invoiceVariant,
  documentDetailsHtml,
  manufacturerDetailsHtml,
  bankDetailsHtml,
  totals,
  printCustomerName,
}
