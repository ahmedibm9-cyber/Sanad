import { useState, useMemo, useCallback, lazy, Suspense } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useWorkItems, useCustomers, useWorkItemMaterials } from '../hooks/useData'
import { downloadDocumentPdf } from '../lib/pdfExport'
import type { DocumentType } from '../types'
import {
  ArrowLeft, Printer, Download, FileText, Languages,
} from 'lucide-react'
import { appLogger } from '../lib/logger'

/* ── lazy-load Fulla templates ──────────────────────────── */
const FullaPackingList = lazy(() => import('../templates/fulla-packing-list-680/Template'))
const FullaQuotation = lazy(() => import('../templates/fulla-quotation-680/Template'))
const FullaTaxInvoiceA = lazy(() => import('../templates/fulla-tax-invoice-a-680/Template'))
const FullaDeliveryNote = lazy(() => import('../templates/fulla-delivery-note-680/Template'))
const FullaCommercialInvoice = lazy(() => import('../templates/fulla-commercial-invoice-680/Template'))
const FullaTaxInvoiceB = lazy(() => import('../templates/fulla-tax-invoice-b-680/Template'))
const FullaProformaInvoice = lazy(() => import('../templates/fulla-proforma-invoice-680/Template'))

/* ── helpers ──────────────────────────────────────────── */
const docTypeLabels: Record<DocumentType, { en: string; ar: string; enFull: string; arFull: string }> = {
  QUOT: { en: 'QUOTATION', ar: 'عرض أسعار', enFull: 'Quotation', arFull: 'عرض أسعار' },
  PINV: { en: 'PROFORMA INVOICE', ar: 'فاتورة مبدئية', enFull: 'Proforma Invoice', arFull: 'فاتورة مبدئية' },
  TINV: { en: 'TAX INVOICE', ar: 'فاتورة ضريبية', enFull: 'Tax Invoice', arFull: 'فاتورة ضريبية' },
  CINV: { en: 'COMMERCIAL INVOICE', ar: 'فاتورة تجارية', enFull: 'Commercial Invoice', arFull: 'فاتورة تجارية' },
  PKL:  { en: 'PACKING LIST', ar: 'قائمة التعبئة', enFull: 'Packing List', arFull: 'قائمة التعبئة' },
  DN:   { en: 'DELIVERY NOTE', ar: 'إشعار التسليم', enFull: 'Delivery Note', arFull: 'إشعار التسليم' },
  BL:   { en: 'BILL OF LADING', ar: 'بوليصة الشحن', enFull: 'Bill of Lading', arFull: 'بوليصة الشحن' },
}

/* ── template options (7 Fulla templates only) ──────────── */
const TEMPLATE_OPTIONS = [
  { value: 'fulla-packing-list-680', label: 'Packing List — Fulla Original', labelAr: 'قائمة التعبئة — فولا الأصلي', docType: 'PKL' },
  { value: 'fulla-quotation-680', label: 'Quotation — Fulla Original', labelAr: 'عرض أسعار — فولا الأصلي', docType: 'QUOT' },
  { value: 'fulla-tax-invoice-a-680', label: 'Tax Invoice — Fulla Layout A', labelAr: 'فاتورة ضريبية — تخطيط فولا أ', docType: 'TINV' },
  { value: 'fulla-delivery-note-680', label: 'Delivery Note — Fulla Original', labelAr: 'إشعار التسليم — فولا الأصلي', docType: 'DN' },
  { value: 'fulla-commercial-invoice-680', label: 'Commercial Invoice — Fulla Original', labelAr: 'فاتورة تجارية — فولا الأصلي', docType: 'CINV' },
  { value: 'fulla-tax-invoice-b-680', label: 'Tax Invoice — Fulla Layout B', labelAr: 'فاتورة ضريبية — تخطيط فولا ب', docType: 'TINV' },
  { value: 'fulla-proforma-invoice-680', label: 'Proforma Invoice — Fulla Original', labelAr: 'فاتورة مبدئية — فولا الأصلي', docType: 'PINV' },
]

