/* ── Quotation Field Mapping ───────────────────────────
 * Maps visual fields in the Fulla Quotation template
 * to SANAD DocRenderData paths.
 */

export const QUOTATION_MAPPING = {
  /* ── Document metadata ─────────────────────────────── */
  documentNumber: 'data.number',
  documentDate: 'data.date',
  expirationDate: 'data.expirationDate',
  documentLanguage: 'data.language',
  documentStatus: 'data.status',
  preparedBy: 'data.preparedBy',
  showSignature: 'data.showSignature',
  showStamp: 'data.showStamp',

  /* ── Company (sender) ──────────────────────────────── */
  companyNameEn: 'data.company.nameEn',
  companyNameAr: 'data.company.nameAr',
  companyLegalNameEn: 'data.company.legalNameEn',
  companyLegalNameAr: 'data.company.legalNameAr',
  companyCrNumber: 'data.company.crNumber',
  companyVatNumber: 'data.company.vatNumber',
  companyAddress: 'data.company.address',
  companyCity: 'data.company.city',
  companyCountry: 'data.company.country',
  companyPhone: 'data.company.phone',
  companyEmail: 'data.company.email',
  companyWebsite: 'data.company.website',
  companyLogo: 'data.company.logo',
  companyStamp: 'data.company.stamp',
  companySignature: 'data.company.signature',

  /* ── Customer / Buyer ──────────────────────────────── */
  customerName: 'data.customer.name',
  customerNameAr: 'data.customer.nameAr',
  customerContact: 'data.customer.contactPerson',
  customerPhone: 'data.customer.phone',
  customerEmail: 'data.customer.email',
  customerAddress: 'data.customer.address',
  customerCity: 'data.customer.city',
  customerCountry: 'data.customer.country',
  customerVatNumber: 'data.customer.vatNumber',

  /* ── Shipping details ──────────────────────────────── */
  incoterm: 'data.shipping.incoterm',
  portOfLoading: 'data.shipping.portOfLoading',
  portOfDischarge: 'data.shipping.portOfDischarge',
  freightTerms: 'data.shipping.freightTerms',
  shippingMethod: 'data.shipping.shippingMethod',
  destination: 'data.shipping.destination',
  deliverBefore: 'data.shipping.deliverBefore',

  /* ── Line items (materials) ────────────────────────── */
  items: 'data.items',
  itemMaterial: 'data.items[].material',
  itemDescription: 'data.items[].description',
  itemGrade: 'data.items[].grade',
  itemHsCode: 'data.items[].hsCode',
  itemOrigin: 'data.items[].origin',
  itemQuantity: 'data.items[].quantity',
  itemUnit: 'data.items[].unit',
  itemUnitPrice: 'data.items[].unitPrice',
  itemCurrency: 'data.items[].currency',
  itemTotal: 'data.items[].total',
  itemPacking: 'data.items[].packing',

  /* ── Totals ────────────────────────────────────────── */
  currency: 'data.currency',
  subtotal: 'data.subtotal',
  vatRate: 'data.vatRate',
  vatAmount: 'data.vatAmount',
  total: 'data.total',

  /* ── Bank details ──────────────────────────────────── */
  bankName: 'data.company.bankName',
  accountName: 'data.company.accountName',
  iban: 'data.company.iban',
  swift: 'data.company.swift',

  /* ── Notes & terms ─────────────────────────────────── */
  notes: 'data.notes',
  terms: 'data.terms',
} as const

export type QuotationMappingKey = keyof typeof QUOTATION_MAPPING