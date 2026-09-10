import type { FullaTemplateDefinition } from '../types'

/* ── Tax Invoice B — Template Definition ───────────────── */
export const TEMPLATE_DEFINITION: FullaTemplateDefinition = {
  key: 'fulla-tax-invoice-b-680',
  name: 'Tax Invoice — Fulla Layout B',
  nameAr: 'فاتورة ضريبية — تخطيط فولا ب',
  description: 'Fulla Trading Company tax invoice layout B — modern minimal with centered branding, full-width blocks, restrained lines, and structured information cards.',
  descriptionAr: 'تصميم فاتورة ضريبية شركة فولا ب — تصميم عصري أنيق مع شعار مركزي ومربعات عرض كاملة وخطوط محددة وبطاقات معلومات منظمة',
  documentType: 'TINV',
  version: '1.0.0',
  features: ['Modern minimal layout', 'Centered branding', 'Full-width info blocks', 'ZATCA QR support', 'VAT handling', 'Bank details', 'Signature/stamp'],
}

/* ── Field Mapping ─────────────────────────────────────── */
export interface FieldMapping {
  source: string
  label: string
  labelAr: string
  section: string
}

export const FIELD_MAPPINGS: FieldMapping[] = [
  // Document metadata
  { source: 'number', label: 'Tax Invoice Number', labelAr: 'رقم الفاتورة الضريبية', section: 'metadata' },
  { source: 'date', label: 'Date', labelAr: 'التاريخ', section: 'metadata' },
  { source: 'expirationDate', label: 'Expiration / Validity', labelAr: 'تاريخ الانتهاء / الصلاحية', section: 'metadata' },
  { source: 'status', label: 'Status', labelAr: 'الحالة', section: 'metadata' },

  // Company (seller) fields
  { source: 'company.nameEn', label: 'Company Name', labelAr: 'اسم الشركة', section: 'seller' },
  { source: 'company.legalNameEn', label: 'Legal Name', labelAr: 'الاسم القانوني', section: 'seller' },
  { source: 'company.address', label: 'Address', labelAr: 'العنوان', section: 'seller' },
  { source: 'company.city', label: 'City', labelAr: 'المدينة', section: 'seller' },
  { source: 'company.country', label: 'Country', labelAr: 'الدولة', section: 'seller' },
  { source: 'company.phone', label: 'Phone', labelAr: 'الهاتف', section: 'seller' },
  { source: 'company.email', label: 'Email', labelAr: 'البريد الإلكتروني', section: 'seller' },
  { source: 'company.website', label: 'Website', labelAr: 'الموقع الإلكتروني', section: 'seller' },
  { source: 'company.crNumber', label: 'CR Number', labelAr: 'رقم السجل التجاري', section: 'seller' },
  { source: 'company.vatNumber', label: 'VAT Number', labelAr: 'الرقم الضريبي', section: 'seller' },
  { source: 'company.logo', label: 'Logo', labelAr: 'الشعار', section: 'seller' },

  // Customer (buyer) fields
  { source: 'customer.name', label: 'Customer Name', labelAr: 'اسم العميل', section: 'buyer' },
  { source: 'customer.nameAr', label: 'Customer Name (Arabic)', labelAr: 'اسم العميل (عربي)', section: 'buyer' },
  { source: 'customer.contactPerson', label: 'Contact Person', labelAr: 'جهة الاتصال', section: 'buyer' },
  { source: 'customer.phone', label: 'Phone', labelAr: 'الهاتف', section: 'buyer' },
  { source: 'customer.email', label: 'Email', labelAr: 'البريد الإلكتروني', section: 'buyer' },
  { source: 'customer.address', label: 'Address', labelAr: 'العنوان', section: 'buyer' },
  { source: 'customer.city', label: 'City', labelAr: 'المدينة', section: 'buyer' },
  { source: 'customer.country', label: 'Country', labelAr: 'الدولة', section: 'buyer' },
  { source: 'customer.vatNumber', label: 'VAT Number', labelAr: 'الرقم الضريبي', section: 'buyer' },

  // Item columns
  { source: 'items[].material', label: 'Item Code', labelAr: 'كود الصنف', section: 'items' },
  { source: 'items[].description', label: 'Description', labelAr: 'الوصف', section: 'items' },
  { source: 'items[].quantity', label: 'Quantity', labelAr: 'الكمية', section: 'items' },
  { source: 'items[].unit', label: 'Unit', labelAr: 'الوحدة', section: 'items' },
  { source: 'items[].unitPrice', label: 'Unit Price', labelAr: 'سعر الوحدة', section: 'items' },
  { source: 'items[].currency', label: 'Currency', labelAr: 'العملة', section: 'items' },
  { source: 'items[].total', label: 'Line Total', labelAr: 'الإجمالي', section: 'items' },

  // Terms of sale
  { source: 'terms', label: 'Terms of Sale', labelAr: 'شروط البيع', section: 'terms' },
  { source: 'shipping.incoterm', label: 'Incoterm', labelAr: 'الشرط التجاري', section: 'terms' },
  { source: 'shipping.portOfLoading', label: 'Port of Loading', labelAr: 'ميناء التحميل', section: 'terms' },
  { source: 'shipping.portOfDischarge', label: 'Port of Discharge', labelAr: 'ميناء التفريغ', section: 'terms' },
  { source: 'shipping.freightTerms', label: 'Freight Terms', labelAr: 'شروط النقل', section: 'terms' },
  { source: 'shipping.shippingMethod', label: 'Shipping Method', labelAr: 'طريقة الشحن', section: 'terms' },

  // Bank details
  { source: 'company.bankName', label: 'Bank Name', labelAr: 'اسم البنك', section: 'bank' },
  { source: 'company.accountName', label: 'Account Name', labelAr: 'اسم الحساب', section: 'bank' },
  { source: 'company.iban', label: 'IBAN', labelAr: 'رقم الآيبان', section: 'bank' },
  { source: 'company.swift', label: 'SWIFT Code', labelAr: 'كود السويفت', section: 'bank' },

  // Totals
  { source: 'subtotal', label: 'Subtotal', labelAr: 'المجموع الفرعي', section: 'totals' },
  { source: 'vatRate', label: 'VAT Rate', labelAr: 'نسبة الضريبة', section: 'totals' },
  { source: 'vatAmount', label: 'VAT Amount', labelAr: 'مبلغ الضريبة', section: 'totals' },
  { source: 'total', label: 'Total', labelAr: 'الإجمالي', section: 'totals' },
  { source: 'currency', label: 'Currency', labelAr: 'العملة', section: 'totals' },

  // Signature / stamp
  { source: 'preparedBy', label: 'Export Manager', labelAr: 'مدير التصدير', section: 'signature' },
  { source: 'company.stamp', label: 'Company Stamp', labelAr: 'ختم الشركة', section: 'signature' },
  { source: 'company.signature', label: 'Signature', labelAr: 'التوقيع', section: 'signature' },

  // ZATCA QR
  { source: 'vatRate', label: 'ZATCA QR Code', labelAr: 'رمز QR زاتكا', section: 'qr' },
]

/* ── Section labels ────────────────────────────────────── */
export const SECTIONS = {
  metadata: { en: 'Invoice Details', ar: 'تفاصيل الفاتورة' },
  seller: { en: 'Seller / Exporter', ar: 'البائع / المصدر' },
  buyer: { en: 'Buyer / Consignee', ar: 'المشتري / المستلم' },
  items: { en: 'Commercial Material', ar: 'المواد التجارية' },
  terms: { en: 'Terms of Sale', ar: 'شروط البيع' },
  bank: { en: 'Banking Information', ar: 'المعلومات البنكية' },
  totals: { en: 'Amount Summary', ar: 'ملخص المبالغ' },
  signature: { en: 'Export Manager & Authorization', ar: 'مدير التصدير والتفويض' },
  qr: { en: 'ZATCA QR Code', ar: 'رمز QR زاتكا' },
} as const
