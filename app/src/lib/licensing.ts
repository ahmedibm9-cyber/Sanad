/**
 * Licensing service for SANAD application.
 * 
 * This module handles license verification against the vendor licensing server.
 * It implements graceful degradation for temporary outages.
 */

import { LicensingError } from './errors'
import { appLogger } from './logger'
import { env } from './env'

// ===========================================
// Types
// ===========================================

export type LicenseStatus = 'valid' | 'expiring' | 'expired' | 'unavailable' | 'invalid'

export interface LicenseInfo {
  key: string
  status: LicenseStatus
  validUntil: string | null
  lastVerified: string | null
  nextVerification: string | null
  plan: string | null
  features: string[]
  message: string | null
}

export interface LicenseVerificationRequest {
  licenseKey: string
  installationId: string
  productVersion: string
  instanceFingerprint?: string
}

export interface LicenseVerificationResponse {
  valid: boolean
  expiry: string | null
  nextVerification: string | null
  plan: string | null
  features: string[]
  message: string | null
}

export interface LicenseConfig {
  serverUrl: string
  applicationCredential?: string
  gracePeriodDays: number
  verificationIntervalHours: number
}

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_CONFIG: LicenseConfig = {
  serverUrl: '',
  gracePeriodDays: 7,
  verificationIntervalHours: 24,
}

// ===========================================
// License Storage Keys
// ===========================================

const STORAGE_KEYS = {
  LICENSE_KEY: 'sanad_license_key',
  LICENSE_INFO: 'sanad_license_info',
  LAST_VERIFIED: 'sanad_last_verified',
  INSTALLATION_ID: 'sanad_installation_id',
} as const

// ===========================================
// License Service
// ===========================================

export class LicenseService {
  private config: LicenseConfig
  private currentLicense: LicenseInfo | null = null

  constructor(config?: Partial<LicenseConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    if (env.licenseServerUrl) {
      this.config.serverUrl = env.licenseServerUrl
    }
    if (env.licenseKey) {
      this.config.applicationCredential = undefined // Never store in client
    }
  }

  /**
   * Initialize the license service and load stored license data.
   */
  async initialize(): Promise<void> {
    // Load stored license info
    const storedInfo = this.loadStoredLicenseInfo()
    if (storedInfo) {
      this.currentLicense = storedInfo
    }

    // Check if we need to verify
    if (this.shouldVerify()) {
      await this.verify()
    }
  }

