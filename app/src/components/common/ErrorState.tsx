import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  onBack?: () => void
}

/**
 * Centered card shown when a page or data fetch fails.
 * Provides retry and/or back actions.
 */
export default function ErrorState({
  title,
  description,
  onRetry,
  onBack,
}: ErrorStateProps) {
  const { t } = useLanguage()

  const resolvedTitle = title ?? t('Something went wrong', 'حدث خطأ ما')
  const resolvedDescription = description ?? t(
    'An unexpected error occurred. Please try again.',
    'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  )

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="card px-8 py-10 max-w-md w-full flex flex-col items-center">
        {/* Icon */}
        <div className="p-3 bg-red-100 rounded-lg mb-4">
          <AlertTriangle size={28} className="text-red-600" aria-hidden="true" />
        </div>

        {/* Text */}
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{resolvedTitle}</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">{resolvedDescription}</p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button type="button" onClick={onBack} className="btn-secondary">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t('Go Back', 'رجوع')}</span>
            </button>
          )}
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-primary">
              <RotateCw size={16} aria-hidden="true" />
              <span>{t('Retry', 'إعادة المحاولة')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
