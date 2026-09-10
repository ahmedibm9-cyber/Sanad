import { useState, useCallback, useEffect } from 'react'
import {
  Building2,
  Scale,
  Phone,
  Landmark,
  FileText,
  Bell,
  Database,
  Key,
  Upload,
  Camera,
  PenLine,
  Save,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Shield,
  Plus,
  X,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/common/ConfirmModal'
import Modal from '../components/common/Modal'
import { getSettingsService } from '../lib/services/settings'
import { getCompanyService } from '../lib/services/company'
import { getBackupService } from '../lib/services/backup'
import { getAuditService } from '../lib/services/audit'
import { appLogger } from '../lib/logger'

type SettingsTab = 'identity' | 'legal' | 'contact' | 'banking' | 'documents' | 'notifications' | 'backup' | 'licensing'

interface TabDef {
  id: SettingsTab
  labelEn: string
  labelAr: string
  icon: typeof Building2
}

const tabs: TabDef[] = [
  { id: 'identity', labelEn: 'Company Identity', labelAr: 'هوية الشركة', icon: Building2 },
  { id: 'legal', labelEn: 'Legal & Registration', labelAr: 'القانونية والتسجيل', icon: Scale },
  { id: 'contact', labelEn: 'Contact', labelAr: 'التواصل', icon: Phone },
  { id: 'banking', labelEn: 'Banking', labelAr: 'المصرفية', icon: Landmark },
  { id: 'documents', labelEn: 'Document Defaults', labelAr: 'الإعدادات الافتراضية', icon: FileText },
  { id: 'notifications', labelEn: 'Notifications', labelAr: 'الإشعارات', icon: Bell },
  { id: 'backup', labelEn: 'Backup', labelAr: 'النسخ الاحتياطي', icon: Database },
  { id: 'licensing', labelEn: 'Licensing', labelAr: 'التراخيص', icon: Key },
]

const NOTIFICATION_TYPES = [
  { key: 'task_assigned', en: 'Task Assigned', ar: 'تم تكليف مهمة' },
  { key: 'task_overdue', en: 'Task Overdue', ar: 'مهمة متأخرة' },
  { key: 'document_created', en: 'Document Created', ar: 'تم إنشاء مستند' },
  { key: 'document_status_change', en: 'Document Status Change', ar: 'تغيير حالة المستند' },
  { key: 'project_status', en: 'Project Status Change', ar: 'تغيير حالة المشروع' },
  { key: 'report_issue', en: 'Report Issue', ar: 'مشكلة في التقرير' },
  { key: 'attachment', en: 'Attachment Upload', ar: 'رفع مرفق' },
  { key: 'permission_change', en: 'Permission Change', ar: 'تغيير الصلاحيات' },
  { key: 'backup_success', en: 'Backup Success', ar: 'نجاح النسخ الاحتياطي' },
  { key: 'backup_failure', en: 'Backup Failure', ar: 'فشل النسخ الاحتياطي' },
  { key: 'todo_reminder', en: 'To-do Reminder', ar: 'تذكير بمهام' },
  { key: 'user_created', en: 'User Created', ar: 'تم إنشاء مستخدم' },
  { key: 'project_archived', en: 'Project Archived', ar: 'تم أرشفة المشروع' },
  { key: 'customer_created', en: 'Customer Created', ar: 'تم إنشاء عميل' },
]

interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  iban: string
  swift: string
  bankCurrency: string
}

