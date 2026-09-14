/* ── Packing List Field Mapping ──────────────────────────
 * Maps visual fields in the Fulla Packing List template
 * to SANAD DocRenderData paths.
 */

export const PACKING_LIST_MAPPING = {
  /* ── Document metadata ─────────────────────────────── */
  documentNumber: 'data.number',
  documentDate: 'data.date',
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

  /* ── Customer / Consignee (buyer) ──────────────────── */
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
  containerNumber: 'data.shipping.containerNumber',
  sealNumber: 'data.shipping.sealNumber',
  marksAndNumbers: 'data.shipping.marksAndNumbers',
  vessel: 'data.shipping.vessel',
  voyage: 'data.shipping.voyage',
  portOfLoading: 'data.shipping.portOfLoading',
  portOfDischarge: 'data.shipping.portOfDischarge',
  placeOfReceipt: 'data.shipping.placeOfReceipt',
  placeOfDelivery: 'data.shipping.placeOfDelivery',
  incoterm: 'data.shipping.incoterm',
  shippingMethod: 'data.shipping.shippingMethod',

  /* ── Invoice reference ─────────────────────────────── */
  invoiceReference: 'data.invoiceReference',
  documentReference: 'data.documentReference',

  /* ── Line items (materials) ────────────────────────── */
  items: 'data.items',
  itemMaterial: 'data.items[].material',
  itemDescription: 'data.items[].description',
  itemGrade: 'data.items[].grade',
  itemHsCode: 'data.items[].hsCode',
  itemOrigin: 'data.items[].origin',
  itemQuantity: 'data.items[].quantity',
  itemUnit: 'data.items[].unit',
  itemPacking: 'data.items[].packing',
  itemPackages: 'data.items[].packages',
  itemNetWeight: 'data.items[].netWeight',
  itemGrossWeight: 'data.items[].grossWeight',
  itemCbm: 'data.items[].cbm',

  /* ── Totals ────────────────────────────────────────── */
  currency: 'data.currency',
  subtotal: 'data.subtotal',
  vatRate: 'data.vatRate',
  vatAmount: 'data.vatAmount',
  total: 'data.total',

  /* ── Notes & terms ─────────────────────────────────── */
  notes: 'data.notes',
  terms: 'data.terms',
} as const

export type PackingListMappingKey = keyof typeof PACKING_LIST_MAPPING
