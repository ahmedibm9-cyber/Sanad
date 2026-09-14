/**
 * Environment variables for Cloudflare R2 MCP Server
 * These are SERVER-ONLY and must never be exposed to clients
 */

// Guard: prevent accidental exposure info
if (typeof window !== 'undefined') {
  throw new Error('[SANAD SECURITY] env.ts must NOT be accessed in browser code.');
}

import { config } from "dotenv";

// Load environment variables from .env file
config();

export const env = {
  // Cloudflare R2 Configuration
  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2Bucket: process.env.R2_BUCKET || 'sanad-production',
  r2PublicUrl: process.env.R2_PUBLIC_URL || '',

  // Server Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Validation
  isR2Configured(): boolean {
    return !!(
      this.r2Endpoint &&
      this.r2AccessKeyId &&
      this.r2SecretAccessKey
    );
  }
};

// Validate required environment variables on import
if (!env.isR2Configured()) {
  console.warn('[SANAD WARNING] R2 storage not fully configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.');
}