/* ── Fulla Delivery Note / Loading Renderer (ported from Fulla HTML app) ── */
import { S, n, fmt, esc } from './fullaUtils'
import type { FullaSettings } from './fullaInvoiceRenderer'
import { coHead, logo, footer } from './fullaInvoiceRenderer'

/* ── Loading Data ──────────────────────────────────────────── */
export interface FullaLoading {
  id?: string
  number: string
  date: string
  reference?: string
  invoiceId?: string
  customerId: string
  customerName?: string
  preparedBefore?: string
  marks?: string
  notes?: string
  lines: FullaLoadingLine[]
}

export interface FullaLoadingLine {
  id?: string
  itemId?: string
  code?: string
  description?: string
  unit?: string
  origin?: string
  qty: number
  remarks?: string
}

/* ── Loading Line Table ────────────────────────────────────── */
function loadingLineTable(
  r: FullaLoading,
  cfg: { accent: string; soft: string; gold: string },
  lang: 'en' | 'ar' = 'en'
): string {
  const lines = r.lines || []
  const thNo = lang === 'ar' ? 'م' : '#'
  const thCode = lang === 'ar' ? 'كود الصنف' : 'Item Code'
  const thDesc = lang === 'ar' ? 'المادة / الوصف' : 'Material / Description'
  const thUnit = lang === 'ar' ? 'الوحدة' : 'Unit'
  const thQty = lang === 'ar' ? 'الكمية' : 'Quantity'
  const thOrigin = lang === 'ar' ? 'المنشأ' : 'Origin'
  const thRemarks = lang === 'ar' ? 'ملاحظات' : 'Remarks'

  const rows = lines.map((l, i) => {
    return `<tr style="background:${i % 2 === 0 ? '#fff' : cfg.soft}"><td class="c">${i + 1}</td><td class="c">${esc(l.code || '')}</td><td><b>${esc(l.description || '')}</b></td><td class="c">${esc(l.unit || '')}</td><td class="c">${fmt(l.qty, 0)}</td><td>${esc(l.origin || '')}</td><td>${esc(l.remarks || '')}</td></tr>`
  }).join('')

  // Add empty rows if less than 5 items
  const emptyRows = lines.length < 5
    ? Array.from({ length: 5 - lines.length }, (_, i) =>
        `<tr><td class="c" style="color:#ccc">${lines.length + i + 1}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`
      ).join('')
    : ''

  return `<table class="bd avoid doc-items" style="font-size:9.5px"><thead><tr style="background:${cfg.accent};color:#fff"><th>${thNo}</th><th>${thCode}</th><th>${thDesc}</th><th>${thUnit}</th><th>${thQty}</th><th>${thOrigin}</th><th>${thRemarks}</th></tr></thead><tbody>${rows}${emptyRows}</tbody></table>`
}

