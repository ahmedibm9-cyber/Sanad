import type { ReactNode } from 'react'
import type { FullaTemplateKey } from '../types'

/* ── Fulla Template CSS (from Fulla_Dynamic_HTML_CSS_Templates) ── */
import './fullaTemplateStyles.css'

/* ── A4 Page Wrapper ────────────────────────────────────── */
export function A4Page({
  templateKey,
  lang,
  children,
}: {
  templateKey: FullaTemplateKey
  lang: 'en' | 'ar'
  children: ReactNode
}) {
  const isAr = lang === 'ar'
  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={isAr ? 'font-arabic' : ''}
      style={{
        fontFamily: isAr ? "'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif",
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        background: '#fff',
      }}
      data-template={templateKey}
    >
      {children}
    </div>
  )
}
