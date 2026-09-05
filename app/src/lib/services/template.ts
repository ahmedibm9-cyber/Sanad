/**
 * Document Template service for SANAD application.
 * 
 * Handles template selection, rendering, and print/PDF generation.
 * Supports Template A (Classic Minimal) and Template B (Modern Minimal).
 */

import type { DocumentType } from './document'

// ===========================================
// Types
// ===========================================

export type TemplateKey = 'template-a' | 'template-b'

export interface TemplateDefinition {
  key: TemplateKey
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  features: string[]
}

export interface DocumentRenderData {
  // Document metadata
  documentType: DocumentType
  documentNumber: string
  createdDate: string
  language: string
  templateKey: TemplateKey
  preparedBy: string
  showSignature: boolean
  showStamp: boolean

  // Company data
  company: {
    nameEn: string
    nameAr: string
    legalNameEn?: string
    legalNameAr?: string
    address?: string
    city?: string
    country?: string
    phone?: string
    email?: string
    website?: string
    crNumber?: string
    vatNumber?: string
    bankName?: string
    accountName?: string
    accountNumber?: string
    iban?: string
    swift?: string
    logoUrl?: string
    stampUrl?: string
    signatureUrl?: string
  }

  // Customer data
  customer: {
    name: string
    nameAr?: string
    contactPerson?: string
    phone?: string
    email?: string
    address?: string
    city?: string
    country?: string
    vatNumber?: string
  }

  // Items
  items: Array<{
    material: string
    description?: string
    grade?: string
    hsCode?: string
    origin?: string
    quantity: number
    unit: string
    unitPrice?: number
    currency?: string
    total?: number
    packing?: string
    packages?: number
    netWeight?: number
    grossWeight?: number
    cbm?: number
  }>

  // Totals
  subtotal?: number
  vatRate?: number
  vatAmount?: number
  total?: number
  currency?: string

  // Shipping (for PKL, DN, BL)
  shipping?: {
    portOfLoading?: string
    portOfDischarge?: string
    vessel?: string
    voyage?: string
    containerNumber?: string
    sealNumber?: string
    marksAndNumbers?: string
    placeOfReceipt?: string
    placeOfDelivery?: string
    freightTerms?: string
  }

  // Notes/Terms
  notes?: string
  terms?: string
}

// ===========================================
// Template Definitions
// ===========================================

export const TEMPLATES: Record<TemplateKey, TemplateDefinition> = {
  'template-a': {
    key: 'template-a',
    name: 'Classic Minimal',
    nameAr: 'كلاسيكي مبسط',
    description: 'Strong typographic hierarchy, thin rules, compact header, traditional business-table structure.',
    descriptionAr: '티포그래피 واضح، خطوط رفيعة، رأس مختصر، هيكل جداول تقليدي',
    features: ['Traditional table structure', 'Thin rules', 'Compact header', 'Professional typography'],
  },
  'template-b': {
    key: 'template-b',
    name: 'Modern Minimal',
    nameAr: 'عصري مبسط',
    description: 'More whitespace, structured information cards/blocks, restrained lines.',
    descriptionAr: 'مساحة بيضاء أكثر، كتل معلومات منظمة، خطوط متحكّم بها',
    features: ['Structured info blocks', 'More whitespace', 'Modern layout', 'Clean design'],
  },
}

// ===========================================
// Template Service
// ===========================================

export class TemplateService {
  /**
   * Get all available templates.
   */
  getTemplates(): TemplateDefinition[] {
    return Object.values(TEMPLATES)
  }

  /**
   * Get a specific template.
   */
  getTemplate(key: TemplateKey): TemplateDefinition | undefined {
    return TEMPLATES[key]
  }

  /**
   * Get document type label.
   */
  getDocumentTypeLabel(type: DocumentType, language: string): string {
    const labels: Record<DocumentType, { en: string; ar: string }> = {
      QUOT: { en: 'QUOTATION', ar: 'عرض أسعار' },
      PINV: { en: 'PROFORMA INVOICE', ar: 'فاتورة مبدئية' },
      TINV: { en: 'TAX INVOICE', ar: 'فاتورة ضريبية' },
      CINV: { en: 'COMMERCIAL INVOICE', ar: 'فاتورة تجارية' },
      PKL: { en: 'PACKING LIST', ar: 'قائمة التعبئة' },
      DN: { en: 'DELIVERY NOTE', ar: 'إشعار التسليم' },
      BL: { en: 'BILL OF LADING', ar: 'بوليصة الشحن' },
    }
    return labels[type]?.[language as 'en' | 'ar'] || type
  }

