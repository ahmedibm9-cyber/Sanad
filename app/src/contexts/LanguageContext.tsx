import { useEffect, useState, type ReactNode } from 'react'
import { LanguageContext } from './LanguageContextValue'
import type { Language } from '../types'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('sanad.ui-language')
    return saved === 'ar' || saved === 'en' ? saved : 'en'
  })
  const dir = language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    localStorage.setItem('sanad.ui-language', language)
  }, [language])

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