/* ── shared doc data type ─────────────────────────────── */
interface DocPreviewItem {
  material: string; description: string; hsCode: string; origin: string;
  grade?: string; packing?: string;
  quantity: number; unit: string; unitPrice: number; currency: string; total: number;
  packages?: number; netWeight?: number; grossWeight?: number; cbm?: number;
}
interface DocPreviewParty { name: string; nameAr: string; address: string; contactPerson: string; phone?: string; email?: string; country?: string; city?: string }
interface DocPreviewCompany {
  nameEn: string | undefined; nameAr: string | undefined; legalNameEn?: string; legalNameAr?: string;
  crNumber: string | undefined; vatNumber: string | undefined;
  address: string | undefined; phone: string | undefined; email: string | undefined;
  website?: string; city?: string; country?: string;
  bankName: string | undefined; accountName?: string; iban: string | undefined; swift: string | undefined;
  logo?: string; stamp?: string; signature?: string;
}
interface DocPreviewData {
  id: string; type: DocumentType; number: string; date: string; expirationDate?: string;
  language: 'en' | 'ar'; template: string;
  preparedBy: string; showSignature: boolean; showStamp: boolean;
  vatRate: number; status: 'draft' | 'final'; notes: string; terms: string;
  items: DocPreviewItem[]; subtotal: number; vatAmount: number; total: number; currency: string;
  company: DocPreviewCompany; customer: DocPreviewParty;
  incoterm: string; portOfLoading: string; portOfDischarge: string;
  shipping: {
    vessel?: string; voyage?: string; containerNumber?: string; sealNumber?: string;
    marksAndNumbers?: string; shippingMethod?: string; destination?: string; deliverBefore?: string;
    placeOfReceipt?: string; placeOfDelivery?: string; freightTerms?: string;
  }
  invoiceReference?: string;
}

/* ── empty fallback ────────────────────────────────────── */
const emptyDoc: DocPreviewData = {
  id: 'doc-preview', type: 'CINV', number: '', date: new Date().toISOString().split('T')[0],
  language: 'en', template: 'fulla-commercial-invoice-680',
  preparedBy: '', showSignature: true, showStamp: true, vatRate: 0, status: 'draft',
  notes: '', terms: '', items: [], subtotal: 0, vatAmount: 0, total: 0, currency: 'SAR',
  company: { nameEn: '', nameAr: '', crNumber: '', vatNumber: '', address: '', phone: '', email: '', bankName: '', iban: '', swift: '' },
  customer: { name: '', nameAr: '', address: '', contactPerson: '' },
  incoterm: 'FOB', portOfLoading: '', portOfDischarge: '', shipping: {},
}

/* ══════════════════════════════════════════════════════ */
/*  TEMPLATE SWITCHER                                     */
/* ══════════════════════════════════════════════════════ */
const LOADER = <div className="p-8 text-center text-gray-400">Loading template...</div>

function TemplateRenderer({ template, data, lang }: { template: string; data: DocPreviewData; lang: 'en' | 'ar' }) {
  const p = { data: data as any, lang }
  switch (template) {
    case 'fulla-packing-list-680':      return <Suspense fallback={LOADER}><FullaPackingList {...p} /></Suspense>
    case 'fulla-quotation-680':         return <Suspense fallback={LOADER}><FullaQuotation {...p} /></Suspense>
    case 'fulla-tax-invoice-a-680':     return <Suspense fallback={LOADER}><FullaTaxInvoiceA {...p} /></Suspense>
    case 'fulla-delivery-note-680':     return <Suspense fallback={LOADER}><FullaDeliveryNote {...p} /></Suspense>
    case 'fulla-commercial-invoice-680': return <Suspense fallback={LOADER}><FullaCommercialInvoice {...p} /></Suspense>
    case 'fulla-tax-invoice-b-680':     return <Suspense fallback={LOADER}><FullaTaxInvoiceB {...p} /></Suspense>
    case 'fulla-proforma-invoice-680':  return <Suspense fallback={LOADER}><FullaProformaInvoice {...p} /></Suspense>
    default:                            return <Suspense fallback={LOADER}><FullaCommercialInvoice {...p} /></Suspense>
  }
}

