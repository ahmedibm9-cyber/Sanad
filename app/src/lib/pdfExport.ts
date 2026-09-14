import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage()
    return MARGIN
  }
  return y
}

/** Simple flat-key lookup for adaptForTemplate output. */
function val(data: Record<string, unknown>, key: string): string {
  const v = data[key]
  return v != null && v !== '' ? String(v) : ''
}

/* ── Template ID resolution ────────────────────────────── */

function resolveTemplateId(docData: DocPreviewData): string {
  switch (docData.template) {
    case 'fulla-commercial-invoice-680': return 'invoice-commercial'
    case 'fulla-tax-invoice-a-680':     return 'invoice-tax-a'
    case 'fulla-tax-invoice-b-680':     return 'invoice-tax-b'
    case 'fulla-proforma-invoice-680':  return 'invoice-proforma'
    case 'fulla-quotation-680':         return 'quotation'
    case 'fulla-packing-list-680':      return 'packing-list'
    case 'fulla-delivery-note-680':     return 'delivery-note'
    default:                            return 'invoice'
  }
}

function templateTitle(templateId: string): string {
  switch (templateId) {
    case 'invoice-commercial': return 'COMMERCIAL INVOICE'
    case 'invoice-tax-a':      return 'TAX INVOICE'
    case 'invoice-tax-b':      return 'TAX INVOICE'
    case 'invoice-proforma':   return 'PROFORMA INVOICE'
    case 'quotation':          return 'QUOTATION'
    case 'packing-list':       return 'PACKING LIST'
    case 'delivery-note':      return 'DELIVERY NOTE'
    default:                   return 'INVOICE'
  }
}

/* ═══════════════════════════════════════════════════════════
 * Invoice-family PDF renderer (QUOT / PINV / TINV / CINV)
 * ═══════════════════════════════════════════════════════════ */

