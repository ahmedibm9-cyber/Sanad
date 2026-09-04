import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import Modal from '../common/Modal'
import FormSection from '../common/FormSection'
import type { Customer } from '../../types'

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (customer: Partial<Customer>) => void
  customer?: Customer | null
}

const EMPTY_FORM = {
  name: '', nameAr: '', contactPerson: '', phone: '', phoneSecondary: '', email: '', website: '',
  country: '', city: '', address: '', postalCode: '', vatNumber: '',
  defaultCurrency: 'SAR', defaultVatTreatment: '0', paymentTerms: 'Net 30 days',
  paymentMethodNotes: '', incoterm: 'FOB', deliveryTerms: '', defaultDocumentLanguage: 'en',
  defaultTemplate: 'template-a', commercialNotes: '',
  defaultDestCountry: '', defaultDestCity: '', defaultPort: '',
  transportResponsibility: 'Seller', loadingResponsibility: 'Seller', unloadingResponsibility: 'Buyer',
  defaultConsignee: '', defaultNotifyParty: '', packingInstructions: '', shippingNotes: '',
  specialHandling: '', notes: '',
}

export default function CustomerFormModal({ open, onClose, onSave, customer }: CustomerFormModalProps) {
  const { t } = useLanguage()
  const isEdit = !!customer
  const [form, setForm] = useState(EMPTY_FORM)
  const initialFormRef = useRef(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '', nameAr: customer.nameAr || '',
        contactPerson: customer.contactPerson || '', phone: customer.phone || '',
        phoneSecondary: customer.phoneSecondary || '', email: customer.email || '',
        website: '', country: customer.country || '', city: customer.city || '',
        address: customer.address || '', postalCode: customer.postalCode || '',
        vatNumber: customer.vatNumber || '',
        defaultCurrency: 'SAR', defaultVatTreatment: '0', paymentTerms: 'Net 30 days',
        paymentMethodNotes: '', incoterm: 'FOB', deliveryTerms: '',
        defaultDocumentLanguage: 'en', defaultTemplate: 'template-a', commercialNotes: '',
        defaultDestCountry: customer.country || '', defaultDestCity: customer.city || '',
        defaultPort: '', transportResponsibility: 'Seller', loadingResponsibility: 'Seller',
        unloadingResponsibility: 'Buyer', defaultConsignee: '', defaultNotifyParty: '',
        packingInstructions: '', shippingNotes: '', specialHandling: '',
        notes: customer.notes || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [customer, open])

  // Capture initial form snapshot after form state settles (on open / customer change)
  useEffect(() => {
    initialFormRef.current = form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Dirty-state tracking: compare current form to initial snapshot
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialFormRef.current)

  // Unsaved changes protection via native browser beforeunload
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault()
      e.returnValue = ''
    }
  }, [isDirty])

  useEffect(() => {
    if (open && isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [open, isDirty, handleBeforeUnload])

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      onSave({ ...form, id: customer?.id, companyId: customer?.companyId })
      setSaving(false)
      onClose()
    }, 500)
  }

  const field = (label: string, fieldKey: string, opts?: { type?: string; placeholder?: string; required?: boolean; half?: boolean }) => (
    <div className={opts?.half ? 'grid grid-cols-2 gap-4' : ''}>
      <label className="label-field">{label}{opts?.required && ' *'}</label>
      <input
        type={opts?.type || 'text'}
        className="input-field"
        value={(form as any)[fieldKey] || ''}
        onChange={e => update(fieldKey, e.target.value)}
        placeholder={opts?.placeholder || ''}
      />
    </div>
  )

  const select = (label: string, fieldKey: string, options: { value: string; label: string }[], required?: boolean) => (
    <div>
      <label className="label-field">{label}{required && ' *'}</label>
      <select className="select-field" value={(form as any)[fieldKey] || ''} onChange={e => update(fieldKey, e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const textarea = (label: string, fieldKey: string, rows = 3) => (
    <div>
      <label className="label-field">{label}</label>
      <textarea className="input-field" rows={rows} value={(form as any)[fieldKey] || ''} onChange={e => update(fieldKey, e.target.value)} />
    </div>
  )

  return (
    <Modal
      open={open} onClose={onClose} size="xl"
      title={isEdit ? t('Edit Customer', 'تعديل العميل') : t('Add New Customer', 'إضافة عميل جديد')}
      subtitle={isEdit ? t('Update customer information and defaults', 'تحديث معلومات العميل والإعدادات الافتراضية') : t('Create a new customer with commercial and logistics defaults', 'إنشاء عميل جديد مع الإعدادات التجارية واللوجستية')}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={saving}>{t('Cancel', 'إلغاء')}</button>
          <button onClick={handleSave} className="btn-primary min-w-[140px]" disabled={saving}>
            {saving
              ? t('Saving...', 'جاري الحفظ...')
              : isEdit ? t('Save Changes', 'حفظ التغييرات') : t('Create Customer', 'إنشاء العميل')
            }
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <FormSection title="Basic Information" titleAr="المعلومات الأساسية">
          <div className="grid grid-cols-2 gap-4">
            {field('Customer Name', 'name', { required: true })}
            {field('Arabic Name', 'nameAr')}
            {field('Legal Name', 'name', { half: false })}
            {field('Contact Person', 'contactPerson')}
          </div>
        </FormSection>

        <FormSection title="Contact" titleAr="جهات الاتصال">
          <div className="grid grid-cols-3 gap-4">
            {field('Phone', 'phone')}
            {field('Secondary Phone', 'phoneSecondary')}
            {field('Email', 'email', { type: 'email' })}
          </div>
          {field('Website', 'website')}
        </FormSection>

        <FormSection title="Address" titleAr="العنوان">
          <div className="grid grid-cols-2 gap-4">
            {select('Country', 'country', [
              { value: 'Saudi Arabia', label: 'Saudi Arabia' }, { value: 'UAE', label: 'UAE' },
              { value: 'Egypt', label: 'Egypt' }, { value: 'Kuwait', label: 'Kuwait' },
              { value: 'Bahrain', label: 'Bahrain' }, { value: 'Qatar', label: 'Qatar' },
              { value: 'Oman', label: 'Oman' }, { value: 'Jordan', label: 'Jordan' },
              { value: 'Lebanon', label: 'Lebanon' }, { value: 'Iraq', label: 'Iraq' },
              { value: 'India', label: 'India' }, { value: 'Pakistan', label: 'Pakistan' },
              { value: 'Turkey', label: 'Turkey' }, { value: 'China', label: 'China' },
              { value: 'South Korea', label: 'South Korea' }, { value: 'Singapore', label: 'Singapore' },
              { value: 'Germany', label: 'Germany' }, { value: 'Italy', label: 'Italy' },
              { value: 'France', label: 'France' }, { value: 'United Kingdom', label: 'United Kingdom' },
              { value: 'Brazil', label: 'Brazil' }, { value: 'Kenya', label: 'Kenya' },
              { value: 'Thailand', label: 'Thailand' }, { value: 'Oman', label: 'Oman' },
            ])}
            {field('City', 'city')}
          </div>
          {field('Address', 'address')}
          {field('Postal Code', 'postalCode')}
        </FormSection>

        <FormSection title="Legal / Tax" titleAr="قانوني / ضريبي">
          <div className="grid grid-cols-2 gap-4">
            {field('VAT / Tax Number', 'vatNumber')}
            {field('Registration Number', 'postalCode', { placeholder: 'Optional' })}
          </div>
        </FormSection>

        <FormSection title="Commercial Defaults" titleAr="الإعدادات التجارية الافتراضية" defaultOpen={false}>
          <div className="grid grid-cols-3 gap-4">
            {select('Default Currency', 'defaultCurrency', [
              { value: 'SAR', label: 'SAR — Saudi Riyal' }, { value: 'USD', label: 'USD — US Dollar' },
              { value: 'EUR', label: 'EUR — Euro' }, { value: 'GBP', label: 'GBP — British Pound' },
              { value: 'EGP', label: 'EGP — Egyptian Pound' }, { value: 'AED', label: 'AED — UAE Dirham' },
            ])}
            {select('Default VAT Treatment', 'defaultVatTreatment', [
              { value: '0', label: '0% — VAT Exempt' }, { value: '15', label: '15% — Standard VAT' },
              { value: 'exempt', label: 'Exempt' },
            ])}
            {select('Incoterm', 'incoterm', [
              { value: 'FOB', label: 'FOB — Free On Board' }, { value: 'CIF', label: 'CIF — Cost, Insurance & Freight' },
              { value: 'CFR', label: 'CFR — Cost & Freight' }, { value: 'EXW', label: 'EXW — Ex Works' },
              { value: 'DDP', label: 'DDP — Delivered Duty Paid' }, { value: 'DAP', label: 'DAP — Delivered At Place' },
            ])}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {select('Payment Terms', 'paymentTerms', [
              { value: 'Net 30 days', label: 'Net 30 days' }, { value: 'Net 45 days', label: 'Net 45 days' },
              { value: 'Net 60 days', label: 'Net 60 days' }, { value: 'Cash on Delivery', label: 'Cash on Delivery' },
              { value: '30% Advance / 70% Before Shipment', label: '30% Advance / 70% Before Shipment' },
              { value: '100% Advance', label: '100% Advance' }, { value: 'LC at Sight', label: 'LC at Sight' },
            ])}
            {field('Delivery Terms', 'deliveryTerms')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {select('Default Document Language', 'defaultDocumentLanguage', [
              { value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' },
            ])}
            {select('Default Document Template', 'defaultTemplate', [
              { value: 'template-a', label: 'Template A — Classic Minimal' },
              { value: 'template-b', label: 'Template B — Modern Minimal' },
            ])}
          </div>
          {textarea('Payment Method Notes', 'paymentMethodNotes', 2)}
          {textarea('Commercial Notes', 'commercialNotes', 2)}
        </FormSection>

        <FormSection title="Logistics Defaults" titleAr="الإعدادات اللوجستية الافتراضية" defaultOpen={false}>
          <div className="grid grid-cols-3 gap-4">
            {select('Default Destination Country', 'defaultDestCountry', [
              { value: '', label: '— Select —' }, { value: 'Saudi Arabia', label: 'Saudi Arabia' },
              { value: 'UAE', label: 'UAE' }, { value: 'Egypt', label: 'Egypt' },
              { value: 'India', label: 'India' }, { value: 'Turkey', label: 'Turkey' },
              { value: 'China', label: 'China' }, { value: 'Singapore', label: 'Singapore' },
              { value: 'Italy', label: 'Italy' }, { value: 'Germany', label: 'Germany' },
              { value: 'United Kingdom', label: 'United Kingdom' }, { value: 'France', label: 'France' },
              { value: 'South Korea', label: 'South Korea' }, { value: 'Pakistan', label: 'Pakistan' },
              { value: 'Thailand', label: 'Thailand' }, { value: 'Brazil', label: 'Brazil' },
              { value: 'Kenya', label: 'Kenya' }, { value: 'Morocco', label: 'Morocco' },
            ])}
            {field('Default Destination City', 'defaultDestCity')}
            {field('Default Port / Delivery Location', 'defaultPort')}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {select('Transport Responsibility', 'transportResponsibility', [
              { value: 'Seller', label: 'Seller' }, { value: 'Buyer', label: 'Buyer' }, { value: 'Third Party', label: 'Third Party' },
            ])}
            {select('Loading Responsibility', 'loadingResponsibility', [
              { value: 'Seller', label: 'Seller' }, { value: 'Buyer', label: 'Buyer' }, { value: 'Third Party', label: 'Third Party' },
            ])}
            {select('Unloading Responsibility', 'unloadingResponsibility', [
              { value: 'Seller', label: 'Seller' }, { value: 'Buyer', label: 'Buyer' }, { value: 'Third Party', label: 'Third Party' },
            ])}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Default Consignee', 'defaultConsignee')}
            {field('Default Notify Party', 'defaultNotifyParty')}
          </div>
          {textarea('Preferred Packing Instructions', 'packingInstructions', 2)}
          {textarea('Shipping / Loading Notes', 'shippingNotes', 2)}
          {textarea('Special Handling Instructions', 'specialHandling', 2)}
        </FormSection>

        <FormSection title="Notes" titleAr="ملاحظات" defaultOpen={false}>
          {textarea('General Customer Notes', 'notes', 3)}
        </FormSection>
      </div>
    </Modal>
  )
}
