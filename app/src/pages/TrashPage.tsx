import { useState, useMemo } from 'react'
import { Search, RotateCcw, Trash2, X, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { trashEntries } from '../data/mockData'

export default function TrashPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()

  const [search, setSearch] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)

  const entityTypes = useMemo(() => {
    const types = new Set(trashEntries.filter(e => e.companyId === currentCompany.id).map(e => e.entityType))
    return Array.from(types).sort()
  }, [currentCompany.id])

  const filtered = useMemo(() => {
    return trashEntries
      .filter(e => e.companyId === currentCompany.id)
      .filter(e => {
        if (entityTypeFilter && e.entityType !== entityTypeFilter) return false
        if (search.trim()) {
          const q = search.toLowerCase()
          if (
            !e.entityName.toLowerCase().includes(q) &&
            !e.entityType.toLowerCase().includes(q) &&
            !e.deletedBy.toLowerCase().includes(q)
          ) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
  }, [search, entityTypeFilter, currentCompany.id])

  const handleRestore = (id: string) => {
    setConfirmRestore(id)
  }

  const confirmRestoreAction = () => {
    if (confirmRestore) {
      alert(t(
        `Item "${trashEntries.find(e => e.id === confirmRestore)?.entityName}" has been restored.`,
        `تم استعادة "${trashEntries.find(e => e.id === confirmRestore)?.entityName}".`
      ))
      setConfirmRestore(null)
    }
  }

  const entityTypeIcons: Record<string, string> = {
    project: '📋',
    task: '✅',
    document: '📄',
    customer: '👤',
    material: '📦',
    attachment: '📎',
  }

  const entityTypeBadge: Record<string, string> = {
    project: 'bg-blue-100 text-blue-800',
    task: 'bg-green-100 text-green-800',
    document: 'bg-indigo-100 text-indigo-800',
    customer: 'bg-purple-100 text-purple-800',
    material: 'bg-orange-100 text-orange-800',
    attachment: 'bg-teal-100 text-teal-800',
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('Trash', 'سلة المحذوفات')}</h1>
            <p className="text-sm text-gray-500">
              {t('Deleted items can be restored within 30 days', 'يمكن استعادة المحذوفات خلال 30 يوماً')}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="flex items-end gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('Search by name, type, or user...', 'بحث بالاسم أو النوع أو المستخدم...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div>
            <select value={entityTypeFilter} onChange={e => setEntityTypeFilter(e.target.value)} className="select-field w-44">
              <option value="">{t('All Types', 'كل الأنواع')}</option>
              {entityTypes.map(et => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="flex-shrink-0 px-6 pb-2">
        <p className="text-sm text-gray-500">
          {t(`${filtered.length} deleted item(s)`, `${filtered.length} عنصر محذوف`)}
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Entity Name', 'اسم الكيان')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Entity Type', 'نوع الكيان')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Deleted By', 'حذفه')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Deleted Date', 'تاريخ الحذف')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Actions', 'الإجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{entityTypeIcons[entry.entityType] || '📄'}</span>
                      <span className="font-medium text-gray-900">{entry.entityName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${entityTypeBadge[entry.entityType] || 'bg-gray-100 text-gray-800'}`}>
                      {entry.entityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.deletedBy}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(entry.deletedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRestore(entry.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t('Restore', 'استعادة')}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <Trash2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>{t('Trash is empty or no items match your filters.', 'السلة فارغة أو لا توجد عناصر مطابقة.')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-md mx-4 shadow-2xl">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('Confirm Restore', 'تأكيد الاستعادة')}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {t('Are you sure you want to restore this item?', 'هل أنت متأكد من استعادة هذا العنصر؟')}
              </p>
              <p className="text-sm font-medium text-gray-900 mb-4">
                "{trashEntries.find(e => e.id === confirmRestore)?.entityName}"
              </p>
              <p className="text-xs text-gray-400">
                {t(
                  'The item will be restored to its original location and will be accessible again.',
                  'سيتم استعادته إلى موقعه الأصلي وسيكون متاحاً مرة أخرى.'
                )}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setConfirmRestore(null)} className="btn-ghost">
                {t('Cancel', 'إلغاء')}
              </button>
              <button
                onClick={confirmRestoreAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t('Restore', 'استعادة')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