function renderInvoiceFamily(doc: jsPDF, data: Record<string, unknown>, templateId: string): void {
  let y = MARGIN

  // ── Company name ──
  setFont(doc, 'bold', 14)
  doc.setTextColor(20, 20, 20)
  doc.text(val(data, 'company.name') || 'Company Name', MARGIN, y + 4)
  y += 6

  // ── Company info ──
  setFont(doc, 'normal', 8)
  doc.setTextColor(80, 80, 80)
  const info = [val(data, 'company.address'), val(data, 'company.phone') ? `Phone: ${val(data, 'company.phone')}` : ''].filter(Boolean)
  if (info.length) { doc.text(info.join(' | '), MARGIN, y); y += 4 }
  const info2 = [val(data, 'company.email') ? `Email: ${val(data, 'company.email')}` : '', val(data, 'company.vat') ? `VAT: ${val(data, 'company.vat')}` : '', val(data, 'company.cr') ? `CR: ${val(data, 'company.cr')}` : ''].filter(Boolean)
  if (info2.length) { doc.text(info2.join(' | '), MARGIN, y); y += 4 }

  // ── Accent line ──
  y += 2
  drawBoldLine(doc, y)
  y += 8

  // ── Title (right-aligned) ──
  setFont(doc, 'bold', 16)
  doc.setTextColor(10, 69, 73)
  doc.text(templateTitle(templateId), PAGE_W - MARGIN, y, { align: 'right' })
  y += 10

  // ── Meta (right side) ──
  let metaY = y - 8
  drawLabel(doc, 'Date:', val(data, 'date'), PAGE_W - MARGIN - 80, metaY, { labelW: 30 })
  metaY += 7
  if (val(data, 'expiration_date')) {
    drawLabel(doc, 'Expiry:', val(data, 'expiration_date'), PAGE_W - MARGIN - 80, metaY, { labelW: 30 })
    metaY += 7
  }
  drawLabel(doc, 'Invoice #:', val(data, 'invoice_number'), PAGE_W - MARGIN - 80, metaY, { labelW: 30 })
  metaY += 7
  drawLabel(doc, 'Customer ID:', val(data, 'customer_id'), PAGE_W - MARGIN - 80, metaY, { labelW: 30 })

  y = Math.max(metaY + 10, y)

  // ── Customer box ──
  drawLine(doc, y)
  y += 4
  setFont(doc, 'bold', 10)
  doc.setTextColor(20, 20, 20)
  doc.text('CUSTOMER', MARGIN, y)
  y += 5
  drawLabel(doc, 'Buyer:', val(data, 'customer.name'), MARGIN, y, { labelW: 25 })
  y += 6
  if (val(data, 'customer.address')) {
    drawLabel(doc, 'Address:', val(data, 'customer.address'), MARGIN, y, { labelW: 25 })
    y += 6
  }
  if (val(data, 'customer.contact')) {
    drawLabel(doc, 'Contact:', val(data, 'customer.contact'), MARGIN, y, { labelW: 25 })
    y += 6
  }
  if (val(data, 'customer.phone')) {
    drawLabel(doc, 'Phone:', val(data, 'customer.phone'), MARGIN, y, { labelW: 25 })
    y += 6
  }
  y += 4

  // ── Items table ──
  const items: Array<Record<string, unknown>> = []
  let i = 0
  while (data[`items.${i}.description`] !== undefined || data[`items.${i}.item_code`] !== undefined) {
    items.push({
      code: val(data, `items.${i}.item_code`),
      desc: val(data, `items.${i}.description`),
      hs: val(data, `items.${i}.hs_code`),
      packing: val(data, `items.${i}.packing`),
      origin: val(data, `items.${i}.origin`),
      qty: val(data, `items.${i}.quantity`),
      uom: val(data, `items.${i}.uom`),
      price: val(data, `items.${i}.price`),
      amount: val(data, `items.${i}.amount`),
    })
    i++
  }

  if (items.length > 0) {
    y = checkPageBreak(doc, y, 30)
    const head = [['Item Code', 'Description', 'Quantity', 'Price', 'Total']]
    const rows: string[][] = items.map(item => [
      String(item.code),
      [item.desc, item.hs ? `HS: ${item.hs}` : '', item.packing ? `Packing: ${item.packing}` : '', item.origin ? `Origin: ${item.origin}` : ''].filter(Boolean).join('\n'),
      `${item.qty} ${item.uom}`,
      String(item.price),
      String(item.amount),
    ])

    autoTable(doc, {
      startY: y,
      head,
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak', font: 'helvetica', lineColor: [200, 200, 200], lineWidth: 0.2 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
      },
      margin: { left: MARGIN, right: MARGIN },
    })

    const table = (doc as any).lastAutoTable
    y = (table?.finalY ?? y) + 6
  }

  // ── Terms section ──
  y = checkPageBreak(doc, y, 50)
  drawLine(doc, y)
  y += 4
  setFont(doc, 'bold', 10)
  doc.setTextColor(20, 20, 20)
  doc.text('TERMS OF SALE AND OTHER COMMENTS', MARGIN, y)
  y += 6

  if (val(data, 'terms.payment')) { drawLabel(doc, 'Payment:', val(data, 'terms.payment'), MARGIN, y, { labelW: 25 }); y += 6 }
  if (val(data, 'terms.delivery')) { drawLabel(doc, 'Delivery:', val(data, 'terms.delivery'), MARGIN, y, { labelW: 25 }); y += 6 }
  if (val(data, 'terms.shipping')) { drawLabel(doc, 'Shipping:', val(data, 'terms.shipping'), MARGIN, y, { labelW: 25 }); y += 6 }
  if (val(data, 'terms.validity')) { setFont(doc, 'normal', 9); doc.setTextColor(80, 80, 80); doc.text(val(data, 'terms.validity'), MARGIN + 25, y); y += 6 }

  // ── Bank details ──
  if (val(data, 'bank.name')) {
    y += 2
    setFont(doc, 'bold', 9)
    doc.text(`Bank: ${val(data, 'bank.name')}${val(data, 'bank.currency') ? ` (${val(data, 'bank.currency')})` : ''}`, MARGIN, y)
    y += 5
    if (val(data, 'bank.account_name')) { drawLabel(doc, 'Account:', val(data, 'bank.account_name'), MARGIN, y, { labelW: 25 }); y += 5 }
    if (val(data, 'bank.iban')) { drawLabel(doc, 'IBAN:', val(data, 'bank.iban'), MARGIN, y, { labelW: 25 }); y += 5 }
    if (val(data, 'bank.swift')) { drawLabel(doc, 'SWIFT:', val(data, 'bank.swift'), MARGIN, y, { labelW: 25 }); y += 5 }
  }

  // ── Totals ──
  y += 4
  const totalsY = y
  const totalsX = MARGIN + 40
  autoTable(doc, {
    startY: totalsY,
    head: [],
    body: [
      ['Subtotal', val(data, 'totals.subtotal')],
      [`Tax (${val(data, 'totals.tax_rate')})`, val(data, 'totals.vat')],
      ['TOTAL', val(data, 'totals.total')],
      ['Currency', val(data, 'currency')],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2, font: 'helvetica', lineColor: [200, 200, 200], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: totalsX, right: MARGIN },
  })

  const totalsTable = (doc as any).lastAutoTable
  y = (totalsTable?.finalY ?? totalsY) + 8

  // ── Manager ──
  y = checkPageBreak(doc, y, 15)
  drawLine(doc, y)
  y += 5
  setFont(doc, 'bold', 10)
  doc.setTextColor(20, 20, 20)
  doc.text('Export Manager', MARGIN, y)
  if (val(data, 'approved_by')) {
    y += 5
    setFont(doc, 'normal', 10)
    doc.text(val(data, 'approved_by'), MARGIN, y)
  }
}

