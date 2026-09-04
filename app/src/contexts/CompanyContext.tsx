import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Company, CompanyId } from '../types'
import { companies } from '../data/mockData'

interface CompanyContextType {
  currentCompany: Company
  setCurrentCompany: (id: CompanyId) => void
  allCompanies: Company[]
}

const CompanyContext = createContext<CompanyContextType>({
  currentCompany: companies[0],
  setCurrentCompany: () => {},
  allCompanies: companies,
})

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompanyId, setCurrentCompanyId] = useState<CompanyId>(companies[0].id)
  const currentCompany = companies.find(c => c.id === currentCompanyId) || companies[0]

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      setCurrentCompany: setCurrentCompanyId,
      allCompanies: companies,
    }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  return useContext(CompanyContext)
}
