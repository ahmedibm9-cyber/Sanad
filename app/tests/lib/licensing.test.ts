/**
 * Tests for licensing service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env module
vi.mock('@/lib/env', () => ({
  env: {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'test-key',
    licenseServerUrl: 'http://localhost:3000',
    licenseKey: undefined,
    appName: 'SANAD',
    appVersion: '0.1.0',
    appEnv: 'development',
    devMode: true,
  },
  getClientEnv: vi.fn(() => ({
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'test-key',
    licenseServerUrl: 'http://localhost:3000',
    licenseKey: undefined,
    appName: 'SANAD',
    appVersion: '0.1.0',
    appEnv: 'development',
    devMode: true,
  })),
  getServerEnv: vi.fn(() => ({})),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock fetch
global.fetch = vi.fn()

describe('LicenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('License Verification', () => {
    it('should create invalid license when no key is configured', async () => {
      const { LicenseService } = await import('@/lib/licensing')
      const service = new LicenseService({ serverUrl: 'http://localhost:3000' })

      const result = await service.verify()
      expect(result.status).toBe('invalid')
      expect(result.message).toContain('No license key')
    })

    it('should verify license against server', async () => {
      const { LicenseService } = await import('@/lib/licensing')
      const service = new LicenseService({ serverUrl: 'http://localhost:3000' })

      // Set license key in localStorage
      localStorageMock.setItem('sanad_license_key', 'TEST-LICENSE-KEY')

      // Mock successful verification
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          valid: true,
          expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          nextVerification: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          plan: 'enterprise',
          features: ['pdf', 'factory_code'],
          message: null,
        }),
      })

      const result = await service.verify()
      expect(result.status).toBe('valid')
      expect(result.plan).toBe('enterprise')
      expect(result.features).toContain('pdf')
    })

    it('should handle server unavailable gracefully', async () => {
      const { LicenseService } = await import('@/lib/licensing')
      const service = new LicenseService({ serverUrl: 'http://localhost:3000' })

      // Mock network error
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const result = await service.verify()
      // Without a key, it returns 'invalid' immediately
      expect(result.status).toBe('invalid')
    })

    it('should report invalid when no license', async () => {
      const { LicenseService } = await import('@/lib/licensing')
      const service = new LicenseService({ serverUrl: 'http://localhost:3000' })
      expect(service.isValid()).toBe(false)
      expect(service.getStatus()).toBe('unavailable')
    })

    it('should report valid after successful verification', async () => {
      const { LicenseService } = await import('@/lib/licensing')
      const service = new LicenseService({ serverUrl: 'http://localhost:3000' })

      localStorageMock.setItem('sanad_license_key', 'TEST-LICENSE-KEY')

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          valid: true,
          expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          nextVerification: null,
          plan: 'enterprise',
          features: ['pdf'],
          message: null,
        }),
      })

      await service.verify()
      expect(service.isValid()).toBe(true)
      expect(service.getStatus()).toBe('valid')
    })

    it('should report expiring when license is near expiry', async () => {
      const { LicenseService } = await import('@/lib/licensing')
      const service = new LicenseService({ serverUrl: 'http://localhost:3000' })

      localStorageMock.setItem('sanad_license_key', 'TEST-LICENSE-KEY')

      // Mock verification with expiry in 15 days
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          valid: true,
          expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          nextVerification: null,
          plan: 'enterprise',
          features: ['pdf'],
          message: null,
        }),
      })

      await service.verify()
      expect(service.getStatus()).toBe('expiring')
    })

    it('should report invalid when license is expired', async () => {
      const { LicenseService } = await import('@/lib/licensing')
      const service = new LicenseService({ serverUrl: 'http://localhost:3000' })

      localStorageMock.setItem('sanad_license_key', 'TEST-LICENSE-KEY')

      // Mock verification with expired date
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          valid: false,
          expiry: null,
          nextVerification: null,
          plan: null,
          features: [],
          message: 'License expired',
        }),
      })

      await service.verify()
      expect(service.getStatus()).toBe('invalid')
    })
  })
})
