import type { DocumentType } from '../types'

/* ── Template Key (all 7 Fulla templates) ──────────────── */
export type FullaTemplateKey =
  | 'fulla-packing-list-680'
  | 'fulla-quotation-680'
  | 'fulla-tax-invoice-a-680'
  | 'fulla-delivery-note-680'
  | 'fulla-commercial-invoice-680'
  | 'fulla-tax-invoice-b-680'
  | 'fulla-proforma-invoice-680'

/* ── Template Definition ────────────────────────────────── */
export interface FullaTemplateDefinition {
  key: FullaTemplateKey
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  documentType: DocumentType
  version: string
  features: string[]
}

/* ── Document Render Data (shared by all templates) ─────── */
export interface DocRenderData {
  id: string
  type: DocumentType
  number: string
  date: string
  expirationDate?: string
  language: 'en' | 'ar'
  preparedBy: string
  showSignature: boolean
  showStamp: boolean
  vatRate: number
  status: 'draft' | 'final'
  notes: string
  terms: string

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
    logo?: string
    stamp?: string
    signature?: string
    bankName?: string
    accountName?: string
    accountNumber?: string
    iban?: string
    swift?: string
  }

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

  items: DocRenderItem[]

  subtotal: number
  vatAmount: number
  total: number
  currency: string

  shipping: {
    incoterm?: string
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
    shippingMethod?: string
    destination?: string
    deliverBefore?: string
  }

  invoiceReference?: string
  documentReference?: string
}

export interface DocRenderItem {
  material: string
  description: string
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
}

/* ── Template Props ─────────────────────────────────────── */
export interface TemplateProps {
  data: DocRenderData
  lang: 'en' | 'ar'
}
