import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCompany } from '../../contexts/CompanyContext'
import Modal from '../common/Modal'
import FormSection from '../common/FormSection'
import type { WorkItem, Customer, Material, ProjectMaterial } from '../../types'
import { useCustomers, useMaterials } from '../../hooks/useData'
import { Plus, Trash2, AlertCircle } from 'lucide-react'

interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<WorkItem>) => void
  item?: WorkItem | null
  mode: 'project' | 'task'
}

export default function ProjectFormModal({ open, onClose, onSave, item, mode }: ProjectFormModalProps) {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const isEdit = !!item
  const { data: customers } = useCustomers(currentCompany?.id)
  const { data: materials } = useMaterials(currentCompany?.id)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', customerId: '', destinationCountry: '', destinationCity: '',
    currency: 'SAR', incoterm: 'FOB', paymentTerms: 'Net 30 days', deliveryTerms: '',
    portOfLoading: '', portOfDischarge: '', vesselName: '', voyageNumber: '',
    containerNumber: '', notes: '',
  })
  const [materialLines, setMaterialLines] = useState<ProjectMaterial[]>([])
  const [customerDefaultsApplied, setCustomerDefaultsApplied] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '', customerId: item.customerId || '',
        destinationCountry: item.destinationCountry || '',
        destinationCity: item.destinationCity || '',
        currency: item.currency || 'SAR',
        incoterm: item.incoterm || 'FOB',
        paymentTerms: item.paymentTerms || 'Net 30 days',
        deliveryTerms: item.deliveryTerms || '',
        portOfLoading: item.portOfLoading || '',
        portOfDischarge: item.portOfDischarge || '',
        vesselName: item.vesselName || '',
        voyageNumber: item.voyageNumber || '',
        containerNumber: item.containerNumber || '',
        notes: item.notes || '',
      })
      setMaterialLines(item.materials || [])
    } else {
      setForm({ name: '', customerId: '', destinationCountry: '', destinationCity: '', currency: 'SAR', incoterm: 'FOB', paymentTerms: 'Net 30 days', deliveryTerms: '', portOfLoading: '', portOfDischarge: '', vesselName: '', voyageNumber: '', containerNumber: '', notes: '' })
      setMaterialLines([])
    }
    setCustomerDefaultsApplied(false)
  }, [item, open])

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleCustomerChange = (customerId: string) => {
    update('customerId', customerId)
    const customer = (customers || []).find(c => c.id === customerId)
    if (customer && !isEdit) {
      setForm(prev => ({
        ...prev,
        customerId,
        currency: 'SAR',
        incoterm: 'FOB',
        paymentTerms: 'Net 30 days',
        destinationCountry: customer.country || '',
        destinationCity: customer.city || '',
      }))
      setCustomerDefaultsApplied(true)
      setTimeout(() => setCustomerDefaultsApplied(false), 4000)
    }
  }

  const addMaterialLine = () => {
    const id = `pm-new-${Date.now()}`
    setMaterialLines(prev => [...prev, {
      id, materialId: '', materialName: '', grade: '',
      quantity: 0, weightUnit: 'MT', unitPrice: 0, currency: form.currency || 'SAR',
      packing: '', packingUnit: '', origin: '', hsCode: '',
    }])
  }

  const updateMaterialLine = (idx: number, field: string, value: any) => {
    setMaterialLines(prev => prev.map((line, i) => i === idx ? { ...line, [field]: value } : line))
  }

  const removeMaterialLine = (idx: number) => {
    setMaterialLines(prev => prev.filter((_, i) => i !== idx))
  }

  const handleMaterialSelect = (idx: number, materialId: string) => {
    const mat = (materials || []).find(m => m.id === materialId)
    if (mat) {
      setMaterialLines(prev => prev.map((line, i) => i === idx ? {
        ...line, materialId, materialName: mat.name, grade: mat.grade || '',
        unitPrice: mat.last_selling_price || 0, currency: mat.last_selling_currency || form.currency,
        packing: mat.default_packing || '', origin: mat.origin || '', hsCode: mat.hs_code || '',
      } : line))
    }
  }

  const handleSave = () => {
    setSaving(true)
    onSave({
      ...item,
      name: form.name,
      customerId: form.customerId,
      customerName: (customers || []).find(c => c.id === form.customerId)?.name,
      destinationCountry: form.destinationCountry,
      destinationCity: form.destinationCity,
      currency: form.currency,
      incoterm: form.incoterm,
      paymentTerms: form.paymentTerms,
      deliveryTerms: form.deliveryTerms,
      portOfLoading: form.portOfLoading,
      portOfDischarge: form.portOfDischarge,
      vesselName: form.vesselName,
      voyageNumber: form.voyageNumber,
      containerNumber: form.containerNumber,
      notes: form.notes,
      materials: materialLines,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} size="xl"
      title={isEdit
        ? (mode === 'project' ? t('Edit Project', 'تعديل المشروع') : t('Edit Task', 'تعديل المهمة'))
        : (mode === 'project' ? t('New Project', 'مشروع جديد') : t('New Task', 'مهمة جديدة'))
      }
      subtitle={isEdit
        ? t('Update operation details', 'تحديث تفاصيل العملية')
        : (mode === 'project' ? t('Create a new export operation', 'إنشاء عملية تصدير جديدة') : t('Create a new task', 'إنشاء مهمة جديدة'))
      }
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={saving}>{t('Cancel', 'إلغاء')}</button>
          <button onClick={handleSave} className="btn-primary min-w-[140px]" disabled={saving || !form.name || !form.customerId}>
            {saving
              ? t('Saving...', 'جاري الحفظ...')
              : isEdit ? t('Save Changes', 'حفظ التغييرات') : (mode === 'project' ? t('Create Project', 'إنشاء المشروع') : t('Create Task', 'إنشاء المهمة'))
            }
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Customer defaults notification */}
        {customerDefaultsApplied && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            <AlertCircle size={16} />
            {t('Customer defaults applied. You can modify any field.', 'تم تطبيق الإعدادات الافتراضية للعميل. يمكنك تعديل أي حقل.')}
          </div>
        )}

        <FormSection title="Basic Information" titleAr="المعلومات الأساسية">
          <div>
            <label className="label-field">{mode === 'project' ? 'Project Name' : 'Task Name'} *</label>
            <input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} placeholder={t('e.g. HDPE Shipment to Dubai', 'مثال: شحن HDPE إلى دبي')} />
          </div>
          <div>
            <label className="label-field">Customer *</label>
            <select className="select-field" value={form.customerId} onChange={e => handleCustomerChange(e.target.value)}>
              <option value="">{t('— Select Customer —', '— اختر العميل —')}</option>
              {(customers || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </FormSection>

        <FormSection title="Destination & Shipping" titleAr="الوجهة والشحن">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Destination Country</label>
              <input className="input-field" value={form.destinationCountry} onChange={e => update('destinationCountry', e.target.value)} />
            </div>
            <div>
              <label className="label-field">Destination City</label>
              <input className="input-field" value={form.destinationCity} onChange={e => update('destinationCity', e.target.value)} />
            </div>
            <div>
              <label className="label-field">Port of Loading</label>
              <input className="input-field" value={form.portOfLoading} onChange={e => update('portOfLoading', e.target.value)} />
            </div>
            <div>
              <label className="label-field">Port of Discharge</label>
              <input className="input-field" value={form.portOfDischarge} onChange={e => update('portOfDischarge', e.target.value)} />
            </div>
            <div>
              <label className="label-field">Vessel Name</label>
              <input className="input-field" value={form.vesselName} onChange={e => update('vesselName', e.target.value)} />
            </div>
            <div>
              <label className="label-field">Voyage Number</label>
              <input className="input-field" value={form.voyageNumber} onChange={e => update('voyageNumber', e.target.value)} />
            </div>
            <div>
              <label className="label-field">Container Number</label>
              <input className="input-field" value={form.containerNumber} onChange={e => update('containerNumber', e.target.value)} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Commercial Terms" titleAr="الشروط التجارية">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-field">Currency</label>
              <select className="select-field" value={form.currency} onChange={e => update('currency', e.target.value)}>
                <option value="SAR">SAR</option><option value="USD">USD</option>
                <option value="EUR">EUR</option><option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="label-field">Incoterm</label>
              <select className="select-field" value={form.incoterm} onChange={e => update('incoterm', e.target.value)}>
                <option value="FOB">FOB</option><option value="CIF">CIF</option>
                <option value="CFR">CFR</option><option value="EXW">EXW</option>
                <option value="DDP">DDP</option><option value="DAP">DAP</option>
              </select>
            </div>
            <div>
              <label className="label-field">Payment Terms</label>
              <select className="select-field" value={form.paymentTerms} onChange={e => update('paymentTerms', e.target.value)}>
                <option value="Net 30 days">Net 30 days</option>
                <option value="Net 45 days">Net 45 days</option>
                <option value="Net 60 days">Net 60 days</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="30% Advance / 70% Before Shipment">30% Advance / 70% Before Shipment</option>
                <option value="100% Advance">100% Advance</option>
                <option value="LC at Sight">LC at Sight</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Delivery Terms</label>
            <input className="input-field" value={form.deliveryTerms} onChange={e => update('deliveryTerms', e.target.value)} />
          </div>
        </FormSection>

        <FormSection title="Materials" titleAr="المواد">
          <div className="space-y-3">
            {materialLines.map((line, idx) => (
              <div key={line.id} className="p-3 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Material {idx + 1}</span>
                  <button type="button" onClick={() => removeMaterialLine(idx)} className="btn-ghost text-red-500 hover:text-red-700 p-1" aria-label={t('Remove material line', 'إزالة صندوق المادة')}><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="label-field text-xs">Material</label>
                    <select className="select-field text-sm" value={line.materialId} onChange={e => handleMaterialSelect(idx, e.target.value)}>
                      <option value="">Select...</option>
                      {(materials || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-field text-xs">Grade</label>
                    <input className="input-field text-sm" value={line.grade || ''} onChange={e => updateMaterialLine(idx, 'grade', e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field text-xs">Quantity</label>
                    <input className="input-field text-sm" type="number" value={line.quantity || ''} onChange={e => updateMaterialLine(idx, 'quantity', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="label-field text-xs">Unit Price</label>
                    <input className="input-field text-sm" type="number" value={line.unitPrice || ''} onChange={e => updateMaterialLine(idx, 'unitPrice', Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="label-field text-xs">Weight Unit</label>
                    <select className="select-field text-sm" value={line.weightUnit} onChange={e => updateMaterialLine(idx, 'weightUnit', e.target.value)}>
                      <option value="MT">MT</option><option value="KG">KG</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field text-xs">Packing</label>
                    <input className="input-field text-sm" value={line.packing || ''} onChange={e => updateMaterialLine(idx, 'packing', e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field text-xs">Origin</label>
                    <input className="input-field text-sm" value={line.origin || ''} onChange={e => updateMaterialLine(idx, 'origin', e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field text-xs">HS Code</label>
                    <input className="input-field text-sm" value={line.hsCode || ''} onChange={e => updateMaterialLine(idx, 'hsCode', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addMaterialLine} className="btn-secondary w-full">
              <Plus size={16} className="ms-1.5" />
              {t('Add Material Line', 'إضافة صنف مادة')}
            </button>
          </div>
        </FormSection>

        <FormSection title="Notes" titleAr="ملاحظات" defaultOpen={false}>
          <textarea className="input-field" rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder={t('Additional notes...', 'ملاحظات إضافية...')} />
        </FormSection>
      </div>
    </Modal>
  )
}
