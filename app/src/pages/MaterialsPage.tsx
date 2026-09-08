import { useState, useMemo, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial } from '../hooks/useData'
import type { Material } from '../types'
import { type Material as DbMaterial } from '../lib/data'
import MaterialFormModal from '../components/materials/MaterialFormModal'
import ConfirmModal from '../components/common/ConfirmModal'
import Pagination from '../components/common/Pagination'
import { Package, Search, Plus, FileText, Pencil, Trash2 } from 'lucide-react'

/** Map snake_case DB Material → camelCase UI Material */
function toUIMaterial(m: DbMaterial): Material {
  return {
    id: m.id,
    companyId: m.company_id,
    name: m.name,
    grade: m.grade ?? undefined,
    manufacturer: m.manufacturer ?? undefined,
    origin: m.origin ?? undefined,
    hsCode: m.hs_code ?? undefined,
    defaultPacking: m.default_packing ?? undefined,
    lastSellingPrice: m.last_selling_price ?? undefined,
    currency: m.last_selling_currency ?? undefined,
    createdAt: m.created_at,
  }
}

/** Map camelCase form data → snake_case DB partial */
function toDbUpdates(data: Partial<Material>): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  if (data.name !== undefined) r.name = data.name
  if (data.grade !== undefined) r.grade = data.grade
  if (data.manufacturer !== undefined) r.manufacturer = data.manufacturer
  if (data.origin !== undefined) r.origin = data.origin
  if (data.hsCode !== undefined) r.hs_code = data.hsCode
  if (data.defaultPacking !== undefined) r.default_packing = data.defaultPacking
  if (data.lastSellingPrice !== undefined) r.last_selling_price = data.lastSellingPrice
  if (data.currency !== undefined) r.last_selling_currency = data.currency
  return r
}

