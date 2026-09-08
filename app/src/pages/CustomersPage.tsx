import { useState, useMemo, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useData'
import type { Customer } from '../types'
import { type Customer as DbCustomer } from '../lib/data'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import ConfirmModal from '../components/common/ConfirmModal'
import Pagination from '../components/common/Pagination'
import { Users, Search, Plus, Phone, Mail, MapPin, Eye, Pencil, Trash2 } from 'lucide-react'

/** Map snake_case DB Customer → camelCase UI Customer */
function toUICustomer(c: DbCustomer): Customer {
  return {
    id: c.id,
    companyId: c.company_id,
    name: c.name,
    nameAr: c.name_ar ?? undefined,
    contactPerson: c.contact_person ?? undefined,
    phone: c.phone ?? undefined,
    phoneSecondary: c.phone_secondary ?? undefined,
    email: c.email ?? undefined,
    country: c.country ?? undefined,
    city: c.city ?? undefined,
    address: c.address ?? undefined,
    postalCode: c.postal_code ?? undefined,
    vatNumber: c.vat_number ?? undefined,
    notes: c.notes ?? undefined,
    createdAt: c.created_at,
  }
}

/** Map camelCase form data → snake_case DB partial */
function toDbUpdates(data: Partial<Customer>): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  if (data.name !== undefined) r.name = data.name
  if (data.nameAr !== undefined) r.name_ar = data.nameAr
  if (data.contactPerson !== undefined) r.contact_person = data.contactPerson
  if (data.phone !== undefined) r.phone = data.phone
  if (data.phoneSecondary !== undefined) r.phone_secondary = data.phoneSecondary
  if (data.email !== undefined) r.email = data.email
  if (data.country !== undefined) r.country = data.country
  if (data.city !== undefined) r.city = data.city
  if (data.address !== undefined) r.address = data.address
  if (data.postalCode !== undefined) r.postal_code = data.postalCode
  if (data.vatNumber !== undefined) r.vat_number = data.vatNumber
  if (data.notes !== undefined) r.notes = data.notes
  return r
}

