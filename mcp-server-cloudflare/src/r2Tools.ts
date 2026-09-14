import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env.js';

/**
 * Cloudflare R2 Storage Adapter for MCP Server
 * 
 * This module provides server-side R2 operations for use with MCP tools.
 * It mirrors the functionality in src/lib/r2.ts but is optimized for MCP server usage.
 */

// R2 configuration
const R2_CONFIG = {
  endpoint: env.r2Endpoint,
  region: 'auto',
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
  },
};

// R2 bucket name
const R2_BUCKET = env.r2Bucket;

// Create S3-compatible client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    if (!env.isR2Configured()) {
      throw new Error('R2 storage not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.');
    }
    r2Client = new S3Client(R2_CONFIG);
  }
  return r2Client;
}

/**
 * Upload a file to R2.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ key: string; url: string; size: number; contentType: string }> {
  const client = getR2Client();
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await client.send(command);

  const url = env.r2PublicUrl 
    ? `${env.r2PublicUrl}/${key}`
    : key; // Return key for private objects

  return {
    key,
    url,
    size: body instanceof Buffer ? body.length : body.byteLength,
    contentType,
  };
}

/**
 * Download a file from R2.
 */
export async function downloadFromR2(key: string): Promise<{
  body: Buffer;
  contentType: string;
  metadata: Record<string, string> | undefined;
}> {
  const client = getR2Client();
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  const response = await client.send(command);
  
  if (!response.Body) {
    throw new Error(`File not found: ${key}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  const reader = response.Body.transformToWebStream().getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const body = Buffer.concat(chunks);

  return {
    body,
    contentType: response.ContentType || 'application/octet-stream',
    metadata: response.Metadata,
  };
}

/**
 * Get a presigned URL for uploading a file to R2.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  options: { expiresIn?: number } = {}
): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: options.expiresIn ?? 3600,
  });

  return { url, key };
}

/**
 * Get a presigned URL for downloading a file from R2.
 */
export async function getPresignedDownloadUrl(
  key: string,
  options: { expiresIn?: number } = {}
): Promise<string> {
  const client = getR2Client();
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return await getSignedUrl(client, command, {
    expiresIn: options.expiresIn ?? 3600,
  });
}

/**
 * Get metadata for a file in R2.
 */
export async function getR2Metadata(key: string): Promise<{
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
} | null> {
  try {
    const client = getR2Client();
    
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const response = await client.send(command);

    return {
      key,
      size: response.ContentLength ?? 0,
      contentType: response.ContentType ?? 'application/octet-stream',
      lastModified: response.LastModified ?? new Date(),
    };
  } catch (error) {
    // File not found
    return null;
  }
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  await client.send(command);
}

/**
 * List objects in R2 bucket with optional prefix.
 */
export async function listObjects(
  prefix: string = '',
  limit: number = 100
): Promise<Array<{
  key: string;
  size: number;
  lastModified: Date;
}>> {
  const client = getR2Client();
  
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix,
    MaxKeys: limit,
  });

  const response = await client.send(command);
  
  return (response.Contents ?? []).map(obj => ({
    key: obj.Key ?? '',
    size: obj.Size ?? 0,
    lastModified: obj.LastModified ?? new Date()
  }));
}

/**
 * Generate an R2 object key for company-scoped files.
 * Matches the logic in src/lib/r2.ts
 */
export function generateCompanyKey(
  companyId: string,
  category: string,
  filename: string
): string {
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `companies/${companyId}/${category}/${timestamp}_${safeFilename}`;
}

/**
 * Generate an R2 object key for material files.
 * Matches the logic in src/lib/r2.ts
 */
export function generateMaterialKey(
  companyId: string,
  materialId: string,
  fileType: string,
  filename: string
): string {
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `companies/${companyId}/materials/${materialId}/${fileType}/${timestamp}_${safeFilename}`;
}

/**
 * Generate an R2 object key for project attachments.
 * Matches the logic in src/lib/r2.ts
 */
export function generateAttachmentKey(
  companyId: string,
  projectId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `companies/${companyId}/projects/${projectId}/attachments/${timestamp}_${safeFilename}`;
}