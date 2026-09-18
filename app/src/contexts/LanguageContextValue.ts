import { createContext } from 'react'
import type { Language } from '../types'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  dir: 'ltr' | 'rtl'
  t: (en: string, ar: string) => string
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  dir: 'ltr',
  t: (en) => en,
})
