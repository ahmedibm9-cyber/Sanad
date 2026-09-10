import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import Modal from '../common/Modal'
import FormSection from '../common/FormSection'
import type { Material } from '../../types'
import { Upload, FileText, X } from 'lucide-react'
import { generateMaterialKey, uploadToR2 } from '../../lib/r2Client'
import { useCompany } from '../../contexts/CompanyContext'
import { appLogger } from '../../lib/logger'

interface MaterialFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (material: Partial<Material>) => void
  material?: Material | null
}

const EMPTY_FORM = {
  name: '', grade: '', manufacturer: '', origin: '', hsCode: '',
  defaultPacking: '', lastSellingPrice: '', currency: 'SAR', weightUnit: 'MT',
  tdsFileName: '', msdsFileName: '', coaFileName: '',
}

export default function MaterialFormModal({ open, onClose, onSave, material }: MaterialFormModalProps) {
  const { t } = useLanguage()
  const isEdit = !!material
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { currentCompany } = useCompany()
  
  // Store actual File objects for upload
  const tdsFileRef = useRef<File | null>(null)
  const msdsFileRef = useRef<File | null>(null)
  const coaFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (material) {
      setForm({
        name: material.name || '', grade: material.grade || '',
        manufacturer: material.manufacturer || '', origin: material.origin || '',
        hsCode: material.hsCode || '', defaultPacking: material.defaultPacking || '',
        lastSellingPrice: material.lastSellingPrice?.toString() || '',
        currency: material.currency || 'SAR', weightUnit: 'MT',
        tdsFileName: material.tdsFile || '',
        msdsFileName: material.msdsFile || '',
        coaFileName: material.coaFile || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    // Clear file refs when modal opens/closes
    tdsFileRef.current = null
    msdsFileRef.current = null
    coaFileRef.current = null
  }, [material, open])

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const companyId = currentCompany?.id || ''
      const materialId = material?.id || `temp-${Date.now()}`
      
      // Upload files to R2 if they exist
      let tdsKey = form.tdsFileName || undefined
      let msdsKey = form.msdsFileName || undefined
      let coaKey = form.coaFileName || undefined

      if (tdsFileRef.current) {
        const key = generateMaterialKey(companyId, materialId, 'tds', tdsFileRef.current.name)
        const arrayBuffer = await tdsFileRef.current.arrayBuffer()
        await uploadToR2(key, new Uint8Array(arrayBuffer), tdsFileRef.current.type, companyId)
        tdsKey = key
      }

      if (msdsFileRef.current) {
        const key = generateMaterialKey(companyId, materialId, 'msds', msdsFileRef.current.name)
        const arrayBuffer = await msdsFileRef.current.arrayBuffer()
        await uploadToR2(key, new Uint8Array(arrayBuffer), msdsFileRef.current.type, companyId)
        msdsKey = key
      }

      if (coaFileRef.current) {
        const key = generateMaterialKey(companyId, materialId, 'coa', coaFileRef.current.name)
        const arrayBuffer = await coaFileRef.current.arrayBuffer()
        await uploadToR2(key, new Uint8Array(arrayBuffer), coaFileRef.current.type, companyId)
        coaKey = key
      }

      onSave({
        ...material,
        name: form.name, grade: form.grade, manufacturer: form.manufacturer,
        origin: form.origin, hsCode: form.hsCode, defaultPacking: form.defaultPacking,
        lastSellingPrice: form.lastSellingPrice ? Number(form.lastSellingPrice) : undefined,
        currency: form.currency,
        tdsFile: tdsKey,
        msdsFile: msdsKey,
        coaFile: coaKey,
      })
    } catch (err) {
      appLogger.error('Failed to upload files', err)
    } finally {
      setSaving(false)
      onClose()
    }
  }

  const fileUpload = (label: string, fieldKey: string, fileName: string, fileRef: React.MutableRefObject<File | null>) => (
    <div>
      <label className="label-field">{label}</label>
      {fileName ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <FileText size={16} className="text-green-600" />
          <span className="text-sm text-green-700 flex-1">{fileName}</span>
          <button type="button" onClick={() => { update(fieldKey, ''); fileRef.current = null }} className="p-1 hover:bg-green-100 rounded" aria-label={t('Remove file', 'إزالة الملف')}><X size={14} className="text-green-500" /></button>
        </div>
      ) : (
        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <Upload size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500">{t('Upload file', 'رفع ملف')}</span>
          <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { update(fieldKey, f.name); fileRef.current = f } }} accept=".pdf,.doc,.docx" />
        </label>
      )}
    </div>
  )

  return (
    <Modal
      open={open} onClose={onClose} size="lg"
      title={isEdit ? t('Edit Material', 'تعديل المادة') : t('Add New Material', 'إضافة مادة جديدة')}
      subtitle={isEdit ? t('Update material information', 'تحديث معلومات المادة') : t('Add a new material to the library', 'إضافة مادة جديدة إلى المكتبة')}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={saving}>{t('Cancel', 'إلغاء')}</button>
          <button onClick={handleSave} className="btn-primary min-w-[140px]" disabled={saving}>
            {saving
              ? t('Saving...', 'جاري الحفظ...')
              : isEdit ? t('Save Changes', 'حفظ التغييرات') : t('Create Material', 'إنشاء المادة')
            }
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <FormSection title="Material Information" titleAr="معلومات المادة">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Material Name *</label>
              <input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. HDPE 952" />
            </div>
            <div>
              <label className="label-field">Grade</label>
              <input className="input-field" value={form.grade} onChange={e => update('grade', e.target.value)} placeholder="e.g. Blow Molding" />
            </div>
            <div>
              <label className="label-field">Manufacturer</label>
              <input className="input-field" value={form.manufacturer} onChange={e => update('manufacturer', e.target.value)} placeholder="e.g. SABIC" />
            </div>
            <div>
              <label className="label-field">Origin</label>
              <input className="input-field" value={form.origin} onChange={e => update('origin', e.target.value)} placeholder="e.g. Saudi Arabia" />
            </div>
            <div>
              <label className="label-field">HS Code</label>
              <input className="input-field" value={form.hsCode} onChange={e => update('hsCode', e.target.value)} placeholder="e.g. 3901.20" />
            </div>
            <div>
              <label className="label-field">Default Packing</label>
              <input className="input-field" value={form.defaultPacking} onChange={e => update('defaultPacking', e.target.value)} placeholder="e.g. 25 KG Bags" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Pricing" titleAr="التسعير">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-field">Last Selling Price</label>
              <input className="input-field" type="number" value={form.lastSellingPrice} onChange={e => update('lastSellingPrice', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label-field">Currency</label>
              <select className="select-field" value={form.currency} onChange={e => update('currency', e.target.value)}>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="label-field">Weight Unit</label>
              <select className="select-field" value={form.weightUnit} onChange={e => update('weightUnit', e.target.value)}>
                <option value="MT">MT — Metric Ton</option>
                <option value="KG">KG — Kilogram</option>
                <option value="LB">LB — Pound</option>
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Reference Files" titleAr="الملفات المرجعية" defaultOpen={false}>
          <div className="grid grid-cols-3 gap-4">
            {fileUpload('TDS (Technical Data Sheet)', 'tdsFileName', form.tdsFileName, tdsFileRef)}
            {fileUpload('MSDS (Safety Data Sheet)', 'msdsFileName', form.msdsFileName, msdsFileRef)}
            {fileUpload('COA (Certificate of Analysis)', 'coaFileName', form.coaFileName, coaFileRef)}
          </div>
        </FormSection>
      </div>
    </Modal>
  )
}
