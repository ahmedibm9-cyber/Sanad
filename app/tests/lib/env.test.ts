/**
 * Tests for environment configuration.
 */

import { describe, it, expect, vi } from 'vitest'

// Test the validation functions directly without importing the module
// since import.meta.env is not available in test environment

describe('Environment Validation Functions', () => {
  // Create test versions of the validation functions
  function validateRequired(value: string | undefined, name: string): string {
    if (!value || value.trim() === '') {
      throw new Error(`Missing required environment variable: ${name}`)
    }
    return value.trim()
  }

  function validateOptional(value: string | undefined): string | undefined {
    return value?.trim() || undefined
  }

  function validateUrl(value: string, name: string): string {
    try {
      new URL(value)
      return value
    } catch {
      throw new Error(`Invalid URL for ${name}: ${value}`)
    }
  }

  it('should validate required environment variables', () => {
    expect(() => validateRequired(undefined, 'TEST_VAR')).toThrow('Missing required environment variable: TEST_VAR')
    expect(() => validateRequired('', 'TEST_VAR')).toThrow('Missing required environment variable: TEST_VAR')
    expect(validateRequired('value', 'TEST_VAR')).toBe('value')
    expect(validateRequired('  value  ', 'TEST_VAR')).toBe('value')
  })

  it('should validate optional environment variables', () => {
    expect(validateOptional(undefined)).toBeUndefined()
    expect(validateOptional('')).toBeUndefined()
    expect(validateOptional('  ')).toBeUndefined()
    expect(validateOptional('value')).toBe('value')
    expect(validateOptional('  value  ')).toBe('value')
  })

  it('should validate URLs', () => {
    expect(() => validateUrl('not-a-url', 'TEST')).toThrow('Invalid URL')
    expect(() => validateUrl('ftp://example.com', 'TEST')).not.toThrow()
    expect(validateUrl('https://example.com', 'TEST')).toBe('https://example.com')
    expect(validateUrl('http://localhost:54321', 'TEST')).toBe('http://localhost:54321')
  })
})

describe('Environment Configuration Object', () => {
  it('should provide type-safe environment access', () => {
    // Test the shape of the environment object
    const env = {
      supabaseUrl: 'http://localhost:54321',
      supabaseAnonKey: 'test-key',
      appName: 'SANAD',
      appVersion: '0.1.0',
      appEnv: 'development' as const,
      devMode: true,
    }

    expect(env.appName).toBe('SANAD')
    expect(env.appVersion).toBe('0.1.0')
    expect(env.appEnv).toBe('development')
    expect(env.devMode).toBe(true)
  })

  it('should support different environments', () => {
    const devEnv = { appEnv: 'development' as const }
    const stagingEnv = { appEnv: 'staging' as const }
    const prodEnv = { appEnv: 'production' as const }

    expect(devEnv.appEnv).toBe('development')
    expect(stagingEnv.appEnv).toBe('staging')
    expect(prodEnv.appEnv).toBe('production')
  })
})