/* ══════════════════════════════════════════════════════ */
/*  MAIN PAGE                                             */
/* ══════════════════════════════════════════════════════ */
export default function DocumentPreviewPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const { data: workItems } = useWorkItems(currentCompany.id)
  const { data: customers } = useCustomers(currentCompany.id)
  const workItemsList = workItems ?? []
  const customersList = customers ?? []

  const typeFromUrl = (searchParams.get('type') || 'CINV') as DocumentType
  const projectId = searchParams.get('projectId') || 'proj-1'
  const project = workItemsList.find(p => p.id === projectId) || workItemsList[0]
  const { data: workItemMaterials } = useWorkItemMaterials(project?.id)

  const [template, setTemplate] = useState<string>(
    (currentCompany as any).defaultTemplate || (currentCompany as any).default_template || 'fulla-commercial-invoice-680'
  )
  const [previewLang, setPreviewLang] = useState<'en' | 'ar'>('en')

  const docData: DocPreviewData = useMemo(() => {
    if (!project) return emptyDoc
    const dbMaterials = workItemMaterials ?? []
    const items: DocPreviewItem[] = dbMaterials.length > 0
      ? dbMaterials.map((m: any) => {
          const mat = m.materials || {}
          return {
            material: mat.name || m.material_name || m.materialName || '',
            description: mat.description || mat.grade || m.description || m.grade || '',
            grade: mat.grade || m.grade || '',
            hsCode: mat.hs_code || m.hs_code || m.hsCode || '',
            origin: mat.origin_country || m.origin || '',
            packing: m.packing_description || m.packing || '',
            quantity: Number(m.quantity) || 0,
            unit: mat.unit || m.weight_unit || m.weightUnit || 'MT',
            unitPrice: Number(m.unit_price || m.unitPrice) || 0,
            currency: m.currency || 'SAR',
            total: (Number(m.quantity) || 0) * (Number(m.unit_price || m.unitPrice) || 0),
            packages: Number(m.packages) || 0,
            netWeight: Number(m.net_weight || m.netWeight) || 0,
            grossWeight: Number(m.gross_weight || m.grossWeight) || 0,
            cbm: Number(m.cbm) || 0,
          }
        })
      : []

    const subtotal = items.reduce((s, i) => s + i.total, 0)
    const vatRate = (currentCompany as any).defaultVatRate ?? (currentCompany as any).default_vat_rate ?? 0
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100
    const customer = customersList.find(c => c.id === project.customer_id) || customersList[0]

    return {
      id: id || 'doc-preview',
      type: typeFromUrl,
      number: `${typeFromUrl}-${new Date().getFullYear()}-013`,
      date: new Date().toISOString().split('T')[0],
      language: previewLang,
      template,
      preparedBy: (currentCompany as any).defaultPreparedBy || (currentCompany as any).default_prepared_by || '',
      showSignature: (currentCompany as any).showSignature ?? (currentCompany as any).show_signature ?? true,
      showStamp: (currentCompany as any).showStamp ?? (currentCompany as any).show_stamp ?? true,
      vatRate,
      status: 'draft' as const,
      notes: '',
      terms: (project as any).payment_terms || (project as any).paymentTerms || (currentCompany as any).defaultPaymentTerms || (currentCompany as any).default_payment_terms || '',
      items,
      subtotal,
      vatAmount,
      total: subtotal + vatAmount,
      currency: items[0]?.currency || 'SAR',
      company: {
        nameEn: (currentCompany as any).nameEn || currentCompany.name_en || '',
        nameAr: (currentCompany as any).nameAr || currentCompany.name_ar || '',
        legalNameEn: (currentCompany as any).legalNameEn || currentCompany.legal_name_en || undefined,
        legalNameAr: (currentCompany as any).legalNameAr || currentCompany.legal_name_ar || undefined,
        crNumber: (currentCompany as any).crNumber || (currentCompany as any).cr_number || '',
        vatNumber: (currentCompany as any).vatNumber || (currentCompany as any).vat_number || '',
        address: (currentCompany as any).address || '',
        phone: (currentCompany as any).phone || '',
        email: (currentCompany as any).email || '',
        website: (currentCompany as any).website,
        bankName: (currentCompany as any).bankName || (currentCompany as any).bank_name || '',
        accountName: (currentCompany as any).accountName || (currentCompany as any).account_name,
        iban: (currentCompany as any).iban || '',
        swift: (currentCompany as any).swift || '',
        logo: undefined,
        stamp: undefined,
        signature: undefined,
      },
      customer: {
        name: customer?.name || '',
        nameAr: (customer as any)?.nameAr || customer?.name_ar || customer?.name || '',
        address: customer?.address || '',
        contactPerson: (customer as any)?.contactPerson || customer?.contact_person || '',
        phone: customer?.phone || undefined,
        email: customer?.email || undefined,
        country: customer?.country || undefined,
        city: customer?.city || undefined,
      },
      incoterm: project.incoterm || (currentCompany as any).defaultIncoterm || (currentCompany as any).default_incoterm || 'FOB',
      portOfLoading: (project as any).port_of_loading || (project as any).portOfLoading || '',
      portOfDischarge: (project as any).port_of_discharge || (project as any).portOfDischarge || '',
      shipping: {
        vessel: (project as any).vessel_name || (project as any).vesselName || '',
        voyage: (project as any).voyage_number || (project as any).voyageNumber || '',
        containerNumber: (project as any).container_number || (project as any).containerNumber || '',
        sealNumber: (project as any).seal_number || (project as any).sealNumber || '',
        shippingMethod: (project as any).shipping_method || (project as any).shippingMethod || '',
        destination: (project as any).destination_country || (project as any).destinationCountry || '',
        deliverBefore: (project as any).deliver_before || (project as any).deliverBefore || '',
      },
    }
  }, [id, typeFromUrl, project, currentCompany, template, customersList, previewLang, workItemMaterials])

  const handlePrint = useCallback(() => { window.print() }, [])
  const handleDownload = useCallback(() => { downloadDocumentPdf(docData).catch((e) => appLogger.error('PDF download failed', e)) }, [docData])

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Top Toolbar (hidden on print) ────────────── */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2" aria-label={t('Go back', 'رجوع')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">{t('Document Preview', 'معاينة المستند')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {docData.number} — {t(docTypeLabels[docData.type].enFull, docTypeLabels[docData.type].arFull)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="btn-secondary">
            <Download size={16} className="ms-1.5" />{t('Download PDF', 'تنزيل PDF')}
          </button>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} className="ms-1.5" />{t('Print', 'طباعة')}
          </button>
        </div>
      </div>

      {/* ── Controls (hidden on print) ───────────────── */}
      <div className="print:hidden flex items-center gap-4 mb-4 p-3 bg-white rounded-lg border border-gray-200 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">{t('Template:', 'القالب:')}</span>
          <select className="select-field text-xs py-1.5" value={template} onChange={e => setTemplate(e.target.value)}>
            {TEMPLATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{t(opt.label, opt.labelAr)}</option>
            ))}
          </select>
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <Languages size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">{t('Language:', 'اللغة:')}</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button onClick={() => setPreviewLang('en')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${previewLang === 'en' ? 'bg-brand-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>English</button>
            <button onClick={() => setPreviewLang('ar')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${previewLang === 'ar' ? 'bg-brand-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>العربية</button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/*  A4 DOCUMENT PREVIEW                           */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex justify-center mb-8 print:mb-0">
        <div className="bg-white shadow-xl print:shadow-none overflow-hidden" style={{ width: '794px', pageBreakAfter: 'always' }}>
          <TemplateRenderer template={template} data={docData} lang={previewLang} />
        </div>
      </div>

      {/* ── Bottom Actions (hidden on print) ─────────── */}
      <div className="print:hidden flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ArrowLeft size={16} className="ms-1.5" />{t('Back', 'رجوع')}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="btn-secondary">
            <Download size={16} className="ms-1.5" />{t('Download PDF', 'تنزيل PDF')}
          </button>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} className="ms-1.5" />{t('Print', 'طباعة')}
          </button>
        </div>
      </div>
    </div>
  )
}
