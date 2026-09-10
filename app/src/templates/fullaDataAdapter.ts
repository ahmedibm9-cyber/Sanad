/* ── Data Adapter: SANAD DocRenderData → Fulla shapes ──────── */
import type { DocRenderData } from './types'
import type { FullaSettings, FullaCustomer, FullaInvoice, FullaLine } from './fullaInvoiceRenderer'
import type { FullaPacking, FullaPackingLine } from './fullaPackingRenderer'
import type { FullaLoading, FullaLoadingLine } from './fullaLoadingRenderer'

/* ── Adapt Settings ────────────────────────────────────────── */
export function adaptSettings(company: DocRenderData['company']): FullaSettings {
  return {
    companyEn: company.nameEn || '',
    companyAr: company.nameAr || '',
    addressEn: [company.address, company.city, company.country].filter(Boolean).join(', '),
    addressAr: '',
    phone: company.phone || '',
    mobile: '',
    email: company.email || '',
    website: company.website || '',
    vatNumber: company.vatNumber || '',
    crNumber: company.crNumber || '',
    companyPrintFields: '',
    logo: company.logo,
    stamp: company.stamp,
    signature: company.signature,
    banks: company.bankName || company.iban ? [{
      id: 'default',
      name: company.bankName || '',
      accountName: company.accountName || '',
      currency: '',
      iban: company.iban || '',
      swift: company.swift || '',
      accountNumber: company.accountNumber || '',
      branch: '',
    }] : [],
  }
}

/* ── Adapt Customer ────────────────────────────────────────── */
function adaptCustomer(customer: DocRenderData['customer']): FullaCustomer {
  return {
    id: '',
    code: '',
    companyEn: customer.name || '',
    companyAr: customer.nameAr || '',
    vat: customer.vatNumber || '',
    cr: '',
    country: customer.country || '',
    city: customer.city || '',
    address1: customer.address || '',
    address2: '',
    contact: customer.contactPerson || '',
    phone: customer.phone || '',
    mobile: '',
    email: customer.email || '',
    website: '',
    currency: '',
    pol: '',
    pod: '',
    paymentTerms: '',
    deliveryTerms: '',
    shippingTerms: '',
  }
}

/* ── Adapt Invoice Lines ───────────────────────────────────── */
function adaptLines(items: DocRenderData['items']): FullaLine[] {
  return items.map((item) => ({
    id: '',
    itemId: '',
    code: item.material || '',
    nameEn: item.material || '',
    nameAr: '',
    description: item.description || item.material || '',
    unit: item.unit || '',
    packing: item.packing || '',
    hs: item.hsCode || '',
    origin: item.origin || '',
    qty: item.quantity || 0,
    price: item.unitPrice || 0,
    vat: 0,
    packages: item.packages,
    net: item.netWeight,
    gross: item.grossWeight,
  }))
}

/* ── Adapt Invoice ─────────────────────────────────────────── */
function adaptInvoice(data: DocRenderData, type: string): FullaInvoice {
  return {
    id: data.id,
    number: data.number || '',
    date: data.date || '',
    type,
    customerId: '',
    customerName: data.customer.name || '',
    customerNameAr: data.customer.nameAr || '',
    lines: adaptLines(data.items),
    notes: data.notes || '',
    terms: data.terms || '',
    discount: 0,
    currency: data.currency || '',
    expirationDate: data.expirationDate,
    preparedBy: data.preparedBy,
    stampUrl: data.showStamp ? data.company.stamp : undefined,
    signatureUrl: data.showSignature ? data.company.signature : undefined,
  }
}

