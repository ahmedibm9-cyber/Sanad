import { createContext } from 'react'
import type { AuthUser, AuthSession, LoginCredentials } from '../lib/auth'
import type { LicenseInfo } from '../lib/licensing'

export interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (credentials: LoginCredentials) => Promise<void>
  signUp: (credentials: { email: string; password: string; displayName: string }) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  licenseInfo: LicenseInfo | null
  isLicenseValid: boolean
  isLicenseExpiringSoon: boolean
  isLicenseLoading: boolean
  verifyLicense: () => Promise<void>
  isSystemAdmin: boolean
  hasPermission: (permission: string) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
