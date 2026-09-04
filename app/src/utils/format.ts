/**
 * Shared formatting utilities for SANAD.
 */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Format a date string to "MMM D, YYYY" (e.g. "Jan 5, 2026").
 * Accepts any string parseable by `new Date()`.
 */
export function formatDate(dateStr: string, _locale?: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const month = MONTHS_SHORT[d.getMonth()]
  const day = d.getDate()
  const year = d.getFullYear()
  return `${month} ${day}, ${year}`
}

/**
 * Format a number as a currency string: "1,250 SAR".
 */
export function formatCurrency(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${currency}`
}

/**
 * Format a number with comma separators: "1,250".
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/**
 * Format a date string as relative time: "2 hours ago", "yesterday", etc.
 */
export function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr

  const now = Date.now()
  const diffMs = now - d.getTime()

  // Future dates
  if (diffMs < 0) return formatDate(dateStr)

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  return `${years} year${years === 1 ? '' : 's'} ago`
}
