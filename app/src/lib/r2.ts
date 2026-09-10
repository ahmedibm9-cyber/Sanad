/**
 * Cloudflare R2 Storage Adapter — SERVER-ONLY
 *
 * This module is for server-side use ONLY (Node.js, Edge Functions, tests).
 * It must NEVER be imported in browser/bundle code.
 *
 * For browser code, use r2Client.ts instead.
 *
 * Required environment variables for R2 to work:
 * - R2_ENDPOINT: Your Cloudflare R2 endpoint URL
 * - R2_ACCESS_KEY_ID: Your R2 access key ID
 * - R2_SECRET_ACCESS_KEY: Your R2 secret access key
 * - R2_BUCKET: Your R2 bucket name (defaults to 'sanad-production')
 */

// Guard: prevent accidental browser bundling
if (typeof window !== 'undefined') {
  console.error(
    '[SANAD SECURITY] r2.ts must NOT be imported in browser code. ' +
    'Use r2Client.ts for browser-side R2 operations. ' +
    'This import exposes secret credentials to the client.'
  )
}

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'
import { appLogger } from './logger'

// R2 configuration — only constructed when env vars are present
const R2_CONFIG = {
  endpoint: env.r2Endpoint || '',
  region: 'auto',
  credentials: {
    accessKeyId: env.r2AccessKeyId || '',
    secretAccessKey: env.r2SecretAccessKey || '',
  },
}

// R2 bucket name
const R2_BUCKET = env.r2Bucket || 'sanad-production'

// R2 public URL (optional, for public assets)
const R2_PUBLIC_URL = env.r2PublicUrl

// Create S3-compatible client
let r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client(R2_CONFIG)
  }
  return r2Client
}

// ===========================================
// Types
// ===========================================

export interface R2UploadResult {
  key: string
  url: string
  size: number
  contentType: string
}

export interface R2FileMetadata {
  key: string
  size: number
  contentType: string
  lastModified: Date
}

export interface R2PresignedUrlOptions {
  expiresIn?: number // seconds, default 3600 (1 hour)
  contentType?: string
}

// ===========================================
// R2 Object Key Generation
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
 * Generate an R2 object key for shared factory code data.
 */
export function generateFactoryCodeKey(
  filename: string,
  importId: string
): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `shared/factory-code/imports/${importId}/${safeFilename}`
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
// Upload Operations
// ===========================================

/**
 * Upload a file to R2.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | ArrayBuffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<R2UploadResult> {
  if (!isR2Configured()) {
    appLogger.warn('R2 storage not configured. File upload will fail. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.')
    throw new Error('R2 storage not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.')
  }

  const client = getR2Client()
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body as any,
    ContentType: contentType,
    Metadata: metadata,
  })

  await client.send(command)

  const url = R2_PUBLIC_URL 
    ? `${R2_PUBLIC_URL}/${key}`
    : key // Return key for private objects

  return {
    key,
    url,
    size: typeof body === 'string' ? Buffer.byteLength(body) : body.byteLength,
    contentType,
  }
}

/**
 * Upload a file from a browser File object (client-side upload).
 * This generates a presigned URL for direct upload.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  options?: R2PresignedUrlOptions
): Promise<{ url: string; key: string }> {
  const client = getR2Client()
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(client, command, {
    expiresIn: options?.expiresIn || 3600,
  })

  return { url, key }
}

// ===========================================
// Download Operations
// ===========================================

/**
 * Download a file from R2.
 */
export async function downloadFromR2(key: string): Promise<{
  body: Buffer
  contentType: string
  metadata: Record<string, string> | undefined
}> {
  const client = getR2Client()
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  const response = await client.send(command)
  
  if (!response.Body) {
    throw new Error(`File not found: ${key}`)
  }

  const chunks: Uint8Array[] = []
  const reader = response.Body.transformToWebStream().getReader()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const body = Buffer.concat(chunks)

  return {
    body,
    contentType: response.ContentType || 'application/octet-stream',
    metadata: response.Metadata,
  }
}

/**
 * Get a presigned URL for downloading a file.
 */
export async function getPresignedDownloadUrl(
  key: string,
  options?: R2PresignedUrlOptions
): Promise<string> {
  const client = getR2Client()
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  return await getSignedUrl(client, command, {
    expiresIn: options?.expiresIn || 3600,
  })
}

// ===========================================
// Metadata Operations
// ===========================================

/**
 * Get metadata for a file in R2.
 */
export async function getR2Metadata(key: string): Promise<R2FileMetadata | null> {
  try {
    const client = getR2Client()
    
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })

    const response = await client.send(command)

    return {
      key,
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
    }
  } catch (error) {
    // File not found
    return null
  }
}

// ===========================================
// Delete Operations
// ===========================================

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client()
  
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  await client.send(command)
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Check if R2 is properly configured.
 */
export function isR2Configured(): boolean {
  return !!(
    env.r2Endpoint &&
    env.r2AccessKeyId &&
    env.r2SecretAccessKey
  )
}

/**
 * Get the public URL for a file (if R2 public URL is configured).
 */
export function getPublicUrl(key: string): string | null {
  if (!R2_PUBLIC_URL) return null
  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Extract the key from a full URL (if R2 public URL is configured).
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL) return null
  if (!url.startsWith(R2_PUBLIC_URL)) return null
  return url.slice(R2_PUBLIC_URL.length + 1) // +1 for the leading slash
}

/**
 * Download an attachment from R2 by triggering a browser download.
 * Gets a presigned URL and navigates to it.
 */
export async function downloadAttachment(r2Key: string, fileName: string): Promise<void> {
  if (!r2Key) {
    throw new Error('No R2 key provided for download')
  }
  const url = await getPresignedDownloadUrl(r2Key, { expiresIn: 3600 })
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
