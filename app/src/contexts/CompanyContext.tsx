/**
 * Company context for SANAD application.
 * 
 * This provides company state and methods to the entire React app.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getCompanyService, type Company } from '../lib/services/company'
import { getMembershipService } from '../lib/services/membership'
import { getPermissionService, type UserPermissions } from '../lib/services/permission'
import { appLogger } from '../lib/logger'

// ===========================================
// Types
// ===========================================

// Default company for when no company is loaded
const DEFAULT_COMPANY: Company = {
  id: '',
  name_en: '',
  name_ar: '',
  legal_name_en: null,
  legal_name_ar: null,
  short_name: '',
  company_code: '',
  active: false,
  created_at: '',
  updated_at: '',
  created_by: null,
  updated_by: null,
}

interface CompanyContextType {
  // Company state
  currentCompany: Company
  companies: Company[]
  isLoading: boolean
  
  // Company selection
  setCurrentCompany: (companyId: string) => void
  
  // Permissions
  permissions: UserPermissions | null
  hasPermission: (permission: string) => boolean
  
  // Methods
  refreshCompanies: () => Promise<void>
  createCompany: (data: {
    name_en: string
    name_ar: string
    short_name: string
    company_code: string
  }) => Promise<Company>
}

// ===========================================
// Context
// ===========================================

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

// ===========================================
// Provider
// ===========================================

interface CompanyProviderProps {
  children: ReactNode
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)

  const companyService = getCompanyService()
  const membershipService = getMembershipService()
  const permissionService = getPermissionService()

  // Load companies when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCompanies([])
      setCurrentCompanyState(null)
      setPermissions(null)
      setIsLoading(false)
      return
    }

    const loadCompanies = async () => {
      setIsLoading(true)
      try {
        const userCompanies = await companyService.getUserCompanies({
          userId: user.id,
          permissions: {},
          isSystemAdmin: user.isSystemAdmin,
        })

        setCompanies(userCompanies)

        // Auto-select first company if none selected
        if (userCompanies.length > 0 && !currentCompany) {
          setCurrentCompanyState(userCompanies[0])
          // Load permissions for the first company
          const perms = await permissionService.getUserPermissions(user.id, userCompanies[0].id)
          setPermissions(perms)
        }
      } catch (error) {
        appLogger.error('Failed to load companies', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanies()
  }, [isAuthenticated, user])

  // Load permissions when company changes
  useEffect(() => {
    if (!user || !currentCompany) {
      setPermissions(null)
      return
    }

    const loadPermissions = async () => {
      try {
        const perms = await permissionService.getUserPermissions(user.id, currentCompany.id)
        setPermissions(perms)
      } catch (error) {
        appLogger.error('Failed to load permissions', error)
      }
    }

    loadPermissions()
  }, [user, currentCompany])

  // Set current company
  const setCurrentCompany = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setCurrentCompanyState(company)
    }
  }, [companies])

  // Check permission
  const hasPermission = useCallback((permission: string) => {
    if (!permissions) return false
    if (permissions.isSystemAdmin) return true
    return permissions.permissions[permission] === true
  }, [permissions])

  // Refresh companies
  const refreshCompanies = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const userCompanies = await companyService.getUserCompanies({
        userId: user.id,
        permissions: {},
        isSystemAdmin: user.isSystemAdmin,
      })
      setCompanies(userCompanies)
    } catch (error) {
      appLogger.error('Failed to refresh companies', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Create company
  const createCompany = useCallback(async (data: {
    name_en: string
    name_ar: string
    short_name: string
    company_code: string
  }): Promise<Company> => {
    if (!user) throw new Error('Not authenticated')

    const newCompany = await companyService.createCompany(data, {
      userId: user.id,
      permissions: {},
      isSystemAdmin: user.isSystemAdmin,
    })

    setCompanies(prev => [...prev, newCompany])
    return newCompany
  }, [user])

  const value: CompanyContextType = {
    currentCompany: currentCompany || DEFAULT_COMPANY,
    companies,
    isLoading,
    setCurrentCompany,
    permissions,
    hasPermission,
    refreshCompanies,
    createCompany,
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

// ===========================================
// Hook
// ===========================================

export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

export default CompanyContext
