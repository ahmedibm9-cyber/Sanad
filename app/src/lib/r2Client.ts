/**
 * SANAD R2 Client Proxy
 *
 * Browser-safe module for R2 file operations.
 * ALL operations go through the Cloudflare Worker (r2-proxy).
 * R2 credentials NEVER reach the browser.
 *
 * Architecture:
 *   Browser → r2Client.ts → Cloudflare Worker (r2-proxy) → Cloudflare R2
 */

import { getSupabase } from './supabase'
import { env } from './env'

// ===========================================
// Types
// ===========================================

export interface R2UploadResult {
  key: string
  size: number
  contentType: string
}

function encodeBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000
  let binary = ''

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return btoa(binary)
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
): Promise<Response> {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const baseUrl = env.r2ProxyUrl || `${(await import('./env')).env.supabaseUrl}/functions/v1/r2-proxy`

  const response = await fetch(`${baseUrl}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': env.supabaseAnonKey,
    },
    body: JSON.stringify({ ...payload, companyId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `R2 proxy error: ${response.status}`)
  }

  return response
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
  const base64 = encodeBase64(bytes)

  const response = await callR2Proxy('upload', {
    key,
    fileBase64: base64,
    contentType,
    metadata,
  }, companyId)

  return response.json() as Promise<R2UploadResult>
}

// ===========================================
// Download Operations
// ===========================================

/**
 * Download an R2 object through the authenticated Worker.
 */
export async function downloadFromR2(
  key: string,
  companyId: string
): Promise<{ body: Uint8Array; contentType: string }> {
  const response = await callR2Proxy('download', {
    key,
  }, companyId)

  return {
    body: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get('Content-Type') || 'application/octet-stream',
  }
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
  const { body, contentType } = await downloadFromR2(r2Key, companyId)
  const bytes = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer
  const url = URL.createObjectURL(new Blob([bytes], { type: contentType }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
