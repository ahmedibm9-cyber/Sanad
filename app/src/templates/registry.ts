import type { FullaTemplateDefinition, FullaTemplateKey } from './types'

/* ── Template Registry ──────────────────────────────────── */
export const TEMPLATES: Record<FullaTemplateKey, FullaTemplateDefinition> = {
  'fulla-packing-list-680': {
    key: 'fulla-packing-list-680',
    name: 'Packing List — Fulla Original',
    nameAr: 'قائمة التعبئة — فولا الأصلي',
    description: 'Fulla Trading Company packing list layout with company header, consignee block, material table with marks, and signature area.',
    descriptionAr: 'تصميم قائمة التعبئة لشركة فولا التجارية مع رأس الشركة وبلوك المستلم وجدول المواد والتوقيع',
    documentType: 'PKL',
    version: '1.0.0',
    features: ['Company header', 'Consignee block', 'Marks & numbers', 'Weight columns', 'Container/seal summary', 'Signature area'],
  },
  'fulla-quotation-680': {
    key: 'fulla-quotation-680',
    name: 'Quotation — Fulla Original',
    nameAr: 'عرض أسعار — فولا الأصلي',
    description: 'Fulla Trading Company quotation layout with centered branding, customer section, commercial terms, totals, and bank details.',
    descriptionAr: 'تصميم عرض أسعار شركة فولا التجارية مع شعار مركزي وقسم العميل والشروط التجارية والإجماليات وتفاصيل البنك',
    documentType: 'QUOT',
    version: '1.0.0',
    features: ['Centered branding', 'Customer block', 'Commercial terms', 'Totals section', 'Bank details', 'Signature/stamp'],
  },
  'fulla-tax-invoice-a-680': {
    key: 'fulla-tax-invoice-a-680',
    name: 'Tax Invoice — Fulla Layout A',
    nameAr: 'فاتورة ضريبية — تخطيط فولا أ',
    description: 'Fulla Trading Company tax invoice layout A with header, metadata, customer block, item table, terms, totals, and banking.',
    descriptionAr: 'تصميم فاتورة ضريبية شركة فولا أ مع رأس وبيانات وعميل وجدول وأ conditions وإجماليات ومعلومات بنكية',
    documentType: 'TINV',
    version: '1.0.0',
    features: ['Tax invoice layout', 'ZATCA QR support', 'VAT handling', 'Bank details', 'Signature/stamp'],
  },
  'fulla-delivery-note-680': {
    key: 'fulla-delivery-note-680',
    name: 'Delivery Note — Fulla Original',
    nameAr: 'إشعار التسليم — فولا الأصلي',
    description: 'Fulla Trading Company delivery note with distinctive green header, structured summary grid, delivery details, and approval section.',
    descriptionAr: 'تصميم إشعار التسليم شركة فولا مع رأس أخضر وشبكة ملخص وتفاصيل التسليم وقسم الموافقة',
    documentType: 'DN',
    version: '1.0.0',
    features: ['Dark green header', 'Summary grid', 'Delivery details', 'Approval section', 'No blank pages'],
  },
  'fulla-commercial-invoice-680': {
    key: 'fulla-commercial-invoice-680',
    name: 'Commercial Invoice — Fulla Original',
    nameAr: 'فاتورة تجارية — فولا الأصلي',
    description: 'Fulla Trading Company commercial invoice with company header, logo, customer section, item table, terms, and bank details.',
    descriptionAr: 'تصميم فاتورة تجارية شركة فولا مع رأس وشعار وعميل وجدول وشروط وتفاصيل بنكية',
    documentType: 'CINV',
    version: '1.0.0',
    features: ['HS code column', 'Origin column', 'Commercial terms', 'Bank details', 'ZATCA QR support'],
  },
  'fulla-tax-invoice-b-680': {
    key: 'fulla-tax-invoice-b-680',
    name: 'Tax Invoice — Fulla Layout B',
    nameAr: 'فاتورة ضريبية — تخطيط فولا ب',
    description: 'Fulla Trading Company tax invoice layout B — independent variant with its own visual design, terms, totals, and banking.',
    descriptionAr: 'تصميم فاتورة ضريبية شركة فولا ب — نسخة مستقلة بتصميمها الخاص وشروط وإجماليات ومعلومات بنكية',
    documentType: 'TINV',
    version: '1.0.0',
    features: ['Independent layout', 'Tax invoice variant', 'VAT handling', 'Bank details', 'Signature/stamp'],
  },
  'fulla-proforma-invoice-680': {
    key: 'fulla-proforma-invoice-680',
    name: 'Proforma Invoice — Fulla Original',
    nameAr: 'فاتورة مبدئية — فولا الأصلي',
    description: 'Fulla Trading Company proforma invoice with company header, logo, customer section, item table, terms, totals, and bank details.',
    descriptionAr: 'تصميم فاتورة مبدئية شركة فولا مع رأس وشعار وعميل وجدول وشروط وإجماليات وتفاصيل بنكية',
    documentType: 'PINV',
    version: '1.0.0',
    features: ['Proforma layout', 'Expiration/validity', 'Commercial terms', 'Bank details', 'Signature/stamp'],
  },
}

/* ── Helpers ─────────────────────────────────────────────── */
export function getTemplateByKey(key: FullaTemplateKey): FullaTemplateDefinition {
  return TEMPLATES[key]
}

export function getTemplatesForDocumentType(docType: string): FullaTemplateDefinition[] {
  return Object.values(TEMPLATES).filter(t => t.documentType === docType)
}

export function getAllTemplates(): FullaTemplateDefinition[] {
  return Object.values(TEMPLATES)
}

export function isValidTemplateKey(key: string): key is FullaTemplateKey {
  return key in TEMPLATES
}

/* ── Default templates per document type ─────────────────── */
export const DEFAULT_TEMPLATE_FOR_TYPE: Record<string, FullaTemplateKey> = {
  PKL: 'fulla-packing-list-680',
  QUOT: 'fulla-quotation-680',
  TINV: 'fulla-tax-invoice-a-680',
  CINV: 'fulla-commercial-invoice-680',
  DN: 'fulla-delivery-note-680',
  PINV: 'fulla-proforma-invoice-680',
}
