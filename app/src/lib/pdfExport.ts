import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'

/* ── Document type labels ──────────────────────────────── */
const docTypeLabels: Record<string, { en: string; ar: string }> = {
  QUOT: { en: 'QUOTATION', ar: 'عرض أسعار' },
  PINV: { en: 'PROFORMA INVOICE', ar: 'فاتورة مبدئية' },
  TINV: { en: 'TAX INVOICE', ar: 'فاتورة ضريبية' },
  CINV: { en: 'COMMERCIAL INVOICE', ar: 'فاتورة تجارية' },
  PKL:  { en: 'PACKING LIST', ar: 'قائمة التعبئة' },
  DN:   { en: 'DELIVERY NOTE', ar: 'إشعار التسليم' },
  BL:   { en: 'BILL OF LADING', ar: 'بوليصة الشحن' },
}

/* ── Shared helpers ────────────────────────────────────── */

const PAGE_W = 210
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

function isArabicText(text: string): boolean {
  return ARABIC_RE.test(text)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

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

/**
 * Generate a ZATCA-compliant QR code as a data URL.
 * Encodes: Seller Name, VAT Registration, Timestamp, Invoice Total, VAT Amount.
 */
async function generateZatcaQr(data: {
  sellerName: string
  vatNumber: string
  timestamp: string
  totalWithVat: string
  vatAmount: string
}): Promise<string> {
  // ZATCA TLV format: each field is Tag-Length-Value
  const encoder = new TextEncoder()
  
  function tlv(tag: number, value: string): number[] {
    const bytes = encoder.encode(value)
    return [tag, bytes.length, ...bytes]
  }
  
  const fields = [
    tlv(1, data.sellerName),       // Seller Name
    tlv(2, data.vatNumber),         // VAT Registration Number
    tlv(3, data.timestamp),         // Timestamp (ISO 8601)
    tlv(4, data.totalWithVat),      // Invoice Total with VAT
    tlv(5, data.vatAmount),         // VAT Amount
  ]
  
  const tlvBytes = fields.flat()
  const base64 = btoa(String.fromCharCode(...tlvBytes))
  
  return QRCode.toDataURL(base64, { width: 200, margin: 1 })
}

/* ── Arabic HTML-to-PDF fallback ────────────────────────── */

async function downloadDocumentPdfArabic(docData: {
  number: string
  type: string
  date: string
  language?: string
  items?: Array<{
    material: string
    description: string
    hsCode?: string
    origin?: string
    quantity: number
    unit: string
    unitPrice: number
    currency: string
    total?: number
  }>
  buyer?: { name?: string; nameAr?: string; address?: string; contactPerson?: string }
  company?: {
    nameEn?: string
    nameAr?: string
    crNumber?: string
    vatNumber?: string
    address?: string
    phone?: string
    email?: string
    bankName?: string
    iban?: string
    swift?: string
  }
  subtotal?: number
  vatAmount?: number
  vatRate?: number
  total?: number
  preparedBy?: string
  showSignature?: boolean
  showStamp?: boolean
  notes?: string
  terms?: string
  incoterm?: string
  portOfLoading?: string
  portOfDischarge?: string
}): Promise<void> {
  const d = docData
  const items = d.items || []
  const label = docTypeLabels[d.type] || { en: d.type, ar: d.type }
  const docTitle = label.ar

  const companyName = d.company?.nameAr || d.company?.nameEn || 'SANAD'
  const buyerName = d.buyer?.nameAr || d.buyer?.name || ''

  const formattedDate = d.date
    ? new Date(d.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const subtotal = d.subtotal ?? items.reduce((s, i) => s + (i.total ?? i.quantity * i.unitPrice), 0)
  const vatAmount = d.vatAmount ?? 0
  const total = d.total ?? subtotal + vatAmount
  const currency = items[0]?.currency || 'SAR'
  const isCINV = d.type === 'CINV'

  const itemRows = items.map((item, idx) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ccc;text-align:center;font-size:9pt;">${idx + 1}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;font-size:9pt;">${escapeHtml(isCINV ? (item.hsCode || '') : item.material)}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;font-size:9pt;">${escapeHtml(item.description)}</td>
      ${isCINV ? `<td style="padding:6px 8px;border:1px solid #ccc;font-size:9pt;">${escapeHtml(item.origin || '')}</td>` : ''}
      <td style="padding:6px 8px;border:1px solid #ccc;font-size:9pt;text-align:center;">${item.quantity} ${escapeHtml(item.unit)}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;font-size:9pt;text-align:right;">${item.unitPrice.toLocaleString()} ${escapeHtml(item.currency)}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;font-size:9pt;text-align:right;">${((item.total ?? item.quantity * item.unitPrice) || 0).toLocaleString()} ${escapeHtml(item.currency)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', 'Noto Sans Arabic', Arial, sans-serif;
    font-size: 9pt; line-height: 1.5; color: #1e1e1e;
    margin: 0; padding: 20px; direction: rtl; text-align: right;
    width: 794px; background: #fff;
  }
  .company-name { font-size: 16pt; font-weight: bold; margin: 0; }
  .company-meta { font-size: 8pt; color: #888; margin: 2px 0; }
  .bold-sep { border: none; border-top: 2.5px solid #282828; margin: 12px 0; }
  .doc-title { font-size: 14pt; font-weight: bold; text-align: center; margin: 8px 0; }
  .doc-meta { font-size: 10pt; color: #555; }
  .doc-meta strong { color: #1e1e1e; }
  .parties { display: flex; justify-content: space-between; margin-top: 14px; font-size: 9pt; }
  .party-label { font-size: 8pt; font-weight: bold; color: #999; }
  .party-name { font-size: 10pt; font-weight: bold; color: #1e1e1e; }
  .party-detail { font-size: 8pt; color: #555; }
  .shipping-bar { border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 6px 0; margin: 10px 0; font-size: 9pt; color: #555; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
  table.items th { background: #282828; color: #fff; padding: 6px 8px; font-size: 8pt; border: 1px solid #333; text-align: right; }
  table.items td { border: 1px solid #ccc; }
  .totals { width: 280px; margin: 10px 0 0 auto; font-size: 10pt; }
  .totals td { padding: 4px 8px; }
  .totals .lbl { text-align: left; color: #555; }
  .totals .val { text-align: right; }
  .totals .total-row td { border-top: 2px solid #282828; padding-top: 6px; font-weight: bold; font-size: 12pt; }
  .notes { font-size: 9pt; color: #555; margin-top: 12px; }
  .notes strong { color: #999; font-size: 8pt; }
  .footer-sep { border: none; border-top: 1px solid #ccc; margin-top: 18px; }
  .prepared { font-size: 9pt; text-align: center; margin-top: 8px; color: #555; }
  .prepared strong { color: #1e1e1e; }
  .stamp-area { display: flex; justify-content: space-between; margin-top: 20px; font-size: 8pt; color: #999; }
  .stamp-area .line { width: 120px; border-bottom: 1px solid #000; margin-bottom: 4px; }
</style>
</head>
<body>
  <div class="company-name">${escapeHtml(companyName)}</div>
  ${d.company?.crNumber || d.company?.vatNumber ? `<div class="company-meta">${[d.company.crNumber ? `السجل: ${d.company.crNumber}` : '', d.company.vatNumber ? `الرقم الضريبي: ${d.company.vatNumber}` : ''].filter(Boolean).join(' | ')}</div>` : ''}
  ${d.company?.address ? `<div class="company-meta">${escapeHtml(d.company.address)}</div>` : ''}
  ${d.company?.phone || d.company?.email ? `<div class="company-meta">${escapeHtml(d.company.phone || '')} | ${escapeHtml(d.company.email || '')}</div>` : ''}

  <hr class="bold-sep">

  <div class="doc-title">${escapeHtml(docTitle)}</div>

  <div style="display:flex;justify-content:space-between;font-size:10pt;color:#555;margin-bottom:10px;">
    <div><strong>رقم:</strong> <strong style="color:#1e1e1e;">${escapeHtml(d.number || '—')}</strong></div>
    <div><strong>التاريخ:</strong> <strong style="color:#1e1e1e;">${formattedDate}</strong></div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">المُصدِّر / البائع</div>
      <div class="party-name">${escapeHtml(companyName)}</div>
      ${d.company?.address ? `<div class="party-detail">${escapeHtml(d.company.address)}</div>` : ''}
      ${d.company?.phone ? `<div class="party-detail">${escapeHtml(d.company.phone)}</div>` : ''}
    </div>
    <div>
      <div class="party-label">المشتري / العميل</div>
      <div class="party-name">${escapeHtml(buyerName)}</div>
      ${d.buyer?.address ? `<div class="party-detail">${escapeHtml(d.buyer.address)}</div>` : ''}
      ${d.buyer?.contactPerson ? `<div class="party-detail">جهة الاتصال: ${escapeHtml(d.buyer.contactPerson)}</div>` : ''}
    </div>
  </div>

  ${d.incoterm || d.portOfLoading || d.portOfDischarge ? `
  <div class="shipping-bar">
    ${d.incoterm ? `<span>شرطة التجارة: ${escapeHtml(d.incoterm)}</span> &nbsp;&nbsp; ` : ''}
    ${d.portOfLoading ? `<span>ميناء التحميل: ${escapeHtml(d.portOfLoading)}</span> &nbsp;&nbsp; ` : ''}
    ${d.portOfDischarge ? `<span>ميناء التفريغ: ${escapeHtml(d.portOfDischarge)}</span>` : ''}
  </div>` : ''}

  ${items.length > 0 ? `
  <table class="items">
    <thead>
      <tr>
        <th>#</th>
        <th>${isCINV ? 'كود النظام المنسق' : 'المادة'}</th>
        <th>الوصف</th>
        ${isCINV ? '<th>المصدر</th>' : ''}
        <th>الكمية</th>
        <th>سعر الوحدة</th>
        <th>المجموع</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals">
    <tr>
      <td class="lbl">المجموع الفرعي</td>
      <td class="val">${subtotal.toLocaleString()} ${currency}</td>
    </tr>
    ${vatAmount > 0 ? `
    <tr>
      <td class="lbl">الضريبة (${d.vatRate || 0}%)</td>
      <td class="val">${vatAmount.toLocaleString()} ${currency}</td>
    </tr>` : ''}
    <tr class="total-row">
      <td class="lbl">المجموع</td>
      <td class="val">${total.toLocaleString()} ${currency}</td>
    </tr>
  </table>` : ''}

  ${d.notes ? `<div class="notes"><strong>ملاحظات:</strong> ${escapeHtml(d.notes)}</div>` : ''}
  ${d.terms ? `<div class="notes"><strong>الشروط والأحكام:</strong> ${escapeHtml(d.terms)}</div>` : ''}

  <hr class="footer-sep">

  ${d.preparedBy ? `<div class="prepared"><strong>أعدّه:</strong> ${escapeHtml(d.preparedBy)}</div>` : ''}

  <div class="stamp-area">
    <div>
      <div class="line"></div>
      <span>التوقيع</span>
    </div>
    <div>
      <div class="line"></div>
      <span>الختم</span>
    </div>
  </div>
</body>
</html>`

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;'
  container.innerHTML = html
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

    pdf.save(`${d.number || 'document'}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}

/* ── Document PDF ──────────────────────────────────────── */

export async function downloadDocumentPdf(docData: {
  number: string
  type: string
  date: string
  language?: string
  items?: Array<{
    material: string
    description: string
    hsCode?: string
    origin?: string
    quantity: number
    unit: string
    unitPrice: number
    currency: string
    total?: number
  }>
  buyer?: { name?: string; nameAr?: string; address?: string; contactPerson?: string }
  company?: {
    nameEn?: string
    nameAr?: string
    crNumber?: string
    vatNumber?: string
    address?: string
    phone?: string
    email?: string
    bankName?: string
    iban?: string
    swift?: string
  }
  subtotal?: number
  vatAmount?: number
  vatRate?: number
  total?: number
  preparedBy?: string
  showSignature?: boolean
  showStamp?: boolean
  notes?: string
  terms?: string
  incoterm?: string
  portOfLoading?: string
  portOfDischarge?: string
}): Promise<void> {
  if (docData.language === 'ar') {
    return downloadDocumentPdfArabic(docData)
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const isAr = docData.language === 'ar'
  const d = docData
  const items = d.items || []

  const label = docTypeLabels[d.type] || { en: d.type, ar: d.type }
  const docTitle = isAr ? label.ar : label.en

  let y = MARGIN

  /* ── Company header ─────────────────────────────────── */
  const companyName = isAr
    ? (d.company?.nameAr || d.company?.nameEn || 'SANAD')
    : (d.company?.nameEn || d.company?.nameAr || 'SANAD')

  setFont(doc, 'bold', 16)
  doc.setTextColor(20, 20, 20)
  doc.text(companyName, MARGIN, y + 4)

  if (d.company?.crNumber || d.company?.vatNumber) {
    setFont(doc, 'normal', 8)
    doc.setTextColor(120, 120, 120)
    const parts: string[] = []
    if (d.company.crNumber) parts.push(`CR: ${d.company.crNumber}`)
    if (d.company.vatNumber) parts.push(`VAT: ${d.company.vatNumber}`)
    doc.text(parts.join('  |  '), MARGIN, y + 9)
  }
  if (d.company?.address) {
    setFont(doc, 'normal', 8)
    doc.setTextColor(120, 120, 120)
    doc.text(d.company.address, MARGIN, y + 13)
  }
  if (d.company?.phone || d.company?.email) {
    setFont(doc, 'normal', 8)
    doc.setTextColor(120, 120, 120)
    doc.text(`${d.company.phone || ''}  |  ${d.company.email || ''}`.trim(), MARGIN, y + 17)
  }

  y += 24

  /* ── Separator ──────────────────────────────────────── */
  drawBoldLine(doc, y)
  y += 8

  /* ── Document title ─────────────────────────────────── */
  setFont(doc, 'bold', 14)
  doc.setTextColor(20, 20, 20)
  doc.text(docTitle, PAGE_W / 2, y, { align: 'center' })
  y += 8

  /* ── Doc number & date row ──────────────────────────── */
  setFont(doc, 'normal', 10)
  doc.setTextColor(80, 80, 80)
  doc.text(`${isAr ? 'رقم:' : 'No:'} `, MARGIN, y)
  setFont(doc, 'bold', 10)
  doc.text(d.number || '—', MARGIN + 15, y)

  setFont(doc, 'normal', 10)
  const dateLabelW = isAr ? 'التاريخ:' : 'Date:'
  doc.text(`${dateLabelW} `, PAGE_W - MARGIN - 50, y)
  setFont(doc, 'bold', 10)
  const formattedDate = d.date
    ? new Date(d.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'
  doc.text(formattedDate, PAGE_W - MARGIN - 35, y)
  y += 10

  /* ── Shipper / Buyer side-by-side ───────────────────── */
  const midX = MARGIN + CONTENT_W / 2

  // Shipper
  setFont(doc, 'bold', 8)
  doc.setTextColor(150, 150, 150)
  doc.text(isAr ? 'المُصدِّر / البائع' : 'Exporter / Seller', MARGIN, y)
  setFont(doc, 'bold', 10)
  doc.setTextColor(20, 20, 20)
  doc.text(isAr ? (d.company?.nameAr || '') : (d.company?.nameEn || ''), MARGIN, y + 5)
  setFont(doc, 'normal', 8)
  doc.setTextColor(80, 80, 80)
  if (d.company?.address) doc.text(d.company.address, MARGIN, y + 10)
  if (d.company?.phone) doc.text(d.company.phone, MARGIN, y + 15)

  // Buyer
  setFont(doc, 'bold', 8)
  doc.setTextColor(150, 150, 150)
  doc.text(isAr ? 'المشتري / العميل' : 'Buyer / Customer', midX + 5, y)
  setFont(doc, 'bold', 10)
  doc.setTextColor(20, 20, 20)
  const buyerName = isAr ? (d.buyer?.nameAr || d.buyer?.name || '') : (d.buyer?.name || '')
  doc.text(buyerName, midX + 5, y + 5)
  setFont(doc, 'normal', 8)
  doc.setTextColor(80, 80, 80)
  if (d.buyer?.address) doc.text(d.buyer.address, midX + 5, y + 10)
  if (d.buyer?.contactPerson) {
    const cpLabel = isAr ? 'جهة الاتصال:' : 'Contact:'
    doc.text(`${cpLabel} ${d.buyer.contactPerson}`, midX + 5, y + 15)
  }

  y += 24

  /* ── Shipping info bar ──────────────────────────────── */
  if (d.incoterm || d.portOfLoading || d.portOfDischarge) {
    drawLine(doc, y)
    y += 5
    setFont(doc, 'normal', 9)
    doc.setTextColor(80, 80, 80)

    let shippingX = MARGIN
    if (d.incoterm) {
      const incLabel = isAr ? 'شرطة التجارة:' : 'Incoterm:'
      doc.text(`${incLabel} ${d.incoterm}`, shippingX, y)
      shippingX += 50
    }
    if (d.portOfLoading) {
      const polLabel = isAr ? 'ميناء التحميل:' : 'Port of Loading:'
      doc.text(`${polLabel} ${d.portOfLoading}`, shippingX, y)
      shippingX += 75
    }
    if (d.portOfDischarge) {
      const podLabel = isAr ? 'ميناء التفريغ:' : 'Port of Discharge:'
      doc.text(`${podLabel} ${d.portOfDischarge}`, shippingX, y)
    }
    y += 8
    drawLine(doc, y)
    y += 5
  }

  /* ── Items table ────────────────────────────────────── */
  if (items.length > 0) {
    const isCINV = d.type === 'CINV'

    const headCols = isAr
      ? [
          { header: '#', dataKey: 'idx' },
          { header: isCINV ? 'كود النظام المنسق' : 'البضاعة', dataKey: 'col1' },
          { header: 'الوصف', dataKey: 'description' },
          ...(isCINV ? [{ header: 'المصدر', dataKey: 'origin' }] : []),
          { header: 'الكمية', dataKey: 'qty' },
          { header: 'سعر الوحدة', dataKey: 'unitPrice' },
          { header: 'المجموع', dataKey: 'total' },
        ]
      : [
          { header: '#', dataKey: 'idx' },
          { header: 'Description', dataKey: 'col1' },
          ...(isCINV ? [{ header: 'HS Code', dataKey: 'hsCode' }] : []),
          ...(isCINV ? [{ header: 'Origin', dataKey: 'origin' }] : []),
          { header: 'Quantity', dataKey: 'qty' },
          { header: 'Unit Price', dataKey: 'unitPrice' },
          { header: 'Total', dataKey: 'total' },
        ]

    const rows = items.map((item, idx) => {
      const descCol = isCINV ? (item.hsCode || '') : (`${item.material} — ${item.description}`)
      const base: Record<string, string | number> = {
        idx: idx + 1,
        col1: descCol,
        description: item.description,
        qty: `${item.quantity} ${item.unit}`,
        unitPrice: `${(item.unitPrice || 0).toLocaleString()} ${item.currency}`,
        total: `${((item.total ?? item.quantity * item.unitPrice) || 0).toLocaleString()} ${item.currency}`,
      }
      if (isCINV) {
        base.hsCode = item.hsCode || ''
        base.origin = item.origin || ''
      }
      return base
    })

    const headStyles = isAr
      ? { fillColor: [40, 40, 40] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], halign: 'right' as const, fontStyle: 'bold' as const }
      : { fillColor: [40, 40, 40] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], halign: 'left' as const, fontStyle: 'bold' as const }

    autoTable(doc, {
      startY: y,
      head: [headCols.map(c => c.header)],
      body: rows.map(r => headCols.map(c => String(r[c.dataKey] ?? ''))),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        font: 'helvetica',
        halign: isAr ? 'right' : 'left',
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
      },
      headStyles,
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
      },
      margin: { left: MARGIN, right: MARGIN },
    })

    const table = (doc as any).lastAutoTable
    y = (table?.finalY ?? y) + 5
  }

  /* ── Totals section ─────────────────────────────────── */
  const currency = items[0]?.currency || 'SAR'
  const subtotal = d.subtotal ?? items.reduce((s, i) => s + (i.total ?? i.quantity * i.unitPrice), 0)
  const vatAmount = d.vatAmount ?? 0
  const total = d.total ?? subtotal + vatAmount

  const totalsX = PAGE_W - MARGIN - 70
  const totalsW = 70

  // Check if we need a page break
  if (y > 250) {
    doc.addPage()
    y = MARGIN
  }

  // Subtotal
  setFont(doc, 'normal', 10)
  doc.setTextColor(80, 80, 80)
  doc.text(isAr ? 'المجموع الفرعي' : 'Subtotal', totalsX, y)
  setFont(doc, 'normal', 10)
  doc.text(`${subtotal.toLocaleString()} ${currency}`, totalsX + totalsW, y, { align: 'right' })
  y += 6

  // VAT if applicable
  if (vatAmount > 0) {
    setFont(doc, 'normal', 10)
    doc.setTextColor(80, 80, 80)
    doc.text(isAr ? `الضريبة (${d.vatRate || 0}%)` : `VAT (${d.vatRate || 0}%)`, totalsX, y)
    doc.text(`${vatAmount.toLocaleString()} ${currency}`, totalsX + totalsW, y, { align: 'right' })
    y += 6
  }

  // Total line
  drawBoldLine(doc, y - 2)
  y += 3
  setFont(doc, 'bold', 12)
  doc.setTextColor(20, 20, 20)
  doc.text(isAr ? 'المجموع' : 'Total', totalsX, y)
  doc.text(`${total.toLocaleString()} ${currency}`, totalsX + totalsW, y, { align: 'right' })
  y += 10

  /* ── Notes ──────────────────────────────────────────── */
  if (d.notes) {
    if (y > 250) { doc.addPage(); y = MARGIN }
    setFont(doc, 'bold', 8)
    doc.setTextColor(150, 150, 150)
    doc.text(isAr ? 'ملاحظات' : 'Notes', MARGIN, y)
    y += 4
    setFont(doc, 'normal', 9)
    doc.setTextColor(80, 80, 80)
    const noteLines = doc.splitTextToSize(d.notes, CONTENT_W)
    doc.text(noteLines, MARGIN, y)
    y += noteLines.length * 4 + 4
  }

  /* ── Terms & Conditions ─────────────────────────────── */
  if (d.terms) {
    if (y > 250) { doc.addPage(); y = MARGIN }
    setFont(doc, 'bold', 8)
    doc.setTextColor(150, 150, 150)
    doc.text(isAr ? 'الشروط والأحكام' : 'Terms & Conditions', MARGIN, y)
    y += 4
    setFont(doc, 'normal', 9)
    doc.setTextColor(80, 80, 80)
    const termLines = doc.splitTextToSize(d.terms, CONTENT_W)
    doc.text(termLines, MARGIN, y)
    y += termLines.length * 4 + 4
  }

  /* ── Footer: Prepared by / Signature / Stamp ────────── */
  if (y > 250) { doc.addPage(); y = MARGIN }
  y = Math.max(y, 255)

  drawLine(doc, y)
  y += 6

  if (d.preparedBy) {
    setFont(doc, 'normal', 8)
    doc.setTextColor(150, 150, 150)
    doc.text(isAr ? 'أعدّه' : 'Prepared by', PAGE_W / 2, y, { align: 'center' })
    setFont(doc, 'bold', 10)
    doc.setTextColor(30, 30, 30)
    doc.text(d.preparedBy, PAGE_W / 2, y + 5, { align: 'center' })
  }

  if (d.showSignature) {
    setFont(doc, 'normal', 8)
    doc.setTextColor(150, 150, 150)
    const sigX = isAr ? PAGE_W - MARGIN - 30 : MARGIN
    doc.text(isAr ? 'التوقيع' : 'Signature', sigX, y)
    doc.line(sigX, y + 1, sigX + 30, y + 1)
  }

  if (d.showStamp) {
    setFont(doc, 'normal', 7)
    doc.setTextColor(180, 180, 180)
    const stampX = isAr ? MARGIN : PAGE_W - MARGIN - 25
    doc.roundedRect(stampX, y - 3, 20, 20, 2, 2, 'S')
    doc.text(isAr ? 'ختم' : 'STAMP', stampX + 10, y + 8, { align: 'center' })
  }

  /* ── ZATCA QR for Tax Invoices (VAT 15%) ──────────────── */
  if (d.type === 'TINV' && d.vatRate === 15 && d.company?.vatNumber) {
    const qrDataUrl = await generateZatcaQr({
      sellerName: d.company.nameEn || d.company.nameAr || '',
      vatNumber: d.company.vatNumber,
      timestamp: d.date || new Date().toISOString(),
      totalWithVat: String(total),
      vatAmount: String(vatAmount),
    })
    
    // Draw QR code in bottom-right area
    const qrSize = 25
    const qrX = PAGE_W - MARGIN - qrSize - 5
    const qrY = Math.max(y + 5, 260)
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    
    // Label
    setFont(doc, 'normal', 7)
    doc.setTextColor(120, 120, 120)
    doc.text('ZATCA QR', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' })
  }

  /* ── Page numbers ───────────────────────────────────── */
  addPageFooter(doc, d.number)

  /* ── Save ───────────────────────────────────────────── */
  doc.save(`${d.number || 'document'}.pdf`)
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
