/**
 * Tests for authentication service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  })),
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'user-123',
          display_name: 'Test User',
          email: 'test@example.com',
          is_system_admin: false,
          active: true,
          preferred_language: 'en',
        },
        error: null,
      }),
    })
  })

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const { AuthService } = await import('@/lib/auth')
      const authService = new AuthService()

      mockSignInWithPassword.mockResolvedValue({
        data: {
          session: {
            access_token: 'token123',
            refresh_token: 'refresh123',
            expires_at: Date.now() + 3600000,
            user: { id: 'user-123', email: 'test@example.com' },
          },
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.user.id).toBe('user-123')
      expect(result.user.email).toBe('test@example.com')
      expect(result.accessToken).toBe('token123')
    })

    it('should throw AuthError on invalid credentials', async () => {
      const { AuthService, AuthError } = await import('@/lib/auth')
      const authService = new AuthService()

      mockSignInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      })

      await expect(authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      })).rejects.toThrow(AuthError)
    })

    it('should throw AuthError when user is disabled', async () => {
      const { AuthService, AuthError } = await import('@/lib/auth')
      const authService = new AuthService()

      mockSignInWithPassword.mockResolvedValue({
        data: {
          session: {
            access_token: 'token123',
            refresh_token: 'refresh123',
            expires_at: Date.now() + 3600000,
            user: { id: 'user-123', email: 'test@example.com' },
          },
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      // Mock disabled user
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            display_name: 'Disabled User',
            email: 'test@example.com',
            is_system_admin: false,
            active: false,
            preferred_language: 'en',
          },
          error: null,
        }),
      })

      await expect(authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrow(AuthError)
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const { AuthService } = await import('@/lib/auth')
      const authService = new AuthService()

      mockSignOut.mockResolvedValue({ error: null })

      await expect(authService.signOut()).resolves.not.toThrow()
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('getSession', () => {
    it('should return null when no session exists', async () => {
      const { AuthService } = await import('@/lib/auth')
      const authService = new AuthService()

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await authService.getSession()
      expect(result).toBeNull()
    })

    it('should return session when authenticated', async () => {
      const { AuthService } = await import('@/lib/auth')
      const authService = new AuthService()

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'token123',
            refresh_token: 'refresh123',
            expires_at: Date.now() + 3600000,
            user: { id: 'user-123', email: 'test@example.com' },
          },
        },
        error: null,
      })

      const result = await authService.getSession()
      expect(result).not.toBeNull()
      expect(result?.user.email).toBe('test@example.com')
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', async () => {
      const { AuthService } = await import('@/lib/auth')
      const authService = new AuthService()

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await authService.isAuthenticated()
      expect(result).toBe(false)
    })
  })
})
