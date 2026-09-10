/**
 * SANAD R2 Client Proxy
 *
 * Browser-safe module for R2 file operations.
 * ALL operations go through the Supabase Edge Function (r2-proxy).
 * R2 credentials NEVER reach the browser.
 *
 * Architecture:
 *   Browser → r2Client.ts → Edge Function (r2-proxy) → Cloudflare R2
 */

import { getSupabase } from './supabase'

// ===========================================
// Types
// ===========================================

export interface R2UploadResult {
  key: string
  size: number
  contentType: string
}

export interface R2DownloadResult {
  url: string
  key: string
  expiresIn: number
}

// ===========================================
// Key Generation (same as r2.ts, safe for browser)
// ===========================================

/**
 * Generate an R2 object key for company-scoped files.
 */
export function generateCompanyKey(
  companyId: string,
  category: string,
  filename: string
): string {
  const timestamp = Date.now()
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `companies/${companyId}/${category}/${timestamp}_${safeFilename}`
}

/**
 * Generate an R2 object key for material files.
 */
export function generateMaterialKey(
  companyId: string,
  materialId: string,
  fileType: string,
  filename: string
): string {
  const timestamp = Date.now()
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `companies/${companyId}/materials/${materialId}/${fileType}/${timestamp}_${safeFilename}`
}

/**
 * Generate an R2 object key for project attachments.
 */
export function generateAttachmentKey(
  companyId: string,
  projectId: string,
  filename: string
): string {
  const timestamp = Date.now()
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `companies/${companyId}/projects/${projectId}/attachments/${timestamp}_${safeFilename}`
}

/**
 * Generate an R2 object key for company assets (logo, stamp, signature).
 */
export function generateAssetKey(
  companyId: string,
  assetType: string,
  filename: string
): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `companies/${companyId}/assets/${assetType}/${safeFilename}`
}

/**
 * Generate an R2 object key for backups.
 */
export function generateBackupKey(
  deploymentId: string,
  backupId: string,
  filename: string
): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `backups/${deploymentId}/${backupId}/${safeFilename}`
}

// ===========================================
// Edge Function Call Helper
// ===========================================

async function callR2Proxy(
  action: string,
  payload: Record<string, unknown>,
  companyId: string
): Promise<unknown> {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const { supabaseUrl } = await import('./env').then(m => ({ supabaseUrl: m.env.supabaseUrl }))

  const response = await fetch(`${supabaseUrl}/functions/v1/r2-proxy/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': (await import('./env')).env.supabaseAnonKey,
    },
    body: JSON.stringify({ ...payload, companyId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `R2 proxy error: ${response.status}`)
  }

  return response.json()
}

// ===========================================
// Upload Operations
// ===========================================

/**
 * Upload a file to R2 via the Edge Function proxy.
 * Credentials never reach the browser.
 */
export async function uploadToR2(
  key: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string,
  companyId: string,
  metadata?: Record<string, string>
): Promise<R2UploadResult> {
  // Convert to base64 for safe transport
  const bytes = body instanceof Uint8Array ? body : new Uint8Array(body)
  const base64 = btoa(String.fromCharCode(...bytes))

  const result = await callR2Proxy('upload', {
    key,
    fileBase64: base64,
    contentType,
    metadata,
  }, companyId) as R2UploadResult

  return result
}

/**
 * Get a presigned upload URL for direct browser-to-R2 upload.
 * For large files where base64 encoding is inefficient.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  companyId: string,
  expiresIn?: number
): Promise<{ url: string; key: string }> {
  const result = await callR2Proxy('presign', {
    key,
    contentType,
    expiresIn: expiresIn || 3600,
  }, companyId) as { url: string; key: string }

  return result
}

// ===========================================
// Download Operations
// ===========================================

/**
 * Get a presigned download URL for a file in R2.
 */
export async function getPresignedDownloadUrl(
  key: string,
  companyId: string,
  expiresIn?: number
): Promise<string> {
  const result = await callR2Proxy('download', {
    key,
    expiresIn: expiresIn || 3600,
  }, companyId) as R2DownloadResult

  return result.url
}

/**
 * Download an attachment from R2 by triggering a browser download.
 */
export async function downloadAttachment(
  r2Key: string,
  fileName: string,
  companyId: string
): Promise<void> {
  if (!r2Key) {
    throw new Error('No R2 key provided for download')
  }
  const url = await getPresignedDownloadUrl(r2Key, companyId, 3600)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ===========================================
// Delete Operations
// ===========================================

/**
 * Delete a file from R2 via the Edge Function proxy.
 */
export async function deleteFromR2(key: string, companyId: string): Promise<void> {
  await callR2Proxy('delete', { key }, companyId)
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Extract the key from a full R2 URL.
 */
export function extractKeyFromUrl(url: string, publicUrl?: string): string | null {
  if (!publicUrl) return null
  if (!url.startsWith(publicUrl)) return null
  return url.slice(publicUrl.length + 1)
}
