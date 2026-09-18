import { useContext } from 'react'
import { LanguageContext } from './LanguageContextValue'

export function useLanguage() {
  return useContext(LanguageContext)
}
