import { useState, useMemo, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from '../hooks/useData'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import {
  CheckSquare, Mic, Plus, Calendar, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Trash2, Filter,
} from 'lucide-react'

export default function TodosPage() {
  const { t, language } = useLanguage()
  const { currentUser } = useApp()

  const { data: todosData, loading, refetch } = useTodos(currentUser.id)
  const { create: createTodo, loading: creating } = useCreateTodo()
  const { update: updateTodo } = useUpdateTodo()
  const { remove: deleteTodo, loading: deleting } = useDeleteTodo()

  const {
    isSupported: speechSupported,
    isListening,
    transcript: speechTranscript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition()

  const todos = todosData || []

  const [showForm, setShowForm] = useState(false)
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [filterDone, setFilterDone] = useState<'all' | 'done' | 'pending'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium')

  // Track which field is focused for voice input target
  const activeFieldRef = useRef<'title' | 'description'>('title')

  const filteredTodos = useMemo(() => {
    return todos.filter((td) => {
      if (filterPriority !== 'all' && td.priority !== filterPriority) return false
      if (filterDone === 'done' && !td.is_done) return false
      if (filterDone === 'pending' && td.is_done) return false
      return true
    })
  }, [todos, filterPriority, filterDone])

  const pendingCount = todos.filter((td) => !td.is_done).length
  const doneCount = todos.filter((td) => td.is_done).length

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border border-red-200',
    medium: 'bg-amber-100 text-amber-700 border border-amber-200',
    low: 'bg-green-100 text-green-700 border border-green-200',
  }

  const priorityLabels: Record<string, { en: string; ar: string }> = {
    high: { en: 'High', ar: 'عالية' },
    medium: { en: 'Medium', ar: 'متوسطة' },
    low: { en: 'Low', ar: 'منخفضة' },
  }

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return

    await createTodo({
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      due_date: formDate || null,
      due_time: formTime || null,
      priority: formPriority,
    }, currentUser.id)

    refetch()
    setFormTitle('')
    setFormDescription('')
    setFormDate('')
    setFormTime('')
    setFormPriority('medium')
    setShowForm(false)
  }

  async function toggleDone(id: string) {
    const todo = todos.find((td) => td.id === id)
    if (todo) {
      await updateTodo(id, { is_done: !todo.is_done })
      refetch()
    }
  }

  async function handleDeleteTodo(id: string) {
    await deleteTodo(id)
    refetch()
  }

  // Derive voice button state from hook
  const voiceState = isListening ? 'listening' : speechTranscript ? 'transcript' : 'idle'

  // Apply speech transcript to the active field
  useEffect(() => {
    if (speechTranscript) {
      if (activeFieldRef.current === 'title') {
        setFormTitle(speechTranscript)
      } else {
        setFormDescription(speechTranscript)
      }
    }
  }, [speechTranscript])

  function handleVoiceInput() {
    if (isListening) {
      stopListening()
      return
    }

    const lang = language === 'ar' ? 'ar-SA' : 'en-US'
    startListening(lang)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stopListening()
  }, [stopListening])

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatTime(timeStr?: string | null) {
    if (!timeStr) return null
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${m} ${ampm}`
  }

  function isOverdue(dateStr?: string | null, done?: boolean) {
    if (!dateStr || done) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dateStr + 'T00:00:00')
    return due < today
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            {t('My To-dos', 'مهامي الشخصية')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t(
              `${pendingCount} pending, ${doneCount} completed`,
              `${pendingCount} معلقة، ${doneCount} مكتملة`
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <Plus size={16} className="ms-1.5" />
          {t('New To-do', 'مهمة جديدة')}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card p-8 text-center mb-6">
          <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-3" />
          <p className="text-gray-400">{t('Loading to-dos...', 'جاري تحميل المهام...')}</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="card p-5 mb-6">
          <h3 className="text-lg font-semibold text-brand-800 mb-4">
            {t('Add New To-do', 'إضافة مهمة جديدة')}
          </h3>
          <form onSubmit={handleAddTodo} className="space-y-4">
            <div>
              <label className="label-field">{t('Title', 'العنوان')} *</label>
              <input
                type="text"
                className="input-field"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onFocus={() => { activeFieldRef.current = 'title' }}
                placeholder={t('Enter todo title...', 'أدخل عنوان المهمة...')}
                required
              />
            </div>
            <div>
              <label className="label-field">{t('Description', 'الوصف')}</label>
              <textarea
                className="input-field min-h-[80px] resize-y"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                onFocus={() => { activeFieldRef.current = 'description' }}
                placeholder={t('Optional description...', 'وصف اختياري...')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-field">
                  <Calendar size={14} className="inline ms-1" />
                  {t('Due Date', 'تاريخ الاستحقاق')}
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">
                  <Clock size={14} className="inline ms-1" />
                  {t('Due Time', 'وقت الاستحقاق')}
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">
                  <Filter size={14} className="inline ms-1" />
                  {t('Priority', 'الأولوية')}
                </label>
                <select
                  className="select-field"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">{t('Low', 'منخفضة')}</option>
                  <option value="medium">{t('Medium', 'متوسطة')}</option>
                  <option value="high">{t('High', 'عالية')}</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={creating}>
                <Plus size={16} className="ms-1.5" />
                {creating ? t('Adding...', 'جاري الإضافة...') : t('Add To-do', 'إضافة المهمة')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                {t('Cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                className={`btn-ghost ${
                  isListening
                    ? 'bg-red-50 text-red-600 animate-pulse'
                    : voiceState === 'transcript'
                    ? 'bg-green-50 text-green-600'
                    : ''
                }`}
                onClick={handleVoiceInput}
                title={
                  !speechSupported
                    ? t('Voice input not supported in this browser', 'الإدخال الصوتي غير مدعوم في هذا المتصفح')
                    : speechError || t('Voice Input', 'إدخال صوتي')
                }
                disabled={!speechSupported || isListening}
              >
                <Mic size={18} />
                <span className="ms-1.5 hidden sm:inline">
                  {isListening
                    ? t('Listening...', 'جاري الاستماع...')
                    : voiceState === 'transcript'
                    ? t('Done!', 'تم!')
                    : t('Voice', 'صوتي')}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter size={14} />
          {t('Filter:', 'تصفية:')}
        </div>
        <select
          className="select-field w-auto min-w-[130px]"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
        >
          <option value="all">{t('All Priorities', 'كل الأولويات')}</option>
          <option value="high">{t('High', 'عالية')}</option>
          <option value="medium">{t('Medium', 'متوسطة')}</option>
          <option value="low">{t('Low', 'منخفضة')}</option>
        </select>
        <select
          className="select-field w-auto min-w-[130px]"
          value={filterDone}
          onChange={(e) => setFilterDone(e.target.value as typeof filterDone)}
        >
          <option value="all">{t('All Status', 'كل الحالات')}</option>
          <option value="pending">{t('Pending', 'معلقة')}</option>
          <option value="done">{t('Completed', 'مكتملة')}</option>
        </select>
        <span className="text-xs text-gray-400 ms-auto">
          {t(`${filteredTodos.length} shown`, `${filteredTodos.length} معروض`)}
        </span>
      </div>

      {/* Todo List */}
      <div className="space-y-2">
        {!loading && filteredTodos.length === 0 && (
          <div className="card p-8 text-center empty-state">
            <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {t('No to-dos match your filters.', 'لا توجد مهام تطابق مرشحاتك.')}
            </p>
          </div>
        )}

        {filteredTodos.map((todo) => {
          const overdue = isOverdue(todo.due_date, todo.is_done)
          const isExpanded = expandedId === todo.id

          return (
            <div
              key={todo.id}
              className={`card p-4 transition-all ${
                todo.is_done ? 'opacity-60' : ''
              } ${overdue ? 'border-s-4 border-s-red-400' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Done checkbox */}
                <button
                  onClick={() => toggleDone(todo.id)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                    todo.is_done
                      ? 'bg-status-completed border-status-completed text-white'
                      : 'border-gray-300 hover:border-brand-400'
                  }`}
                >
                  {todo.is_done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-sm font-semibold ${
                        todo.is_done ? 'line-through text-gray-400' : 'text-brand-900'
                      }`}
                    >
                      {todo.title}
                    </h4>
                    <span className={`status-badge ${priorityColors[todo.priority]}`}>
                      {t(priorityLabels[todo.priority]?.en || todo.priority, priorityLabels[todo.priority]?.ar || todo.priority)}
                    </span>
                    {overdue && (
                      <span className="status-badge bg-red-100 text-red-700 border border-red-200">
                        <AlertTriangle size={12} className="ms-1" />
                        {t('Overdue', 'متأخرة')}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                    {todo.due_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(todo.due_date)}
                      </span>
                    )}
                    {todo.due_time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {formatTime(todo.due_time)}
                      </span>
                    )}
                    {!todo.due_date && !todo.due_time && (
                      <span className="text-gray-400 italic">
                        {t('No due date', 'بلا تاريخ استحقاق')}
                      </span>
                    )}
                  </div>

                  {/* Expandable description */}
                  {todo.description && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : todo.id)}
                        className="text-xs text-brand-500 hover:text-brand-700 inline-flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isExpanded ? t('Hide details', 'إخفاء التفاصيل') : t('Show details', 'عرض التفاصيل')}
                      </button>
                      {isExpanded && (
                        <p className="text-sm text-gray-600 mt-2 ps-1 border-s-2 border-gray-200 ms-1">
                          {todo.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleVoiceInput}
                    className={`btn-ghost p-1.5 ${
                      isListening
                        ? 'text-red-500 animate-pulse'
                        : voiceState === 'transcript'
                        ? 'text-green-500'
                        : ''
                    }`}
                    title={
                      !speechSupported
                        ? t('Voice input not supported in this browser', 'الإدخال الصوتي غير مدعوم في هذا المتصفح')
                        : speechError || t('Voice Input', 'إدخال صوتي')
                    }
                    disabled={!speechSupported || isListening}
                    aria-label={t('Voice input', 'إدخال صوتي')}
                  >
                    <Mic size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                    title={t('Delete', 'حذف')}
                    disabled={deleting}
                    aria-label={t('Delete to-do', 'حذف المهمة')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
