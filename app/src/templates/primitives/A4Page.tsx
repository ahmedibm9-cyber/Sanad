import type { ReactNode } from 'react'
import type { FullaTemplateKey } from '../types'

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
      className={`bg-white text-[11px] leading-relaxed ${isAr ? 'font-arabic' : ''}`}
      style={{
        fontFamily: isAr ? "'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif",
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        margin: '0 auto',
      }}
      data-template={templateKey}
    >
      {children}
    </div>
  )
}
