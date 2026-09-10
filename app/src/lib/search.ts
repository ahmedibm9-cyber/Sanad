/**
 * Search query sanitization helpers for Supabase ilike queries.
 *
 * Escapes SQL LIKE wildcards (% _ \) so user input is treated as literal text.
 */

/**
 * Escape special characters for use inside a SQL LIKE / ilike pattern.
 *
 * Characters escaped:
 * - `\` → `\\`  (escape character, must be first)
 * - `%` → `\%`  (matches any sequence)
 * - `_` → `\_`  (matches any single character)
 */
export function escapeILike(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

/**
 * Wrap a user-supplied value in `%...%` with ilike wildcards escaped.
 *
 * Use this anywhere you would have written `%${input}%` in an .ilike() call.
 */
export function ilikeSearch(value: string): string {
  return `%${escapeILike(value)}%`
}
