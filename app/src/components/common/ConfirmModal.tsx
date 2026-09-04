import { AlertTriangle, Trash2, RefreshCw, Info, Shield } from 'lucide-react'
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

  return (
    <Modal open={open} onClose={onClose} size="sm" footer={
      <>
        <button onClick={onClose} className="btn-secondary" disabled={loading}>{cancelLabel}</button>
        <button onClick={onConfirm} className={v.btnClass} disabled={loading} aria-label={confirmLabel}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
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