export default function MaterialsPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  // ── Supabase data hooks ──
  const { data: dbMaterials, loading, refetch } = useMaterials(currentCompany.id)
  const { create } = useCreateMaterial()
  const { update } = useUpdateMaterial()
  const { remove } = useDeleteMaterial()

  // Map DB rows to UI shape
  const materials = useMemo(() => (dbMaterials ?? []).map(toUIMaterial), [dbMaterials])

  const filtered = useMemo(() => {
    if (!search.trim()) return materials
    const q = search.toLowerCase()
    return materials.filter(m =>
      m.name.toLowerCase().includes(q) || m.grade?.toLowerCase().includes(q) ||
      m.manufacturer?.toLowerCase().includes(q) || m.origin?.toLowerCase().includes(q) ||
      m.hsCode?.toLowerCase().includes(q) || m.defaultPacking?.toLowerCase().includes(q)
    )
  }, [materials, search])

  // Reset page when search changes
  useEffect(() => { setPage(1) }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedMaterials = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const manufacturers = useMemo(() => new Set(materials.map(m => m.manufacturer).filter(Boolean)).size, [materials])
  const origins = useMemo(() => new Set(materials.map(m => m.origin).filter(Boolean)).size, [materials])

  const handleSave = async (data: Partial<Material>) => {
    if (editingMaterial) {
      const updates = toDbUpdates(data)
      if (Object.keys(updates).length > 0) {
        await update(editingMaterial.id, updates as Record<string, unknown>)
      }
    } else {
      const dbData = toDbUpdates(data)
      await create(dbData as Record<string, unknown>, currentCompany.id)
    }
    refetch()
  }

  const handleDelete = async () => {
    if (deletingMaterial) {
      await remove(deletingMaterial.id)
      setDeletingMaterial(null)
      refetch()
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{t('Materials Library', 'مكتبة المواد')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t(`${materials.length} materials across ${manufacturers} manufacturers from ${origins} origins`, `${materials.length} مادة من ${manufacturers} مصنّع و ${origins} أصل`)}</p>
        </div>
        <button onClick={() => { setEditingMaterial(null); setShowForm(true) }} className="btn-primary"><Plus size={16} className="ms-1.5" />{t('Add Material', 'إضافة مادة')}</button>
      </div>

      {loading && (
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('Loading materials...', 'جاري تحميل المواد...')}</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="card px-4 py-3 text-center"><Package size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-lg font-bold text-brand-700">{materials.length}</p><p className="text-xs text-gray-500">{t('Total Materials', 'إجمالي المواد')}</p></div>
            <div className="card px-4 py-3 text-center"><p className="text-lg font-bold text-brand-700">{manufacturers}</p><p className="text-xs text-gray-500">{t('Manufacturers', 'المصنّعون')}</p></div>
            <div className="card px-4 py-3 text-center"><p className="text-lg font-bold text-brand-700">{origins}</p><p className="text-xs text-gray-500">{t('Origins', 'الأصول')}</p></div>
            <div className="card px-4 py-3 text-center"><FileText size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-lg font-bold text-brand-700">{materials.filter(m => m.tdsFile).length}</p><p className="text-xs text-gray-500">{t('With TDS', 'بملف TDS')}</p></div>
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className="input-field ps-9" placeholder={t('Search materials by name, grade, manufacturer, HS code...', 'بحث بالاسم أو المستوى أو المصنّع أو كود HS...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="empty-state"><Package size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500 text-sm">{search ? t('No materials match your search.', 'لا توجد مواد تطابق بحثك.') : t('No materials yet.', 'لا توجد مواد بعد.')}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Material', 'المادة')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Grade', 'المستوى')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Manufacturer', 'المصنّع')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Origin', 'الأصل')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">{t('HS Code', 'كود HS')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">{t('Packing', 'التعبئة')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Last Price', 'آخر سعر')}</th>
                      <th className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Files', 'الملفات')}</th>
                      <th className="text-end text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('Actions', 'الإجراءات')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedMaterials.map(m => (
                      <tr key={m.id} className="table-row-hover">
                        <td className="px-5 py-3.5"><span className="text-sm font-semibold text-brand-900">{m.name}</span></td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{m.grade || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{m.manufacturer || '—'}</td>
                        <td className="px-5 py-3.5"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.origin || '—'}</span></td>
                        <td className="px-5 py-3.5 text-sm text-gray-500 font-mono hidden lg:table-cell">{m.hsCode || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-600 hidden lg:table-cell">{m.defaultPacking || '—'}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-brand-800">{m.lastSellingPrice ? `${m.currency || 'SAR'} ${m.lastSellingPrice.toLocaleString()}` : '—'}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {m.tdsFile && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">TDS</span>}
                            {m.msdsFile && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">MSDS</span>}
                            {m.coaFile && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">COA</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditingMaterial(m); setShowForm(true) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600" title={t('Edit', 'تعديل')}><Pencil size={15} /></button>
                            <button onClick={() => setDeletingMaterial(m)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600" title={t('Delete', 'حذف')}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filtered.length > 0 && <p className="text-xs text-gray-400 mt-3 text-end">{t(`Showing ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} materials`, `عرض ${Math.min(page * PAGE_SIZE, filtered.length)} من ${filtered.length} مادة`)}</p>}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="mt-2">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <MaterialFormModal open={showForm} onClose={() => { setShowForm(false); setEditingMaterial(null) }} onSave={handleSave} material={editingMaterial} />
      <ConfirmModal open={!!deletingMaterial} onClose={() => setDeletingMaterial(null)} onConfirm={handleDelete} title={t('Move to Trash', 'نقل إلى سلة المهملات')} message={t(`Are you sure you want to move "${deletingMaterial?.name}" to trash?`, `هل أنت متأكد من نقل "${deletingMaterial?.name}" إلى سلة المهملات؟`)} details={t('This action can be undone from Trash.', 'يمكن التراجع من سلة المهملات.')} confirmLabel={t('Move to Trash', 'نقل إلى سلة المهملات')} cancelLabel={t('Cancel', 'إلغاء')} variant="danger" />
    </div>
  )
}