/* ── Adapt Packing ─────────────────────────────────────────── */
function adaptPacking(data: DocRenderData): FullaPacking {
  const lines: FullaPackingLine[] = data.items.map((item) => ({
    id: '',
    itemId: '',
    code: item.material || '',
    description: item.description || item.material || '',
    hs: item.hsCode || '',
    packing: item.packing || '',
    origin: item.origin || '',
    unit: item.unit || '',
    qty: item.quantity || 0,
    packages: item.packages,
    net: item.netWeight,
    gross: item.grossWeight,
  }))

  const totalPkgs = data.items.reduce((s, i) => s + (i.packages || 0), 0)
  const totalNet = data.items.reduce((s, i) => s + (i.netWeight || 0), 0)
  const totalGross = data.items.reduce((s, i) => s + (i.grossWeight || 0), 0)

  return {
    id: data.id,
    number: data.number || '',
    date: data.date || '',
    reference: data.invoiceReference,
    customerId: '',
    customerName: data.customer.name || '',
    marks: data.shipping.marksAndNumbers || '',
    container: data.shipping.containerNumber || '',
    seal: data.shipping.sealNumber || '',
    packages: totalPkgs > 0 ? String(totalPkgs) : '',
    net: totalNet,
    gross: totalGross,
    notes: data.notes || '',
    lines,
  }
}

/* ── Adapt Loading ─────────────────────────────────────────── */
function adaptLoading(data: DocRenderData): FullaLoading {
  const lines: FullaLoadingLine[] = data.items.map((item) => ({
    id: '',
    itemId: '',
    code: item.material || '',
    description: item.description || item.material || '',
    unit: item.unit || '',
    origin: item.origin || '',
    qty: item.quantity || 0,
    remarks: item.packing || '',
  }))

  return {
    id: data.id,
    number: data.number || '',
    date: data.date || '',
    reference: data.invoiceReference,
    customerId: '',
    customerName: data.customer.name || '',
    preparedBefore: data.shipping.deliverBefore,
    marks: data.shipping.marksAndNumbers || '',
    notes: data.notes || '',
    lines,
  }
}

/* ── Template-specific rendering ───────────────────────────── */
export function renderTemplate(
  data: DocRenderData,
  templateKey: string,
  lang: 'en' | 'ar' = 'en'
): string {
  const s = adaptSettings(data.company)

  switch (templateKey) {
    case 'fulla-commercial-invoice-680': {
      const v = adaptInvoice(data, 'commercial')
      const { invoicePaper } = require('./fullaInvoiceRenderer')
      return invoicePaper(v, 'modern', s, lang)
    }
    case 'fulla-tax-invoice-a-680': {
      const v = adaptInvoice(data, 'tax')
      const { invoicePaper } = require('./fullaInvoiceRenderer')
      return invoicePaper(v, 'classic', s, lang)
    }
    case 'fulla-tax-invoice-b-680': {
      const v = adaptInvoice(data, 'tax')
      const { invoicePaper } = require('./fullaInvoiceRenderer')
      return invoicePaper(v, 'bilingual', s, lang)
    }
    case 'fulla-proforma-invoice-680': {
      const v = adaptInvoice(data, 'proforma')
      const { invoicePaper } = require('./fullaInvoiceRenderer')
      return invoicePaper(v, 'elegant', s, lang)
    }
    case 'fulla-quotation-680': {
      const v = adaptInvoice(data, 'quotation')
      const { quotePaper } = require('./fullaInvoiceRenderer')
      return quotePaper(v, 'classic', s, lang)
    }
    case 'fulla-packing-list-680': {
      const p = adaptPacking(data)
      const { packingPaper } = require('./fullaPackingRenderer')
      return packingPaper(p, 'detailed', s, lang)
    }
    case 'fulla-delivery-note-680': {
      const r = adaptLoading(data)
      const { loadingPaper } = require('./fullaLoadingRenderer')
      return loadingPaper(r, 'load-classic', s, lang)
    }
    default:
      return `<div class="paper"><p>Unknown template: ${templateKey}</p></div>`
  }
}

export {
  adaptCustomer,
  adaptLines,
  adaptInvoice,
  adaptPacking,
  adaptLoading,
}
