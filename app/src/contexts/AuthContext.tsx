/**
 * Authentication context for SANAD application.
 * 
 * This provides authentication state and methods to the entire React app.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { getAuthService, type AuthUser, type AuthSession, type LoginCredentials } from '../lib/auth'
import { getLicenseService, type LicenseInfo } from '../lib/licensing'
import { AuthContext, type AuthContextType } from './AuthContextValue'
import { appLogger } from '../lib/logger'
import { backupScheduler } from '../lib/backupScheduler'

// ===========================================
// Types
// ===========================================

// ===========================================
// Provider
// ===========================================

interface AuthProviderProps {
  children: ReactNode
}
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null)
  const [isLicenseLoading, setIsLicenseLoading] = useState(true)

  const authService = getAuthService()
  const licenseService = getLicenseService()

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize license service
        await licenseService.initialize()
        setLicenseInfo(licenseService.getLicenseInfo())
        setIsLicenseLoading(false)

        // Check for existing session
        const existingSession = await authService.getSession()
        if (existingSession) {
          setSession(existingSession)
          setUser(existingSession.user)
          backupScheduler.start()
        }
      } catch (error) {
        appLogger.error('Failed to initialize auth', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, newSession) => {
        appLogger.info('Auth state changed', { event })

        if (event === 'SIGNED_IN' && newSession) {
          const currentSession = await authService.getSession()
          if (currentSession) {
            setSession(currentSession)
            setUser(currentSession.user)
            backupScheduler.start()
          }
        } else if (event === 'SIGNED_OUT') {
          backupScheduler.stop()
          setSession(null)
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          const currentSession = await authService.getSession()
          if (currentSession) {
            setSession(currentSession)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [authService, licenseService])

  // Sign in
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const newSession = await authService.signIn(credentials)
      setSession(newSession)
      setUser(newSession.user)
    } finally {
      setIsLoading(false)
    }
  }, [authService])

  // Sign up
  const signUp = useCallback(async (credentials: { email: string; password: string; displayName: string }) => {
    setIsLoading(true)
    try {
      const newSession = await authService.signUp(credentials)
      setSession(newSession)
      setUser(newSession.user)
    } finally {
      setIsLoading(false)
    }
  }, [authService])

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.signOut()
      setSession(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [authService])

  // Refresh session
  const refreshSession = useCallback(async () => {
    const refreshedSession = await authService.refreshSession()
    if (refreshedSession) {
      setSession(refreshedSession)
      setUser(refreshedSession.user)
    }
  }, [authService])

  // Verify license
  const verifyLicense = useCallback(async () => {
    setIsLicenseLoading(true)
    try {
      const info = await licenseService.verify()
      setLicenseInfo(info)
    } finally {
      setIsLicenseLoading(false)
    }
  }, [licenseService])

  // Permission checking
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})

  // Load permissions when user/company changes
  useEffect(() => {
    if (session?.user) {
      // Permissions will be loaded when a company is selected
      // For now, use empty permissions
      setPermissions({})
    }
  }, [session])

  const hasPermission = useCallback((permission: string) => {
    if (user?.isSystemAdmin) return true
    return permissions[permission] === true
  }, [user, permissions])

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    licenseInfo,
    isLicenseValid: licenseService.isValid(),
    isLicenseExpiringSoon: licenseService.isExpiringSoon(),
    isLicenseLoading,
    verifyLicense,
    isSystemAdmin: user?.isSystemAdmin || false,
    hasPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
