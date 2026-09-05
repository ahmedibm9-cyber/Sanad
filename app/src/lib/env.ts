/**
 * Environment configuration with type-safe validation.
 */

export interface ClientEnvironment {
  supabaseUrl: string
  supabaseAnonKey: string
  licenseServerUrl?: string
  licenseKey?: string
  appName: string
  appVersion: string
  appEnv: 'development' | 'staging' | 'production'
  devMode: boolean
}

export interface ServerEnvironment {
  supabaseServiceRoleKey?: string
  r2Endpoint?: string
  r2AccessKeyId?: string
  r2SecretAccessKey?: string
  r2Bucket?: string
  r2PublicUrl?: string
  licenseCredential?: string
}

// Validation functions
function validateRequired(value: string | undefined, name: string): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}

function validateOptional(value: string | undefined): string | undefined {
  return value?.trim() || undefined
}

function validateUrl(value: string, name: string): string {
  try {
    new URL(value)
    return value
  } catch {
    throw new Error(`Invalid URL for ${name}: ${value}`)
  }
}

// Client-side environment
let _clientEnv: ClientEnvironment | null = null

function getValidatedClientEnv(): ClientEnvironment {
  if (_clientEnv) return _clientEnv

  const supabaseUrl = validateRequired(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
  validateUrl(supabaseUrl, 'VITE_SUPABASE_URL')

  const supabaseAnonKey = validateRequired(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY')

  _clientEnv = {
    supabaseUrl,
    supabaseAnonKey,
    licenseServerUrl: validateOptional(import.meta.env.VITE_LICENSE_SERVER_URL),
    licenseKey: validateOptional(import.meta.env.VITE_LICENSE_KEY),
    appName: import.meta.env.VITE_APP_NAME || 'SANAD',
    appVersion: import.meta.env.VITE_APP_VERSION || '0.1.0',
    appEnv: (import.meta.env.VITE_APP_ENV || 'development') as 'development' | 'staging' | 'production',
    devMode: import.meta.env.VITE_DEV_MODE === 'true',
  }

  return _clientEnv
}

// Server-side environment
let _serverEnv: ServerEnvironment | null = null

function getValidatedServerEnv(): ServerEnvironment {
  if (_serverEnv) return _serverEnv

  _serverEnv = {
    supabaseServiceRoleKey: validateOptional(process.env.SUPABASE_SERVICE_ROLE_KEY),
    r2Endpoint: validateOptional(process.env.R2_ENDPOINT),
    r2AccessKeyId: validateOptional(process.env.R2_ACCESS_KEY_ID),
    r2SecretAccessKey: validateOptional(process.env.R2_SECRET_ACCESS_KEY),
    r2Bucket: validateOptional(process.env.R2_BUCKET),
    r2PublicUrl: validateOptional(process.env.R2_PUBLIC_URL),
    licenseCredential: validateOptional(process.env.LICENSE_APPLICATION_CREDENTIAL),
  }

  return _serverEnv
}

// Export validated environment
export function getClientEnv(): ClientEnvironment {
  return getValidatedClientEnv()
}

export function getServerEnv(): ServerEnvironment {
  return getValidatedServerEnv()
}

// Quick access helpers for client-side
export const env = {
  get supabaseUrl(): string { return getClientEnv().supabaseUrl },
  get supabaseAnonKey(): string { return getClientEnv().supabaseAnonKey },
  get isDevelopment(): boolean { return getClientEnv().appEnv === 'development' },
  get isStaging(): boolean { return getClientEnv().appEnv === 'staging' },
  get isProduction(): boolean { return getClientEnv().appEnv === 'production' },
  get licenseServerUrl(): string | undefined { return getClientEnv().licenseServerUrl },
  get licenseKey(): string | undefined { return getClientEnv().licenseKey },
  get appName(): string { return getClientEnv().appName },
  get appVersion(): string { return getClientEnv().appVersion },
  get appEnv(): string { return getClientEnv().appEnv },
  get devMode(): boolean { return getClientEnv().devMode },
  get r2Endpoint(): string | undefined { return getServerEnv().r2Endpoint },
  get r2AccessKeyId(): string | undefined { return getServerEnv().r2AccessKeyId },
  get r2SecretAccessKey(): string | undefined { return getServerEnv().r2SecretAccessKey },
  get r2Bucket(): string | undefined { return getServerEnv().r2Bucket },
  get r2PublicUrl(): string | undefined { return getServerEnv().r2PublicUrl },
}
