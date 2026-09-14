import { useEffect, useState } from 'react'
import { CheckCircle, X, AlertTriangle, Info } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

const icons = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error: <AlertTriangle size={16} className="text-red-500" />,
  info: <Info size={16} className="text-blue-500" />,
}

const bgColors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`toast border ${bgColors[type]} transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      role="status"
      aria-live="polite"
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 200) }} className="p-0.5 hover:bg-black/5 rounded" aria-label={t('Dismiss', 'إغلاق')}>
        <X size={14} />
      </button>
    </div>
  )
}
