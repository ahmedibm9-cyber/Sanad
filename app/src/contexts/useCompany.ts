import { useContext } from 'react'
import { CompanyContext } from './CompanyContextValue'

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
