import { ShieldOff, ArrowLeft } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface PermissionDeniedProps {
  onBack?: () => void
}

/**
 * Full-page permission denied screen with a shield icon and a back button.
 */
export default function PermissionDenied({ onBack }: PermissionDeniedProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="card px-8 py-10 max-w-md w-full flex flex-col items-center">
        {/* Icon */}
        <div className="p-3 bg-amber-100 rounded-lg mb-4">
          <ShieldOff size={28} className="text-amber-600" aria-hidden="true" />
        </div>

        {/* Text */}
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('Permission Denied', 'الصلاحية مرفوضة')}
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          {t(
            "You don't have permission to access this page. Please contact your administrator.",
            'ليس لديك صلاحية للوصول إلى هذه الصفحة. يرجى الاتصال بالمسؤول.',
          )}
        </p>

        {/* Back button */}
        {onBack && (
          <button type="button" onClick={onBack} className="btn-secondary">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{t('Go Back', 'رجوع')}</span>
          </button>
        )}
      </div>
    </div>
  )
}