  /**
   * Render a document to HTML string.
   */
  renderDocument(data: DocumentRenderData): string {
    const isArabic = data.language === 'ar'
    const template = data.templateKey

    if (template === 'template-b') {
      return this.renderTemplateB(data, isArabic)
    }
    return this.renderTemplateA(data, isArabic)
  }

  /**
   * Render Template A (Classic Minimal).
   */
  private renderTemplateA(data: DocumentRenderData, isArabic: boolean): string {
    const dir = isArabic ? 'rtl' : 'ltr'
    const align = isArabic ? 'right' : 'left'
    const company = isArabic ? data.company.nameAr || data.company.nameEn : data.company.nameEn
    const customer = isArabic ? (data.customer.nameAr || data.customer.name) : data.customer.name

    const items = data.items.map(item => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #333;font-size:9pt;">${item.material}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:9pt;">${item.description || item.grade || '-'}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:9pt;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:9pt;">${item.unit}</td>
        ${item.unitPrice != null ? `<td style="padding:6px 8px;border:1px solid #333;font-size:9pt;text-align:right;">${item.unitPrice.toLocaleString()} ${item.currency || data.currency || 'SAR'}</td>` : ''}
        ${item.total != null ? `<td style="padding:6px 8px;border:1px solid #333;font-size:9pt;text-align:right;">${item.total.toLocaleString()} ${item.currency || data.currency || 'SAR'}</td>` : ''}
      </tr>
    `).join('')

    const hasPricing = data.items.some(i => i.unitPrice != null)

    return `
<!DOCTYPE html>
<html lang="${data.language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Inter', 'Noto Sans Arabic', Arial, sans-serif; font-size: 9pt; line-height: 1.4; color: #000; margin: 0; padding: 20mm; }
    table { width: 100%; border-collapse: collapse; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .doc-title { font-size: 18pt; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; }
    .doc-number { font-size: 10pt; color: #333; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; font-size: 9pt; }
    .info-label { font-weight: 600; color: #555; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { color: #000; }
    .totals { margin-top: 12px; font-size: 10pt; }
    .totals td { padding: 4px 8px; }
    .totals .label { font-weight: 600; text-align: ${align === 'right' ? 'left' : 'right'}; }
    .totals .value { text-align: ${align}; font-weight: bold; }
    .footer { margin-top: 24px; font-size: 8pt; color: #555; border-top: 1px solid #ccc; padding-top: 8px; }
    .prepared-by { margin-top: 16px; font-size: 9pt; }
    .stamp-area { display: flex; justify-content: space-between; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="doc-title">${this.getDocumentTypeLabel(data.documentType, data.language)}</h1>
    <div class="doc-number">${data.documentNumber} &mdash; ${data.createdDate}</div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">${isArabic ? 'البائع / المصدر' : 'Seller / Exporter'}</div>
      <div class="info-value"><strong>${company}</strong></div>
      ${data.company.address ? `<div class="info-value">${data.company.address}</div>` : ''}
      ${data.company.phone ? `<div class="info-value">${data.company.phone}</div>` : ''}
      ${data.company.vatNumber ? `<div class="info-value">VAT: ${data.company.vatNumber}</div>` : ''}
    </div>
    <div>
      <div class="info-label">${isArabic ? 'المشتري / العميل' : 'Buyer / Customer'}</div>
      <div class="info-value"><strong>${customer}</strong></div>
      ${data.customer.address ? `<div class="info-value">${data.customer.address}</div>` : ''}
      ${data.customer.phone ? `<div class="info-value">${data.customer.phone}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="padding:6px 8px;border:1px solid #333;font-size:8pt;text-transform:uppercase;background:#f5f5f5;">${isArabic ? 'المادة' : 'Material'}</th>
        <th style="padding:6px 8px;border:1px solid #333;font-size:8pt;text-transform:uppercase;background:#f5f5f5;">${isArabic ? 'الوصف' : 'Description'}</th>
        <th style="padding:6px 8px;border:1px solid #333;font-size:8pt;text-transform:uppercase;background:#f5f5f5;text-align:center;">${isArabic ? 'الكمية' : 'Qty'}</th>
        <th style="padding:6px 8px;border:1px solid #333;font-size:8pt;text-transform:uppercase;background:#f5f5f5;">${isArabic ? 'الوحدة' : 'Unit'}</th>
        ${hasPricing ? `<th style="padding:6px 8px;border:1px solid #333;font-size:8pt;text-transform:uppercase;background:#f5f5f5;text-align:right;">${isArabic ? 'سعر الوحدة' : 'Unit Price'}</th>` : ''}
        ${hasPricing ? `<th style="padding:6px 8px;border:1px solid #333;font-size:8pt;text-transform:uppercase;background:#f5f5f5;text-align:right;">${isArabic ? 'الإجمالي' : 'Total'}</th>` : ''}
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>

  ${hasPricing ? `
  <table class="totals">
    <tr>
      <td class="label">${isArabic ? 'المجموع الفرعي' : 'Subtotal'}</td>
      <td class="value">${(data.subtotal || 0).toLocaleString()} ${data.currency || 'SAR'}</td>
    </tr>
    ${data.vatRate != null && data.vatRate > 0 ? `
    <tr>
      <td class="label">VAT (${data.vatRate}%)</td>
      <td class="value">${(data.vatAmount || 0).toLocaleString()} ${data.currency || 'SAR'}</td>
    </tr>
    ` : ''}
    <tr>
      <td class="label" style="font-size:11pt;border-top:2px solid #000;padding-top:6px;">${isArabic ? 'الإجمالي' : 'TOTAL'}</td>
      <td class="value" style="font-size:11pt;border-top:2px solid #000;padding-top:6px;">${(data.total || 0).toLocaleString()} ${data.currency || 'SAR'}</td>
    </tr>
  </table>
  ` : ''}

  ${data.notes ? `<div class="footer"><strong>${isArabic ? 'ملاحظات' : 'Notes'}:</strong> ${data.notes}</div>` : ''}

  <div class="prepared-by">
    <strong>${isArabic ? 'أعده' : 'Prepared By'}:</strong> ${data.preparedBy || '________________'}
  </div>

  <div class="stamp-area">
    <div>
      <div style="width:120px;border-bottom:1px solid #000;margin-bottom:4px;font-size:8pt;">${isArabic ? 'التوقيع' : 'Signature'}</div>
      ${data.showSignature && data.company.signatureUrl ? `<img src="${data.company.signatureUrl}" style="height:40px;" />` : ''}
    </div>
    <div>
      <div style="width:120px;border-bottom:1px solid #000;margin-bottom:4px;font-size:8pt;text-align:right;">${isArabic ? 'الختم' : 'Stamp'}</div>
      ${data.showStamp && data.company.stampUrl ? `<img src="${data.company.stampUrl}" style="height:40px;" />` : ''}
    </div>
  </div>
</body>
</html>`
  }

  /**
   * Render Template B (Modern Minimal).
   */
  private renderTemplateB(data: DocumentRenderData, isArabic: boolean): string {
    const dir = isArabic ? 'rtl' : 'ltr'
    const company = isArabic ? data.company.nameAr || data.company.nameEn : data.company.nameEn
    const customer = isArabic ? (data.customer.nameAr || data.customer.name) : data.customer.name

    const items = data.items.map(item => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;">${item.material}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;color:#666;">${item.description || item.grade || '-'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;text-align:center;">${item.quantity} ${item.unit}</td>
        ${item.unitPrice != null ? `<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;text-align:right;">${item.unitPrice.toLocaleString()} ${item.currency || data.currency || 'SAR'}</td>` : ''}
        ${item.total != null ? `<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;text-align:right;font-weight:600;">${item.total.toLocaleString()} ${item.currency || data.currency || 'SAR'}</td>` : ''}
      </tr>
    `).join('')

    const hasPricing = data.items.some(i => i.unitPrice != null)

    return `
<!DOCTYPE html>
<html lang="${data.language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Inter', 'Noto Sans Arabic', Arial, sans-serif; font-size: 9pt; line-height: 1.5; color: #1a1a1a; margin: 0; padding: 20mm; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .company-block { background: #f8f9fa; padding: 12px 16px; border-radius: 6px; }
    .company-name { font-size: 14pt; font-weight: 700; color: #1a1a1a; }
    .company-detail { font-size: 8pt; color: #666; margin-top: 2px; }
    .doc-block { text-align: ${isArabic ? 'left' : 'right'}; }
    .doc-title { font-size: 16pt; font-weight: 700; color: #1a1a1a; letter-spacing: 0.1em; }
    .doc-meta { font-size: 9pt; color: #666; margin-top: 4px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .party-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
    .party-label { font-size: 8pt; color: #999; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .party-name { font-size: 10pt; font-weight: 600; color: #1a1a1a; }
    .party-detail { font-size: 9pt; color: #555; margin-top: 2px; }
    table.items th { padding: 8px 10px; font-size: 8pt; text-transform: uppercase; color: #999; border-bottom: 2px solid #e5e7eb; letter-spacing: 0.05em; }
    .totals-card { background: #f8f9fa; border-radius: 6px; padding: 12px; margin-top: 16px; display: flex; justify-content: flex-end; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 9pt; }
    .totals-total { font-size: 12pt; font-weight: 700; color: #1a1a1a; border-top: 2px solid #1a1a1a; padding-top: 6px; margin-top: 4px; }
    .footer { margin-top: 20px; font-size: 8pt; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    .prepared-by { margin-top: 16px; font-size: 9pt; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-block">
      <div class="company-name">${company}</div>
      ${data.company.address ? `<div class="company-detail">${data.company.address}</div>` : ''}
      ${data.company.vatNumber ? `<div class="company-detail">VAT: ${data.company.vatNumber}</div>` : ''}
    </div>
    <div class="doc-block">
      <div class="doc-title">${this.getDocumentTypeLabel(data.documentType, data.language)}</div>
      <div class="doc-meta">${data.documentNumber}</div>
      <div class="doc-meta">${data.createdDate}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party-card">
      <div class="party-label">${isArabic ? 'المشتري' : 'Buyer'}</div>
      <div class="party-name">${customer}</div>
      ${data.customer.address ? `<div class="party-detail">${data.customer.address}</div>` : ''}
      ${data.customer.phone ? `<div class="party-detail">${data.customer.phone}</div>` : ''}
    </div>
    <div class="party-card">
      <div class="party-label">${isArabic ? 'البائع' : 'Seller'}</div>
      <div class="party-name">${company}</div>
      ${data.company.phone ? `<div class="party-detail">${data.company.phone}</div>` : ''}
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>${isArabic ? 'المادة' : 'Material'}</th>
        <th>${isArabic ? 'الوصف' : 'Description'}</th>
        <th style="text-align:center;">${isArabic ? 'الكمية' : 'Quantity'}</th>
        ${hasPricing ? `<th style="text-align:right;">${isArabic ? 'سعر الوحدة' : 'Unit Price'}</th>` : ''}
        ${hasPricing ? `<th style="text-align:right;">${isArabic ? 'الإجمالي' : 'Total'}</th>` : ''}
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>

  ${hasPricing ? `
  <div class="totals-card">
    <div style="width:250px;">
      <div class="totals-row">
        <span>${isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
        <span>${(data.subtotal || 0).toLocaleString()} ${data.currency || 'SAR'}</span>
      </div>
      ${data.vatRate != null && data.vatRate > 0 ? `
      <div class="totals-row">
        <span>VAT (${data.vatRate}%)</span>
        <span>${(data.vatAmount || 0).toLocaleString()} ${data.currency || 'SAR'}</span>
      </div>
      ` : ''}
      <div class="totals-row totals-total">
        <span>${isArabic ? 'الإجمالي' : 'TOTAL'}</span>
        <span>${(data.total || 0).toLocaleString()} ${data.currency || 'SAR'}</span>
      </div>
    </div>
  </div>
  ` : ''}

  ${data.notes ? `<div class="footer"><strong>${isArabic ? 'ملاحظات' : 'Notes'}:</strong> ${data.notes}</div>` : ''}

  <div class="prepared-by">
    <span><strong>${isArabic ? 'أعده' : 'Prepared By'}:</strong> ${data.preparedBy || '________________'}</span>
    <span>${data.company.stampUrl ? `<img src="${data.company.stampUrl}" style="height:40px;" />` : ''}</span>
  </div>
</body>
</html>`
  }

  /**
   * Print a document.
   */
  printDocument(html: string): void {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    }
  }

  /**
   * Download as PDF (using browser print).
   */
  downloadPDF(html: string, filename: string): void {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
      // Note: For true PDF generation, a server-side library like Puppeteer
      // or client-side library like jsPDF would be needed in production.
    }
  }
}

// Singleton instance
let templateServiceInstance: TemplateService | null = null

export function getTemplateService(): TemplateService {
  if (!templateServiceInstance) {
    templateServiceInstance = new TemplateService()
  }
  return templateServiceInstance
}
