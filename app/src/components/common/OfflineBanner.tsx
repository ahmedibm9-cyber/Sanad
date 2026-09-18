import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/useLanguage'
import { WifiOff, X } from 'lucide-react'

export default function OfflineBanner() {
  const { t } = useLanguage()
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  const handleOnline = useCallback(() => {
    setIsOffline(false)
    setDismissed(false)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOffline(true)
    setDismissed(false)
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  if (!isOffline || dismissed) return null

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-medium shadow-md"
    >
      <WifiOff size={16} />
      <span>{t('You are offline. Some features may be unavailable.', 'أنت غير متصل بالإنترنت. بعض الميزات قد تكون غير متاحة.')}</span>
      <button
        onClick={() => setDismissed(true)}
        className="ms-2 p-0.5 rounded hover:bg-amber-600 transition-colors"
        aria-label={t('Dismiss', 'إغلاق')}
      >
        <X size={14} />
      </button>
    </div>
  )
}
