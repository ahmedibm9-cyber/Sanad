import { useState, useCallback, useEffect } from 'react'
import {
  ListChecks,
  Plus,
  X,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/useLanguage'
import { useCompany } from '../contexts/useCompany'
import { useAuth } from '../contexts/useAuth'
import { getSettingsService } from '../lib/services/settings'

// ─── Inline List Manager Component ─────────────────────────
function InlineListManager({
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
}) {
  const { t } = useLanguage()

  return (
    <div className="space-y-2">
      <label className="label-field">{label}</label>
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
}

// ─── VAT Rate List Manager (with default) ─────────────────
function VatRateListManager({
  vatRates,
  setVatRates,
  defaultVatRate,
  setDefaultVatRate,
  persistAdd,
  persistRemove,
}: {
  vatRates: number[]
  setVatRates: React.Dispatch<React.SetStateAction<number[]>>
  defaultVatRate: number
  setDefaultVatRate: (v: number) => void
  persistAdd: (val: string) => void
  persistRemove: (val: string) => void
}) {
  const { t } = useLanguage()
  const [showAdd, setShowAdd] = useState(false)
  const [newRate, setNewRate] = useState('')

  const addRate = () => {
    const val = Number(newRate)
    if (!isNaN(val) && val >= 0 && val <= 100 && !vatRates.includes(val)) {
      setVatRates((prev) => [...prev, val].sort((a, b) => a - b))
      setNewRate('')
      setShowAdd(false)
      persistAdd(String(val))
    }
  }

  return (
    <div className="space-y-2">
      <label className="label-field">{t('Available VAT Rates (%)', 'نسب ضريبة القيمة المضافة المتاحة')}</label>
      <p className="text-xs text-gray-400 -mt-1">{t('Tax rates available for selection in documents', 'النسب الضريبية المتاحة للاختيار في المستندات')}</p>
      <div className="flex flex-wrap gap-2">
        {vatRates.map((rate) => (
          <div key={rate} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 group hover:border-brand-300 transition-colors">
            <span className="text-sm font-medium text-gray-700">{rate}%</span>
            {defaultVatRate === rate && (
              <span className="text-[10px] px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded font-medium">
                {t('Default', 'افتراضي')}
              </span>
            )}
            <button
              type="button"
              onClick={() => setDefaultVatRate(rate)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                defaultVatRate === rate
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-gray-400 hover:bg-brand-50 hover:text-brand-600'
              }`}
              title={t('Set as default', 'تعيين كافتراضي')}
            >
              {t('Set Default', 'افتراضي')}
            </button>
            <button
              type="button"
              onClick={() => { setVatRates((prev) => prev.filter((r) => r !== rate)); persistRemove(String(rate)) }}
              className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title={t('Remove', 'إزالة')}
              aria-label={t('Remove VAT rate', 'إزالة معدل الضريبة')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {showAdd ? (
          <div className="flex items-center gap-1.5">
            <input
              className="input-field !py-1.5 !px-2.5 text-sm w-24"
              type="number"
              min={0}
              max={100}
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder={t('Rate', 'النسبة')}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') addRate()
                if (e.key === 'Escape') { setShowAdd(false); setNewRate('') }
              }}
            />
            <span className="text-sm text-gray-500">%</span>
            <button
              type="button"
              onClick={addRate}
              className="btn-ghost !py-1.5 !px-2 text-sm text-brand-600 hover:text-brand-700"
              aria-label={t('Confirm add', 'تأكيد الإضافة')}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewRate('') }}
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
}

// ─── Page Component ──────────────────────────────────────────
export default function ConfigurableListsPage() {
  const { t } = useLanguage()
  const { currentCompany, permissions } = useCompany()
  const { user } = useAuth()
  const navigate = useNavigate()

  // ─── List states ──────────────────────────────────────────
  const [currencies, setCurrencies] = useState<string[]>(['SAR', 'USD', 'EUR', 'GBP'])
  const [vatRates, setVatRates] = useState<number[]>([0, 15])
  const [weightUnits, setWeightUnits] = useState<string[]>(['MT', 'KG', 'LB', 'TON'])
  const [packingUnits, setPackingUnits] = useState<string[]>(['Bags', 'Jumbo Bags', 'Drums', 'Containers'])
  const [paymentTermsList, setPaymentTermsList] = useState<string[]>(['Net 15 days', 'Net 30 days', 'Net 45 days', 'Net 60 days', 'Net 90 days', 'LC at Sight', 'T/T Advance'])
  const [deliveryTermsList, setDeliveryTermsList] = useState<string[]>(['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP', 'FCA'])

  // ─── New item inputs ─────────────────────────────────────
  const [newCurrency, setNewCurrency] = useState('')
  const [newWeightUnit, setNewWeightUnit] = useState('')
  const [newPackingUnit, setNewPackingUnit] = useState('')
  const [newPaymentTerm, setNewPaymentTerm] = useState('')
  const [newDeliveryTerm, setNewDeliveryTerm] = useState('')

  // ─── Show add toggles ────────────────────────────────────
  const [showAddCurrency, setShowAddCurrency] = useState(false)
  const [showAddWeightUnit, setShowAddWeightUnit] = useState(false)
  const [showAddPackingUnit, setShowAddPackingUnit] = useState(false)
  const [showAddPaymentTerm, setShowAddPaymentTerm] = useState(false)
  const [showAddDeliveryTerm, setShowAddDeliveryTerm] = useState(false)

  const [loading, setLoading] = useState(true)

  // ─── Load from DB on mount ────────────────────────────────
  useEffect(() => {
    if (!currentCompany?.id || !user) return
    const ctx = {
      userId: user.id,
      companyId: currentCompany.id,
      permissions: permissions?.permissions || {},
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
    Promise.all(
      Object.entries(listNameMap).map(([listName, setter]) =>
        settingsService.getConfigList(currentCompany.id, listName, ctx)
          .then((items) => {
            if (items.length > 0) setter(items.map((i) => i.item_value))
          })
          .catch(() => { /* keep defaults */ })
      )
    ).finally(() => setLoading(false))
  }, [currentCompany?.id, user, permissions])

  // ─── DB persistence helpers ───────────────────────────────
  const persistConfigAdd = useCallback(async (listName: string, itemValue: string) => {
    if (!currentCompany?.id || !user) return
    const ctx = { userId: user.id, companyId: currentCompany.id, permissions: permissions?.permissions || {}, isSystemAdmin: user.isSystemAdmin || false }
    try {
      await getSettingsService().addConfigListItem(currentCompany.id, listName, itemValue, false, ctx)
    } catch { /* non-critical */ }
  }, [currentCompany?.id, user, permissions])

  const persistConfigRemove = useCallback(async (listName: string, itemValue: string) => {
    if (!currentCompany?.id || !user) return
    const ctx = { userId: user.id, companyId: currentCompany.id, permissions: permissions?.permissions || {}, isSystemAdmin: user.isSystemAdmin || false }
    try {
      await getSettingsService().removeConfigListItem(currentCompany.id, listName, itemValue, ctx)
    } catch { /* non-critical */ }
  }, [currentCompany?.id, user, permissions])

  // ─── Section definitions ──────────────────────────────────
  const sections = [
    {
      id: 'currencies',
      icon: '💱',
      titleEn: 'Currencies',
      titleAr: 'العملات',
      descEn: 'Available currencies for document generation and pricing',
      descAr: 'العملات المتاحة لإنشاء المستندات والأسعار',
    },
    {
      id: 'weight-units',
      icon: '⚖️',
      titleEn: 'Weight Units',
      titleAr: 'وحدات الوزن',
      descEn: 'Weight units available for quantity specifications',
      descAr: 'وحدات الوزن المتاحة لمواصفات الكمية',
    },
    {
      id: 'packing-units',
      icon: '📦',
      titleEn: 'Packing Units',
      titleAr: 'وحدات التعبئة',
      descEn: 'Packing types available for shipment documents',
      descAr: 'أنواع التعبئة المتاحة لمستندات الشحن',
    },
    {
      id: 'payment-terms',
      icon: '💳',
      titleEn: 'Payment Terms',
      titleAr: 'شروط الدفع',
      descEn: 'Payment terms available for selection in documents',
      descAr: 'شروط الدفع المتاحة للاختيار في المستندات',
    },
    {
      id: 'delivery-terms',
      icon: '🚚',
      titleEn: 'Delivery Terms',
      titleAr: 'شروط التسليم',
      descEn: 'Incoterms available for trade document specifications',
      descAr: 'شروط التجارة المتاحة لمواصفات المستندات التجارية',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ─── Page Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label={t('Back to Settings', 'العودة للإعدادات')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-brand-600" />
            {t('Configurable Lists', 'القوائم القابلة للتكوين')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('Manage dropdown options used across documents and forms', 'إدارة خيارات القوائم المنسدلة المستخدمة في المستندات والنماذج')}
          </p>
        </div>
      </div>

      {/* ─── Currency Section ────────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{t('Currencies', 'العملات')}</h2>
          <p className="text-sm text-gray-500">{t('Currencies available for document generation and pricing', 'العملات المتاحة لإنشاء المستندات والأسعار')}</p>
        </div>
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
      </div>

      {/* ─── Weight Units Section ────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{t('Weight Units', 'وحدات الوزن')}</h2>
          <p className="text-sm text-gray-500">{t('Weight units available for quantity specifications', 'وحدات الوزن المتاحة لمواصفات الكمية')}</p>
        </div>
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
      </div>

      {/* ─── Packing Units Section ───────────────────────── */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{t('Packing Units', 'وحدات التعبئة')}</h2>
          <p className="text-sm text-gray-500">{t('Packing types available for shipment documents', 'أنواع التعبئة المتاحة لمستندات الشحن')}</p>
        </div>
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
      </div>

      {/* ─── Payment Terms Section ───────────────────────── */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{t('Payment Terms', 'شروط الدفع')}</h2>
          <p className="text-sm text-gray-500">{t('Payment terms available for selection in documents', 'شروط الدفع المتاحة للاختيار في المستندات')}</p>
        </div>
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
      </div>

      {/* ─── Delivery Terms Section ──────────────────────── */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{t('Delivery Terms', 'شروط التسليم')}</h2>
          <p className="text-sm text-gray-500">{t('Incoterms available for trade document specifications', 'شروط التجارة المتاحة لمواصفات المستندات التجارية')}</p>
        </div>
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
      </div>

      {/* ─── VAT Rates Section ───────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{t('VAT Rates', 'نسب ضريبة القيمة المضافة')}</h2>
          <p className="text-sm text-gray-500">{t('Tax rates available for selection in documents', 'النسب الضريبية المتاحة للاختيار في المستندات')}</p>
        </div>
        <VatRateListManager
          vatRates={vatRates}
          setVatRates={setVatRates}
          defaultVatRate={15}
          setDefaultVatRate={() => {}}
          persistAdd={(val) => persistConfigAdd('vat_rates', val)}
          persistRemove={(val) => persistConfigRemove('vat_rates', val)}
        />
      </div>
    </div>
  )
}
