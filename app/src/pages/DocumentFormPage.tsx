import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useApp } from '../contexts/AppContext'
import { projects, customersFulla } from '../data/mockData'
import type { DocumentType, ProjectMaterial } from '../types'
import {
  Save, Printer, ArrowLeft, Plus, Trash2, AlertTriangle, X,
  FileText, CheckCircle, RefreshCw, ChevronDown, Info,
} from 'lucide-react'

/* ── helpers ──────────────────────────────────────────── */
const today = () => new Date().toISOString().split('T')[0]

const docTypeLabels: Record<DocumentType, { en: string; ar: string }> = {
  QUOT: { en: 'Quotation', ar: 'عرض أسعار' },
  PINV: { en: 'Proforma Invoice', ar: 'فاتورة مبدئية' },
  TINV: { en: 'Tax Invoice', ar: 'فاتورة ضريبية' },
  CINV: { en: 'Commercial Invoice', ar: 'فاتورة تجارية' },
  PKL:  { en: 'Packing List', ar: 'قائمة التعبئة' },
  DN:   { en: 'Delivery Note', ar: 'إشعار التسليم' },
  BL:   { en: 'Bill of Lading', ar: 'بوليصة الشحن' },
}

function defaultDocNumber(type: DocumentType): string {
  const prefix = type
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')
  return `${prefix}-${year}-${seq}`
}

const itemTemplate: ProjectMaterial = {
  id: '',
  materialId: '',
  materialName: 'HDPE 952',
  grade: 'Blow Molding',
  quantity: 50,
  weightUnit: 'MT',
  unitPrice: 1050,
  currency: 'SAR',
  packing: '25 KG Bags',
  packingUnit: 'Bags',
  origin: 'Saudi Arabia',
  hsCode: '3901.20',
}

/* ── conflict demo affected docs ──────────────────────── */
const affectedDocs = [
  { number: 'PINV-2024-001', type: 'Proforma Invoice', checked: true },
  { number: 'PKL-2024-001', type: 'Packing List', checked: true },
  { number: 'CINV-2024-001', type: 'Commercial Invoice', checked: true },
]