/* ═══════════════════════════════════════════════════════════
 * Packing List PDF renderer
 * ═══════════════════════════════════════════════════════════ */

function renderPackingList(doc: jsPDF, data: Record<string, unknown>): void {
  let y = MARGIN

  // ── Header ──
  setFont(doc, 'bold', 14)
  doc.setTextColor(20, 20, 20)
  doc.text(val(data, 'company.name') || 'Company Name', MARGIN, y + 4)
  y += 6
  setFont(doc, 'normal', 8)
  doc.setTextColor(80, 80, 80)
  const info = [val(data, 'company.address'), val(data, 'company.phone') ? `Phone: ${val(data, 'company.phone')}` : ''].filter(Boolean)
  if (info.length) { doc.text(info.join(' | '), MARGIN, y); y += 4 }
  y += 2
  drawBoldLine(doc, y)
  y += 8

  // ── Title ──
  setFont(doc, 'bold', 16)
  doc.setTextColor(10, 69, 73)
  doc.text('PACKING LIST', PAGE_W - MARGIN, y, { align: 'right' })
  y += 6
  setFont(doc, 'normal', 9)
  doc.text(val(data, 'packing_list_number'), PAGE_W - MARGIN, y, { align: 'right' })
  y += 5
  doc.text(val(data, 'date'), PAGE_W - MARGIN, y, { align: 'right' })
  y += 10

  // ── Info section ──
  drawLabel(doc, 'PL No:', val(data, 'packing_list_number'), MARGIN, y, { labelW: 20 })
  drawLabel(doc, 'Date:', val(data, 'date'), MARGIN + 60, y, { labelW: 20 })
  y += 8

  drawLabel(doc, 'Consignee:', val(data, 'customer.name'), MARGIN, y, { labelW: 25 })
  y += 6
  if (val(data, 'customer.address_line1')) { doc.text(val(data, 'customer.address_line1'), MARGIN + 25, y); y += 5 }
  if (val(data, 'customer.address_line2')) { doc.text(val(data, 'customer.address_line2'), MARGIN + 25, y); y += 5 }
  if (val(data, 'customer.phone')) { doc.text(val(data, 'customer.phone'), MARGIN + 25, y); y += 5 }
  y += 2

  drawLabel(doc, 'Invoice Ref:', val(data, 'invoice_reference'), MARGIN, y, { labelW: 25 })
  drawLabel(doc, 'Marks:', val(data, 'marks_numbers'), MARGIN + 60, y, { labelW: 20 })
  y += 10

  // ── Items table ──
  const items: Array<Record<string, unknown>> = []
  let i = 0
  while (data[`items.${i}.description`] !== undefined || data[`items.${i}.item_code`] !== undefined) {
    items.push({
      marks: val(data, `items.${i}.marks`),
      code: val(data, `items.${i}.item_code`),
      desc: val(data, `items.${i}.description`),
      hs: val(data, `items.${i}.hs_code`),
      packing: val(data, `items.${i}.packing`),
      origin: val(data, `items.${i}.origin`),
      packages: val(data, `items.${i}.packages`),
      qty: val(data, `items.${i}.quantity`),
      uom: val(data, `items.${i}.uom`),
      net: val(data, `items.${i}.net_kg`),
      gross: val(data, `items.${i}.gross_kg`),
    })
    i++
  }

  if (items.length > 0) {
    y = checkPageBreak(doc, y, 30)
    const head = [['Marks', 'Code', 'Description', 'Pkgs', 'Qty', 'Net KG', 'Gross KG']]
    const rows: string[][] = items.map(item => [
      String(item.marks),
      String(item.code),
      [item.desc, item.hs ? `HS: ${item.hs}` : '', item.packing ? `Pack: ${item.packing}` : '', item.origin ? `Origin: ${item.origin}` : ''].filter(Boolean).join('\n'),
      String(item.packages),
      `${item.qty} ${item.uom}`,
      String(item.net),
      String(item.gross),
    ])

    autoTable(doc, {
      startY: y,
      head,
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', font: 'helvetica', lineColor: [200, 200, 200], lineWidth: 0.2 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 25 },
        2: { cellWidth: 60 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
      },
      margin: { left: MARGIN, right: MARGIN },
    })

    const table = (doc as any).lastAutoTable
    y = (table?.finalY ?? y) + 6
  }

  // ── Container info ──
  y = checkPageBreak(doc, y, 20)
  if (val(data, 'container.type') || val(data, 'container.seal') || val(data, 'container.packages')) {
    drawLabel(doc, 'Container:', val(data, 'container.type'), MARGIN, y, { labelW: 25 })
    drawLabel(doc, 'Seal:', val(data, 'container.seal'), MARGIN + 50, y, { labelW: 15 })
    drawLabel(doc, 'Packages:', val(data, 'container.packages'), MARGIN + 90, y, { labelW: 22 })
    y += 8
  }

  // ── Manager ──
  y = checkPageBreak(doc, y, 15)
  drawLine(doc, y)
  y += 5
  setFont(doc, 'bold', 10)
  doc.text('Export Manager', MARGIN, y)
  if (val(data, 'approved_by')) { y += 5; setFont(doc, 'normal', 10); doc.text(val(data, 'approved_by'), MARGIN, y) }
}

