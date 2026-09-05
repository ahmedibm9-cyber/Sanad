import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, FolderKanban, CheckSquare, Users, Package, FileText, Factory } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCompany } from '../../contexts/CompanyContext'
import {
  getProjectsByCompany,
  getTasksByCompany,
  getCustomersByCompany,
  getMaterialsByCompany,
  factoryCodes,
} from '../../data/mockData'

// ─── Types ───────────────────────────────────────────

type ResultType = 'project' | 'task' | 'customer' | 'material' | 'document' | 'factory'

interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle: string
  route: string
}

interface ResultGroup {
  type: ResultType
  label: string
  icon: typeof FolderKanban
  items: SearchResult[]
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

// ─── Badge colours per entity type ───────────────────

const typeConfig: Record<ResultType, { color: string; icon: typeof FolderKanban }> = {
  project:  { color: 'bg-brand-100 text-brand-700 border border-brand-200', icon: FolderKanban },
  task:     { color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: CheckSquare },
  customer: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: Users },
  material: { color: 'bg-violet-50 text-violet-700 border border-violet-200', icon: Package },
  document: { color: 'bg-rose-50 text-rose-700 border border-rose-200', icon: FileText },
  factory:  { color: 'bg-sky-50 text-sky-700 border border-sky-200', icon: Factory },
}

// ─── Helpers ─────────────────────────────────────────

function match(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.toLowerCase()
  return fields.some(f => f != null && f.toLowerCase().includes(q))
}

function highlights(text: string, query: string): string {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    text.slice(0, idx) +
    '<mark class="bg-yellow-200 rounded px-0.5">' +
    text.slice(idx, idx + query.length) +
    '</mark>' +
    text.slice(idx + query.length)
  )
}

const DOC_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  QUOT: { en: 'Quotation', ar: 'عرض سعر' },
  PINV: { en: 'Proforma Invoice', ar: 'فاتورة مبدئية' },
  TINV: { en: 'Tax Invoice', ar: 'فاتورة ضريبية' },
  CINV: { en: 'Commercial Invoice', ar: 'فاتورة تجارية' },
  PKL:  { en: 'Packing List', ar: 'قائمة التعبئة' },
  DN:   { en: 'Delivery Note', ar: 'إشعار التسليم' },
  BL:   { en: 'Bill of Lading', ar: 'بوليصة الشحن' },
}

