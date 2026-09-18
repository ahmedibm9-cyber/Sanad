import { createContext } from 'react'
import type { Company } from '../lib/services/company'
import type { UserPermissions } from '../lib/services/permission'

export interface CompanyContextType {
  currentCompany: Company
  companies: Company[]
  isLoading: boolean
  setCurrentCompany: (companyId: string) => void
  permissions: UserPermissions | null
  hasPermission: (permission: string) => boolean
  refreshCompanies: () => Promise<void>
  createCompany: (data: { name_en: string; name_ar: string; short_name: string; company_code: string }) => Promise<Company>
}

export const CompanyContext = createContext<CompanyContextType | undefined>(undefined)
