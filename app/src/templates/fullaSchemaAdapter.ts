/* ──────────────────────────────────────────────────────────────
 * Fulla Schema Adapter
 *
 * Maps SANAD DocPreviewData → flat data object for data-field fill.
 * Each template family has its own adapter function.
 * ────────────────────────────────────────────────────────────── */

import type { FullaTemplateId } from './fullaTemplateRenderer'

/* ── Types ──────────────────────────────────────────────────── */
interface PreviewItem {
  material: string
  description: string
  hsCode?: string
  origin?: string
  packing?: string
  quantity: number
  unit: string
  unitPrice?: number
  total?: number
  packages?: number
  netWeight?: number
  grossWeight?: number
}

interface PreviewParty {
  name: string
  nameAr?: string
  address?: string
  contactPerson?: string
  phone?: string
  email?: string
  country?: string
  city?: string
}

interface PreviewCompany {
  nameEn?: string
  nameAr?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  crNumber?: string
  vatNumber?: string
  bankName?: string
  accountName?: string
  iban?: string
  swift?: string
  bankCurrency?: string
}

export interface DocPreviewData {
  id: string
  type: string
  number: string
  date: string
  expirationDate?: string
  language: 'en' | 'ar'
  template?: string
  preparedBy: string
  showSignature: boolean
  showStamp: boolean
  vatRate: number
  status: 'draft' | 'final'
  notes: string
  terms: string
  items: PreviewItem[]
  subtotal: number
  vatAmount: number
  total: number
  currency: string
  company: PreviewCompany
  customer: PreviewParty
  shipping: {
    incoterm?: string
    portOfLoading?: string
    portOfDischarge?: string
    vessel?: string
    voyage?: string
    containerNumber?: string
    sealNumber?: string
    marksAndNumbers?: string
    shippingMethod?: string
    destination?: string
    deliverBefore?: string
  }
  invoiceReference?: string
  documentReference?: string
}

/* ── Shared helpers ─────────────────────────────────────────── */

function fmtNum(n: unknown): string {
  if (n == null || n === '') return ''
  const num = Number(n)
  if (isNaN(num)) return String(n)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d: unknown): string {
  if (!d) return ''
  const s = String(d)
  // If already DD/MM/YYYY or similar, return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  // Try parsing ISO date
  try {
    const dt = new Date(s)
    if (isNaN(dt.getTime())) return s
    const dd = String(dt.getDate()).padStart(2, '0')
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const yyyy = dt.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return s
  }
}

function itemFields(items: PreviewItem[], prefix: string) {
  const result: Record<string, unknown> = {}
  items.forEach((item, i) => {
    const p = `${prefix}.${i}`
    // Common fields for invoice-family items
    result[`${p}.item_code`] = item.material || ''
    result[`${p}.description`] = item.description || item.material || ''
    result[`${p}.hs_code`] = item.hsCode || ''
    result[`${p}.origin`] = item.origin || ''
    result[`${p}.packing`] = item.packing || ''
    result[`${p}.quantity`] = fmtNum(item.quantity)
    result[`${p}.uom`] = item.unit || ''
    result[`${p}.price`] = fmtNum(item.unitPrice)
    result[`${p}.amount`] = fmtNum(item.total)
    // Packing-specific fields
    result[`${p}.marks`] = ''
    result[`${p}.packages`] = item.packages != null ? String(item.packages) : ''
    result[`${p}.net_kg`] = fmtNum(item.netWeight)
    result[`${p}.gross_kg`] = fmtNum(item.grossWeight)
    // Delivery-specific
    result[`${p}.remarks`] = item.packing || ''
  })
  return result
}

/* ── Invoice-family adapter (QUOT / PINV / TINV-A / TINV-B / CINV) ── */

