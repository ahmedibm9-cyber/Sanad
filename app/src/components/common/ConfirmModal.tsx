import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, RefreshCw, Info } from 'lucide-react'
import Modal from './Modal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  details?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info' | 'restore'
  loading?: boolean
}

const variants = {
  danger: { icon: Trash2, iconBg: 'bg-red-100', iconColor: 'text-red-600', btnClass: 'btn-danger' },
  warning: { icon: AlertTriangle, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', btnClass: 'btn-primary' },
  info: { icon: Info, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', btnClass: 'btn-primary' },
  restore: { icon: RefreshCw, iconBg: 'bg-green-100', iconColor: 'text-green-600', btnClass: 'btn-primary' },
}

export default function ConfirmModal({ open, onClose, onConfirm, title, message, details, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'warning', loading }: ConfirmModalProps) {
  const v = variants[variant]
  const Icon = v.icon
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Auto-focus the confirm button when the modal opens
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => confirmRef.current?.focus())
      return () => cancelAnimationFrame(raf)
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} size="sm" footer={
      <>
        <button onClick={onClose} className="btn-secondary" disabled={loading}>{cancelLabel}</button>
        <button
          ref={confirmRef}
          onClick={onConfirm}
          className={v.btnClass}
          disabled={loading}
          aria-label={confirmLabel}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing…
            </span>
          ) : confirmLabel}
        </button>
      </>
    }>
      <div className="flex flex-col items-center text-center py-4">
        <div className={`p-3 ${v.iconBg} rounded-lg mb-4`}>
          <Icon className={`w-7 h-7 ${v.iconColor}`} aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-1">{message}</p>
        {details && <p className="text-xs text-gray-400 max-w-sm">{details}</p>}
      </div>
    </Modal>
  )
}
