import { useState, useMemo, useCallback } from 'react'
import { AlertTriangle, Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '../../contexts/useLanguage'
import type { SharedDataConflict } from '../../lib/services/sharedData'

export type ConflictChoice = 'keep_project' | 'keep_document'

export interface ResolvedConflict {
  conflict: SharedDataConflict
  choice: ConflictChoice
}

interface ConflictResolutionPanelProps {
  conflicts: SharedDataConflict[]
  onResolve: (resolved: ResolvedConflict[]) => void
  onCancel?: () => void
}

const FIELD_LABELS_AR: Record<string, string> = {
  quantity: 'الكمية',
  unit_price: 'سعر الوحدة',
  currency: 'العملة',
  weight_unit: 'وحدة الوزن',
  packing_unit: 'التعبئة',
  origin: 'المصدر',
  hs_code: 'كود HS',
  incoterm: 'الشروط التجارية',
  payment_terms: 'شروط الدفع',
  delivery_terms: 'شروط التسليم',
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

export default function ConflictResolutionPanel({ conflicts, onResolve, onCancel }: ConflictResolutionPanelProps) {
  const { t } = useLanguage()
  const [choices, setChoices] = useState<Record<string, ConflictChoice>>({})
  const [expanded, setExpanded] = useState(true)

  const resolvedCount = useMemo(
    () => Object.keys(choices).length,
    [choices]
  )

  const allResolved = resolvedCount === conflicts.length

  const handleChoice = useCallback((fieldKey: string, choice: ConflictChoice) => {
    setChoices(prev => ({ ...prev, [fieldKey]: choice }))
  }, [])

  const handleApplyAll = useCallback(() => {
    const resolved: ResolvedConflict[] = conflicts.map(c => ({
      conflict: c,
      choice: choices[c.fieldKey] || 'keep_project',
    }))
    onResolve(resolved)
  }, [conflicts, choices, onResolve])

  const handleBulkChoice = useCallback((choice: ConflictChoice) => {
    const bulk: Record<string, ConflictChoice> = {}
    for (const c of conflicts) {
      bulk[c.fieldKey] = choice
    }
    setChoices(bulk)
  }, [conflicts])

  if (conflicts.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-start">
            <h3 className="text-sm font-semibold text-amber-900">
              {t('Shared Data Conflicts', 'تعارضات البيانات المشتركة')}
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              {t(
                `${resolvedCount} of ${conflicts.length} resolved`,
                `${resolvedCount} من ${conflicts.length} تم حلها`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allResolved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
              <Check className="w-3 h-3" />
              {t('Ready', 'جاهز')}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-amber-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-600" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-amber-200">
          {/* Bulk Actions */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/30 border-b border-amber-200">
            <span className="text-xs text-amber-700 font-medium">
              {t('Apply to all:', 'تطبيق على الكل:')}
            </span>
            <button
              onClick={() => handleBulkChoice('keep_project')}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors"
            >
              {t('Keep All Project Values', 'احتفاظ بقيم المشروع للكل')}
            </button>
            <button
              onClick={() => handleBulkChoice('keep_document')}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors"
            >
              {t('Keep All Document Values', 'احتفاظ بقيم المستند للكل')}
            </button>
          </div>

          {/* Conflict List */}
          <div className="divide-y divide-amber-200">
            {conflicts.map((conflict) => {
              const choice = choices[conflict.fieldKey]
              const fieldLabel = FIELD_LABELS_AR[conflict.fieldKey] || conflict.fieldLabel

              return (
                <div key={conflict.fieldKey} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-900">
                        {conflict.fieldLabel}
                        <span className="ms-1.5 text-xs text-amber-600 font-normal">({fieldLabel})</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-amber-600 mb-0.5">
                            {t('Project', 'المشروع')}
                          </p>
                          <p className="text-sm font-medium text-brand-900 truncate">
                            {formatFieldValue(conflict.projectValue)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-amber-600 mb-0.5">
                            {t('Document', 'المستند')}
                          </p>
                          <p className="text-sm font-medium text-brand-900 truncate">
                            {formatFieldValue(conflict.documentValue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Choice Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-1">
                      <button
                        onClick={() => handleChoice(conflict.fieldKey, 'keep_project')}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                          choice === 'keep_project'
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700'
                        }`}
                      >
                        {t('Project', 'المشروع')}
                      </button>
                      <button
                        onClick={() => handleChoice(conflict.fieldKey, 'keep_document')}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                          choice === 'keep_document'
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700'
                        }`}
                      >
                        {t('Document', 'المستند')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber-100/30 border-t border-amber-200">
            <button onClick={onCancel} className="btn-ghost text-sm text-gray-600">
              {t('Cancel', 'إلغاء')}
            </button>
            <button
              disabled={!allResolved}
              onClick={handleApplyAll}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                allResolved
                  ? 'bg-brand-700 text-white hover:bg-brand-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('Apply Resolutions', 'تطبيق الحلول')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
