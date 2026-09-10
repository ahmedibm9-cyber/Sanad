/**
 * Authentication service for SANAD application.
 * 
 * This module handles user authentication, session management,
 * and user identity through Supabase Auth.
 */

import { getSupabase, type Database } from './supabase'
import { authLogger } from './logger'
import { AuthError, ForbiddenError } from './errors'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface AuthUser {
  id: string
  email: string
  displayName: string
  isSystemAdmin: boolean
  active: boolean
  preferredLanguage: 'en' | 'ar'
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  displayName: string
  preferredLanguage?: 'en' | 'ar'
}

// ===========================================
// Auth Service
// ===========================================

export class AuthService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Sign in with email and password.
   */
  async signIn(credentials: LoginCredentials): Promise<AuthSession> {
    authLogger.info('Attempting sign in', { email: credentials.email })

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      authLogger.error('Sign in failed', error)
      throw new AuthError(error.message, 'SIGN_IN_FAILED')
    }

    if (!data.session || !data.user) {
      throw new AuthError('No session created', 'SESSION_ERROR')
    }

    // Get user profile
    const profile = await this.getUserProfile(data.user.id)

    // Check if user is active
    if (!profile.active) {
      // Sign out the user if they're disabled
      await this.supabase.auth.signOut()
      throw new AuthError('Account is disabled', 'ACCOUNT_DISABLED')
    }

    authLogger.info('Sign in successful', { userId: data.user.id })

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        displayName: profile.display_name,
        isSystemAdmin: profile.is_system_admin,
        active: profile.active,
        preferredLanguage: profile.preferred_language,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at || 0,
    }
  }

  /**
   * Sign up a new user.
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthSession> {
    authLogger.info('Attempting sign up', { email: credentials.email })

    const { data, error } = await this.supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          display_name: credentials.displayName,
          preferred_language: credentials.preferredLanguage || 'en',
        },
      },
    })

    if (error) {
      authLogger.error('Sign up failed', error)
      throw new AuthError(error.message, 'SIGN_UP_FAILED')
    }

    if (!data.session || !data.user) {
      throw new AuthError('No session created', 'SESSION_ERROR')
    }

    // The user profile is auto-created by the trigger
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const profile = await this.getUserProfile(data.user.id)

    authLogger.info('Sign up successful', { userId: data.user.id })

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        displayName: profile.display_name,
        isSystemAdmin: profile.is_system_admin,
        active: profile.active,
        preferredLanguage: profile.preferred_language,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at || 0,
    }
  }

  /**
   * Sign out the current user.
   */
  async signOut(): Promise<void> {
    authLogger.info('Signing out')

    const { error } = await this.supabase.auth.signOut()

    if (error) {
      authLogger.error('Sign out failed', error)
      throw new AuthError(error.message, 'SIGN_OUT_FAILED')
    }

    authLogger.info('Sign out successful')
  }

  /**
   * Get the current session.
   */
  async getSession(): Promise<AuthSession | null> {
    const { data: { session }, error } = await this.supabase.auth.getSession()

    if (error) {
      authLogger.error('Error getting session', error)
      return null
    }

    if (!session) {
      return null
    }

    // Get user profile
    try {
      const profile = await this.getUserProfile(session.user.id)

      if (!profile.active) {
        return null
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          displayName: profile.display_name,
          isSystemAdmin: profile.is_system_admin,
          active: profile.active,
          preferredLanguage: profile.preferred_language,
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at || 0,
      }
    } catch {
      return null
    }
  }

  /**
   * Get the current user.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession()
    return session?.user || null
  }

  /**
   * Check if the current user is authenticated.
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession()
    return session !== null
  }

  /**
   * Refresh the current session.
   */
  async refreshSession(): Promise<AuthSession | null> {
    const { data, error } = await this.supabase.auth.refreshSession()

    if (error) {
      authLogger.error('Error refreshing session', error)
      return null
    }

    if (!data.session || !data.user) {
      return null
    }

    const profile = await this.getUserProfile(data.user.id)

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        displayName: profile.display_name,
        isSystemAdmin: profile.is_system_admin,
        active: profile.active,
        preferredLanguage: profile.preferred_language,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at || 0,
    }
  }

  /**
   * Update user profile.
   */
  async updateProfile(updates: Partial<Pick<AuthUser, 'displayName' | 'preferredLanguage'>>): Promise<AuthUser> {
    const session = await this.getSession()
    if (!session) {
      throw new AuthError('Not authenticated')
    }

    const updateData: Record<string, unknown> = {}
    if (updates.displayName) updateData.display_name = updates.displayName
    if (updates.preferredLanguage) updateData.preferred_language = updates.preferredLanguage

    const { error } = await (this.supabase as any)
      .from('users')
      .update(updateData)
      .eq('id', session.user.id)

    if (error) {
      throw new AuthError('Failed to update profile')
    }

    return {
      ...session.user,
      ...updates,
    }
  }

  /**
   * Change password.
   */
  async changePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw new AuthError(error.message, 'PASSWORD_CHANGE_FAILED')
    }
  }

  /**
   * Send password reset email.
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw new AuthError(error.message, 'RESET_FAILED')
    }
  }

  /**
   * Get user profile from the users table.
   */
  private async getUserProfile(userId: string) {
    const { data, error } = await (this.supabase as any)
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      return data
    }

    // If users table query fails (e.g., RLS), deny access instead of trusting auth metadata
    // Auth metadata can be attacker-controlled and must never be used for authorization
    throw new AuthError('Unable to verify user profile')
  }

  /**
   * Listen for auth state changes.
   */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService()
  }
  return authServiceInstance
}

export default AuthService
