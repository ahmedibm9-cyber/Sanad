import { Fragment, useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, Clock, User, FileText, Edit3, Trash2, Archive, Download, Upload, RotateCcw, Shield, Database, Key } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { activityLog } from '../data/mockData'

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <FileText className="w-4 h-4 text-green-600" />,
  EDIT: <Edit3 className="w-4 h-4 text-blue-600" />,
  DELETE: <Trash2 className="w-4 h-4 text-red-600" />,
  ARCHIVE: <Archive className="w-4 h-4 text-gray-500" />,
  MOVE_TO_TRASH: <Trash2 className="w-4 h-4 text-red-600" />,
  DOWNLOAD: <Download className="w-4 h-4 text-indigo-600" />,
  PDF_DOWNLOAD: <Download className="w-4 h-4 text-indigo-600" />,
  UPLOAD: <Upload className="w-4 h-4 text-teal-600" />,
  RESTORE: <RotateCcw className="w-4 h-4 text-emerald-600" />,
  PERMISSION_CHANGE: <Key className="w-4 h-4 text-purple-600" />,
  FACTORY_IMPORT: <Database className="w-4 h-4 text-orange-600" />,
  BACKUP: <Database className="w-4 h-4 text-gray-600" />,
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  EDIT: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  ARCHIVE: 'bg-gray-100 text-gray-800',
  MOVE_TO_TRASH: 'bg-red-100 text-red-800',
  DOWNLOAD: 'bg-indigo-100 text-indigo-800',
  PDF_DOWNLOAD: 'bg-indigo-100 text-indigo-800',
  UPLOAD: 'bg-teal-100 text-teal-800',
  RESTORE: 'bg-emerald-100 text-emerald-800',
  PERMISSION_CHANGE: 'bg-purple-100 text-purple-800',
  FACTORY_IMPORT: 'bg-orange-100 text-orange-800',
  BACKUP: 'bg-gray-100 text-gray-800',
}

export default function ActivityPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()

  const [userSearch, setUserSearch] = useState('')
  const [entitySearch, setEntitySearch] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const entityTypes = useMemo(() => {
    const types = new Set(activityLog.map(a => a.entityType))
    return Array.from(types).sort()
  }, [])

  const actionTypes = useMemo(() => {
    const actions = new Set(activityLog.map(a => a.action))
    return Array.from(actions).sort()
  }, [])

  const filtered = useMemo(() => {
    return activityLog.filter(entry => {
      if (entry.companyId !== currentCompany.id) return false

      if (userSearch.trim()) {
        const q = userSearch.toLowerCase()
        if (!entry.userName.toLowerCase().includes(q)) return false
      }

      if (entitySearch.trim()) {
        const q = entitySearch.toLowerCase()
        if (
          !(entry.entityRef || '').toLowerCase().includes(q) &&
          !entry.entityId.toLowerCase().includes(q)
        ) return false
      }

      if (entityTypeFilter && entry.entityType !== entityTypeFilter) return false
      if (actionFilter && entry.action !== actionFilter) return false

      if (dateFrom) {
        const entryDate = entry.timestamp.substring(0, 10)
        if (entryDate < dateFrom) return false
      }
      if (dateTo) {
        const entryDate = entry.timestamp.substring(0, 10)
        if (entryDate > dateTo) return false
      }

      return true
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [userSearch, entitySearch, entityTypeFilter, actionFilter, dateFrom, dateTo, currentCompany.id])

  const toggleExpand = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('Activity Log', 'سجل النشاط')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('Track all user actions and system events', 'تتبع جميع إجراءات المستخدمين والأحداث')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="card p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="relative">
              <label className="label-field">{t('User Search', 'بحث المستخدم')}</label>
              <Search className="absolute left-3 top-8 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('User name...', 'اسم المستخدم...')}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <div className="relative">
              <label className="label-field">{t('Document / Entity', 'المستند / الكيان')}</label>
              <Search className="absolute left-3 top-8 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('Reference...', 'المرجع...')}
                value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <div>
              <label className="label-field">{t('Entity Type', 'نوع الكيان')}</label>
              <select value={entityTypeFilter} onChange={e => setEntityTypeFilter(e.target.value)} className="select-field">
                <option value="">{t('All Types', 'كل الأنواع')}</option>
                {entityTypes.map(et => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">{t('Action', 'الإجراء')}</label>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="select-field">
                <option value="">{t('All Actions', 'كل الإجراءات')}</option>
                {actionTypes.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">{t('From Date', 'من تاريخ')}</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">{t('To Date', 'إلى تاريخ')}</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex-shrink-0 px-6 pb-2">
        <p className="text-sm text-gray-500">
          {t(`${filtered.length} activity entries`, `${filtered.length} سجل نشاط`)}
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Timestamp', 'الوقت')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('User', 'المستخدم')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Action', 'الإجراء')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Entity', 'الكيان')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('Reference', 'المرجع')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => {
                const isExpanded = expandedRow === entry.id
                const hasBeforeAfter = entry.action === 'EDIT' && entry.before && entry.after
                const entityColors: Record<string, string> = {
                  project: 'bg-blue-50 text-blue-700',
                  document: 'bg-indigo-50 text-indigo-700',
                  attachment: 'bg-teal-50 text-teal-700',
                  report_issue: 'bg-amber-50 text-amber-700',
                  settings: 'bg-gray-50 text-gray-700',
                  user: 'bg-purple-50 text-purple-700',
                  factory_code: 'bg-orange-50 text-orange-700',
                  backup: 'bg-gray-50 text-gray-700',
                }

                return (
                  <Fragment key={entry.id}>
                    <tr
                      className={`border-b border-gray-100 transition-colors ${
                        hasBeforeAfter ? 'cursor-pointer hover:bg-gray-50' : ''
                      }`}
                      onClick={hasBeforeAfter ? () => toggleExpand(entry.id) : undefined}
                    >
                      <td className="px-4 py-3">
                        {hasBeforeAfter && (
                          <button className="p-0.5">
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 text-gray-400" />
                              : <ChevronRight className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {entry.userName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <span className="font-medium text-gray-900">{entry.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${actionColors[entry.action] || 'bg-gray-100 text-gray-800'}`}>
                          <span className="mr-1">{actionIcons[entry.action]}</span>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${entityColors[entry.entityType] || 'bg-gray-50 text-gray-700'}`}>
                          {entry.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{entry.entityRef || entry.entityId}</td>
                    </tr>
                    {isExpanded && hasBeforeAfter && (
                      <tr className="bg-gray-50/80">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {t('Before / After Comparison', 'مقارنة قبل / بعد')}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg border border-red-200 bg-red-50/50">
                              <div className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                {t('Before', 'قبل')}
                              </div>
                              <div className="space-y-1">
                                {Object.entries(entry.before!).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="font-mono text-gray-600 font-medium">{key}:</span>
                                    <span className="text-red-700">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 rounded-lg border border-green-200 bg-green-50/50">
                              <div className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                {t('After', 'بعد')}
                              </div>
                              <div className="space-y-1">
                                {Object.entries(entry.after!).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="font-mono text-gray-600 font-medium">{key}:</span>
                                    <span className="text-green-700">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {t('No activity entries match your filters.', 'لا توجد سجلات مطابقة لمرشّحاتك.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

