import type { DocRenderData } from '../types'

/* ── Delivery Note Field Mapping ─────────────────────── */
export interface DeliveryNoteMapping {
  header: {
    title: string
    subtitle: string
    companyName: string
  }
  deliveryDetails: {
    deliveryNoteNumber: string
    date: string
    customerImporter: string
    shippingMethod: string
    destinationCountry: string
    deliverBefore: string
  }
  documentDetails: {
    invoiceNumber: string
    documentNumber: string
    date: string
    customerConsignee: string
    customerInvoiceReference: string
    destination: string
    shippingMethod: string
    prepareBefore: string
  }
  materials: {
    rowNumber: number
    itemCode: string
    itemName: string
    unit: string
    quantity: number
    countryOfOrigin: string
    remarks: string
  }[]
  totals: {
    subtotal: number
    vatAmount: number
    total: number
    currency: string
  }
  approval: {
    approvedBy: string
    preparedBy: string
    receivedBy: string
    customerCarrier: string
  }
}

/* ── Map DocRenderData to Delivery Note Fields ──────── */
export function mapDeliveryNoteData(data: DocRenderData): DeliveryNoteMapping {
  return {
    header: {
      title: 'DELIVERY NOTE',
      subtitle: 'إشعار التسليم',
      companyName: data.company.nameEn || 'FULLA TRADING',
    },
    deliveryDetails: {
      deliveryNoteNumber: data.number || '—',
      date: data.date || '—',
      customerImporter: data.customer.name || '—',
      shippingMethod: data.shipping?.shippingMethod || '—',
      destinationCountry: data.shipping?.destination || data.customer.country || '—',
      deliverBefore: data.shipping?.deliverBefore || '—',
    },
    documentDetails: {
      invoiceNumber: data.invoiceReference || '—',
      documentNumber: data.documentReference || data.number || '—',
      date: data.date || '—',
      customerConsignee: data.customer.name || '—',
      customerInvoiceReference: data.invoiceReference || '—',
      destination: data.shipping?.destination || data.customer.country || '—',
      shippingMethod: data.shipping?.shippingMethod || '—',
      prepareBefore: data.shipping?.deliverBefore || '—',
    },
    materials: data.items.map((item, index) => ({
      rowNumber: index + 1,
      itemCode: item.hsCode || item.material || '—',
      itemName: item.description || item.material || '—',
      unit: item.unit || '—',
      quantity: item.quantity || 0,
      countryOfOrigin: item.origin || '—',
      remarks: item.packing || '',
    })),
    totals: {
      subtotal: data.subtotal || 0,
      vatAmount: data.vatAmount || 0,
      total: data.total || 0,
      currency: data.currency || 'SAR',
    },
    approval: {
      approvedBy: data.preparedBy || '—',
      preparedBy: data.preparedBy || '—',
      receivedBy: '',
      customerCarrier: data.customer.name || '—',
    },
  }
}