export default function CustomersPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  // ── Supabase data hooks ──
  const { data: dbCustomers, loading, refetch } = useCustomers(currentCompany.id)
  const { create } = useCreateCustomer()
  const { update } = useUpdateCustomer()
  const { remove } = useDeleteCustomer()

  // Map DB rows to UI shape
  const customers = useMemo(() => (dbCustomers ?? []).map(toUICustomer), [dbCustomers])

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.contactPerson?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)
    )
  }, [customers, search])

  // Reset page when search changes
  useEffect(() => { setPage(1) }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE))
  const paginatedCustomers = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    customers.forEach(c => { const country = c.country || 'Unknown'; counts[country] = (counts[country] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [customers])

  const handleSave = async (data: Partial<Customer>) => {
    if (editingCustomer) {
      const updates = toDbUpdates(data)
      if (Object.keys(updates).length > 0) {
        await update(editingCustomer.id, updates as Record<string, unknown>)
      }
    } else {
      const dbData = toDbUpdates(data)
      await create(dbData as Record<string, unknown>, currentCompany.id)
    }
    refetch()
  }

  const handleDelete = async () => {
    if (deletingCustomer) {
      await remove(deletingCustomer.id)
      setDeletingCustomer(null)
      refetch()
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{t('Customers', 'العملاء')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t(`${customers.length} customers for ${currentCompany.shortName}`, `${customers.length} عميل لـ ${currentCompany.shortName}`)}</p>
        </div>
        <button onClick={() => { setEditingCustomer(null); setShowForm(true) }} className="btn-primary">
          <Plus size={16} className="ms-1.5" />{t('Add Customer', 'إضافة عميل')}
        </button>
      </div>

      {loading && (
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('Loading customers...', 'جاري تحميل العملاء...')}</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {countryCounts.map(([country, count]) => (
              <div key={country} className="card px-4 py-3 text-center">
                <p className="text-lg font-bold text-brand-700">{count}</p>
                <p className="text-xs text-gray-500 truncate">{country}</p>
              </div>
            ))}
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className="input-field ps-9" placeholder={t('Search by name, contact, phone, email, country...', 'بحث بالاسم، جهة الاتصال، الهاتف، البريد، الدولة...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="card overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="empty-state">
                <Users size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">{search ? t('No customers match your search.', 'لا توجد عملاء يطابق بحثك.') : t('No customers yet. Add your first customer.', 'لا يوجد عملاء بعد. أضف أول عميل.')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Name', 'الاسم')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Contact', 'جهة الاتصال')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Phone', 'الهاتف')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Country', 'الدولة')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">{t('Email', 'البريد')}</th>
                      <th className="text-end text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Actions', 'الإجراءات')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedCustomers.map(customer => (
                      <tr key={customer.id} className="table-row-hover">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                              {customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-brand-900 truncate">{customer.name}</p>
                              {customer.city && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{customer.city}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">{customer.contactPerson || '—'}</td>
                        <td className="px-5 py-3.5">{customer.phone ? <span className="text-sm text-gray-700 inline-flex items-center gap-1.5"><Phone size={12} className="text-gray-400" />{customer.phone}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3.5">{customer.country ? <span className="status-badge bg-brand-50 text-brand-700 border border-brand-200">{customer.country}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">{customer.email ? <span className="text-sm text-gray-700 inline-flex items-center gap-1.5"><Mail size={12} className="text-gray-400" />{customer.email}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewingCustomer(customer)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600" title={t('View', 'عرض')}><Eye size={15} /></button>
                            <button onClick={() => { setEditingCustomer(customer); setShowForm(true) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600" title={t('Edit', 'تعديل')}><Pencil size={15} /></button>
                            <button onClick={() => setDeletingCustomer(customer)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600" title={t('Delete', 'حذف')}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filteredCustomers.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-end">{t(`Showing ${Math.min(page * PAGE_SIZE, filteredCustomers.length)} of ${filteredCustomers.length} customers`, `عرض ${Math.min(page * PAGE_SIZE, filteredCustomers.length)} من ${filteredCustomers.length} عميل`)}</p>
          )}

          {/* Pagination */}
          {filteredCustomers.length > 0 && (
            <div className="mt-2">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* View Customer Detail Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingCustomer(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-brand-900">{viewingCustomer.name}</h2>
                <p className="text-sm text-gray-500">{t('Customer Details', 'تفاصيل العميل')}</p>
              </div>
              <button onClick={() => setViewingCustomer(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">{t('Contact Person', 'جهة الاتصال')}</p><p className="text-sm font-medium">{viewingCustomer.contactPerson || '—'}</p></div>
                <div><p className="text-xs text-gray-400">{t('Phone', 'الهاتف')}</p><p className="text-sm font-medium">{viewingCustomer.phone || '—'}</p></div>
                <div><p className="text-xs text-gray-400">{t('Email', 'البريد')}</p><p className="text-sm font-medium">{viewingCustomer.email || '—'}</p></div>
                <div><p className="text-xs text-gray-400">{t('Country', 'الدولة')}</p><p className="text-sm font-medium">{viewingCustomer.country || '—'}</p></div>
                <div><p className="text-xs text-gray-400">{t('City', 'المدينة')}</p><p className="text-sm font-medium">{viewingCustomer.city || '—'}</p></div>
                <div><p className="text-xs text-gray-400">{t('VAT Number', 'الرقم الضريبي')}</p><p className="text-sm font-medium">{viewingCustomer.vatNumber || '—'}</p></div>
              </div>
              {viewingCustomer.address && <div><p className="text-xs text-gray-400">{t('Address', 'العنوان')}</p><p className="text-sm font-medium">{viewingCustomer.address}</p></div>}
              {viewingCustomer.notes && <div><p className="text-xs text-gray-400">{t('Notes', 'ملاحظات')}</p><p className="text-sm text-gray-600">{viewingCustomer.notes}</p></div>}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => { setEditingCustomer(viewingCustomer); setViewingCustomer(null); setShowForm(true) }} className="btn-primary"><Pencil size={14} className="ms-1.5" />{t('Edit', 'تعديل')}</button>
            </div>
          </div>
        </div>
      )}

      <CustomerFormModal open={showForm} onClose={() => { setShowForm(false); setEditingCustomer(null) }} onSave={handleSave} customer={editingCustomer} />
      <ConfirmModal open={!!deletingCustomer} onClose={() => setDeletingCustomer(null)} onConfirm={handleDelete} title={t('Move to Trash', 'نقل إلى سلة المهملات')} message={t(`Are you sure you want to move "${deletingCustomer?.name}" to trash?`, `هل أنت متأكد من نقل "${deletingCustomer?.name}" إلى سلة المهملات؟`)} details={t('This action can be undone from the Trash module.', 'يمكن التراجع عن هذا الإجراء من وحدة سلة المهملات.')} confirmLabel={t('Move to Trash', 'نقل إلى سلة المهملات')} cancelLabel={t('Cancel', 'إلغاء')} variant="danger" />
    </div>
  )
}