/* ═══════════════════════════════════════════════════════════
 * Delivery Note PDF renderer
 * ═══════════════════════════════════════════════════════════ */

function renderDeliveryNote(doc: jsPDF, data: Record<string, unknown>): void {
  let y = MARGIN

  // ── Banner ──
  doc.setFillColor(18, 99, 76)
  doc.rect(MARGIN, y, CONTENT_W, 15, 'F')
  setFont(doc, 'bold', 14)
  doc.setTextColor(255, 255, 255)
  doc.text('DELIVERY NOTE', PAGE_W / 2, y + 6, { align: 'center' })
  setFont(doc, 'normal', 8)
  doc.text('Export Material Issue Voucher', PAGE_W / 2, y + 11, { align: 'center' })
  y += 18

  // ── Company ──
  setFont(doc, 'bold', 12)
  doc.setTextColor(20, 20, 20)
  doc.text(val(data, 'company.name') || 'Company Name', PAGE_W / 2, y + 4, { align: 'center' })
  y += 10
  drawBoldLine(doc, y)
  y += 8

  // ── Summary grid ──
  const summaryFields = [
    ['Delivery Note No:', val(data, 'delivery_note_number')],
    ['Date:', val(data, 'date')],
    ['Customer:', val(data, 'customer.name')],
    ['Shipping Method:', val(data, 'shipping_method')],
    ['Destination:', val(data, 'destination')],
    ['Deliver Before:', val(data, 'prepare_before')],
  ]

  doc.setFillColor(244, 238, 209)
  doc.rect(MARGIN, y, CONTENT_W, 20, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(MARGIN, y, CONTENT_W, 20, 'S')

  let sy = y + 4
  for (const [label, value] of summaryFields) {
    drawLabel(doc, label, value, MARGIN + 2, sy, { labelW: 35 })
    sy += 3
  }
  y += 24

  // ── Details ──
  setFont(doc, 'bold', 10)
  doc.setTextColor(20, 20, 20)
  doc.text('DELIVERY DETAILS', MARGIN, y)
  y += 6

  const detailFields = [
    ['Invoice No:', val(data, 'invoice_number')],
    ['Document No:', val(data, 'document_number')],
    ['Date:', val(data, 'date')],
    ['Customer:', val(data, 'customer.name')],
    ['Destination:', val(data, 'destination')],
    ['Shipping:', val(data, 'shipping_method')],
  ]

  for (const [label, value] of detailFields) {
    if (value) {
      drawLabel(doc, label, value, MARGIN, y, { labelW: 30 })
      y += 6
    }
  }
  y += 4

  // ── Items table ──
  const items: Array<Record<string, unknown>> = []
  let i = 0
  while (data[`items.${i}.description`] !== undefined || data[`items.${i}.item_code`] !== undefined) {
    items.push({
      num: String(i + 1),
      code: val(data, `items.${i}.item_code`),
      name: val(data, `items.${i}.description`),
      unit: val(data, `items.${i}.uom`),
      qty: val(data, `items.${i}.quantity`),
      origin: val(data, `items.${i}.origin`),
      remarks: val(data, `items.${i}.remarks`),
    })
    i++
  }

  if (items.length > 0) {
    y = checkPageBreak(doc, y, 30)
    const head = [['#', 'Item Code', 'Description', 'Unit', 'Quantity', 'Origin', 'Remarks']]
    const rows: string[][] = items.map(item => [String(item.num), String(item.code), String(item.name), String(item.unit), String(item.qty), String(item.origin), String(item.remarks)])

    autoTable(doc, {
      startY: y,
      head,
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', font: 'helvetica', lineColor: [200, 200, 200], lineWidth: 0.2 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 45 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 30 },
      },
      margin: { left: MARGIN, right: MARGIN },
    })

    const table = (doc as any).lastAutoTable
    y = (table?.finalY ?? y) + 8
  }

  // ── Approvals ──
  y = checkPageBreak(doc, y, 25)
  setFont(doc, 'bold', 10)
  doc.text('Approvals & Signatures', MARGIN, y)
  y += 6
  drawLabel(doc, 'Approved by:', val(data, 'approved_by'), MARGIN, y, { labelW: 30 })
  drawLabel(doc, 'Received by:', val(data, 'received_by'), MARGIN + 80, y, { labelW: 30 })
}

