import { useEffect, useRef, useCallback, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  footer?: ReactNode
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
}

export default function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // ── Focus return: remember who had focus before the modal opened ──
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      // Focus the panel once the DOM has painted
      const raf = requestAnimationFrame(() => panelRef.current?.focus())
      return () => cancelAnimationFrame(raf)
    } else {
      document.body.style.overflow = ''
      // Restore focus to the element that triggered the modal
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ── Escape key ──
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // ── Focus trap ──
  const trapFocus = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: wrap from first → last
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: wrap from last → first
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [],
  )

  if (!open) return null

  // Full-screen modal: backdrop covers entire viewport, blocking Sidebar/TopBar.
  // This is intentional — modals are disruptive overlays requiring user action.
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}>
      <div className="backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`modal-panel ${sizeClasses[size]} outline-none`}
        onKeyDown={trapFocus}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              {title && <h2 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h2>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
