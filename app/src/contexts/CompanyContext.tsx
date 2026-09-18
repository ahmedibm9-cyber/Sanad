/**
 * Company context for SANAD application.
 *
 * ARCHITECTURAL NOTE — Multi-Tenant Isolation (C1):
 * Company switching is client-side state. Supabase RLS policies enforce
 * tenant isolation at the database level (every table has company_id RLS).
 * The service layer adds application-level company_id filtering as defense-in-depth.
 * JWT-level company_id claims are NOT implemented because:
 *   1. Supabase JS client doesn't expose JWT claims directly
 *   2. RLS is the authoritative isolation layer
 *   3. Service-layer filtering provides redundant protection
 * If RLS is ever bypassed (debug mode, migration scripts, admin tools),
 * service-layer company_id filtering still blocks cross-tenant access.
 * See: services/workItem.ts, document.ts, customer.ts, material.ts — all filter by companyId.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './useAuth'
import { getCompanyService, type Company } from '../lib/services/company'
import { getMembershipService } from '../lib/services/membership'
import { getPermissionService, type UserPermissions } from '../lib/services/permission'
import { appLogger } from '../lib/logger'
import { CompanyContext, type CompanyContextType } from './CompanyContextValue'

// ===========================================
// Types
// ===========================================

// Default company for when no company is loaded — includes camelCase aliases
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
  // camelCase aliases (prevents undefined in UI)
  shortName: '',
  nameEn: '',
  nameAr: '',
  legalNameEn: undefined,
  legalNameAr: undefined,
  companyCode: '',
  code: '',
  postalCode: undefined,
  vatNumber: undefined,
  bankName: undefined,
  accountName: undefined,
  accountNumber: undefined,
  bankCurrency: undefined,
  defaultLanguage: undefined,
  defaultTemplate: undefined,
  defaultVatRate: undefined,
  defaultCurrency: undefined,
  defaultWeightUnit: undefined,
  defaultPackingUnit: undefined,
  defaultIncoterm: undefined,
  defaultPaymentTerms: undefined,
  defaultDeliveryTerms: undefined,
  defaultPreparedBy: undefined,
  showSignature: undefined,
  showStamp: undefined,
  crNumber: undefined,
}
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

        // Restore previously selected company from localStorage, else auto-select first
        if (userCompanies.length > 0) {
          let restored: Company | undefined
          try {
            const savedId = localStorage.getItem('sanad_company_id')
            if (savedId) {
              restored = userCompanies.find(c => c.id === savedId)
            }
          } catch { /* SSR / private browsing */ }
          const selected = restored || userCompanies[0]
          setCurrentCompanyState(selected)
          const perms = await permissionService.getUserPermissions(user.id, selected.id)
          setPermissions(perms)
        }
      } catch (error) {
        appLogger.error('Failed to load companies', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanies()
  }, [isAuthenticated, user, companyService, permissionService])

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
  }, [user, currentCompany, permissionService])

  // Set current company (with localStorage persistence)
  const setCurrentCompany = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setCurrentCompanyState(company)
      try { localStorage.setItem('sanad_company_id', companyId) } catch { /* SSR / private browsing */ }
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
  }, [user, companyService])

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
  }, [user, companyService])

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