// ─── Component ───────────────────────────────────────

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { currentCompany } = useCompany()

  // ── Build search results ──────────────────────────

  const results = useMemo<ResultGroup[]>(() => {
    const q = query.trim()
    if (!q || !currentCompany) return []

    const projectMatches: SearchResult[] = getProjectsByCompany(currentCompany.id)
      .filter(p => match(q, p.name, p.customerName, p.destinationCountry, p.destinationCity))
      .map(p => ({
        id: p.id,
        type: 'project' as ResultType,
        title: p.name,
        subtitle: [p.customerName, p.destinationCountry && p.destinationCity ? `${p.destinationCity}, ${p.destinationCountry}` : p.destinationCountry || p.destinationCity].filter(Boolean).join(' · '),
        route: `/projects/${p.id}`,
      }))

    const taskMatches: SearchResult[] = getTasksByCompany(currentCompany.id)
      .filter(tk => match(q, tk.name, tk.customerName))
      .map(tk => ({
        id: tk.id,
        type: 'task' as ResultType,
        title: tk.name,
        subtitle: tk.customerName || t('No customer', 'لا يوجد عميل'),
        route: `/tasks/${tk.id}`,
      }))

    const customerMatches: SearchResult[] = getCustomersByCompany(currentCompany.id)
      .filter(c => match(q, c.name, c.contactPerson, c.city, c.country))
      .map(c => ({
        id: c.id,
        type: 'customer' as ResultType,
        title: c.name,
        subtitle: [c.contactPerson, c.city, c.country].filter(Boolean).join(' · '),
        route: `/customers/${c.id}`,
      }))

    const materialMatches: SearchResult[] = getMaterialsByCompany(currentCompany.id)
      .filter(m => match(q, m.name, m.grade, m.manufacturer, m.hsCode))
      .map(m => ({
        id: m.id,
        type: 'material' as ResultType,
        title: m.name,
        subtitle: [m.grade, m.manufacturer].filter(Boolean).join(' · ') || m.hsCode || '',
        route: `/materials/${m.id}`,
      }))

    // Collect documents from all company projects + tasks
    const allWorkItems = [
      ...getProjectsByCompany(currentCompany.id),
      ...getTasksByCompany(currentCompany.id),
    ]
    const documentMatches: SearchResult[] = []
    for (const wi of allWorkItems) {
      for (const doc of wi.documents) {
        if (match(q, doc.number, wi.name, doc.preparedBy, DOC_TYPE_LABELS[doc.type]?.en)) {
          documentMatches.push({
            id: doc.id,
            type: 'document',
            title: doc.number,
            subtitle: `${DOC_TYPE_LABELS[doc.type]?.en ?? doc.type} · ${wi.name}`,
            route: `/documents/${doc.id}/preview`,
          })
        }
      }
    }

    const factoryMatches: SearchResult[] = factoryCodes
      .filter(fc => match(q, fc.factoryName, fc.factoryNameAr, fc.factoryCode, fc.product, fc.activity, fc.city, fc.hsCode))
      .map(fc => ({
        id: fc.id,
        type: 'factory' as ResultType,
        title: fc.factoryName,
        subtitle: [fc.factoryCode, fc.product, fc.city].filter(Boolean).join(' · '),
        route: '/factory',
      }))

    const groups: ResultGroup[] = [
      { type: 'project',  label: t('Projects', 'المشاريع'),       icon: FolderKanban, items: projectMatches },
      { type: 'task',     label: t('Tasks', 'المهام'),            icon: CheckSquare,  items: taskMatches },
      { type: 'customer', label: t('Customers', 'العملاء'),       icon: Users,        items: customerMatches },
      { type: 'material', label: t('Materials', 'المواد'),        icon: Package,      items: materialMatches },
      { type: 'document', label: t('Documents', 'المستندات'),     icon: FileText,     items: documentMatches },
      { type: 'factory',  label: t('Factory Codes', 'أكواد المصانع'), icon: Factory,  items: factoryMatches },
    ]

    return groups.filter(g => g.items.length > 0)
  }, [query, currentCompany?.id, t])

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => results.flatMap(g => g.items), [results])

  // ── Reset on open / query change ──────────────────

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // ── Scroll selected into view ─────────────────────

  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // ── Navigation ────────────────────────────────────

  const selectItem = useCallback((item: SearchResult) => {
    onClose()
    navigate(item.route)
  }, [onClose, navigate])

  // ── Keyboard handling ─────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % flatItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length)
      } else if (e.key === 'Enter' && flatItems.length > 0) {
        e.preventDefault()
        selectItem(flatItems[selectedIndex])
      }
    },
    [flatItems, selectedIndex, selectItem, onClose],
  )

  // ── Render ────────────────────────────────────────

  if (!open) return null

  const totalResults = flatItems.length

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('Global Search', 'بحث عام')}>
      {/* Backdrop */}
      <div className="backdrop" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
           style={{ animation: 'modal-in 160ms ease-out' }}>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('Search projects, tasks, customers, materials, documents, factory codes…',
                            'ابحث عن المشاريع، المهام، العملاء، المواد، المستندات، أكواد المصانع…')}
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            aria-label={t('Search', 'بحث')}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <span className="text-xs text-gray-400 shrink-0 tabular-nums">
              {totalResults} {t('results', 'نتائج')}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label={t('Close', 'إغلاق')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
          {!query ? (
            <div className="empty-state py-16">
              <Search size={40} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">
                {t('Start typing to search across all entities',
                   'ابدأ الكتابة للبحث في جميع العناصر')}
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="empty-state py-16">
              <Search size={40} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">{t('No results found', 'لم يتم العثور على نتائج')}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t('Try a different search term', 'جرّب مصطلح بحث آخر')}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {results.map(group => {
                const GroupIcon = group.icon
                const cfg = typeConfig[group.type]
                return (
                  <div key={group.type} className="mb-1">
                    {/* Section header */}
                    <div className="px-4 py-2 flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${cfg.color}`}>
                        <GroupIcon size={12} />
                      </span>
                      <span className="section-title">{group.label}</span>
                      <span className="text-xs text-gray-400 ml-1">({group.items.length})</span>
                    </div>

                    {/* Items */}
                    {group.items.map(item => {
                      const idx = flatItems.indexOf(item)
                      const isSelected = idx === selectedIndex
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={() => selectItem(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors duration-75 cursor-pointer ${
                            isSelected
                              ? 'bg-brand-50 border-l-2 border-brand-600'
                              : 'border-l-2 border-transparent hover:bg-gray-50'
                          }`}
                        >
                          {/* Type badge */}
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0 mt-0.5 ${cfg.color}`}>
                            {group.type === 'document'
                              ? (DOC_TYPE_LABELS[(item as { subtitle: string }).subtitle.split(' · ')[0]?.split(' · ')[0]]?.en ?? item.title.slice(0, 4))
                              : group.type.slice(0, 3)
                            }
                          </span>

                          {/* Text */}
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium text-gray-900 truncate"
                              dangerouslySetInnerHTML={{ __html: highlights(item.title, query) }}
                            />
                            {item.subtitle && (
                              <p
                                className="text-xs text-gray-500 truncate mt-0.5"
                                dangerouslySetInnerHTML={{ __html: highlights(item.subtitle, query) }}
                              />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {query && totalResults > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 shrink-0 flex items-center gap-4 text-[11px] text-gray-400">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">↓</kbd>{' '}
              {t('Navigate', 'تنقل')}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">↵</kbd>{' '}
              {t('Open', 'فتح')}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">Esc</kbd>{' '}
              {t('Close', 'إغلاق')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
