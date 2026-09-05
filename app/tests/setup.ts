/**
 * Test setup for SANAD application.
 * 
 * This file configures the test environment and provides
 * common test utilities.
 */

import '@testing-library/jest-dom'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      range: vi.fn().mockReturnThis(),
    })),
  })),
}))

// Mock R2 module
vi.mock('@/lib/r2', () => ({
  isR2Configured: vi.fn(() => false),
  uploadToR2: vi.fn(),
  downloadFromR2: vi.fn(),
  deleteFromR2: vi.fn(),
  getPresignedUploadUrl: vi.fn(),
  getPresignedDownloadUrl: vi.fn(),
  generateCompanyKey: vi.fn(() => 'test-key'),
  generateMaterialKey: vi.fn(() => 'test-key'),
  generateAttachmentKey: vi.fn(() => 'test-key'),
  generateAssetKey: vi.fn(() => 'test-key'),
  generateFactoryCodeKey: vi.fn(() => 'test-key'),
  generateBackupKey: vi.fn(() => 'test-key'),
}))

// Common test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  display_name: 'Test User',
  email: 'test@example.com',
  preferred_language: 'en' as const,
  is_system_admin: false,
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockCompany = (overrides = {}) => ({
  id: 'test-company-123',
  name_en: 'Test Company',
  name_ar: 'شركة اختبار',
  short_name: 'Test',
  company_code: 'TEST',
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test-user-123',
  updated_by: 'test-user-123',
  ...overrides,
})

export const createMockMembership = (overrides = {}) => ({
  id: 'test-membership-123',
  company_id: 'test-company-123',
  user_id: 'test-user-123',
  base_role: 'user' as const,
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockRequestContext = (overrides = {}) => ({
  userId: 'test-user-123',
  companyId: 'test-company-123',
  permissions: {
    'projects.view': true,
    'projects.create': true,
    'projects.edit': true,
    'documents.view': true,
    'documents.create': true,
  },
  isSystemAdmin: false,
  ...overrides,
})

// Test environment setup
beforeEach(() => {
  vi.clearAllMocks()
})