/* ── Loading Paper ─────────────────────────────────────────── */
export function loadingPaper(
  r: FullaLoading,
  template: string,
  s: FullaSettings,
  lang: 'en' | 'ar' = 'en'
): string {
  const customerName = r.customerName || ''

  // Template configs
  const configs: Record<string, { accent: string; soft: string; gold: string; title: string; en: string }> = {
    'load-classic': { accent: '#155c43', soft: '#fff7d6', gold: '#c99a2e', title: 'طلب صرف مواد للتصدير', en: 'Export Material Issue Voucher' },
    'load-modern': { accent: '#0f6b78', soft: '#edf8fa', gold: '#77aeb7', title: 'طلب تحميل للتصدير', en: 'Export Loading Request' },
    'load-bilingual': { accent: '#176b4f', soft: '#f1f8f4', gold: '#b9923b', title: 'طلب صرف / تحميل مواد', en: 'Material Issue & Loading Voucher' },
    'load-warehouse': { accent: '#9a5a00', soft: '#fff6e9', gold: '#d8a342', title: 'إذن صرف المستودع', en: 'Warehouse Material Release' },
    'load-minimal': { accent: '#333', soft: '#fff', gold: '#777', title: 'طلب مواد', en: 'Material Request' },
    'load-dispatch': { accent: '#174f86', soft: '#eef5fc', gold: '#4f8fca', title: 'أمر تجهيز وشحن', en: 'Dispatch & Loading Order' },
    'load-industrial': { accent: '#454b50', soft: '#f1f2f3', gold: '#8d959b', title: 'إذن صرف صناعي', en: 'Industrial Issue Note' },
    'load-borderless': { accent: '#276148', soft: '#fff', gold: '#6e9b87', title: 'طلب تحميل', en: 'Loading Request' },
    'load-blueband': { accent: '#0b5f86', soft: '#eaf6fb', gold: '#66a5c2', title: 'طلب تجهيز للتصدير', en: 'Export Preparation Request' },
    'load-executive': { accent: '#173f5f', soft: '#edf3f8', gold: '#b99a55', title: 'طلب صرف مواد للتصدير', en: 'Executive Export Material Voucher' },
  }
  const cfg = configs[template] || configs['load-classic']
  const enOnly = lang === 'en'

  // English-only mode (simplified header)
  if (enOnly) {
    let html = `<div class="paper print-layout doc-loading tpl-${template}" style="--load-accent:${cfg.accent};--load-gold:${cfg.gold};direction:ltr">`
    html += `<div class="doc-header loading-titlebar">`
    html += `<div class="load-title"><b style="font-size:22px">DELIVERY NOTE</b><span style="font-size:11px;margin-top:4px">${esc(cfg.en)}</span></div>`
    html += `<div class="load-brand">${logo(s)}<b style="font-size:17px">${esc(s.companyEn)}</b></div>`
    html += '</div>'

    // Meta table
    html += `<table class="bd doc-customer loading-meta" style="background:${cfg.soft}">`
    html += `<tr><td><b>Delivery Note No.</b></td><td>${esc(r.number)}</td><td><b>Date</b></td><td>${esc(r.date)}</td></tr>`
    html += `<tr><td><b>Customer / Importer</b></td><td colspan="3">${esc(customerName)}</td></tr>`
    html += '</table>'

    // Items table
    html += loadingLineTable(r, cfg, lang)

    // Notes
    if (r.notes) {
      html += `<div class="doc-notes" style="margin-top:8px;white-space:pre-line">${esc(r.notes)}</div>`
    }

    // Approval section
    html += '<div class="loading-approval"><table class="bd"><tr>'
    html += `<td style="width:25%"><div class="c"><b>Approved By</b></div><div style="height:34px"></div></td>`
    html += `<td style="width:25%"><div class="c"><b>Prepared By</b></div><div style="height:34px"></div></td>`
    html += `<td style="width:25%"><div class="c"><b>Received By</b></div><div style="height:34px"></div></td>`
    html += `<td style="width:25%"><div class="c"><b>Customer / Carrier</b></div><div style="height:34px"></div></td>`
    html += '</tr></table></div>'

    html += footer('', s)
    html += '</div>'
    return html
  }

  // Bilingual mode
  let html = `<div class="paper print-layout doc-loading tpl-${template}" style="--load-accent:${cfg.accent};--load-gold:${cfg.gold}">`
  html += `<div class="doc-header loading-titlebar">`
  html += `<div class="load-title"><b style="font-size:22px">${cfg.title}</b><span style="font-size:11px;margin-top:4px">${esc(cfg.en)}</span></div>`
  html += `<div class="load-brand">${logo(s)}<b style="font-size:17px">${esc(s.companyEn)}</b><br><span style="font-size:12px">${esc(s.companyAr)}</span></div>`
  html += '</div>'

  // Meta table (bilingual)
  html += `<table class="bd doc-customer loading-meta" style="background:${cfg.soft}">`
  html += `<tr><td><b>رقم</b><br><b style="font-size:9px">No.</b></td><td>${esc(r.number)}</td><td><b>التاريخ</b><br><b style="font-size:9px">Date</b></td><td>${esc(r.date)}</td></tr>`
  html += `<tr><td><b>العميل</b><br><b style="font-size:9px">Customer</b></td><td colspan="3">${esc(customerName)}</td></tr>`
  html += '</table>'

  // Items table
  html += loadingLineTable(r, cfg, lang)

  // Notes
  if (r.notes) {
    html += `<div class="doc-notes" style="margin-top:8px;white-space:pre-line">${esc(r.notes)}</div>`
  }

  // Approval section (bilingual)
  html += '<div class="loading-approval"><table class="bd"><tr>'
  html += `<td style="width:25%"><div class="c"><b>اعتمد من</b><br><span style="font-size:9px">Approved By</span></div><div style="height:34px"></div></td>`
  html += `<td style="width:25%"><div class="c"><b>أعدّه</b><br><span style="font-size:9px">Prepared By</span></div><div style="height:34px"></div></td>`
  html += `<td style="width:25%"><div class="c"><b>استلم من</b><br><span style="font-size:9px">Received By</span></div><div style="height:34px"></div></td>`
  html += `<td style="width:25%"><div class="c"><b>العميل / الناقل</b><br><span style="font-size:9px">Customer / Carrier</span></div><div style="height:34px"></div></td>`
  html += '</tr></table></div>'

  html += footer('', s)
  html += '</div>'
  return html
}

export { loadingLineTable }
