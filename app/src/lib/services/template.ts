/**
 * Document Template service for SANAD application.
 * 
 * Handles template selection, rendering, and print/PDF generation.
 * Supports 7 Fulla native templates.
 */

import type { DocumentType } from './document'

// ===========================================
// Helpers
// ===========================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ===========================================
// Types
// ===========================================

export type TemplateKey =
  | 'template-a'
  | 'template-b'
  | 'fulla-packing-list-680'
  | 'fulla-quotation-680'
  | 'fulla-tax-invoice-a-680'
  | 'fulla-delivery-note-680'
  | 'fulla-commercial-invoice-680'
  | 'fulla-tax-invoice-b-680'
  | 'fulla-proforma-invoice-680'

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
    nameAr: 'كلاسيكي بسيط',
    description: 'Classic minimal template with clean layout for all document types.',
    descriptionAr: 'قالب كلاسيكي بسيط مع تخطيط نظيف لجميع أنواع المستندات',
    features: ['Clean layout', 'All document types', 'Bilingual support'],
  },
  'template-b': {
    key: 'template-b',
    name: 'Modern Minimal',
    nameAr: 'عصري بسيط',
    description: 'Modern minimal template with card-based layout.',
    descriptionAr: 'قالب عصري بسيط مع تخطيط مبني على البطاقات',
    features: ['Card layout', 'All document types', 'Bilingual support'],
  },
  'fulla-packing-list-680': {
    key: 'fulla-packing-list-680',
    name: 'Packing List — Fulla Original',
    nameAr: 'قائمة التعبئة — فولا الأصلي',
    description: 'Fulla Trading Company packing list with consignee block, material table, weight columns, and signature area.',
    descriptionAr: 'قائمة تعبئة شركة فولا مع بلوك المستلم وجدول المواد وأعمدة الوزن والتوقيع',
    features: ['Company header', 'Consignee block', 'Marks & numbers', 'Weight columns', 'Signature area'],
  },
  'fulla-quotation-680': {
    key: 'fulla-quotation-680',
    name: 'Quotation — Fulla Original',
    nameAr: 'عرض أسعار — فولا الأصلي',
    description: 'Fulla Trading Company quotation with centered branding, commercial terms, totals, and bank details.',
    descriptionAr: 'عرض أسعار شركة فولا مع شعار مركزي وشروط تجارية وإجماليات وتفاصيل بنكية',
    features: ['Centered branding', 'Customer block', 'Commercial terms', 'Bank details', 'Signature/stamp'],
  },
  'fulla-tax-invoice-a-680': {
    key: 'fulla-tax-invoice-a-680',
    name: 'Tax Invoice — Fulla Layout A',
    nameAr: 'فاتورة ضريبية — تخطيط فولا أ',
    description: 'Fulla Trading Company tax invoice layout A with ZATCA QR support and bank details.',
    descriptionAr: 'فاتورة ضريبية شركة فولا تخطيط أ مع دعم QR وتفاصيل بنكية',
    features: ['Tax invoice layout', 'ZATCA QR support', 'VAT handling', 'Bank details', 'Signature/stamp'],
  },
  'fulla-delivery-note-680': {
    key: 'fulla-delivery-note-680',
    name: 'Delivery Note — Fulla Original',
    nameAr: 'إشعار التسليم — فولا الأصلي',
    description: 'Fulla Trading Company delivery note with green header, summary grid, and approval section.',
    descriptionAr: 'إشعار تسليم شركة فولا مع رأس أخضر وشبكة ملخص وقسم موافقة',
    features: ['Dark green header', 'Summary grid', 'Delivery details', 'Approval section'],
  },
  'fulla-commercial-invoice-680': {
    key: 'fulla-commercial-invoice-680',
    name: 'Commercial Invoice — Fulla Original',
    nameAr: 'فاتورة تجارية — فولا الأصلي',
    description: 'Fulla Trading Company commercial invoice with HS codes, origin, and bank details.',
    descriptionAr: 'فاتورة تجارية شركة فولا مع أكواد النظام المنسق والمصدر وتفاصيل بنكية',
    features: ['HS code column', 'Origin column', 'Commercial terms', 'Bank details', 'ZATCA QR support'],
  },
  'fulla-tax-invoice-b-680': {
    key: 'fulla-tax-invoice-b-680',
    name: 'Tax Invoice — Fulla Layout B',
    nameAr: 'فاتورة ضريبية — تخطيط فولا ب',
    description: 'Fulla Trading Company tax invoice layout B — independent variant with its own visual design.',
    descriptionAr: 'فاتورة ضريبية شركة فولا تخطيط ب — نسخة مستقلة بتصميمها الخاص',
    features: ['Independent layout', 'Tax invoice variant', 'VAT handling', 'Bank details', 'Signature/stamp'],
  },
  'fulla-proforma-invoice-680': {
    key: 'fulla-proforma-invoice-680',
    name: 'Proforma Invoice — Fulla Original',
    nameAr: 'فاتورة مبدئية — فولا الأصلي',
    description: 'Fulla Trading Company proforma invoice with commercial terms, bank details, and validity.',
    descriptionAr: 'فاتورة مبدئية شركة فولا مع شروط تجارية وتفاصيل بنكية وصلاحية',
    features: ['Proforma layout', 'Expiration/validity', 'Commercial terms', 'Bank details', 'Signature/stamp'],
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
    const key = data.templateKey as TemplateKey
    const isArabic = data.language === 'ar'

    if (key === 'template-a') {
      return this.renderTemplateA(data, isArabic)
    }
    if (key === 'template-b') {
      return this.renderTemplateB(data, isArabic)
    }

    // Fulla native templates are rendered via pdfmake at export time;
    // for in-app preview we fall back to Template A layout.
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
        <td style="padding:6px 8px;border:1px solid #333;font-size:9pt;">${escapeHtml(item.material)}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:9pt;">${escapeHtml(item.description || item.grade || '-')}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:9pt;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:9pt;">${escapeHtml(item.unit)}</td>
        ${item.unitPrice != null ? `<td style="padding:6px 8px;border:1px solid #333;font-size:9pt;text-align:right;">${item.unitPrice.toLocaleString()} ${escapeHtml(item.currency || data.currency || 'SAR')}</td>` : ''}
        ${item.total != null ? `<td style="padding:6px 8px;border:1px solid #333;font-size:9pt;text-align:right;">${item.total.toLocaleString()} ${escapeHtml(item.currency || data.currency || 'SAR')}</td>` : ''}
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
      <div class="info-value"><strong>${escapeHtml(company)}</strong></div>
      ${data.company.address ? `<div class="info-value">${escapeHtml(data.company.address)}</div>` : ''}
      ${data.company.phone ? `<div class="info-value">${escapeHtml(data.company.phone)}</div>` : ''}
      ${data.company.vatNumber ? `<div class="info-value">VAT: ${escapeHtml(data.company.vatNumber)}</div>` : ''}
    </div>
    <div>
      <div class="info-label">${isArabic ? 'المشتري / العميل' : 'Buyer / Customer'}</div>
      <div class="info-value"><strong>${escapeHtml(customer)}</strong></div>
      ${data.customer.address ? `<div class="info-value">${escapeHtml(data.customer.address)}</div>` : ''}
      ${data.customer.phone ? `<div class="info-value">${escapeHtml(data.customer.phone)}</div>` : ''}
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

  ${data.notes ? `<div class="footer"><strong>${isArabic ? 'ملاحظات' : 'Notes'}:</strong> ${escapeHtml(data.notes)}</div>` : ''}

  <div class="prepared-by">
    <strong>${isArabic ? 'أعده' : 'Prepared By'}:</strong> ${escapeHtml(data.preparedBy || '________________')}
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
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;">${escapeHtml(item.material)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;color:#666;">${escapeHtml(item.description || item.grade || '-')}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;text-align:center;">${item.quantity} ${escapeHtml(item.unit)}</td>
        ${item.unitPrice != null ? `<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;text-align:right;">${item.unitPrice.toLocaleString()} ${escapeHtml(item.currency || data.currency || 'SAR')}</td>` : ''}
        ${item.total != null ? `<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;text-align:right;font-weight:600;">${item.total.toLocaleString()} ${escapeHtml(item.currency || data.currency || 'SAR')}</td>` : ''}
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
      <div class="company-name">${escapeHtml(company)}</div>
      ${data.company.address ? `<div class="company-detail">${escapeHtml(data.company.address)}</div>` : ''}
      ${data.company.vatNumber ? `<div class="company-detail">VAT: ${escapeHtml(data.company.vatNumber)}</div>` : ''}
    </div>
    <div class="doc-block">
      <div class="doc-title">${this.getDocumentTypeLabel(data.documentType, data.language)}</div>
      <div class="doc-meta">${escapeHtml(data.documentNumber)}</div>
      <div class="doc-meta">${escapeHtml(data.createdDate)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party-card">
      <div class="party-label">${isArabic ? 'المشتري' : 'Buyer'}</div>
      <div class="party-name">${escapeHtml(customer)}</div>
      ${data.customer.address ? `<div class="party-detail">${escapeHtml(data.customer.address)}</div>` : ''}
      ${data.customer.phone ? `<div class="party-detail">${escapeHtml(data.customer.phone)}</div>` : ''}
    </div>
    <div class="party-card">
      <div class="party-label">${isArabic ? 'البائع' : 'Seller'}</div>
      <div class="party-name">${escapeHtml(company)}</div>
      ${data.company.phone ? `<div class="party-detail">${escapeHtml(data.company.phone)}</div>` : ''}
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

  ${data.notes ? `<div class="footer"><strong>${isArabic ? 'ملاحظات' : 'Notes'}:</strong> ${escapeHtml(data.notes)}</div>` : ''}

  <div class="prepared-by">
    <span><strong>${isArabic ? 'أعده' : 'Prepared By'}:</strong> ${escapeHtml(data.preparedBy || '________________')}</span>
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
