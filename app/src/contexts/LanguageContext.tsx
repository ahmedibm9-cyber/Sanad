import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Language } from '../types'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  dir: 'ltr' | 'rtl'
  t: (en: string, ar: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  dir: 'ltr',
  t: (en) => en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const dir = language === 'ar' ? 'rtl' : 'ltr'

  const t = (en: string, ar: string) => language === 'ar' ? ar : en

  const value = { language, setLanguage, dir: dir as 'ltr' | 'rtl', t }

  return (
    <LanguageContext.Provider value={value}>
      <div dir={dir} className={dir === 'rtl' ? 'font-arabic rtl' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
