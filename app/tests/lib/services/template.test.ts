/**
 * Tests for document template service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('TemplateService', () => {
  let service: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { TemplateService } = await import('@/lib/services/template')
    service = new TemplateService()
  })

  describe('Template Definitions', () => {
    it('should have 9 templates defined (2 original + 7 native Fulla)', () => {
      const templates = service.getTemplates()
      expect(templates).toHaveLength(9)
    })

    it('should have template-a, template-b, and all 7 native Fulla templates', () => {
      const keys = service.getTemplates().map((t: any) => t.key)
      expect(keys).toContain('template-a')
      expect(keys).toContain('template-b')
      expect(keys).toContain('fulla-packing-list-680')
      expect(keys).toContain('fulla-quotation-680')
      expect(keys).toContain('fulla-tax-invoice-a-680')
      expect(keys).toContain('fulla-delivery-note-680')
      expect(keys).toContain('fulla-commercial-invoice-680')
      expect(keys).toContain('fulla-tax-invoice-b-680')
      expect(keys).toContain('fulla-proforma-invoice-680')
    })

    it('should return correct template by key', () => {
      const templateA = service.getTemplate('template-a')
      expect(templateA?.name).toBe('Classic Minimal')
      
      const templateB = service.getTemplate('template-b')
      expect(templateB?.name).toBe('Modern Minimal')
    })
  })

  describe('Document Type Labels', () => {
    it('should return correct English labels', () => {
      expect(service.getDocumentTypeLabel('QUOT', 'en')).toBe('QUOTATION')
      expect(service.getDocumentTypeLabel('PINV', 'en')).toBe('PROFORMA INVOICE')
      expect(service.getDocumentTypeLabel('TINV', 'en')).toBe('TAX INVOICE')
      expect(service.getDocumentTypeLabel('CINV', 'en')).toBe('COMMERCIAL INVOICE')
      expect(service.getDocumentTypeLabel('PKL', 'en')).toBe('PACKING LIST')
      expect(service.getDocumentTypeLabel('DN', 'en')).toBe('DELIVERY NOTE')
      expect(service.getDocumentTypeLabel('BL', 'en')).toBe('BILL OF LADING')
    })

    it('should return correct Arabic labels', () => {
      expect(service.getDocumentTypeLabel('QUOT', 'ar')).toBe('عرض أسعار')
      expect(service.getDocumentTypeLabel('TINV', 'ar')).toBe('فاتورة ضريبية')
      expect(service.getDocumentTypeLabel('BL', 'ar')).toBe('بوليصة الشحن')
    })
  })

  describe('Document Rendering', () => {
    const mockData = {
      documentType: 'TINV' as const,
      documentNumber: 'TINV-2024-001',
      createdDate: '2024-11-01',
      language: 'en',
      templateKey: 'template-a' as const,
      preparedBy: 'Mohamed Al-Hassan',
      showSignature: true,
      showStamp: true,
      company: {
        nameEn: 'Fulla International',
        nameAr: 'فلا Intl',
        address: 'Riyadh, Saudi Arabia',
        phone: '+966 11 456 7890',
        vatNumber: '310567890100003',
        logoUrl: undefined,
        stampUrl: undefined,
        signatureUrl: undefined,
      },
      customer: {
        name: 'Al-Baraka Trading LLC',
        address: 'Dubai, UAE',
        phone: '+971 4 345 6789',
      },
      items: [
        { material: 'HDPE 952', quantity: 50, unit: 'MT', unitPrice: 1050, currency: 'SAR', total: 52500 },
      ],
      subtotal: 52500,
      vatRate: 0,
      total: 52500,
      currency: 'SAR',
    }

    it('should render Template A in English', () => {
      const html = service.renderDocument(mockData)
      expect(html).toContain('TAX INVOICE')
      expect(html).toContain('Fulla International')
      expect(html).toContain('Al-Baraka Trading LLC')
      expect(html).toContain('HDPE 952')
      expect(html).toContain('50')
      expect(html).toContain('52,500')
      expect(html).toContain('dir="ltr"')
    })

    it('should render Template A in Arabic', () => {
      const arabicData = { ...mockData, language: 'ar', templateKey: 'template-a' as const }
      const html = service.renderDocument(arabicData)
      expect(html).toContain('فاتورة ضريبية')
      expect(html).toContain('فلا Intl')
      expect(html).toContain('dir="rtl"')
    })

    it('should render Template B in English', () => {
      const templateBData = { ...mockData, templateKey: 'template-b' as const }
      const html = service.renderDocument(templateBData)
      expect(html).toContain('TAX INVOICE')
      expect(html).toContain('Fulla International')
      expect(html).toContain('HDPE 952')
    })

    it('should handle VAT correctly', () => {
      const vatData = { ...mockData, vatRate: 15, vatAmount: 7875, total: 60375 }
      const html = service.renderDocument(vatData)
      expect(html).toContain('VAT (15%)')
      expect(html).toContain('7,875')
      expect(html).toContain('60,375')
    })

    it('should handle no VAT', () => {
      const html = service.renderDocument(mockData)
      expect(html).not.toContain('VAT (15%)')
      expect(html).toContain('52,500')
    })

    it('should handle multiple items', () => {
      const multiItemData = {
        ...mockData,
        items: [
          { material: 'HDPE 952', quantity: 50, unit: 'MT', unitPrice: 1050, currency: 'SAR', total: 52500 },
          { material: 'PP 500P', quantity: 30, unit: 'MT', unitPrice: 980, currency: 'SAR', total: 29400 },
        ],
        subtotal: 81900,
        total: 81900,
      }
      const html = service.renderDocument(multiItemData)
      expect(html).toContain('HDPE 952')
      expect(html).toContain('PP 500P')
      expect(html).toContain('50')
      expect(html).toContain('30')
    })

    it('should include notes when provided', () => {
      const notesData = { ...mockData, notes: 'Payment within 30 days' }
      const html = service.renderDocument(notesData)
      expect(html).toContain('Payment within 30 days')
    })

    it('should include prepared by', () => {
      const html = service.renderDocument(mockData)
      expect(html).toContain('Mohamed Al-Hassan')
    })

    it('should handle Quotation type', () => {
      const quotData = { ...mockData, documentType: 'QUOT' as const }
      const html = service.renderDocument(quotData)
      expect(html).toContain('QUOTATION')
    })
  })
})
