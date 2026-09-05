/**
 * Authentication context for SANAD application.
 * 
 * This provides authentication state and methods to the entire React app.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getAuthService, type AuthUser, type AuthSession, type LoginCredentials } from '../lib/auth'
import { getLicenseService, type LicenseInfo } from '../lib/licensing'
import { appLogger } from '../lib/logger'

// ===========================================
// Types
// ===========================================

interface AuthContextType {
  // Authentication state
  user: AuthUser | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Authentication methods
  signIn: (credentials: LoginCredentials) => Promise<void>
  signUp: (credentials: { email: string; password: string; displayName: string }) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  
  // License state
  licenseInfo: LicenseInfo | null
  isLicenseValid: boolean
  isLicenseLoading: boolean
  verifyLicense: () => Promise<void>
  
  // Utility
  isSystemAdmin: boolean
  hasPermission: (permission: string) => boolean
}

// ===========================================
// Context
// ===========================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
          }
        } else if (event === 'SIGNED_OUT') {
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
  }, [])

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
  }, [])

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
  }, [])

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
  }, [])

  // Refresh session
  const refreshSession = useCallback(async () => {
    const refreshedSession = await authService.refreshSession()
    if (refreshedSession) {
      setSession(refreshedSession)
      setUser(refreshedSession.user)
    }
  }, [])

  // Verify license
  const verifyLicense = useCallback(async () => {
    setIsLicenseLoading(true)
    try {
      const info = await licenseService.verify()
      setLicenseInfo(info)
    } finally {
      setIsLicenseLoading(false)
    }
  }, [])

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

// ===========================================
// Hook
// ===========================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
