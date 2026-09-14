/**
 * Licensing settings component for SANAD application.
 * 
 * Displays license status and allows verification.
 */

import { useAuth } from '../../contexts/AuthContext'
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Clock, Key } from 'lucide-react'

export function LicensingSettings() {
  const { licenseInfo, isLicenseValid, isLicenseLoading, verifyLicense } = useAuth()

  const getStatusIcon = () => {
    if (isLicenseLoading) return <RefreshCw size={20} className="text-gray-400 animate-spin" />
    if (isLicenseValid) return <CheckCircle size={20} className="text-green-500" />
    if (licenseInfo?.status === 'expiring') return <Clock size={20} className="text-amber-500" />
    return <AlertTriangle size={20} className="text-red-500" />
  }

  const getStatusText = () => {
    if (isLicenseLoading) return 'Verifying...'
    if (isLicenseValid) return 'Active'
    if (licenseInfo?.status === 'expiring') return 'Expiring Soon'
    return 'Invalid'
  }

  const getStatusColor = () => {
    if (isLicenseLoading) return 'bg-gray-100 text-gray-700'
    if (isLicenseValid) return 'bg-green-100 text-green-700'
    if (licenseInfo?.status === 'expiring') return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-6">
      {/* License Status Card */}
      <div className={`rounded-xl border p-5 ${
        isLicenseValid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${
            isLicenseValid ? 'bg-emerald-100' : 'bg-amber-100'
          }`}>
            <Shield className={`w-5 h-5 ${isLicenseValid ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-800">
                {t('License Status', 'حالة الترخيص')}
              </p>
              <span className={`status-badge ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            {licenseInfo?.validUntil && (
              <p className="text-xs text-gray-600 mt-1">
                {t('Valid until', 'صالح حتى')} {new Date(licenseInfo.validUntil).toLocaleDateString()}
              </p>
            )}
            {licenseInfo?.lastVerified && (
              <p className="text-xs text-gray-500 mt-0.5">
                {t('Last verified', 'آخر تحقق')} {new Date(licenseInfo.lastVerified).toLocaleString()}
              </p>
            )}
            {licenseInfo?.message && (
              <p className="text-xs text-gray-500 mt-1">{licenseInfo.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* License Key */}
      <div className="card p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          {t('License Key', 'مفتاح الترخيص')}
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-600 tracking-wider flex items-center gap-2">
            <Key size={14} className="text-gray-400" />
            {licenseInfo?.key || 'No license key configured'}
          </div>
        </div>
        {licenseInfo?.plan && (
          <p className="text-xs text-gray-500 mt-2">
            {t('Plan', 'الخطة')}: {licenseInfo.plan}
          </p>
        )}
      </div>

      {/* Verify Button */}
      <div className="flex justify-end">
        <button
          onClick={verifyLicense}
          disabled={isLicenseLoading}
          className="btn-secondary"
        >
          <RefreshCw size={16} className={`mr-2 ${isLicenseLoading ? 'animate-spin' : ''}`} />
          {t('Verify / Refresh', 'تحقق / تحديث')}
        </button>
      </div>
    </div>
  )
}

function t(en: string, ar: string): string {
  return en // Will be connected to useLanguage context later
}

export default LicensingSettings
