import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import { renderFullaTemplate } from '../templates/fullaTemplateRenderer'
import { adaptForTemplate } from '../templates/fullaSchemaAdapter'
import type { DocPreviewData } from '../templates/fullaSchemaAdapter'

/* ── Shared helpers ────────────────────────────────────── */

const PAGE_W = 210
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2

function setFont(doc: jsPDF, weight: 'normal' | 'bold' = 'normal', size = 10) {
  doc.setFont('helvetica', weight)
  doc.setFontSize(size)
}

function drawLabel(doc: jsPDF, label: string, value: string, x: number, y: number, opts?: { labelW?: number; valueW?: number }) {
  const lw = opts?.labelW ?? 35
  setFont(doc, 'normal', 9)
  doc.setTextColor(120, 120, 120)
  doc.text(label, x, y)
  setFont(doc, 'bold', 10)
  doc.setTextColor(30, 30, 30)
  doc.text(value || '—', x + lw, y)
}

function drawLine(doc: jsPDF, y: number) {
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
}

function drawBoldLine(doc: jsPDF, y: number) {
  doc.setDrawColor(40, 40, 40)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
}

function addPageFooter(doc: jsPDF, docNumber: string) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    setFont(doc, 'normal', 8)
    doc.setTextColor(150, 150, 150)
    doc.text(docNumber || '', MARGIN, 290)
    doc.text(`Page ${i} / ${pageCount}`, PAGE_W - MARGIN, 290, { align: 'right' })
  }
}

/* ── Document PDF (uses same Fulla HTML as preview) ───── */

