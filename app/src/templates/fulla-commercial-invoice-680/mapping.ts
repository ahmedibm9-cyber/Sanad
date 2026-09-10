import type { DocRenderData } from '../types'

/* ── Commercial Invoice — Field Mapping ──────────────────── */

export interface FieldMapping {
  key: string
  label: string
  labelAr: string
  getValue: (data: DocRenderData) => string | number | undefined
}

export const documentMetaFields: FieldMapping[] = [
  {
    key: 'number',
    label: 'Commercial Invoice No.',
    labelAr: 'رقم الفاتورة التجارية',
    getValue: (d) => d.number,
  },
  {
    key: 'date',
    label: 'Date',
    labelAr: 'التاريخ',
    getValue: (d) => d.date,
  },
  {
    key: 'expirationDate',
    label: 'Validity / Expiration',
    labelAr: 'الصلاحية / تاريخ الانتهاء',
    getValue: (d) => d.expirationDate,
  },
]

export const buyerFields: FieldMapping[] = [
  {
    key: 'name',
    label: 'Buyer',
    labelAr: 'المشتري',
    getValue: (d) => d.customer.name,
  },
  {
    key: 'address',
    label: 'Address',
    labelAr: 'العنوان',
    getValue: (d) => {
      const c = d.customer
      return [c.address, c.city, c.country].filter(Boolean).join(', ')
    },
  },
  {
    key: 'contactPerson',
    label: 'Contact',
    labelAr: 'جهة الاتصال',
    getValue: (d) => d.customer.contactPerson,
  },
  {
    key: 'phone',
    label: 'Contact Number',
    labelAr: 'رقم الاتصال',
    getValue: (d) => d.customer.phone,
  },
]

export const materialColumns = [
  { key: 'material', label: 'Item Code', labelAr: 'رمز الصنف' },
  { key: 'description', label: 'Description', labelAr: 'الوصف' },
  { key: 'quantity', label: 'Quantity', labelAr: 'الكمية' },
  { key: 'unit', label: 'Unit', labelAr: 'الوحدة' },
  { key: 'unitPrice', label: 'Price', labelAr: 'السعر' },
  { key: 'currency', label: 'Currency', labelAr: 'العملة' },
  { key: 'total', label: 'Total', labelAr: 'الإجمالي' },
]

export const commercialTermFields: FieldMapping[] = [
  {
    key: 'incoterm',
    label: 'Delivery Terms (Incoterm)',
    labelAr: 'شروط التسليم (إنكوتيرم)',
    getValue: (d) => d.shipping.incoterm,
  },
  {
    key: 'freightTerms',
    label: 'Payment Terms',
    labelAr: 'شروط الدفع',
    getValue: (d) => d.shipping.freightTerms,
  },
  {
    key: 'shippingMethod',
    label: 'Shipping',
    labelAr: 'الشحن',
    getValue: (d) => d.shipping.shippingMethod,
  },
  {
    key: 'destination',
    label: 'Destination',
    labelAr: 'الوجهة',
    getValue: (d) => d.shipping.destination,
  },
  {
    key: 'portOfLoading',
    label: 'Port of Loading',
    labelAr: 'ميناء التحميل',
    getValue: (d) => d.shipping.portOfLoading,
  },
  {
    key: 'portOfDischarge',
    label: 'Port of Discharge',
    labelAr: 'ميناء التفريغ',
    getValue: (d) => d.shipping.portOfDischarge,
  },
  {
    key: 'vessel',
    label: 'Vessel',
    labelAr: 'السفينة',
    getValue: (d) => d.shipping.vessel,
  },
  {
    key: 'voyage',
    label: 'Voyage',
    labelAr: 'الرحلة',
    getValue: (d) => d.shipping.voyage,
  },
]

export const bankFields: FieldMapping[] = [
  {
    key: 'bankName',
    label: 'Bank Name',
    labelAr: 'اسم البنك',
    getValue: (d) => d.company.bankName,
  },
  {
    key: 'accountName',
    label: 'Account Name',
    labelAr: 'اسم الحساب',
    getValue: (d) => d.company.accountName,
  },
  {
    key: 'iban',
    label: 'IBAN',
    labelAr: 'آيبان',
    getValue: (d) => d.company.iban,
  },
  {
    key: 'swift',
    label: 'SWIFT',
    labelAr: 'السبت',
    getValue: (d) => d.company.swift,
  },
]

export const financialFields: FieldMapping[] = [
  {
    key: 'subtotal',
    label: 'Subtotal',
    labelAr: 'المجموع الفرعي',
    getValue: (d) => d.subtotal,
  },
  {
    key: 'vatRate',
    label: 'VAT Rate',
    labelAr: 'نسبة الضريبة',
    getValue: (d) => (d.vatRate ? `${d.vatRate}%` : undefined),
  },
  {
    key: 'vatAmount',
    label: 'VAT',
    labelAr: 'الضريبة',
    getValue: (d) => (d.vatAmount ? d.vatAmount : undefined),
  },
  {
    key: 'total',
    label: 'Grand Total',
    labelAr: 'المبلغ الإجمالي',
    getValue: (d) => d.total,
  },
  {
    key: 'currency',
    label: 'Currency',
    labelAr: 'العملة',
    getValue: (d) => d.currency,
  },
]
