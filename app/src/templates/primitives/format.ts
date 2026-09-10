/* ── Formatting helpers shared across all templates ─────── */

export function formatDate(dateStr: string, lang: 'en' | 'ar'): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString(
      lang === 'ar' ? 'ar-SA' : 'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' }
    )
  } catch {
    return dateStr
  }
}

export function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`
}

export function formatNumber(n: number): string {
  return n.toLocaleString()
}

export function l(
  lang: 'en' | 'ar',
  en: string,
  ar: string
): string {
  return lang === 'ar' ? ar : en
}

export function dir(lang: 'en' | 'ar'): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}

export function align(lang: 'en' | 'ar'): 'left' | 'right' {
  return lang === 'ar' ? 'right' : 'left'
}