/* ════════════════════════════════════════════════════════ */
export default function DocumentFormPage() {
  const { t, language } = useLanguage()
  const { currentCompany } = useCompany()
  const { currentUser } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const typeFromUrl = (searchParams.get('type') || 'QUOT') as DocumentType
  const projectId = searchParams.get('projectId') || 'proj-1'
  const project = projects.find(p => p.id === projectId) || projects[0]
  const customer = customersFulla.find(c => c.id === project.customerId) || customersFulla[0]

  /* ── form state ─────────────────────────────────────── */
  const [docType] = useState<DocumentType>(typeFromUrl)
  const [docNumber, setDocNumber] = useState(defaultDocNumber(typeFromUrl))
  const [docDate, setDocDate] = useState(today())
  const [docLanguage, setDocLanguage] = useState<'en' | 'ar'>(
    (searchParams.get('lang') as 'en' | 'ar') || language || 'en'
  )
  const [template, setTemplate] = useState<'template-a' | 'template-b'>(
    (currentCompany.defaultTemplate as 'template-a' | 'template-b') || 'template-a'
  )
  const [preparedBy, setPreparedBy] = useState(currentUser.name)
  const [showSignature, setShowSignature] = useState(currentCompany.showSignature ?? true)
  const [showStamp, setShowStamp] = useState(currentCompany.showStamp ?? true)

  // Quotation
  const [validUntil, setValidUntil] = useState('2024-12-31')
  const [subtotal, setSubtotal] = useState(52500)
  const [vatRate, setVatRate] = useState<number>(0)
  const [origin, setOrigin] = useState('Saudi Arabia')
  const [packing, setPacking] = useState('25 KG Bags')
  const [deliveryTime, setDeliveryTime] = useState('15 business days')
  const [incoterm, setIncoterm] = useState('FOB')
  const [deliveryTerms, setDeliveryTerms] = useState(currentCompany.defaultDeliveryTerms || 'Within 15 business days')
  const [paymentTerms, setPaymentTerms] = useState(currentCompany.defaultPaymentTerms || 'Net 30 days')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('All prices are in SAR. Payment terms as stated. Goods remain property of seller until full payment received.')

  // Items
  const [items, setItems] = useState<ProjectMaterial[]>([
    { ...itemTemplate, id: 'item-1', materialName: 'HDPE 952', grade: 'Blow Molding', quantity: 50, unitPrice: 1050 },
    { ...itemTemplate, id: 'item-2', materialName: 'HDPE FG 952', grade: 'Film Grade', quantity: 25, unitPrice: 1100 },
  ])

  // Shipping
  const [vesselName, setVesselName] = useState(project.vesselName || 'MV Pacific Star')
  const [voyageNumber, setVoyageNumber] = useState(project.voyageNumber || 'PS-2024-0412')
  const [portOfLoading, setPortOfLoading] = useState(project.portOfLoading || 'Jubail Port')
  const [portOfDischarge, setPortOfDischarge] = useState(project.portOfDischarge || 'Jebel Ali Port')
  const [containerNumber, setContainerNumber] = useState(project.containerNumber || 'MSKU 7283456')
  const [sealNumber, setSealNumber] = useState('SH-2024-8891')
  const [marksAndNumbers, setMarksAndNumbers] = useState('N/M')
  const [freightTerms, setFreightTerms] = useState('Freight Collect')

  // Bank
  const [bankName, setBankName] = useState(currentCompany.bankName || '')
  const [accountName, setAccountName] = useState(currentCompany.accountName || '')
  const [accountNumber, setAccountNumber] = useState(currentCompany.accountNumber || '')
  const [iban, setIban] = useState(currentCompany.iban || '')
  const [swift, setSwift] = useState(currentCompany.swift || '')

  // Delivery Note
  const [sender, setSender] = useState(currentCompany.nameEn)
  const [receiver, setReceiver] = useState(customer.name)
  const [deliveryAddress, setDeliveryAddress] = useState(customer.address || '')
  const [relatedInvoice, setRelatedInvoice] = useState('PINV-2024-001')

  // Bill of Lading
  const [shipper, setShipper] = useState(currentCompany.legalNameEn || currentCompany.nameEn)
  const [consignee, setConsignee] = useState(customer.name)
  const [notifyParty, setNotifyParty] = useState(customer.name)
  const [placeOfReceipt, setPlaceOfReceipt] = useState('Jubail Industrial City')
  const [descriptionOfGoods, setDescriptionOfGoods] = useState('HIGH DENSITY POLYETHYLENE (HDPE)')
  const [grossWeight, setGrossWeight] = useState('52.5 MT')
  const [netWeight, setNetWeight] = useState('50.0 MT')
  const [packages, setPackages] = useState('2,000 Bags')

  // Packing List specific
  const [containerNo, setContainerNo] = useState('MSKU 7283456')
  const [sealNo, setSealNo] = useState('SH-2024-8891')
  const [cbm, setCbm] = useState('67.5')
  const [netWeightItem, setNetWeightItem] = useState('50.0')
  const [grossWeightItem, setGrossWeightItem] = useState('52.5')

  // Tax Invoice
  const [sellerVat, setSellerVat] = useState(currentCompany.vatNumber || '')
  const [buyerVat, setBuyerVat] = useState('100200300400003')

  // Commercial Invoice
  const [hsCode, setHsCode] = useState('3901.20')

  /* ── conflict modal state ───────────────────────────── */
  const [conflictOpen, setConflictOpen] = useState(false)
  const [conflictQty, setConflictQty] = useState(50)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [syncChecklist, setSyncChecklist] = useState(affectedDocs.map(d => ({ ...d })))

  /* ── computed ───────────────────────────────────────── */
  const vatAmount = useMemo(() => {
    return Math.round(subtotal * (vatRate / 100) * 100) / 100
  }, [subtotal, vatRate])

  const total = useMemo(() => subtotal + vatAmount, [subtotal, vatAmount])

  const updateItem = useCallback((idx: number, field: keyof ProjectMaterial, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        const origQty = field === 'quantity' ? (value as number) : item.quantity
        const origPrice = field === 'unitPrice' ? (value as number) : item.unitPrice
        // conflict demo: if user changes first item qty from 50 to 48
        if (idx === 0 && field === 'quantity' && value === 48) {
          setTimeout(() => setConflictOpen(true), 300)
        }
      }
      return updated
    }))
  }, [])

  const recalcSubtotal = useCallback(() => {
    const sum = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0)
    setSubtotal(sum)
  }, [items])

  const addItem = () => {
    setItems(prev => [...prev, {
      ...itemTemplate,
      id: `item-${Date.now()}`,
      materialName: '',
      grade: '',
      quantity: 0,
      unitPrice: 0,
    }])
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  /* ── handlers ───────────────────────────────────────── */
  const [saveSuccess, setSaveSuccess] = useState(false)
  const handleSave = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handlePreview = () => {
    const docId = id && id !== 'new' ? id : 'doc-preview'
    navigate(`/documents/${docId}/preview?type=${docType}&projectId=${projectId}`)
  }

  const handleSyncDocs = () => {
    setSyncModalOpen(false)
    setConflictOpen(false)
    alert(t(
      'Shared data updated. Affected documents have been synchronized.',
      'تم تحديث البيانات المشتركة. تم مزامنة المستندات المتأثرة.'
    ))
  }

  /* ── common header ──────────────────────────────────── */
  const CommonFields = () => (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-semibold text-brand-900 mb-4 flex items-center gap-2">
        <FileText size={18} />
        {t('Document Information', 'معلومات المستند')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Document Type */}
        <div>
          <label className="label-field">{t('Document Type', 'نوع المستند')}</label>
          <input
            type="text"
            className="input-field bg-gray-50 cursor-not-allowed"
            value={t(docTypeLabels[docType].en, docTypeLabels[docType].ar)}
            readOnly
          />
        </div>
        {/* Document Number */}
        <div>
          <label className="label-field">{t('Document Number', 'رقم المستند')}</label>
          <input
            type="text"
            className="input-field"
            value={docNumber}
            onChange={e => setDocNumber(e.target.value)}
          />
        </div>
        {/* Date */}
        <div>
          <label className="label-field">{t('Date', 'التاريخ')}</label>
          <input
            type="date"
            className="input-field"
            value={docDate}
            onChange={e => setDocDate(e.target.value)}
          />
        </div>
        {/* Language */}
        <div>
          <label className="label-field">{t('Language', 'اللغة')}</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setDocLanguage('en')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                docLanguage === 'en'
                  ? 'bg-brand-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setDocLanguage('ar')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                docLanguage === 'ar'
                  ? 'bg-brand-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              AR
            </button>
          </div>
        </div>
        {/* Template */}
        <div>
          <label className="label-field">{t('Template', 'القالب')}</label>
          <select
            className="select-field"
            value={template}
            onChange={e => setTemplate(e.target.value as 'template-a' | 'template-b')}
          >
            <option value="template-a">{t('Template A — Classic Minimal', 'القالب أ — كلاسيكي مختصر')}</option>
            <option value="template-b">{t('Template B — Modern Minimal', 'القالب ب — عصري مختصر')}</option>
          </select>
        </div>
        {/* Prepared By */}
        <div>
          <label className="label-field">{t('Prepared By', 'أعدّه')}</label>
          <input
            type="text"
            className="input-field"
            value={preparedBy}
            onChange={e => setPreparedBy(e.target.value)}
          />
        </div>
      </div>
      {/* Signature/Stamp toggles */}
      <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showSignature}
            onChange={e => setShowSignature(e.target.checked)}
            className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
          />
          {t('Show Signature', 'إظهار التوقيع')}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showStamp}
            onChange={e => setShowStamp(e.target.checked)}
            className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
          />
          {t('Show Stamp', 'إظهار الختم')}
        </label>
      </div>
    </div>
  )

  /* ── items table header based on type ───────────────── */
  const renderItemsTable = () => {
    const commonCols = (docType === 'PKL') ? [] : (
      docType === 'DN' ? [
        t('Description', 'الوصف'),
        t('Quantity', 'الكمية'),
        t('Unit', 'الوحدة'),
        t('Packing', 'التعبئة'),
      ] :
      docType === 'BL' ? [
        t('Description of Goods', 'وصف البضاعة'),
        t('Packages', 'التعبئة'),
        t('Gross Weight', 'الوزن الصافي'),
        t('Net Weight', 'الوزن الإجمالي'),
      ] :
      docType === 'CINV' ? [
        t('Material', 'المادة'),
        t('HS Code', 'كود النظام المنسق'),
        t('Origin', 'المصدر'),
        t('Quantity', 'الكمية'),
        t('Unit', 'الوحدة'),
        t('Unit Price', 'سعر الوحدة'),
        t('Currency', 'العملة'),
        t('Total', 'المجموع'),
      ] :
      docType === 'TINV' ? [
        t('Material', 'المادة'),
        t('Description', 'الوصف'),
        t('Quantity', 'الكمية'),
        t('Unit', 'الوحدة'),
        t('Unit Price', 'سعر الوحدة'),
        t('Taxable Amount', 'المبلغ الخاضع للضريبة'),
        t('VAT Rate', 'نسبة الضريبة'),
        t('VAT Amount', 'مبلغ الضريبة'),
        t('Total', 'المجموع'),
      ] :
      /* QUOT, PINV */
      [
        t('Material', 'المادة'),
        t('Description', 'الوصف'),
        t('Quantity', 'الكمية'),
        t('Unit', 'الوحدة'),
        t('Unit Price', 'سعر الوحدة'),
        t('Currency', 'العملة'),
        t('Total', 'المجموع'),
      ]
    )

    const pklCols = [
      t('Grade', 'المستوى'),
      t('Origin', 'المصدر'),
      t('Packages', 'التعبئة'),
      t('Packing Type', 'نوع التعبئة'),
      t('Quantity', 'الكمية'),
      t('Net Weight (MT)', 'الوزن الصافي'),
      t('Gross Weight (MT)', 'الوزن الإجمالي'),
      t('Container No', 'رقم الحاوية'),
      t('Seal No', 'رقم الختم'),
      t('Marks & Numbers', 'العلامات والأرقام'),
      t('CBM', 'الحجم'),
    ]

    const cols = docType === 'PKL' ? pklCols : commonCols

    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-brand-900">
            {t('Items', 'العناصر')}
          </h3>
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-secondary text-xs">
              <Plus size={14} className="mr-1" />
              {t('Add Item', 'إضافة عنصر')}
            </button>
            <button onClick={recalcSubtotal} className="btn-ghost text-xs">
              <RefreshCw size={14} className="mr-1" />
              {t('Recalc', 'إعادة حساب')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs w-8">#</th>
                {cols.map((col, i) => (
                  <th key={i} className="text-left py-2 px-2 text-gray-500 font-medium text-xs whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-2 px-2 text-gray-400 text-xs">{idx + 1}</td>
                  {docType === 'PKL' ? (
                    <>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.grade || ''} onChange={e => updateItem(idx, 'grade', e.target.value)} placeholder={t('Grade', 'المستوى')} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.origin || ''} onChange={e => updateItem(idx, 'origin', e.target.value)} placeholder={t('Origin', 'المصدر')} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" type="number" value={(item as any).packages || ''} onChange={e => { const v = e.target.value; setItems(prev => prev.map((it, i) => i === idx ? { ...it, packages: Number(v) } as any : it)) }} placeholder="Pkgs" />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.packing || ''} onChange={e => updateItem(idx, 'packing', e.target.value)} placeholder={t('Packing Type', 'نوع التعبئة')} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" type="number" value={item.quantity} readOnly />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" type="number" value={Math.round(item.quantity * 1.05 * 10) / 10} readOnly />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={containerNo} onChange={e => setContainerNo(e.target.value)} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={sealNo} onChange={e => setSealNo(e.target.value)} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={marksAndNumbers} onChange={e => setMarksAndNumbers(e.target.value)} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" type="number" value={cbm} onChange={e => setCbm(e.target.value)} />
                      </td>
                    </>
                  ) : docType === 'DN' ? (
                    <>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.materialName} onChange={e => updateItem(idx, 'materialName', e.target.value)} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.weightUnit} onChange={e => updateItem(idx, 'weightUnit', e.target.value)} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.packing || ''} onChange={e => updateItem(idx, 'packing', e.target.value)} />
                      </td>
                    </>
                  ) : docType === 'BL' ? (
                    <>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.materialName} onChange={e => updateItem(idx, 'materialName', e.target.value)} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.packing || '25 KG Bags'} />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" type="number" value={Math.round(item.quantity * 1.05 * 10) / 10} readOnly />
                      </td>
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" type="number" value={item.quantity} readOnly />
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Material */}
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.materialName} onChange={e => updateItem(idx, 'materialName', e.target.value)} />
                      </td>
                      {/* Description */}
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5" value={item.grade || ''} onChange={e => updateItem(idx, 'grade', e.target.value)} />
                      </td>
                      {/* Quantity */}
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5 w-20" type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                      </td>
                      {/* Unit */}
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5 w-20" value={item.weightUnit} onChange={e => updateItem(idx, 'weightUnit', e.target.value)} />
                      </td>
                      {/* Unit Price */}
                      <td className="py-2 px-1">
                        <input className="input-field text-xs py-1.5 w-24" type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} />
                      </td>
                      {/* Currency */}
                      {(docType === 'QUOT' || docType === 'PINV') && (
                        <td className="py-2 px-1">
                          <input className="input-field text-xs py-1.5 w-16" value={item.currency} onChange={e => updateItem(idx, 'currency', e.target.value)} />
                        </td>
                      )}
                      {/* HS Code + Origin for CINV */}
                      {docType === 'CINV' && (
                        <>
                          <td className="py-2 px-1">
                            <input className="input-field text-xs py-1.5 w-20" value={item.hsCode || ''} onChange={e => updateItem(idx, 'hsCode', e.target.value)} />
                          </td>
                          <td className="py-2 px-1">
                            <input className="input-field text-xs py-1.5" value={item.origin || ''} onChange={e => updateItem(idx, 'origin', e.target.value)} />
                          </td>
                        </>
                      )}
                      {/* Total */}
                      <td className="py-2 px-1 font-medium text-right whitespace-nowrap">
                        {(item.quantity * item.unitPrice).toLocaleString()} {item.currency}
                      </td>
                      {/* VAT fields for TINV */}
                      {docType === 'TINV' && (
                        <>
                          <td className="py-2 px-1">
                            <input className="input-field text-xs py-1.5 w-24" type="number" value={item.quantity * item.unitPrice} readOnly />
                          </td>
                          <td className="py-2 px-1">
                            <select className="select-field text-xs py-1.5 w-20" value={vatRate} onChange={e => setVatRate(Number(e.target.value))}>
                              <option value={0}>0%</option>
                              <option value={15}>15%</option>
                            </select>
                          </td>
                          <td className="py-2 px-1">
                            <input className="input-field text-xs py-1.5 w-24" type="number" value={Math.round(item.quantity * item.unitPrice * (vatRate / 100) * 100) / 100} readOnly />
                          </td>
                          <td className="py-2 px-1 font-medium text-right whitespace-nowrap">
                            {(item.quantity * item.unitPrice * (1 + vatRate / 100)).toLocaleString()} {item.currency}
                          </td>
                        </>
                      )}
                    </>
                  )}
                  {/* Delete */}
                  <td className="py-2 px-1">
                    <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  /* ── type-specific fields ───────────────────────────── */
  const renderTypeFields = () => {
    switch (docType) {
      /* ── QUOTATION ─────────────────────────────────── */
      case 'QUOT': return (
        <>
          {renderItemsTable()}
          {/* Financial Summary */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">{t('Financial Summary', 'الملخص المالي')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Quotation Number', 'رقم عرض الأسعار')}</label>
                    <input type="text" className="input-field" value={docNumber} readOnly />
                  </div>
                  <div>
                    <label className="label-field">{t('Valid Until', 'صالح حتى')}</label>
                    <input type="date" className="input-field" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('Customer', 'العميل')}</label>
                  <input type="text" className="input-field" value={customer.name} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Origin', 'المصدر')}</label>
                    <input type="text" className="input-field" value={origin} onChange={e => setOrigin(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('Packing', 'التعبئة')}</label>
                    <input type="text" className="input-field" value={packing} onChange={e => setPacking(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Delivery Time', 'مدة التسليم')}</label>
                    <input type="text" className="input-field" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('Incoterm', 'شرطة التجارة')}</label>
                    <select className="select-field" value={incoterm} onChange={e => setIncoterm(e.target.value)}>
                      <option>FOB</option><option>CIF</option><option>EXW</option><option>CFR</option><option>DDP</option><option>DAP</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Subtotal', 'المجموع الفرعي')}</span>
                    <span className="font-medium">{subtotal.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600">{t('VAT Rate', 'نسبة الضريبة')}</span>
                    <select className="select-field w-24 text-xs py-1" value={vatRate} onChange={e => setVatRate(Number(e.target.value))}>
                      <option value={0}>0%</option>
                      <option value={15}>15%</option>
                    </select>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('VAT Amount', 'مبلغ الضريبة')}</span>
                    <span className="font-medium">{vatAmount.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span>{t('Total', 'المجموع')}</span>
                    <span className="text-brand-700">{total.toLocaleString()} SAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Delivery & Payment Terms */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">{t('Terms & Conditions', 'الشروط والأحكام')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label-field">{t('Delivery Terms', 'شروط التسليم')}</label>
                <input type="text" className="input-field" value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} />
              </div>
              <div>
                <label className="label-field">{t('Payment Terms', 'شروط الدفع')}</label>
                <input type="text" className="input-field" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label-field">{t('Notes', 'ملاحظات')}</label>
              <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('Additional notes...', 'ملاحظات إضافية...')} />
            </div>
            <div className="mt-4">
              <label className="label-field">{t('Terms & Conditions', 'الشروط والأحكام')}</label>
              <textarea className="input-field" rows={3} value={terms} onChange={e => setTerms(e.target.value)} />
            </div>
          </div>
        </>
      )

      /* ── PROFORMA INVOICE ───────────────────────────── */
      case 'PINV': return (
        <>
          {renderItemsTable()}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">{t('Proforma Invoice Details', 'تفاصيل الفاتورة المبدئية')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label-field">{t('PINV Number', 'رقم الفاتورة المبدئية')}</label>
                  <input type="text" className="input-field" value={docNumber} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Seller', 'البائع')}</label>
                    <input type="text" className="input-field" value={currentCompany.nameEn} readOnly />
                  </div>
                  <div>
                    <label className="label-field">{t('Buyer', 'المشتري')}</label>
                    <input type="text" className="input-field" value={customer.name} readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Incoterm', 'شرطة التجارة')}</label>
                    <select className="select-field" value={incoterm} onChange={e => setIncoterm(e.target.value)}>
                      <option>FOB</option><option>CIF</option><option>EXW</option><option>CFR</option><option>DDP</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field">{t('Port of Delivery', 'ميناء التسليم')}</label>
                    <input type="text" className="input-field" value={portOfDischarge} onChange={e => setPortOfDischarge(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('Validity', 'الصلاحية')}</label>
                  <input type="text" className="input-field" value="30 days from date of issue" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Subtotal', 'المجموع الفرعي')}</span>
                    <span className="font-medium">{subtotal.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('VAT', 'الضريبة')} ({vatRate}%)</span>
                    <span className="font-medium">{vatAmount.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span>{t('Total', 'المجموع')}</span>
                    <span className="text-brand-700">{total.toLocaleString()} SAR</span>
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('Payment Terms', 'شروط الدفع')}</label>
                  <input type="text" className="input-field" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">{t('Currency', 'العملة')}</label>
                  <select className="select-field" value={items[0]?.currency || 'SAR'}>
                    <option>SAR</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
                {/* Bank Details */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('Bank Details', 'التفاصيل المصرفية')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">{t('Bank', 'البنك')}</span><input type="text" className="input-field w-48 text-xs py-1" value={bankName} onChange={e => setBankName(e.target.value)} /></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t('Account Name', 'اسم الحساب')}</span><input type="text" className="input-field w-48 text-xs py-1" value={accountName} onChange={e => setAccountName(e.target.value)} /></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t('IBAN', 'آيبان')}</span><input type="text" className="input-field w-48 text-xs py-1" value={iban} onChange={e => setIban(e.target.value)} /></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t('SWIFT', 'سويلفت')}</span><input type="text" className="input-field w-48 text-xs py-1" value={swift} onChange={e => setSwift(e.target.value)} /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="label-field">{t('Packing', 'التعبئة')}</label>
              <input type="text" className="input-field" value={packing} onChange={e => setPacking(e.target.value)} />
            </div>
            <div className="mt-4">
              <label className="label-field">{t('Notes', 'ملاحظات')}</label>
              <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </>
      )

      /* ── TAX INVOICE ────────────────────────────────── */
      case 'TINV': return (
        <>
          {renderItemsTable()}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">{t('Tax Invoice Details', 'تفاصيل الفاتورة الضريبية')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label-field">{t('TINV Number', 'رقم الفاتورة الضريبية')}</label>
                  <input type="text" className="input-field" value={docNumber} readOnly />
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('Seller Tax Details', 'البيانات الضريبية للبائع')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">{t('Company', 'الشركة')}</span><span className="font-medium">{currentCompany.nameEn}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">VAT #</span><span className="font-medium">{sellerVat}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">CR #</span><span className="font-medium">{currentCompany.crNumber}</span></div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('Buyer Details', 'بيانات المشتري')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">{t('Company', 'الشركة')}</span><span className="font-medium">{customer.name}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-500">VAT #</span><input type="text" className="input-field w-40 text-xs py-1" value={buyerVat} onChange={e => setBuyerVat(e.target.value)} /></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Subtotal (excl. VAT)', 'المجموع (بدون ضريبة)')}</span>
                    <span className="font-medium">{subtotal.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('VAT', 'الضريبة')} ({vatRate}%)</span>
                    <span className="font-medium">{vatAmount.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span>{t('Total (incl. VAT)', 'المجموع (شامل الضريبة)')}</span>
                    <span className="text-brand-700">{total.toLocaleString()} SAR</span>
                  </div>
                </div>
                {vatRate === 15 && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="w-16 h-16 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <div className="text-[6px] text-center font-mono leading-tight">
                        <div className="font-bold">QR</div>
                        <div>█████</div>
                        <div>█ █ █</div>
                        <div>█████</div>
                      </div>
                    </div>
                    <div className="text-xs text-blue-700">
                      <p className="font-semibold">{t('ZATCA QR Code', 'رمز QR الزكاة')}</p>
                      <p>{t('Required for VAT 15% invoices', 'مطلوب للفواتير الخاضعة للضريبة 15%')}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="label-field">{t('Currency', 'العملة')}</label>
                  <select className="select-field" value={items[0]?.currency || 'SAR'}>
                    <option>SAR</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </>
      )

      /* ── COMMERCIAL INVOICE ─────────────────────────── */
      case 'CINV': return (
        <>
          {renderItemsTable()}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">{t('Commercial Invoice Details', 'تفاصيل الفاتورة التجارية')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label-field">{t('CINV Number', 'رقم الفاتورة التجارية')}</label>
                  <input type="text" className="input-field" value={docNumber} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Exporter', 'المُصدِّر')}</label>
                    <input type="text" className="input-field" value={currentCompany.nameEn} readOnly />
                  </div>
                  <div>
                    <label className="label-field">{t('Buyer', 'المشتري')}</label>
                    <input type="text" className="input-field" value={customer.name} readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Origin', 'المصدر')}</label>
                    <input type="text" className="input-field" value={origin} onChange={e => setOrigin(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('HS Code', 'كود النظام المنسق')}</label>
                    <input type="text" className="input-field" value={hsCode} onChange={e => setHsCode(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Subtotal', 'المجموع الفرعي')}</span>
                    <span className="font-medium">{subtotal.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('VAT', 'الضريبة')} ({vatRate}%)</span>
                    <span className="font-medium">{vatAmount.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span>{t('Total', 'المجموع')}</span>
                    <span className="text-brand-700">{total.toLocaleString()} SAR</span>
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('Incoterm', 'شرطة التجارة')}</label>
                  <select className="select-field" value={incoterm} onChange={e => setIncoterm(e.target.value)}>
                    <option>FOB</option><option>CIF</option><option>EXW</option><option>CFR</option><option>DDP</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">{t('Payment Terms', 'شروط الدفع')}</label>
                  <input type="text" className="input-field" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </>
      )

      /* ── PACKING LIST ───────────────────────────────── */
      case 'PKL': return (
        <>
          {renderItemsTable()}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">{t('Packing List Details', 'تفاصيل قائمة التعبئة')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label-field">{t('PKL Number', 'رقم قائمة التعبئة')}</label>
                  <input type="text" className="input-field" value={docNumber} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Exporter', 'المُصدِّر')}</label>
                    <input type="text" className="input-field" value={currentCompany.nameEn} readOnly />
                  </div>
                  <div>
                    <label className="label-field">{t('Consignee', 'المستلم')}</label>
                    <input type="text" className="input-field" value={customer.name} readOnly />
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('Invoice Reference', 'مرجع الفاتورة')}</label>
                  <input type="text" className="input-field" value="PINV-2024-001" readOnly />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Total Net Weight', 'الوزن الصافي الإجمالي')}</label>
                    <input type="text" className="input-field" value={`${items.reduce((s, i) => s + i.quantity, 0)} MT`} readOnly />
                  </div>
                  <div>
                    <label className="label-field">{t('Total Gross Weight', 'الوزن الإجمالي')}</label>
                    <input type="text" className="input-field" value={`${Math.round(items.reduce((s, i) => s + i.quantity, 0) * 1.05 * 10) / 10} MT`} readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Container No', 'رقم الحاوية')}</label>
                    <input type="text" className="input-field" value={containerNo} onChange={e => setContainerNo(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('Seal No', 'رقم الختم')}</label>
                    <input type="text" className="input-field" value={sealNo} onChange={e => setSealNo(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('Total CBM', 'الحجم الإجمالي')}</label>
                  <input type="text" className="input-field" value={cbm} onChange={e => setCbm(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </>
      )

      /* ── DELIVERY NOTE ──────────────────────────────── */
      case 'DN': return (
        <>
          {renderItemsTable()}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">{t('Delivery Note Details', 'تفاصيل إشعار التسليم')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label-field">{t('DN Number', 'رقم إشعار التسليم')}</label>
                  <input type="text" className="input-field" value={docNumber} readOnly />
                </div>
                <div>
                  <label className="label-field">{t('Sender', 'المرسل')}</label>
                  <input type="text" className="input-field" value={sender} onChange={e => setSender(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">{t('Receiver', 'المستلم')}</label>
                  <input type="text" className="input-field" value={receiver} onChange={e => setReceiver(e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label-field">{t('Delivery Address', 'عنوان التسليم')}</label>
                  <textarea className="input-field" rows={2} value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">{t('Related Invoice', 'الفاتورة المرتبطة')}</label>
                  <input type="text" className="input-field" value={relatedInvoice} onChange={e => setRelatedInvoice(e.target.value)} />
                </div>
                {/* Receiver Signature */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">{t('Receiver Signature', 'توقيع المستلم')}</p>
                  <div className="h-16 border-b border-gray-200 mb-2"></div>
                  <p className="text-xs text-gray-400">{t('Date: _______________', 'التاريخ: _______________')}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )

      /* ── BILL OF LADING ─────────────────────────────── */
      case 'BL': return (
        <>
          {renderItemsTable()}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">{t('Bill of Lading Details', 'تفاصيل بوليصة الشحن')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label-field">{t('BL Number', 'رقم البوليصة')}</label>
                  <input type="text" className="input-field" value={docNumber} readOnly />
                </div>
                <div>
                  <label className="label-field">{t('Shipper', 'الشاحن')}</label>
                  <input type="text" className="input-field" value={shipper} onChange={e => setShipper(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">{t('Consignee', 'المستلم')}</label>
                  <input type="text" className="input-field" value={consignee} onChange={e => setConsignee(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">{t('Notify Party', 'الطرف المُعلَن')}</label>
                  <input type="text" className="input-field" value={notifyParty} onChange={e => setNotifyParty(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Port of Loading', 'ميناء التحميل')}</label>
                    <input type="text" className="input-field" value={portOfLoading} onChange={e => setPortOfLoading(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('Port of Discharge', 'ميناء التفريغ')}</label>
                    <input type="text" className="input-field" value={portOfDischarge} onChange={e => setPortOfDischarge(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Vessel', 'السفينة')}</label>
                    <input type="text" className="input-field" value={vesselName} onChange={e => setVesselName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('Voyage', 'الرحلة')}</label>
                    <input type="text" className="input-field" value={voyageNumber} onChange={e => setVoyageNumber(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Container Number', 'رقم الحاوية')}</label>
                    <input type="text" className="input-field" value={containerNumber} onChange={e => setContainerNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('Seal Number', 'رقم الختم')}</label>
                    <input type="text" className="input-field" value={sealNumber} onChange={e => setSealNumber(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('Place of Receipt', 'مكان الاستلام')}</label>
                  <input type="text" className="input-field" value={placeOfReceipt} onChange={e => setPlaceOfReceipt(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">{t('Description of Goods', 'وصف البضاعة')}</label>
                  <textarea className="input-field" rows={2} value={descriptionOfGoods} onChange={e => setDescriptionOfGoods(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label-field">{t('Packages', 'التعبئة')}</label>
                    <input type="text" className="input-field" value={packages} onChange={e => setPackages(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('Gross Weight', 'الوزن الإجمالي')}</label>
                    <input type="text" className="input-field" value={grossWeight} onChange={e => setGrossWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">{t('Net Weight', 'الوزن الصافي')}</label>
                    <input type="text" className="input-field" value={netWeight} onChange={e => setNetWeight(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('Freight Terms', 'شروط الشحن')}</label>
                  <select className="select-field" value={freightTerms} onChange={e => setFreightTerms(e.target.value)}>
                    <option>Freight Collect</option>
                    <option>Freight Prepaid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </>
      )

      default: return null
    }
  }

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">
              {t(
                `${id && id !== 'new' ? 'Edit' : 'Create'} ${docTypeLabels[docType].en}`,
                `${id && id !== 'new' ? 'تعديل' : 'إنشاء'} ${docTypeLabels[docType].ar}`
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {t(`Project: ${project.name}`, `المشروع: ${project.name}`)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePreview} className="btn-secondary">
            <Printer size={16} className="mr-1.5" />
            {t('Print / Preview', 'طباعة / معاينة')}
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Save size={16} className="mr-1.5" />
            {t('Save Draft', 'حفظ مسودة')}
          </button>
          {saveSuccess && (
            <span className="text-sm text-green-600 font-medium">{t('Saved!', 'تم الحفظ!')}</span>
          )}
        </div>
      </div>

      {/* Common Fields */}
      <CommonFields />

      {/* Type-Specific Fields */}
      {renderTypeFields()}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ArrowLeft size={16} className="mr-1.5" />
          {t('Back', 'رجوع')}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handlePreview} className="btn-secondary">
            <Printer size={16} className="mr-1.5" />
            {t('Print / Preview', 'طباعة / معاينة')}
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Save size={16} className="mr-1.5" />
            {t('Save Draft', 'حفظ مسودة')}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SHARED DATA CONFLICT MODAL
          ═══════════════════════════════════════════════════ */}
      {conflictOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConflictOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <button onClick={() => setConflictOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-900">
                  {t('Data Conflict Detected', 'تم اكتشاف تعارض في البيانات')}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('Quantity differs from Project Shared Data', 'الكمية تختلف عن البيانات المشتركة للمشروع')}
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-800">{t('Conflict Details', 'تفاصيل التعارض')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('Project Data:', 'بيانات المشروع:')} </span>
                  <span className="font-semibold text-brand-900">50 MT</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('Document Value:', 'قيمة المستند:')} </span>
                  <span className="font-semibold text-red-600">48 MT</span>
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                {t(
                  'This change will affect 3 linked documents in the project.',
                  'سيؤثر هذا التغيير على 3 مستندات مرتبطة في المشروع.'
                )}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConflictOpen(false)} className="btn-ghost">
                {t('Cancel', 'إلغاء')}
              </button>
              <button
                onClick={() => {
                  setConflictOpen(false)
                  alert(t('Updated document only.', 'تم تحديث المستند فقط.'))
                }}
                className="btn-secondary"
              >
                {t('Document Only', 'المستند فقط')}
              </button>
              <button
                onClick={() => setSyncModalOpen(true)}
                className="btn-primary"
              >
                <RefreshCw size={14} className="mr-1.5" />
                {t('Update Project Data', 'تحديث بيانات المشروع')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SYNC CHECKLIST MODAL
          ═══════════════════════════════════════════════════ */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSyncModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <button onClick={() => setSyncModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCw size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-900">
                  {t('Sync Affected Documents', 'مزامنة المستندات المتأثرة')}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('Select documents to update with new quantity', 'اختر المستندات لتحديثها بالكمية الجديدة')}
                </p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-6">
              {syncChecklist.map((doc, i) => (
                <label key={doc.number} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doc.checked}
                    onChange={e => {
                      const updated = [...syncChecklist]
                      updated[i] = { ...updated[i], checked: e.target.checked }
                      setSyncChecklist(updated)
                    }}
                    className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-brand-900">{doc.number}</span>
                    <span className="text-xs text-gray-500 ml-2">{doc.type}</span>
                  </div>
                  <CheckCircle size={16} className={`text-gray-300 ${doc.checked ? 'text-green-500' : ''}`} />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSyncModalOpen(false)} className="btn-ghost">
                {t('Cancel', 'إلغاء')}
              </button>
              <button
                onClick={handleSyncDocs}
                className="btn-primary"
                disabled={!syncChecklist.some(d => d.checked)}
              >
                <RefreshCw size={14} className="mr-1.5" />
                {t('Sync Selected', 'مزامنة المحدد')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
