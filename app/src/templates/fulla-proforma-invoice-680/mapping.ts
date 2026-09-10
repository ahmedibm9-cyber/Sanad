import type { DocRenderData } from '../types'

/* ── Field Mapping for Proforma Invoice ────────────────── */
export interface FieldMapping {
  label: string
  labelAr: string
  getValue: (data: DocRenderData) => string | number
}

export const METADATA_FIELDS: FieldMapping[] = [
  {
    label: 'PINV Number',
    labelAr: 'رقم الفاتورة المبدئية',
    getValue: (d) => d.number,
  },
  {
    label: 'Date',
    labelAr: 'التاريخ',
    getValue: (d) => d.date,
  },
  {
    label: 'Expiration Date',
    labelAr: 'تاريخ الانتهاء',
    getValue: (d) => d.expirationDate ?? '—',
  },
  {
    label: 'Customer ID',
    labelAr: 'رقم العميل',
    getValue: (d) => d.customer.name,
  },
]

export const BUYER_FIELDS: FieldMapping[] = [
  {
    label: 'Buyer Name',
    labelAr: 'اسم المشتري',
    getValue: (d) => d.customer.name,
  },
  {
    label: 'Address',
    labelAr: 'العنوان',
    getValue: (d) => [d.customer.address, d.customer.city, d.customer.country].filter(Boolean).join(', ') || '—',
  },
  {
    label: 'Contact Person',
    labelAr: 'جهة الاتصال',
    getValue: (d) => d.customer.contactPerson ?? '—',
  },
  {
    label: 'Contact Number',
    labelAr: 'رقم الاتصال',
    getValue: (d) => d.customer.phone ?? '—',
  },
]

export const TERMS_FIELDS: FieldMapping[] = [
  {
    label: 'Payment Terms',
    labelAr: 'شروط الدفع',
    getValue: (d) => d.terms || '—',
  },
  {
    label: 'Delivery Terms',
    labelAr: 'شروط التسليم',
    getValue: (d) => d.shipping.incoterm ?? '—',
  },
  {
    label: 'Shipping',
    labelAr: 'الشحن',
    getValue: (d) => d.shipping.shippingMethod ?? '—',
  },
  {
    label: 'Validity',
    labelAr: 'الصلاحية',
    getValue: (d) => d.expirationDate ?? '—',
  },
  {
    label: 'Notes',
    labelAr: 'ملاحظات',
    getValue: (d) => d.notes || '—',
  },
]

export const BANK_FIELDS: FieldMapping[] = [
  {
    label: 'Bank Name',
    labelAr: 'اسم البنك',
    getValue: (d) => d.company.bankName ?? '—',
  },
  {
    label: 'Account Name',
    labelAr: 'اسم الحساب',
    getValue: (d) => d.company.accountName ?? '—',
  },
  {
    label: 'IBAN',
    labelAr: 'آيبان',
    getValue: (d) => d.company.iban ?? '—',
  },
  {
    label: 'SWIFT',
    labelAr: 'سويفت',
    getValue: (d) => d.company.swift ?? '—',
  },
]

export const SIGNATURE_FIELDS: FieldMapping[] = [
  {
    label: 'Prepared By',
    labelAr: 'أعدّها',
    getValue: (d) => d.preparedBy,
  },
  {
    label: 'Export Manager',
    labelAr: 'مدير التصدير',
    getValue: () => '',
  },
]
