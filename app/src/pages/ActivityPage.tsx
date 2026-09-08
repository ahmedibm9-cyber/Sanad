import { Fragment, useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, Clock, User, FileText, Edit3, Trash2, Archive, Download, Upload, RotateCcw, Shield, Database, Key, ArrowRight, ChevronDown as ChevronDownSmall } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useAuditEvents } from '../hooks/useData'
import type { AuditEvent } from '../lib/data'

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

  const { data: auditEvents = [], loading } = useAuditEvents(currentCompany.id)

  // Map Supabase AuditEvent to local ActivityLogEntry shape
  const activityLog = useMemo(() => {
    return (auditEvents ?? []).map((e: AuditEvent) => ({
      id: e.id,
      userId: e.actor_user_id,
      userName: e.actor_user_id, // No name field in AuditEvent; display user ID
      companyId: e.company_id ?? '',
      action: e.action,
      entityType: e.entity_type,
      entityId: e.entity_id ?? '',
      entityRef: e.entity_reference ?? undefined,
      before: e.before_json ?? undefined,
      after: e.after_json ?? undefined,
      timestamp: e.created_at,
    }))
  }, [auditEvents])

  const [userSearch, setUserSearch] = useState('')
  const [entitySearch, setEntitySearch] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showRawDiff, setShowRawDiff] = useState<string | null>(null)

  // Format a camelCase or snake_case field name into a readable label
  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')       // camelCase → "Camel Case"
      .replace(/_/g, ' ')                 // snake_case → "snake case"
      .replace(/^\w/, c => c.toUpperCase()) // capitalize first letter
      .trim()
  }

  // Compute field-level diffs between before and after objects
  const computeDiffs = (before: Record<string, unknown>, after: Record<string, unknown>): Array<{ field: string; oldValue: string; newValue: string; onlyIn?: 'before' | 'after' }> => {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
    const diffs: Array<{ field: string; oldValue: string; newValue: string; onlyIn?: 'before' | 'after' }> = []
    for (const key of allKeys) {
      const oldVal = before[key]
      const newVal = after[key]
      const oldStr = oldVal === undefined ? '—' : String(oldVal)
      const newStr = newVal === undefined ? '—' : String(newVal)
      if (oldStr !== newStr) {
        diffs.push({
          field: formatFieldLabel(key),
          oldValue: oldStr,
          newValue: newStr,
          onlyIn: oldVal === undefined ? 'after' : newVal === undefined ? 'before' : undefined,
        })
      }
    }
    return diffs
  }

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
          {loading
            ? t('Loading activity data...', 'جارٍ تحميل بيانات النشاط...')
            : t('Track all user actions and system events', 'تتبع جميع إجراءات المستخدمين والأحداث')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="card p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="relative">
              <label className="label-field">{t('User Search', 'بحث المستخدم')}</label>
              <Search className="absolute start-3 top-8 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('User name...', 'اسم المستخدم...')}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="input-field ps-9"
              />
            </div>
            <div className="relative">
              <label className="label-field">{t('Document / Entity', 'المستند / الكيان')}</label>
              <Search className="absolute start-3 top-8 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('Reference...', 'المرجع...')}
                value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
                className="input-field ps-9"
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
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Timestamp', 'الوقت')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('User', 'المستخدم')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Action', 'الإجراء')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Entity', 'الكيان')}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-700">{t('Reference', 'المرجع')}</th>
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
                      className={`border-b border-gray-100 table-row-hover ${
                        hasBeforeAfter ? 'cursor-pointer' : ''
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
                          <span className="ms-1">{actionIcons[entry.action]}</span>
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
                    {isExpanded && hasBeforeAfter && (() => {
                      const diffs = computeDiffs(entry.before!, entry.after!)
                      const isRawVisible = showRawDiff === entry.id
                      return (
                        <tr className="bg-gray-50/80">
                          <td colSpan={6} className="px-6 py-4">
                            {/* Field-level diffs */}
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              {t('Changes', 'التغييرات')}
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-3">
                              {diffs.map(d => (
                                <div key={d.field} className="flex items-center gap-3 px-3 py-2 text-sm">
                                  <span className="font-medium text-gray-700 min-w-[120px]">{d.field}</span>
                                  {d.onlyIn === 'after' ? (
                                    <span className="text-green-600">
                                      {t('Added', 'أُضيف')}: <span className="font-mono">{d.newValue}</span>
                                    </span>
                                  ) : d.onlyIn === 'before' ? (
                                    <span className="text-red-600">
                                      {t('Removed', 'حُذف')}: <span className="font-mono line-through">{d.oldValue}</span>
                                    </span>
                                  ) : (
                                    <>
                                      <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{d.oldValue}</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                      <span className="font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{d.newValue}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                              {diffs.length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-400">
                                  {t('No differences detected.', 'لا توجد فروقات.')}
                                </div>
                              )}
                            </div>

                            {/* Collapsible raw data */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowRawDiff(isRawVisible ? null : entry.id)
                              }}
                              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <ChevronDownSmall className={`w-3.5 h-3.5 transition-transform ${isRawVisible ? 'rotate-180' : ''}`} />
                              {t('Show Raw Data', 'عرض البيانات الخام')}
                            </button>
                            {isRawVisible && (
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div className="p-3 rounded-lg border border-red-200 bg-red-50/50">
                                  <div className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    {t('Before', 'قبل')}
                                  </div>
                                  <pre className="font-mono text-xs text-red-700 whitespace-pre-wrap break-words">
                                    {JSON.stringify(entry.before, null, 2)}
                                  </pre>
                                </div>
                                <div className="p-3 rounded-lg border border-green-200 bg-green-50/50">
                                  <div className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    {t('After', 'بعد')}
                                  </div>
                                  <pre className="font-mono text-xs text-green-700 whitespace-pre-wrap break-words">
                                    {JSON.stringify(entry.after, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })()}
                  </Fragment>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 empty-state">
                    <p className="text-gray-400">
                      {t('No activity entries match your filters.', 'لا توجد سجلات مطابقة لمرشّحاتك.')}
                    </p>
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