export default function SettingsPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const { currentUser } = useApp()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity')
  const [saved, setSaved] = useState(false)

  // ─── Document Defaults: List management state ──────────────
  const [currencies, setCurrencies] = useState<string[]>(['SAR', 'USD', 'EUR', 'GBP'])
  const [vatRates, setVatRates] = useState<number[]>([0, 15])
  const [weightUnits, setWeightUnits] = useState<string[]>(['MT', 'KG', 'LB', 'TON'])
  const [packingUnits, setPackingUnits] = useState<string[]>(['Bags', 'Jumbo Bags', 'Drums', 'Containers'])
  const [paymentTermsList, setPaymentTermsList] = useState<string[]>(['Net 15 days', 'Net 30 days', 'Net 45 days', 'Net 60 days', 'Net 90 days', 'LC at Sight', 'T/T Advance'])
  const [deliveryTermsList, setDeliveryTermsList] = useState<string[]>(['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP', 'FCA'])

  const [newCurrency, setNewCurrency] = useState('')
  const [newVatRate, setNewVatRate] = useState('')
  const [newWeightUnit, setNewWeightUnit] = useState('')
  const [newPackingUnit, setNewPackingUnit] = useState('')
  const [newPaymentTerm, setNewPaymentTerm] = useState('')
  const [newDeliveryTerm, setNewDeliveryTerm] = useState('')

  const [showAddCurrency, setShowAddCurrency] = useState(false)
  const [showAddVatRate, setShowAddVatRate] = useState(false)
  const [showAddWeightUnit, setShowAddWeightUnit] = useState(false)
  const [showAddPackingUnit, setShowAddPackingUnit] = useState(false)
  const [showAddPaymentTerm, setShowAddPaymentTerm] = useState(false)
  const [showAddDeliveryTerm, setShowAddDeliveryTerm] = useState(false)
  const [defaultWeightUnit, setDefaultWeightUnit] = useState('MT')
  const [defaultPackingUnit, setDefaultPackingUnit] = useState('Bags')

  // ─── Load config lists from DB on mount ────────────────────
  useEffect(() => {
    if (!currentCompany?.id || !user) return
    const ctx = {
      userId: user.id,
      companyId: currentCompany.id,
      permissions: {},
      isSystemAdmin: user.isSystemAdmin || false,
    }
    const settingsService = getSettingsService()
    const listNameMap: Record<string, (vals: string[]) => void> = {
      currencies: setCurrencies,
      vat_rates: (vals) => setVatRates(vals.map(Number)),
      weight_units: setWeightUnits,
      packing_units: setPackingUnits,
      payment_terms: setPaymentTermsList,
      delivery_terms: setDeliveryTermsList,
    }
    Object.entries(listNameMap).forEach(([listName, setter]) => {
      settingsService.getConfigList(currentCompany.id, listName, ctx)
        .then((items) => {
          if (items.length > 0) setter(items.map((i) => i.item_value))
        })
        .catch(() => { /* keep hardcoded defaults */ })
    })
  }, [currentCompany?.id, user])

  // ─── Config list DB persistence helpers ────────────────────
  const persistConfigAdd = useCallback(async (listName: string, itemValue: string) => {
    if (!currentCompany?.id || !user) return
    const ctx = { userId: user.id, companyId: currentCompany.id, permissions: {}, isSystemAdmin: user.isSystemAdmin || false }
    try {
      await getSettingsService().addConfigListItem(currentCompany.id, listName, itemValue, false, ctx)
    } catch { /* non-critical */ }
  }, [currentCompany?.id, user])

  const persistConfigRemove = useCallback(async (listName: string, itemValue: string) => {
    if (!currentCompany?.id || !user) return
    const ctx = { userId: user.id, companyId: currentCompany.id, permissions: {}, isSystemAdmin: user.isSystemAdmin || false }
    try {
      await getSettingsService().removeConfigListItem(currentCompany.id, listName, itemValue, ctx)
    } catch { /* non-critical */ }
  }, [currentCompany?.id, user])

  // ─── Banking: Multiple accounts state ──────────────────────
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: currentCompany.bankName || '',
      accountName: currentCompany.accountName || '',
      accountNumber: currentCompany.accountNumber || '',
      iban: currentCompany.iban || '',
      swift: currentCompany.swift || '',
      bankCurrency: currentCompany.bankCurrency || 'SAR',
    },
  ])
  const [showAddBank, setShowAddBank] = useState(false)
  const [newBank, setNewBank] = useState<BankAccount>({
    id: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swift: '',
    bankCurrency: 'SAR',
  })

  // ─── Backup: Confirmations ────────────────────────────────
  const [showBackupConfirm, setShowBackupConfirm] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [backupSuccess, setBackupSuccess] = useState(false)

  // Form state — initialized from currentCompany
  const [form, setForm] = useState({
    // Identity
    nameAr: currentCompany.nameAr || '',
    nameEn: currentCompany.nameEn || '',
    legalNameAr: currentCompany.legalNameAr || '',
    legalNameEn: currentCompany.legalNameEn || '',
    shortName: currentCompany.shortName || '',
    code: currentCompany.code || '',
    // Legal
    crNumber: currentCompany.crNumber || '',
    vatNumber: currentCompany.vatNumber || '',
    taxRegistration: '',
    country: currentCompany.country || '',
    city: currentCompany.city || '',
    address: currentCompany.address || '',
    postalCode: currentCompany.postalCode || '',
    // Contact
    phone: currentCompany.phone || '',
    phoneSecondary: '',
    email: currentCompany.email || '',
    website: currentCompany.website || '',
    // Banking
    bankName: currentCompany.bankName || '',
    accountName: currentCompany.accountName || '',
    accountNumber: currentCompany.accountNumber || '',
    iban: currentCompany.iban || '',
    swift: currentCompany.swift || '',
    bankAddress: '',
    bankCurrency: currentCompany.bankCurrency || 'SAR',
    // Document defaults
    defaultLanguage: currentCompany.defaultLanguage || 'en',
    defaultTemplate: currentCompany.defaultTemplate || 'fulla-commercial-invoice-680',
    defaultVatRate: currentCompany.defaultVatRate ?? 15,
    defaultCurrency: currentCompany.defaultCurrency || 'SAR',
    defaultIncoterm: currentCompany.defaultIncoterm || 'FOB',
    defaultPaymentTerms: currentCompany.defaultPaymentTerms || 'Net 30 days',
    defaultDeliveryTerms: currentCompany.defaultDeliveryTerms || '',
    defaultPreparedBy: currentCompany.defaultPreparedBy || '',
    showSignature: currentCompany.showSignature ?? true,
    showStamp: currentCompany.showStamp ?? true,
    // Notifications
    notifications: Object.fromEntries(NOTIFICATION_TYPES.map((n) => [n.key, true])),
    // Backup
    autoBackup: true,
    backupSchedule: 'daily',
    retentionDays: 30,
    lastBackup: '2024-11-24T03:00:00Z',
  })

  const handleChange = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationToggle = (key: string) => {
    setForm((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }))
  }

  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!currentCompany?.id || !user) return
    setSaving(true)
    try {
      const ctx = {
        userId: user.id,
        companyId: currentCompany.id,
        permissions: {},
        isSystemAdmin: user.isSystemAdmin || false,
      }

      // Update basic company fields
      const companyService = getCompanyService()
      await companyService.updateCompany(currentCompany.id, {
        name_en: form.nameEn,
        name_ar: form.nameAr,
        legal_name_en: form.legalNameEn || undefined,
        legal_name_ar: form.legalNameAr || undefined,
        short_name: form.shortName,
        company_code: form.code,
      }, ctx)

      // Update settings (contact, legal, banking, document defaults, notifications)
      const settingsService = getSettingsService()
      await settingsService.updateCompanySettings(currentCompany.id, {
        phone: form.phone,
        email: form.email,
        website: form.website,
        country: form.country,
        city: form.city,
        address: form.address,
        postal_code: form.postalCode,
        vat_number: form.vatNumber,
        cr_number: form.crNumber,
        bank_name: form.bankName,
        account_name: form.accountName,
        account_number: form.accountNumber,
        iban: form.iban,
        swift: form.swift,
        bank_currency: form.bankCurrency,
        default_language: form.defaultLanguage,
        default_template: form.defaultTemplate,
        default_vat_rate: form.defaultVatRate,
        default_currency: form.defaultCurrency,
        default_incoterm: form.defaultIncoterm,
        default_payment_terms: form.defaultPaymentTerms,
        default_delivery_terms: form.defaultDeliveryTerms,
        default_prepared_by: form.defaultPreparedBy,
        show_signature: form.showSignature,
        show_stamp: form.showStamp,
        notifications: form.notifications,
      }, ctx)

      // Log audit event
      try {
        const auditService = getAuditService()
        await auditService.logEvent({
          action: 'SETTINGS_CHANGE',
          entityType: 'company',
          entityId: currentCompany.id,
          after: form,
        }, ctx)
      } catch {
        // Audit logging is non-critical
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      appLogger.error('Failed to save settings', err)
    } finally {
      setSaving(false)
    }
  }, [currentCompany?.id, user, form])

  // ─── Toggle Switch Component ──────────────────────────────
  const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-brand-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

  // ─── Upload Area Component ──────────────────────────────
  const UploadArea = ({ label, icon: Icon }: { label: string; icon: typeof Camera }) => {
    const [uploaded, setUploaded] = useState(false)
    const [fileName, setFileName] = useState('')
    return (
      <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-400 transition-colors cursor-pointer bg-gray-50 hover:bg-brand-50/30 block">
        <input type="file" className="hidden" accept="image/png,image/jpeg,image/svg+xml" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); setUploaded(true) } }} />
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-brand-100 rounded-lg">
            <Icon className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            {uploaded ? (
              <p className="text-sm font-medium text-green-600">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('Click to upload or drag and drop', 'انقر للرفع أو اسحب وأفلت')}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Upload className="w-3.5 h-3.5" />
            <span>PNG, JPG, SVG (max 2MB)</span>
          </div>
        </div>
      </label>
    )
  }

  // ─── Section Label ──────────────────────────────────────
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="label-field">{children}</label>
  )

  // ─── Inline List Manager Component ──────────────────────
  const InlineListManager = ({
    items,
    onAdd,
    onRemove,
    newItem,
    setNewItem,
    showAdd,
    setShowAdd,
    label,
    placeholder,
    itemLabel,
    description,
  }: {
    items: string[]
    onAdd: () => void
    onRemove: (item: string) => void
    newItem: string
    setNewItem: (v: string) => void
    showAdd: boolean
    setShowAdd: (v: boolean) => void
    label: string
    placeholder: string
    itemLabel?: (item: string) => string
    description?: string
  }) => (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      {description && <p className="text-xs text-gray-400 -mt-1">{description}</p>}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 group hover:border-brand-300 transition-colors">
            <span className="text-sm font-medium text-gray-700">{itemLabel ? itemLabel(item) : item}</span>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title={t('Remove', 'إزالة')}
              aria-label={t('Remove', 'إزالة')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {showAdd ? (
          <div className="flex items-center gap-1.5">
            <input
              className="input-field !py-1.5 !px-2.5 text-sm w-36"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={placeholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onAdd()
                if (e.key === 'Escape') { setShowAdd(false); setNewItem('') }
              }}
            />
            <button
              type="button"
              onClick={onAdd}
              className="btn-ghost !py-1.5 !px-2 text-sm text-brand-600 hover:text-brand-700"
              aria-label={t('Confirm add', 'تأكيد الإضافة')}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewItem('') }}
              className="btn-ghost !py-1.5 !px-2 text-sm text-gray-400 hover:text-gray-600"
              aria-label={t('Cancel', 'إلغاء')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg border border-dashed border-brand-300 hover:border-brand-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('Add', 'إضافة')}
          </button>
        )}
      </div>
    </div>
  )

  // ─── VAT Rate List Manager (with default) ───────────────
  const VatRateListManager = () => (
    <div className="space-y-2">
      <FieldLabel>{t('Available VAT Rates (%)', 'نسب ضريبة القيمة المضافة المتاحة')}</FieldLabel>
      <p className="text-xs text-gray-400 -mt-1">{t('Tax rates available for selection in documents', 'النسب الضريبية المتاحة للاختيار في المستندات')}</p>
      <div className="flex flex-wrap gap-2">
        {vatRates.map((rate) => (
          <div key={rate} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 group hover:border-brand-300 transition-colors">
            <span className="text-sm font-medium text-gray-700">{rate}%</span>
            {form.defaultVatRate === rate && (
              <span className="text-[10px] px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded font-medium">
                {t('Default', 'افتراضي')}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleChange('defaultVatRate', rate)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                form.defaultVatRate === rate
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-gray-400 hover:bg-brand-50 hover:text-brand-600'
              }`}
              title={t('Set as default', 'تعيين كافتراضي')}
            >
              {t('Set Default', 'افتراضي')}
            </button>
            <button
              type="button"
              onClick={() => { setVatRates((prev) => prev.filter((r) => r !== rate)); persistConfigRemove('vat_rates', String(rate)) }}
              className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title={t('Remove', 'إزالة')}
              aria-label={t('Remove VAT rate', 'إزالة معدل الضريبة')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {showAddVatRate ? (
          <div className="flex items-center gap-1.5">
            <input
              className="input-field !py-1.5 !px-2.5 text-sm w-24"
              type="number"
              min={0}
              max={100}
              value={newVatRate}
              onChange={(e) => setNewVatRate(e.target.value)}
              placeholder={t('Rate', 'النسبة')}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = Number(newVatRate)
                  if (!isNaN(val) && val >= 0 && val <= 100 && !vatRates.includes(val)) {
                    setVatRates((prev) => [...prev, val].sort((a, b) => a - b))
                    setNewVatRate('')
                    setShowAddVatRate(false)
                    persistConfigAdd('vat_rates', String(val))
                  }
                }
                if (e.key === 'Escape') { setShowAddVatRate(false); setNewVatRate('') }
              }}
            />
            <span className="text-sm text-gray-500">%</span>
            <button
              type="button"
              onClick={() => {
                const val = Number(newVatRate)
                if (!isNaN(val) && val >= 0 && val <= 100 && !vatRates.includes(val)) {
                  setVatRates((prev) => [...prev, val].sort((a, b) => a - b))
                  setNewVatRate('')
                  setShowAddVatRate(false)
                  persistConfigAdd('vat_rates', String(val))
                }
              }}
              className="btn-ghost !py-1.5 !px-2 text-sm text-brand-600 hover:text-brand-700"
              aria-label={t('Confirm add', 'تأكيد الإضافة')}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setShowAddVatRate(false); setNewVatRate('') }}
              className="btn-ghost !py-1.5 !px-2 text-sm text-gray-400 hover:text-gray-600"
              aria-label={t('Cancel', 'إلغاء')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddVatRate(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg border border-dashed border-brand-300 hover:border-brand-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('Add', 'إضافة')}
          </button>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // TAB CONTENT
  // ══════════════════════════════════════════════════════════

  const renderTabContent = () => {
    switch (activeTab) {
      // ─── 1. Company Identity ──────────────────────────────
      case 'identity':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-brand-900 mb-1">{t('Company Identity', 'هوية الشركة')}</h2>
              <p className="text-sm text-gray-500">{t('Basic company information and branding assets', 'المعلومات الأساسية للشركة وأصول العلامة التجارية')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>{t('Arabic Name', 'الاسم بالعربية')}</FieldLabel>
                <input className="input-field" value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('English Name', 'الاسم بالإنجليزية')}</FieldLabel>
                <input className="input-field" value={form.nameEn} onChange={(e) => handleChange('nameEn', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('Legal Name (Arabic)', 'الاسم القانوني بالعربية')}</FieldLabel>
                <input className="input-field" value={form.legalNameAr} onChange={(e) => handleChange('legalNameAr', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('Legal Name (English)', 'الاسم القانوني بالإنجليزية')}</FieldLabel>
                <input className="input-field" value={form.legalNameEn} onChange={(e) => handleChange('legalNameEn', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('Short Name', 'الاسم المختصر')}</FieldLabel>
                <input className="input-field" value={form.shortName} onChange={(e) => handleChange('shortName', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('Company Code', 'رمز الشركة')}</FieldLabel>
                <input className="input-field" value={form.code} onChange={(e) => handleChange('code', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UploadArea label={t('Company Logo', 'شعار الشركة')} icon={Camera} />
              <UploadArea label={t('Company Stamp', 'ختم الشركة')} icon={PenLine} />
              <UploadArea label={t('Authorized Signature', 'التوقيع المعتمد')} icon={PenLine} />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
              </button>
            </div>
          </div>
        )

      // ─── 2. Legal & Registration ──────────────────────────
      case 'legal':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-brand-900 mb-1">{t('Legal & Registration', 'القانونية والتسجيل')}</h2>
              <p className="text-sm text-gray-500">{t('Registration numbers, tax information, and address', 'أرقام التسجيل والمعلومات الضريبية والعنوان')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>{t('CR Number', 'رقم السجل التجاري')}</FieldLabel>
                <input className="input-field" value={form.crNumber} onChange={(e) => handleChange('crNumber', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('VAT Number', 'رقم ضريبة القيمة المضافة')}</FieldLabel>
                <input className="input-field" value={form.vatNumber} onChange={(e) => handleChange('vatNumber', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('Tax Registration', 'التسجيل الضريبي')}</FieldLabel>
                <input className="input-field" value={form.taxRegistration} onChange={(e) => handleChange('taxRegistration', e.target.value)} placeholder={t('Optional', 'اختياري')} />
              </div>
              <div>
                <FieldLabel>{t('Country', 'الدولة')}</FieldLabel>
                <input className="input-field" value={form.country} onChange={(e) => handleChange('country', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('City', 'المدينة')}</FieldLabel>
                <input className="input-field" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('Postal Code', 'الرمز البريدي')}</FieldLabel>
                <input className="input-field" value={form.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} />
              </div>
            </div>

            <div>
              <FieldLabel>{t('Address', 'العنوان')}</FieldLabel>
              <input className="input-field" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
              </button>
            </div>
          </div>
        )

      // ─── 3. Contact ──────────────────────────────────────
      case 'contact':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-brand-900 mb-1">{t('Contact Information', 'معلومات التواصل')}</h2>
              <p className="text-sm text-gray-500">{t('Phone numbers, email, and website', 'أرقام الهاتف والبريد الإلكتروني والموقع')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>{t('Primary Phone', 'الهاتف الرئيسي')}</FieldLabel>
                <input className="input-field" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('Secondary Phone', 'الهاتف الثانوي')}</FieldLabel>
                <input className="input-field" value={form.phoneSecondary} onChange={(e) => handleChange('phoneSecondary', e.target.value)} placeholder={t('Optional', 'اختياري')} />
              </div>
              <div>
                <FieldLabel>{t('Email', 'البريد الإلكتروني')}</FieldLabel>
                <input className="input-field" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div>
                <FieldLabel>{t('Website', 'الموقع الإلكتروني')}</FieldLabel>
                <input className="input-field" value={form.website} onChange={(e) => handleChange('website', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
              </button>
            </div>
          </div>
        )

      // ─── 4. Banking ──────────────────────────────────────
      case 'banking':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-900 mb-1">{t('Banking Details', 'التفاصيل المصرفية')}</h2>
                <p className="text-sm text-gray-500">{t('Bank account information for invoices and payments', 'معلومات الحساب المصرفي للفواتير والمدفوعات')}</p>
              </div>
              <button
                onClick={() => {
                  setNewBank({
                    id: Date.now().toString(),
                    bankName: '',
                    accountName: '',
                    accountNumber: '',
                    iban: '',
                    swift: '',
                    bankCurrency: 'SAR',
                  })
                  setShowAddBank(true)
                }}
                className="btn-primary gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('Add Bank Account', 'إضافة حساب بنكي')}
              </button>
            </div>

            {/* Bank Accounts List */}
            <div className="space-y-4">
              {bankAccounts.map((account, idx) => (
                <div key={account.id} className="card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">
                      {account.bankName || `${t('Account', 'حساب')} ${idx + 1}`}
                      {idx === 0 && (
                        <span className="ms-2 text-[10px] px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded font-medium">
                          {t('Primary', 'رئيسي')}
                        </span>
                      )}
                    </h4>
                    {bankAccounts.length > 1 && (
                      <button
                        onClick={() => setBankAccounts((prev) => prev.filter((a) => a.id !== account.id))}
                        className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 gap-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('Remove', 'إزالة')}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>{t('Bank Name', 'اسم البنك')}</FieldLabel>
                      <input
                        className="input-field"
                        value={account.bankName}
                        onChange={(e) => {
                          const val = e.target.value
                          setBankAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, bankName: val } : a))
                        }}
                      />
                    </div>
                    <div>
                      <FieldLabel>{t('Account Name', 'اسم الحساب')}</FieldLabel>
                      <input
                        className="input-field"
                        value={account.accountName}
                        onChange={(e) => {
                          const val = e.target.value
                          setBankAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, accountName: val } : a))
                        }}
                      />
                    </div>
                    <div>
                      <FieldLabel>{t('Account Number', 'رقم الحساب')}</FieldLabel>
                      <input
                        className="input-field"
                        value={account.accountNumber}
                        onChange={(e) => {
                          const val = e.target.value
                          setBankAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, accountNumber: val } : a))
                        }}
                      />
                    </div>
                    <div>
                      <FieldLabel>IBAN</FieldLabel>
                      <input
                        className="input-field"
                        value={account.iban}
                        onChange={(e) => {
                          const val = e.target.value
                          setBankAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, iban: val } : a))
                        }}
                      />
                    </div>
                    <div>
                      <FieldLabel>SWIFT / BIC</FieldLabel>
                      <input
                        className="input-field"
                        value={account.swift}
                        onChange={(e) => {
                          const val = e.target.value
                          setBankAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, swift: val } : a))
                        }}
                      />
                    </div>
                    <div>
                      <FieldLabel>{t('Currency', 'العملة')}</FieldLabel>
                      <select
                        className="select-field"
                        value={account.bankCurrency}
                        onChange={(e) => {
                          const val = e.target.value
                          setBankAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, bankCurrency: val } : a))
                        }}
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Bank Account Modal */}
            <Modal
              open={showAddBank}
              onClose={() => { setShowAddBank(false); setNewBank({ id: '', bankName: '', accountName: '', accountNumber: '', iban: '', swift: '', bankCurrency: 'SAR' }) }}
              title={t('Add Bank Account', 'إضافة حساب بنكي')}
              subtitle={t('Enter the details for the new bank account', 'أدخل تفاصيل الحساب البنكي الجديد')}
              footer={
                <>
                  <button onClick={() => { setShowAddBank(false); setNewBank({ id: '', bankName: '', accountName: '', accountNumber: '', iban: '', swift: '', bankCurrency: 'SAR' }) }} className="btn-secondary">
                    {t('Cancel', 'إلغاء')}
                  </button>
                  <button
                    onClick={() => {
                      if (newBank.bankName && newBank.accountNumber) {
                        setBankAccounts((prev) => [...prev, newBank])
                        setShowAddBank(false)
                        setNewBank({ id: '', bankName: '', accountName: '', accountNumber: '', iban: '', swift: '', bankCurrency: 'SAR' })
                      }
                    }}
                    className="btn-primary"
                  >
                    {t('Add Account', 'إضافة الحساب')}
                  </button>
                </>
              }
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel>{t('Bank Name', 'اسم البنك')}</FieldLabel>
                  <input className="input-field" value={newBank.bankName} onChange={(e) => setNewBank((prev) => ({ ...prev, bankName: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>{t('Account Name', 'اسم الحساب')}</FieldLabel>
                  <input className="input-field" value={newBank.accountName} onChange={(e) => setNewBank((prev) => ({ ...prev, accountName: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>{t('Account Number', 'رقم الحساب')}</FieldLabel>
                  <input className="input-field" value={newBank.accountNumber} onChange={(e) => setNewBank((prev) => ({ ...prev, accountNumber: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>IBAN</FieldLabel>
                  <input className="input-field" value={newBank.iban} onChange={(e) => setNewBank((prev) => ({ ...prev, iban: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>SWIFT / BIC</FieldLabel>
                  <input className="input-field" value={newBank.swift} onChange={(e) => setNewBank((prev) => ({ ...prev, swift: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>{t('Currency', 'العملة')}</FieldLabel>
                  <select className="select-field" value={newBank.bankCurrency} onChange={(e) => setNewBank((prev) => ({ ...prev, bankCurrency: e.target.value }))}>
                    {currencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Modal>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
              </button>
            </div>
          </div>
        )

      // ─── 5. Document Defaults ──────────────────────────────
      case 'documents':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-brand-900 mb-1">{t('Document Defaults', 'الإعدادات الافتراضية للمستندات')}</h2>
              <p className="text-sm text-gray-500">{t('Default settings applied to new documents', 'الإعدادات الافتراضية المطبقة على المستندات الجديدة')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>{t('Default Language', 'اللغة الافتراضية')}</FieldLabel>
                <select className="select-field" value={form.defaultLanguage} onChange={(e) => handleChange('defaultLanguage', e.target.value)}>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <div>
                <FieldLabel>{t('Default Template', 'القالب الافتراضي')}</FieldLabel>
                <select className="select-field" value={form.defaultTemplate} onChange={(e) => handleChange('defaultTemplate', e.target.value)}>
                  <option value="fulla-packing-list-680">{t('Packing List — Fulla', 'قائمة التعبئة — فولا')}</option>
                  <option value="fulla-quotation-680">{t('Quotation — Fulla', 'عرض أسعار — فولا')}</option>
                  <option value="fulla-tax-invoice-a-680">{t('Tax Invoice A — Fulla', 'فاتورة ضريبية أ — فولا')}</option>
                  <option value="fulla-delivery-note-680">{t('Delivery Note — Fulla', 'إشعار التسليم — فولا')}</option>
                  <option value="fulla-commercial-invoice-680">{t('Commercial Invoice — Fulla', 'فاتورة تجارية — فولا')}</option>
                  <option value="fulla-tax-invoice-b-680">{t('Tax Invoice B — Fulla', 'فاتورة ضريبية ب — فولا')}</option>
                  <option value="fulla-proforma-invoice-680">{t('Proforma Invoice — Fulla', 'فاتورة مبدئية — فولا')}</option>
                </select>
              </div>
              <div>
                <FieldLabel>{t('Default Currency', 'العملة الافتراضية')}</FieldLabel>
                <select className="select-field" value={form.defaultCurrency || 'SAR'} onChange={(e) => handleChange('defaultCurrency', e.target.value)}>
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>{t('Default Weight Unit', 'وحدة الوزن الافتراضية')}</FieldLabel>
                <select className="select-field" value={defaultWeightUnit} onChange={(e) => setDefaultWeightUnit(e.target.value)}>
                  {weightUnits.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>{t('Default Packing Unit', 'وحدة التعبئة الافتراضية')}</FieldLabel>
                <select className="select-field" value={defaultPackingUnit} onChange={(e) => setDefaultPackingUnit(e.target.value)}>
                  {packingUnits.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>{t('Default Incoterm', 'شروط التسليم الافتراضية')}</FieldLabel>
                <select className="select-field" value={form.defaultIncoterm} onChange={(e) => handleChange('defaultIncoterm', e.target.value)}>
                  {deliveryTermsList.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel>{t('Prepared By', 'أعدّه')}</FieldLabel>
              <input className="input-field" value={form.defaultPreparedBy} onChange={(e) => handleChange('defaultPreparedBy', e.target.value)} />
            </div>

            {/* Available VAT Rates - with manage */}
            <VatRateListManager />

            {/* Currencies - with manage */}
            <InlineListManager
              items={currencies}
              onAdd={() => {
                const val = newCurrency.trim().toUpperCase()
                if (val && !currencies.includes(val)) {
                  setCurrencies((prev) => [...prev, val])
                  setNewCurrency('')
                  setShowAddCurrency(false)
                  persistConfigAdd('currencies', val)
                }
              }}
              onRemove={(item) => { setCurrencies((prev) => prev.filter((c) => c !== item)); persistConfigRemove('currencies', item) }}
              newItem={newCurrency}
              setNewItem={setNewCurrency}
              showAdd={showAddCurrency}
              setShowAdd={setShowAddCurrency}
              label={t('Available Currencies', 'العملات المتاحة')}
              placeholder={t('e.g. JPY', 'مثل JPY')}
              description={t('Available currencies for document generation and pricing', 'العملات المتاحة لإنشاء المستندات والأسعار')}
            />

            {/* Weight Units - with manage */}
            <InlineListManager
              items={weightUnits}
              onAdd={() => {
                const val = newWeightUnit.trim()
                if (val && !weightUnits.includes(val)) {
                  setWeightUnits((prev) => [...prev, val])
                  setNewWeightUnit('')
                  setShowAddWeightUnit(false)
                  persistConfigAdd('weight_units', val)
                }
              }}
              onRemove={(item) => { setWeightUnits((prev) => prev.filter((u) => u !== item)); persistConfigRemove('weight_units', item) }}
              newItem={newWeightUnit}
              setNewItem={setNewWeightUnit}
              showAdd={showAddWeightUnit}
              setShowAdd={setShowAddWeightUnit}
              label={t('Available Weight Units', 'وحدات الوزن المتاحة')}
              placeholder={t('e.g. G', 'مثل G')}
              description={t('Weight units available for quantity specifications', 'وحدات الوزن المتاحة لمواصفات الكمية')}
            />

            {/* Packing Units - with manage */}
            <InlineListManager
              items={packingUnits}
              onAdd={() => {
                const val = newPackingUnit.trim()
                if (val && !packingUnits.includes(val)) {
                  setPackingUnits((prev) => [...prev, val])
                  setNewPackingUnit('')
                  setShowAddPackingUnit(false)
                  persistConfigAdd('packing_units', val)
                }
              }}
              onRemove={(item) => { setPackingUnits((prev) => prev.filter((u) => u !== item)); persistConfigRemove('packing_units', item) }}
              newItem={newPackingUnit}
              setNewItem={setNewPackingUnit}
              showAdd={showAddPackingUnit}
              setShowAdd={setShowAddPackingUnit}
              label={t('Available Packing Units', 'وحدات التعبئة المتاحة')}
              placeholder={t('e.g. Pallets', 'مثل Pallets')}
              description={t('Packing types available for shipment documents', 'أنواع التعبئة المتاحة لمستندات الشحن')}
            />

            {/* Payment Terms - with manage */}
            <InlineListManager
              items={paymentTermsList}
              onAdd={() => {
                const val = newPaymentTerm.trim()
                if (val && !paymentTermsList.includes(val)) {
                  setPaymentTermsList((prev) => [...prev, val])
                  setNewPaymentTerm('')
                  setShowAddPaymentTerm(false)
                  persistConfigAdd('payment_terms', val)
                }
              }}
              onRemove={(item) => { setPaymentTermsList((prev) => prev.filter((p) => p !== item)); persistConfigRemove('payment_terms', item) }}
              newItem={newPaymentTerm}
              setNewItem={setNewPaymentTerm}
              showAdd={showAddPaymentTerm}
              setShowAdd={setShowAddPaymentTerm}
              label={t('Available Payment Terms', 'شروط الدفع المتاحة')}
              placeholder={t('e.g. Net 120 days', 'مثل Net 120 days')}
              description={t('Payment terms available for selection in documents', 'شروط الدفع المتاحة للاختيار في المستندات')}
            />

            {/* Delivery Terms - with manage */}
            <InlineListManager
              items={deliveryTermsList}
              onAdd={() => {
                const val = newDeliveryTerm.trim()
                if (val && !deliveryTermsList.includes(val)) {
                  setDeliveryTermsList((prev) => [...prev, val])
                  setNewDeliveryTerm('')
                  setShowAddDeliveryTerm(false)
                  persistConfigAdd('delivery_terms', val)
                }
              }}
              onRemove={(item) => { setDeliveryTermsList((prev) => prev.filter((d) => d !== item)); persistConfigRemove('delivery_terms', item) }}
              newItem={newDeliveryTerm}
              setNewItem={setNewDeliveryTerm}
              showAdd={showAddDeliveryTerm}
              setShowAdd={setShowAddDeliveryTerm}
              label={t('Available Delivery Terms', 'شروط التسليم المتاحة')}
              placeholder={t('e.g. DES', 'مثل DES')}
              description={t('Incoterms available for trade document specifications', 'شروط التجارة المتاحة لمواصفات المستندات التجارية')}
            />

            {/* Signature & Stamp toggles */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">{t('Display Options', 'خيارات العرض')}</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('Show Signature on Documents', 'عرض التوقيع على المستندات')}</p>
                  <p className="text-xs text-gray-400">{t('Display authorized signature on exported documents', 'عرض التوقيع المعتمد على المستندات المصدرة')}</p>
                </div>
                <Toggle checked={form.showSignature} onChange={() => handleChange('showSignature', !form.showSignature)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('Show Stamp on Documents', 'عرض الختم على المستندات')}</p>
                  <p className="text-xs text-gray-400">{t('Display company stamp on exported documents', 'عرض ختم الشركة على المستندات المصدرة')}</p>
                </div>
                <Toggle checked={form.showStamp} onChange={() => handleChange('showStamp', !form.showStamp)} />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
              </button>
            </div>
          </div>
        )

      // ─── 6. Notifications ──────────────────────────────
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-brand-900 mb-1">{t('Notification Preferences', 'تفضيلات الإشعارات')}</h2>
              <p className="text-sm text-gray-500">{t('Choose which notifications you want to receive', 'اختر الإشعارات التي تريد تلقيها')}</p>
            </div>

            <div className="space-y-1">
              {NOTIFICATION_TYPES.map((notif) => (
                <div
                  key={notif.key}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t(notif.en, notif.ar)}</p>
                    <p className="text-xs text-gray-400">{notif.key.replace(/_/g, '.')}</p>
                  </div>
                  <Toggle
                    checked={form.notifications[notif.key] ?? true}
                    onChange={() => handleNotificationToggle(notif.key)}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
              </button>
            </div>
          </div>
        )

      // ─── 7. Backup ──────────────────────────────────────
      case 'backup':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-brand-900 mb-1">{t('Backup & Restore', 'النسخ الاحتياطي والاستعادة')}</h2>
              <p className="text-sm text-gray-500">{t('Configure automatic backups and data recovery', 'تكوين النسخ الاحتياطي التلقائي واستعادة البيانات')}</p>
            </div>

            {/* Auto backup toggle */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('Automatic Backup', 'النسخ الاحتياطي التلقائي')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('Enable scheduled automatic backups', 'تفعيل النسخ الاحتياطي التلقائي المجدول')}</p>
                </div>
                <Toggle checked={form.autoBackup} onChange={() => handleChange('autoBackup', !form.autoBackup)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>{t('Backup Schedule', 'جدولة النسخ الاحتياطي')}</FieldLabel>
                <select className="select-field" value={form.backupSchedule} onChange={(e) => handleChange('backupSchedule', e.target.value)}>
                  <option value="hourly">{t('Every Hour', 'كل ساعة')}</option>
                  <option value="daily">{t('Daily', 'يومياً')}</option>
                  <option value="weekly">{t('Weekly', 'أسبوعياً')}</option>
                  <option value="monthly">{t('Monthly', 'شهرياً')}</option>
                </select>
              </div>
              <div>
                <FieldLabel>{t('Retention (days)', 'مدة الاحتفاظ (أيام)')}</FieldLabel>
                <input className="input-field" type="number" min={7} max={365} value={form.retentionDays} onChange={(e) => handleChange('retentionDays', Number(e.target.value))} />
              </div>
            </div>

            {/* Last backup */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">{t('Last Backup', 'آخر نسخ احتياطي')}</p>
                <p className="text-xs text-emerald-600">
                  {new Date(form.lastBackup).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Backup success banner */}
            {backupSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">{t('Backup Completed Successfully', 'تم النسخ الاحتياطي بنجاح')}</p>
                  <p className="text-xs text-emerald-600">
                    {t('Your data has been backed up.', 'تم نسخ بياناتك احتياطياً.')}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                className="btn-primary gap-2"
                onClick={() => setShowBackupConfirm(true)}
              >
                <Download className="w-4 h-4" />
                {t('Manual Backup', 'نسخ احتياطي يدوي')}
              </button>
              <button
                className="btn-secondary gap-2"
                onClick={() => setShowRestoreConfirm(true)}
              >
                <RotateCcw className="w-4 h-4" />
                {t('Restore from Backup', 'استعادة من نسخة احتياطية')}
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
              </button>
            </div>

            {/* Backup Confirmation Modal */}
            <ConfirmModal
              open={showBackupConfirm}
              onClose={() => setShowBackupConfirm(false)}
              onConfirm={async () => {
                setShowBackupConfirm(false)
                if (!currentCompany?.id || !user) return
                try {
                  const backupService = getBackupService()
                  const ctx = {
                    userId: user.id,
                    companyId: currentCompany.id,
                    permissions: {},
                    isSystemAdmin: user.isSystemAdmin || false,
                  }
                  await backupService.createManualBackup(ctx)
                  setBackupSuccess(true)
                  setForm((prev) => ({ ...prev, lastBackup: new Date().toISOString() }))
                  setTimeout(() => setBackupSuccess(false), 5000)
                } catch (err) {
                  appLogger.error('Backup failed', err)
                }
              }}
              title={t('Create Manual Backup?', 'إنشاء نسخة احتياطية يدوية؟')}
              message={t(
                'This will create an immediate backup of all your company data including documents, settings, and user data.',
                'سيتم إنشاء نسخة احتياطية فورية لجميع بيانات شركتك بما في ذلك المستندات والإعدادات وبيانات المستخدم.'
              )}
              details={t(
                'The backup will be stored securely and can be used to restore your data at any time.',
                'سيتم تخزين النسخة الاحتياطية بشكل آمن ويمكن استخدامها لاستعادة بياناتك في أي وقت.'
              )}
              confirmLabel={t('Start Backup', 'بدء النسخ الاحتياطي')}
              cancelLabel={t('Cancel', 'إلغاء')}
              variant="info"
            />

            {/* Restore Confirmation Modal - DANGEROUS */}
            <ConfirmModal
              open={showRestoreConfirm}
              onClose={() => setShowRestoreConfirm(false)}
              onConfirm={() => {
                setShowRestoreConfirm(false)
              }}
              title={t('Restore from Backup?', 'الاستعادة من نسخة احتياطية؟')}
              message={t(
                'WARNING: This will overwrite all current data with the backup. This action cannot be undone.',
                'تحذير: سيتم الكتابة فوق جميع البيانات الحالية بالنسخة الاحتياطية. لا يمكن التراجع عن هذا الإجراء.'
              )}
              details={t(
                'Make sure you have a recent backup of your current data before proceeding. All unsaved changes will be lost.',
                'تأكد من وجود نسخة احتياطية حديثة لبياناتك الحالية قبل المتابعة. ستفقد جميع التغييرات غير المحفوظة.'
              )}
              confirmLabel={t('Restore Data', 'استعادة البيانات')}
              cancelLabel={t('Cancel', 'إلغاء')}
              variant="danger"
            />
          </div>
        )

      // ─── 8. Licensing ──────────────────────────────
      case 'licensing':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-brand-900 mb-1">{t('Licensing & Subscription', 'التراخيص والاشتراك')}</h2>
              <p className="text-sm text-gray-500">{t('License status and key management', 'حالة الترخيص وإدارة المفاتيح')}</p>
            </div>

            {/* License Status */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-lg">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-emerald-800">{t('License Status', 'حالة الترخيص')}</p>
                    <span className="status-badge bg-emerald-100 text-emerald-700">{t('Active', 'نشط')}</span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">
                    {t('Enterprise Plan — Valid until December 31, 2025', 'خطة المؤسسات — صالحة حتى 31 ديسمبر 2025')}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-emerald-500">{t('Users', 'المستخدمون')}</p>
                      <p className="font-semibold text-emerald-800">4 / 25</p>
                    </div>
                    <div>
                      <p className="text-emerald-500">{t('Companies', 'الشركات')}</p>
                      <p className="font-semibold text-emerald-800">3 / 10</p>
                    </div>
                    <div>
                      <p className="text-emerald-500">{t('Storage', 'التخزين')}</p>
                      <p className="font-semibold text-emerald-800">2.4 GB / 50 GB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* License Key */}
            <div className="card p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('License Key', 'مفتاح الترخيص')}</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-600 tracking-wider">
                  SANAD-ENT-****-****-****-7K2M
                </div>
                <button onClick={() => { navigator.clipboard.writeText('SANAD-ENT-****-****-****-7K2M') }} className="btn-ghost text-xs">
                  {t('Copy', 'نسخ')}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">{t('Issued: January 1, 2024 — Owner: Mohamed Al-Hassan', 'صدر: 1 يناير 2024 — المالك: محمد الحسن')}</p>
            </div>

            {/* Upgrade notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">{t('Renewal Reminder', 'تذكير بالتجديد')}</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {t(
                    'Your license will expire in 365 days. Renew early to avoid service interruption.',
                    'سينتهي ترخيصك خلال 365 يومًا. جدد مبكرًا لتجنب انقطاع الخدمة.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التغييرات')}
              </button>
            </div>
          </div>
        )
    }
  }

  // ══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{t('Settings', 'الإعدادات')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t(`Manage settings for ${currentCompany.nameEn}`, `إدارة إعدادات ${currentCompany.nameEn}`)}
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {t('Saved!', 'تم الحفظ!')}
          </div>
        )}
      </div>

      <div className="flex gap-6 min-h-[600px]">
        {/* ─── Left Sidebar Tabs ────────────────────────── */}
        <div className="w-56 flex-shrink-0">
          <nav className="card p-2 space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-start ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                  <span className="truncate">{t(tab.labelEn, tab.labelAr)}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* ─── Right Content Area ────────────────────────── */}
        <div className="flex-1 card p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