export function adaptInvoiceData(data: DocPreviewData): Record<string, unknown> {
  const company = data.company
  const customer = data.customer

  const address = [customer.address, customer.city, customer.country].filter(Boolean).join(', ')
  const companyAddress = [company.address].filter(Boolean).join(', ')

  return {
    // Document meta
    invoice_number: data.number || '',
    date: formatDate(data.date),
    expiration_date: data.expirationDate ? formatDate(data.expirationDate) : '',
    customer_id: customer.name || '',
    currency: data.currency || '',

    // Customer
    'customer.name': customer.name || '',
    'customer.address': address,
    'customer.contact': customer.contactPerson || '',
    'customer.phone': customer.phone || '',

    // Company
    'company.name': company.nameEn || '',
    'company.address': companyAddress,
    'company.phone': company.phone || '',
    'company.email': company.email || '',
    'company.website': company.website || '',
    'company.vat': company.vatNumber || '',
    'company.cr': company.crNumber || '',
    'company.logo': '',

    // Items (indexed)
    ...itemFields(data.items, 'items'),

    // Terms
    'terms.payment': data.terms || '',
    'terms.delivery': '',
    'terms.shipping': data.shipping.incoterm || '',
    'terms.shipping_extra': '',
    'terms.validity': data.expirationDate ? `Valid until: ${formatDate(data.expirationDate)}` : '',

    // Bank details
    'bank.name': company.bankName || '',
    'bank.currency': company.bankCurrency || '',
    'bank.account_name': company.accountName || '',
    'bank.iban': company.iban || '',
    'bank.swift': company.swift || '',

    // Totals
    'totals.subtotal': fmtNum(data.subtotal),
    'totals.tax_rate': data.vatRate > 0 ? `${data.vatRate}%` : '0%',
    'totals.vat': fmtNum(data.vatAmount),
    'totals.total': fmtNum(data.total),

    // Approved by
    approved_by: data.preparedBy || '',
  }
}

/* ── Packing-list adapter ── */

export function adaptPackingData(data: DocPreviewData): Record<string, unknown> {
  const customer = data.customer
  const company = data.company
  const totalPkgs = data.items.reduce((s, i) => s + (i.packages || 0), 0)
  const totalNet = data.items.reduce((s, i) => s + (i.netWeight || 0), 0)
  const totalGross = data.items.reduce((s, i) => s + (i.grossWeight || 0), 0)

  const address = [customer.address, customer.city, customer.country].filter(Boolean).join(', ')

  return {
    packing_list_number: data.number || '',
    date: formatDate(data.date),
    invoice_reference: data.invoiceReference || '',
    marks_numbers: data.shipping.marksAndNumbers || '',

    'company.name': company.nameEn || '',
    'company.address': company.address || '',
    'company.phone': company.phone || '',
    'company.email': company.email || '',
    'company.vat': company.vatNumber || '',
    'company.logo': '',

    'customer.name': customer.name || '',
    'customer.address_line1': customer.address || '',
    'customer.address_line2': [customer.city, customer.country].filter(Boolean).join(', '),
    'customer.phone': customer.phone || '',

    ...itemFields(data.items, 'items'),

    'container.type': data.shipping.containerNumber || '',
    'container.seal': data.shipping.sealNumber || '',
    'container.packages': totalPkgs > 0 ? String(totalPkgs) : '',
    'container.cbm': '',

    approved_by: data.preparedBy || '',
  }
}

/* ── Delivery-note adapter ── */

export function adaptDeliveryData(data: DocPreviewData): Record<string, unknown> {
  const customer = data.customer
  const company = data.company

  return {
    delivery_note_number: data.number || '',
    document_number: data.documentReference || data.number || '',
    date: formatDate(data.date),
    customer_invoice_number: data.invoiceReference || '',
    shipping_method: data.shipping.shippingMethod || '',
    destination: data.shipping.destination || '',
    prepare_before: data.shipping.deliverBefore ? formatDate(data.shipping.deliverBefore) : '',

    'company.name': company.nameEn || '',
    'company.logo': '',

    'customer.name': customer.name || '',

    ...itemFields(data.items, 'items'),

    approved_by: data.preparedBy || '',
    received_by: '',
  }
}

/* ── Template ID mapping ── */

export function getTemplateId(templateKey: string): FullaTemplateId {
  switch (templateKey) {
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

/* ── Main adapter: dispatch by template type ── */

export function adaptForTemplate(
  data: DocPreviewData,
  templateKey: string,
): Record<string, unknown> {
  const id = getTemplateId(templateKey)
  if (id === 'packing-list') return adaptPackingData(data)
  if (id === 'delivery-note') return adaptDeliveryData(data)
  return adaptInvoiceData(data)
}
