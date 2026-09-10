/* ── Fulla utility functions (ported from Fulla HTML app) ── */

export function S(v: unknown): string {
  return String(v ?? '')
}

export function n(v: unknown): number {
  const num = Number(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(num) ? num : 0
}

export function fmt(v: unknown, d = 2): string {
  return n(v).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}

export function esc(v: unknown): string {
  return S(v).replace(/[&<>"']/g, (c) =>
    ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c] ?? c)
  )
}