/* ═══════════════════════════════════════════════════════════
 * Public API — testable function returning ArrayBuffer
 * ═══════════════════════════════════════════════════════════ */

export async function createDocumentPdf(docData: DocPreviewData): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const templateData = adaptForTemplate(docData as any, docData.template || 'fulla-commercial-invoice-680')
  const templateId = resolveTemplateId(docData)

  switch (templateId) {
    case 'packing-list':   renderPackingList(doc, templateData); break
    case 'delivery-note':  renderDeliveryNote(doc, templateData); break
    default:               renderInvoiceFamily(doc, templateData, templateId); break
  }

  addPageFooter(doc, docData.number)
  return doc.output('arraybuffer')
}

/**
 * Download a document as PDF.
 *
 * - English documents: direct jsPDF text PDF (selectable, no rasterization).
 * - Arabic/mixed documents: browser print dialog (native Arabic shaping, RTL).
 */
export async function downloadDocumentPdf(docData: DocPreviewData): Promise<void> {
  const isAr = docData.language === 'ar'

  if (!isAr) {
    // English-only: direct jsPDF download
    const buffer = await createDocumentPdf(docData)
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docData.number || 'document'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return
  }

  // Arabic/mixed: use browser print for native Arabic text rendering
  const templateData = adaptForTemplate(docData as any, docData.template || 'fulla-commercial-invoice-680')
  const templateId = resolveTemplateId(docData)

  const fullaTemplateMap: Record<string, string> = {
    'invoice-commercial': 'invoice',
    'invoice-tax-a': 'invoice',
    'invoice-tax-b': 'invoice',
    'invoice-proforma': 'invoice',
    'quotation': 'quotation',
    'packing-list': 'packing-list',
    'delivery-note': 'delivery-note',
  }
  const fullaId = fullaTemplateMap[templateId] || 'invoice'
  const pageHtml = renderFullaTemplate(fullaId as any, templateData)

  const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${docData.number || 'Document'}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;800&display=swap">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { margin: 0; padding: 0; background: #fff; font-family: 'Noto Sans Arabic', Tahoma, Arial, sans-serif; }
  .page { position: relative; width: 794px; height: 1123px; margin: 0 auto; background: #fff; overflow: hidden; font-size: 12px; line-height: 1.15; }
  @media print {
    body { margin: 0; padding: 0; }
    .page { width: 210mm; height: 297mm; margin: 0; box-shadow: none; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
${pageHtml}
</body>
</html>`

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:99999;background:#fff;overflow:auto;'
  container.innerHTML = fullHtml
  document.body.appendChild(container)

  const cleanup = () => {
    if (container.parentNode) container.parentNode.removeChild(container)
  }

  // Try native print; fallback to new tab
  setTimeout(() => {
    try {
      window.print()
      // afterprint is unreliable; clean up after a delay
      setTimeout(cleanup, 2000)
    } catch {
      // Fallback: open in new tab for manual print/save
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(fullHtml)
        printWindow.document.close()
      }
      cleanup()
    }
  }, 500)
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
  }

  /* ── Page numbers ───────────────────────────────────── */
  addPageFooter(doc, w.name || 'project')

  /* ── Save ───────────────────────────────────────────── */
  const safeName = (w.name || 'project').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'project'
  doc.save(`${safeName}.pdf`)
}