export async function downloadDocumentPdf(docData: DocPreviewData): Promise<void> {
  const d = docData
  const lang = d.language || 'en'
  const isAr = lang === 'ar'

  // Use the SAME renderer as the preview — pixel-identical output
  const templateData = adaptForTemplate(d as any, d.template || 'fulla-commercial-invoice-680')
  const templateId = (() => {
    switch (d.template) {
      case 'fulla-packing-list-680':      return 'packing-list' as const
      case 'fulla-quotation-680':         return 'quotation' as const
      case 'fulla-tax-invoice-a-680':     return 'invoice-tax-a' as const
      case 'fulla-tax-invoice-b-680':     return 'invoice-tax-b' as const
      case 'fulla-proforma-invoice-680':  return 'invoice-proforma' as const
      case 'fulla-commercial-invoice-680': return 'invoice-commercial' as const
      case 'fulla-delivery-note-680':     return 'delivery-note' as const
      default:                            return 'invoice-commercial' as const
    }
  })()

  const pageHtml = renderFullaTemplate(templateId, templateData)

  // Wrap in a full HTML document with the Fulla template CSS
  const fullHtml = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { margin: 0; padding: 0; background: #fff; }
  /* Import the Fulla template CSS */
  ${getFullaCssText()}
</style>
</head><body>
${pageHtml}
</body></html>`

  // Inject into hidden DOM element
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1;'
  container.innerHTML = fullHtml
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
      windowWidth: 794,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const imgW = pdfW
    const imgH = (canvas.height * imgW) / canvas.width

    let heightLeft = imgH
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
    heightLeft -= pdfH

    while (heightLeft > 0) {
      position = -(pdfH * (Math.ceil((imgH - heightLeft) / pdfH)))
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
      heightLeft -= pdfH
    }

    addPageFooter(pdf, d.number)
    pdf.save(`${d.number || 'document'}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Inlined Fulla template CSS for PDF capture.
 * This ensures the html2canvas render uses the exact same styles as the preview.
 */
function getFullaCssText(): string {
  return `
:root{--ink:#111;--line:#506066;--accent:#0a4549;--green:#12634c;--pale:#f4eed1}
*{box-sizing:border-box}
html,body{margin:0;padding:0;font-family:Arial,Helvetica,Tahoma,sans-serif;color:var(--ink)}
.page{position:relative;width:794px;height:1123px;margin:0 auto;background:#fff;overflow:hidden;font-size:12px;line-height:1.15}
.page *{print-color-adjust:exact;-webkit-print-color-adjust:exact}
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
.pi-cell+.pi-cell{border-left:1px solid var(--line)}
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
.approvals{margin-top:28px;border:1px solid var(--line);height:78px;font-size:12px}
.approvals-title{height:22px;border-bottom:1px solid var(--line);padding:3px 4px;color:white;font-weight:800;background:#f5f6f7}
.approvals-grid{display:grid;grid-template-columns:1fr 1fr;height:56px}
.approval-col{display:grid;grid-template-rows:22px 1fr;text-align:center;border-right:1px solid var(--line)}
.approval-col:last-child{border-right:none}
.approval-head{border-bottom:1px solid var(--line);padding:4px;font-weight:800}
.approval-name{padding-top:5px;font-size:16px}
.dynamic-slot:empty{min-height:1em}
.header-slot{display:inline-block;min-width:26px;min-height:8px}
.inline-slot{display:inline}
[data-show-if]{display:none}
.commercial-page .invoice-meta{top:48px}
.quotation-page .title-ar{font-size:15px}
@media print{@page{size:A4;margin:0}html,body{background:#fff;padding:0;margin:0}.page{width:210mm;height:297mm;margin:0;box-shadow:none;page-break-after:always}.page:last-child{page-break-after:auto}.no-print{display:none!important}}
`
}

/* ── Work Item / Project Summary PDF ───────────────────── */

export async function downloadWorkItemPdf(workItem: {
  id: string
  name: string
  customer_name?: string | null
  destination_country?: string | null
  destination_city?: string | null
  status?: string | null
  currency?: string | null
  incoterm?: string | null
  port_of_loading?: string | null
  port_of_discharge?: string | null
  vessel_name?: string | null
  voyage_number?: string | null
  container_number?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  materials?: Array<{
    id?: string
    description_override?: string | null
    quantity: number
    weight_unit?: string
    price?: number | null
    currency?: string | null
    packing_description?: string | null
    origin?: string | null
    hs_code?: string | null
  }>
}): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = workItem
  const materials = w.materials || []
  const currency = w.currency || 'SAR'

  let y = MARGIN

  /* ── Header ─────────────────────────────────────────── */
  setFont(doc, 'bold', 16)
  doc.setTextColor(20, 20, 20)
  doc.text('Project Summary', MARGIN, y + 4)

  setFont(doc, 'normal', 9)
  doc.setTextColor(120, 120, 120)
  doc.text('SANAD Export Operations', MARGIN, y + 9)
  y += 18

  drawBoldLine(doc, y)
  y += 8

  /* ── Project title ──────────────────────────────────── */
  setFont(doc, 'bold', 14)
  doc.setTextColor(20, 20, 20)
  doc.text(w.name || 'Untitled Project', MARGIN, y)
  y += 10

  /* ── Project details ────────────────────────────────── */
  drawLabel(doc, 'ID:', w.id, MARGIN, y)
  y += 7

  if (w.customer_name) {
    drawLabel(doc, 'Customer:', w.customer_name, MARGIN, y)
    y += 7
  }

  if (w.destination_country) {
    const dest = w.destination_city
      ? `${w.destination_city}, ${w.destination_country}`
      : w.destination_country
    drawLabel(doc, 'Destination:', dest, MARGIN, y)
    y += 7
  }

  if (w.status) {
    drawLabel(doc, 'Status:', w.status.replace(/_/g, ' ').toUpperCase(), MARGIN, y)
    y += 7
  }

  if (w.incoterm) {
    drawLabel(doc, 'Incoterm:', w.incoterm, MARGIN, y)
    y += 7
  }

  if (w.port_of_loading) {
    drawLabel(doc, 'Port of Loading:', w.port_of_loading, MARGIN, y)
    y += 7
  }

  if (w.port_of_discharge) {
    drawLabel(doc, 'Port of Discharge:', w.port_of_discharge, MARGIN, y)
    y += 7
  }

  if (w.vessel_name) {
    drawLabel(doc, 'Vessel:', w.vessel_name, MARGIN, y)
    y += 7
  }

  if (w.voyage_number) {
    drawLabel(doc, 'Voyage #:', w.voyage_number, MARGIN, y)
    y += 7
  }

  if (w.container_number) {
    drawLabel(doc, 'Container #:', w.container_number, MARGIN, y)
    y += 7
  }

  if (w.created_at) {
    const created = new Date(w.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    drawLabel(doc, 'Created:', created, MARGIN, y)
    y += 7
  }

  if (w.created_by) {
    drawLabel(doc, 'Created by:', w.created_by, MARGIN, y)
    y += 7
  }

  y += 4

  /* ── Materials table ────────────────────────────────── */
  if (materials.length > 0) {
    if (y > 240) { doc.addPage(); y = MARGIN }

    setFont(doc, 'bold', 10)
    doc.setTextColor(20, 20, 20)
    doc.text('Materials', MARGIN, y)
    y += 2

    const head = [['#', 'Material', 'HS Code', 'Origin', 'Qty', 'Unit Price', 'Total', 'Packing']]
    const rows = materials.map((m, idx) => [
      String(idx + 1),
      m.description_override || '—',
      m.hs_code || '—',
      m.origin || '—',
      `${m.quantity} ${m.weight_unit || ''}`,
      `${(m.price || 0).toLocaleString()} ${m.currency || currency}`,
      `${(m.quantity * (m.price || 0)).toLocaleString()} ${m.currency || currency}`,
      m.packing_description || '—',
    ])

    autoTable(doc, {
      startY: y,
      head,
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
        font: 'helvetica',
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: MARGIN, right: MARGIN },
    })

    const table = (doc as any).lastAutoTable
    y = (table?.finalY ?? y) + 5

    // Total value row
    const totalValue = materials.reduce((s, m) => s + m.quantity * (m.price || 0), 0)

    setFont(doc, 'bold', 10)
    doc.setTextColor(20, 20, 20)
    doc.text('Total Value', MARGIN, y)
    doc.text(`${totalValue.toLocaleString()} ${currency}`, PAGE_W - MARGIN, y, { align: 'right' })
    y += 8
  }

  /* ── Page numbers ───────────────────────────────────── */
  addPageFooter(doc, w.name || 'project')

  /* ── Save ───────────────────────────────────────────── */
  const safeName = (w.name || 'project').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'project'
  doc.save(`${safeName}.pdf`)
}