  /**
   * Verify the license against the licensing server.
   */
  async verify(): Promise<LicenseInfo> {
    const licenseKey = this.getLicenseKey()
    if (!licenseKey) {
      return this.createInvalidLicense('No license key configured')
    }

    const installationId = this.getInstallationId()

    const request: LicenseVerificationRequest = {
      licenseKey,
      installationId,
      productVersion: env.appVersion,
      instanceFingerprint: this.generateInstanceFingerprint(),
    }

    try {
      appLogger.info('Verifying license', { installationId })

      const response = await fetch(`${this.config.serverUrl}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.applicationCredential && {
            'X-License-Credential': this.config.applicationCredential,
          }),
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: LicenseVerificationResponse = await response.json()

      const licenseInfo = this.processVerificationResponse(data, licenseKey)

      // Store license info
      this.storeLicenseInfo(licenseInfo)
      this.currentLicense = licenseInfo

      appLogger.info('License verified', {
        status: licenseInfo.status,
        validUntil: licenseInfo.validUntil,
      })

      return licenseInfo
    } catch (error) {
      appLogger.error('License verification failed', error)

      // Check if we have a previously valid license for grace period
      if (this.currentLicense?.status === 'valid' || this.currentLicense?.status === 'expiring') {
        // Apply grace period
        const lastVerified = this.currentLicense.lastVerified
        if (lastVerified) {
          const daysSinceVerification = this.daysSince(new Date(lastVerified))
          if (daysSinceVerification <= this.config.gracePeriodDays) {
            appLogger.warn('Using grace period due to verification failure', {
              daysSinceVerification,
              gracePeriodDays: this.config.gracePeriodDays,
            })

            return {
              ...this.currentLicense,
              status: 'expiring',
              message: `License server unavailable. Using grace period (${this.config.gracePeriodDays - daysSinceVerification} days remaining)`,
            }
          }
        }
      }

      return this.createUnavailableLicense('License server unavailable')
    }
  }

  /**
   * Get the current license status.
   */
  getStatus(): LicenseStatus {
    if (!this.currentLicense) {
      return 'unavailable'
    }
    return this.currentLicense.status
  }

  /**
   * Get full license information.
   */
  getLicenseInfo(): LicenseInfo | null {
    return this.currentLicense
  }

  /**
   * Check if the license is valid.
   */
  isValid(): boolean {
    if (!this.currentLicense) return false
    return this.currentLicense.status === 'valid' || this.currentLicense.status === 'expiring'
  }

  /**
   * Check if a specific feature is available.
   */
  hasFeature(feature: string): boolean {
    if (!this.currentLicense) return false
    if (!this.currentLicense.features) return false
    return this.currentLicense.features.includes(feature)
  }

  /**
   * Get the license key from storage or environment.
   */
  private getLicenseKey(): string | null {
    // Try storage first
    const storedKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY)
    if (storedKey) return storedKey

    // Try environment
    if (env.licenseKey) return env.licenseKey

    return null
  }

  /**
   * Get or generate installation ID.
   */
  private getInstallationId(): string {
    let installationId = localStorage.getItem(STORAGE_KEYS.INSTALLATION_ID)
    if (!installationId) {
      installationId = this.generateInstallationId()
      localStorage.setItem(STORAGE_KEYS.INSTALLATION_ID, installationId)
    }
    return installationId
  }

  /**
   * Generate a unique installation ID.
   */
  private generateInstallationId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2)
    return `sanad-${timestamp}-${random}`
  }

  /**
   * Generate an instance fingerprint (non-sensitive).
   */
  private generateInstanceFingerprint(): string {
    try {
      // Create a non-sensitive fingerprint based on deployment characteristics
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('SANAD', 2, 2)
        const fingerprint = canvas.toDataURL().length.toString(36)
        return `${fingerprint}-${navigator.userAgent.length.toString(36)}`
      }
    } catch {
      // Canvas might not be available in test environments
    }
    // Fallback fingerprint using timestamp and random
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)
    return `${timestamp}-${random}`
  }

  /**
   * Process verification response.
   */
  private processVerificationResponse(
    response: LicenseVerificationResponse,
    licenseKey: string
  ): LicenseInfo {
    let status: LicenseStatus = 'invalid'

    if (response.valid) {
      if (response.expiry) {
        const daysUntilExpiry = this.daysUntil(new Date(response.expiry))
        if (daysUntilExpiry <= 30) {
          status = 'expiring'
        } else {
          status = 'valid'
        }
      } else {
        status = 'valid'
      }
    }

    return {
      key: licenseKey,
      status,
      validUntil: response.expiry,
      lastVerified: new Date().toISOString(),
      nextVerification: response.nextVerification,
      plan: response.plan,
      features: response.features || [],
      message: response.message,
    }
  }

  /**
   * Create an invalid license object.
   */
  private createInvalidLicense(message: string): LicenseInfo {
    return {
      key: this.getLicenseKey() || '',
      status: 'invalid',
      validUntil: null,
      lastVerified: null,
      nextVerification: null,
      plan: null,
      features: [],
      message,
    }
  }

  /**
   * Create an unavailable license object.
   */
  private createUnavailableLicense(message: string): LicenseInfo {
    return {
      key: this.getLicenseKey() || '',
      status: 'unavailable',
      validUntil: this.currentLicense?.validUntil || null,
      lastVerified: this.currentLicense?.lastVerified || null,
      nextVerification: this.currentLicense?.nextVerification || null,
      plan: this.currentLicense?.plan || null,
      features: this.currentLicense?.features || [],
      message,
    }
  }

  /**
   * Check if verification is needed.
   */
  private shouldVerify(): boolean {
    const lastVerified = localStorage.getItem(STORAGE_KEYS.LAST_VERIFIED)
    if (!lastVerified) return true

    const lastVerifiedDate = new Date(lastVerified)
    const hoursSinceVerification = this.hoursSince(lastVerifiedDate)

    return hoursSinceVerification >= this.config.verificationIntervalHours
  }

  /**
   * Store license info in localStorage.
   */
  private storeLicenseInfo(info: LicenseInfo): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LICENSE_INFO, JSON.stringify(info))
      localStorage.setItem(STORAGE_KEYS.LAST_VERIFIED, new Date().toISOString())
    } catch {
      // localStorage might be unavailable
    }
  }

  /**
   * Load license info from localStorage.
   */
  private loadStoredLicenseInfo(): LicenseInfo | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LICENSE_INFO)
      if (!stored) return null
      return JSON.parse(stored) as LicenseInfo
    } catch {
      return null
    }
  }

  /**
   * Calculate days since a date.
   */
  private daysSince(date: Date): number {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate hours since a date.
   */
  private hoursSince(date: Date): number {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    return Math.floor(diff / (1000 * 60 * 60))
  }

  /**
   * Calculate days until a date.
   */
  private daysUntil(date: Date): number {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * Clear stored license data.
   */
  clearStorage(): void {
    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY)
    localStorage.removeItem(STORAGE_KEYS.LICENSE_INFO)
    localStorage.removeItem(STORAGE_KEYS.LAST_VERIFIED)
    this.currentLicense = null
  }
}

// Singleton instance
let licenseServiceInstance: LicenseService | null = null

export function getLicenseService(): LicenseService {
  if (!licenseServiceInstance) {
    licenseServiceInstance = new LicenseService()
  }
  return licenseServiceInstance
}

export default LicenseService
