import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import Modal from '../common/Modal'
import FormSection from '../common/FormSection'
import type { Customer } from '../../types'
import { Plus, Trash2 } from 'lucide-react'

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (customer: Partial<Customer>) => void
  customer?: Customer | null
}

interface ContactEntry {
  name: string
  title: string
  email: string
  phone: string
  isPrimary: boolean
}

const EMPTY_CONTACT: ContactEntry = { name: '', title: '', email: '', phone: '', isPrimary: false }

const EMPTY_FORM = {
  name: '', nameAr: '', legalName: '', contactPerson: '', phone: '', phoneSecondary: '', email: '', website: '',
  country: '', city: '', address: '', postalCode: '', vatNumber: '', registrationNumber: '',
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
  const [contacts, setContacts] = useState<ContactEntry[]>([])
  const initialFormRef = useRef(EMPTY_FORM)
  const initialContactsRef = useRef<ContactEntry[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '', nameAr: customer.nameAr || '',
        legalName: customer.legalName || '',
        contactPerson: customer.contactPerson || '', phone: customer.phone || '',
        phoneSecondary: customer.phoneSecondary || '', email: customer.email || '',
        website: customer.website || '', country: customer.country || '', city: customer.city || '',
        address: customer.address || '', postalCode: customer.postalCode || '',
        vatNumber: customer.vatNumber || '', registrationNumber: customer.registrationNumber || '',
        defaultCurrency: customer.defaultCurrency || 'SAR',
        defaultVatTreatment: customer.defaultVatTreatment || '0',
        paymentTerms: customer.paymentTerms || 'Net 30 days',
        paymentMethodNotes: customer.paymentMethodNotes || '',
        incoterm: customer.incoterm || 'FOB',
        deliveryTerms: customer.deliveryTerms || '',
        defaultDocumentLanguage: customer.defaultDocumentLanguage || 'en',
        defaultTemplate: customer.defaultTemplate || 'template-a',
        commercialNotes: customer.commercialNotes || '',
        defaultDestCountry: customer.defaultDestCountry || '',
        defaultDestCity: customer.defaultDestCity || '',
        defaultPort: customer.defaultPort || '',
        transportResponsibility: customer.transportResponsibility || 'Seller',
        loadingResponsibility: customer.loadingResponsibility || 'Seller',
        unloadingResponsibility: customer.unloadingResponsibility || 'Buyer',
        defaultConsignee: customer.defaultConsignee || '',
        defaultNotifyParty: customer.defaultNotifyParty || '',
        packingInstructions: customer.packingInstructions || '',
        shippingNotes: customer.shippingNotes || '',
        specialHandling: customer.specialHandling || '',
        notes: customer.notes || '',
      })
      setContacts(
        (customer.contacts as ContactEntry[] | undefined)?.map(c => ({
          name: c.name || '', title: c.title || '', email: c.email || '',
          phone: c.phone || '', isPrimary: c.isPrimary || false,
        })) || []
      )
    } else {
      setForm(EMPTY_FORM)
      setContacts([])
    }
  }, [customer, open])

  // Capture initial form snapshot after form state settles (on open / customer change)
  useEffect(() => {
    initialFormRef.current = form
    initialContactsRef.current = contacts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Dirty-state tracking: compare current form to initial snapshot
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialFormRef.current) || JSON.stringify(contacts) !== JSON.stringify(initialContactsRef.current)

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

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ ...form, contacts: contacts.length > 0 ? contacts : undefined, id: customer?.id, companyId: customer?.companyId })
      onClose()
    } catch {
      // error already surfaced by caller
    } finally {
      setSaving(false)
    }
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

  const updateContact = (index: number, field: keyof ContactEntry, value: string | boolean) => {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const addContact = () => setContacts(prev => [...prev, { ...EMPTY_CONTACT, isPrimary: prev.length === 0 }])
  const removeContact = (index: number) => setContacts(prev => prev.filter((_, i) => i !== index))

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
            {field('Legal Name', 'legalName', { half: false })}
            {field('Contact Person', 'contactPerson')}
          </div>
        </FormSection>

        <FormSection title="Contacts" titleAr="جهات الاتصال المتعددة" defaultOpen={contacts.length > 0}>
          <div className="space-y-4">
            {contacts.map((contact, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('Contact', 'جهة الاتصال')} {idx + 1}
                    {contact.isPrimary && <span className="ms-2 text-brand-600 normal-case tracking-normal">({t('Primary', 'أساسي')})</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="radio"
                        name="primaryContact"
                        checked={contact.isPrimary}
                        onChange={() => setContacts(prev => prev.map((c, i) => ({ ...c, isPrimary: i === idx })))}
                        className="accent-brand-600"
                      />
                      {t('Primary', 'أساسي')}
                    </label>
                    <button type="button" onClick={() => removeContact(idx)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600" title={t('Remove contact', 'حذف جهة الاتصال')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">{t('Name', 'الاسم')} *</label>
                    <input className="input-field" value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} placeholder={t('Contact name', 'اسم جهة الاتصال')} />
                  </div>
                  <div>
                    <label className="label-field">{t('Title / Role', 'المنصب / الدور')}</label>
                    <input className="input-field" value={contact.title} onChange={e => updateContact(idx, 'title', e.target.value)} placeholder={t('e.g. Procurement Manager', 'مثال: مدير المشتريات')} />
                  </div>
                  <div>
                    <label className="label-field">{t('Email', 'البريد الإلكتروني')}</label>
                    <input type="email" className="input-field" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} placeholder={t('email@example.com', 'email@example.com')} />
                  </div>
                  <div>
                    <label className="label-field">{t('Phone', 'الهاتف')}</label>
                    <input className="input-field" value={contact.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} placeholder={t('+966 5XX XXX XXXX', '+966 5XX XXX XXXX')} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addContact} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
              <Plus size={16} /> {t('Add Contact', 'إضافة جهة اتصال')}
            </button>
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
            {field('Registration Number', 'registrationNumber', { placeholder: 'Optional' })}
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
