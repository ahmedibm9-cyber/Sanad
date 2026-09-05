/**
 * API utilities for SANAD application.
 * 
 * This module provides API request/response handling,
 * authentication middleware, and error handling for API routes.
 */

import { getSupabase, type Database } from './supabase'
import { 
  AppError, 
  ValidationError, 
  AuthError, 
  ForbiddenError,
  formatErrorResponse,
  logError 
} from './errors'
import { logRequest, logResponse } from './logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    hasMore?: boolean
  }
}

export interface RequestContext {
  userId: string
  companyId?: string
  permissions: Record<string, boolean>
  isSystemAdmin: boolean
}

export interface ApiRequest {
  method: string
  path: string
  body?: unknown
  query?: Record<string, string>
  params?: Record<string, string>
  headers?: Record<string, string>
}

// ===========================================
// Request Context Resolution
// ===========================================

/**
 * Resolve the request context from a Supabase session.
 * This extracts user identity, active company, and permissions.
 */
export async function resolveRequestContext(
  supabase: SupabaseClient<Database>,
  companyId?: string
): Promise<RequestContext> {
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session) {
    throw new AuthError('Not authenticated')
  }

  const userId = session.user.id

  // Get user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new AuthError('User profile not found')
  }

  const userData = user as any

  if (!userData.active) {
    throw new AuthError('User account is disabled')
  }

  // If no companyId provided, check if user is system admin
  if (!companyId) {
    if (userData.is_system_admin) {
      return {
        userId,
        permissions: {},
        isSystemAdmin: true,
      }
    }
    throw new AuthError('No company context provided')
  }

  // Get membership for the company
  const { data: membership, error: membershipError } = await supabase
    .from('company_memberships')
    .select('id, base_role')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('active', true)
    .single()

  if (membershipError || !membership) {
    throw new ForbiddenError('Not a member of this company')
  }

  const membershipData = membership as any

  // Get permissions
  let permissions: Record<string, boolean> = {}

  if (membershipData.base_role === 'admin' || userData.is_system_admin) {
    // Admin has all permissions - load from catalog
    const { data: allPerms } = await supabase
      .from('permission_catalog')
      .select('permission_key')
    
    allPerms?.forEach((p: any) => { permissions[p.permission_key] = true })
  } else {
    // Load specific permissions
    const { data: permRecords } = await supabase
      .from('membership_permissions')
      .select('permission_key, allowed')
      .eq('membership_id', membershipData.id)

    permRecords?.forEach((p: any) => { permissions[p.permission_key] = p.allowed })

    // Add base viewer permissions
    if (membershipData.base_role === 'viewer') {
      const viewerBase = [
        'projects.view', 'tasks.view', 'documents.view',
        'customers.view', 'materials.view', 'reports.view', 'factory.view',
      ]
      viewerBase.forEach(p => { if (!(p in permissions)) permissions[p] = true })
    }
  }

  return {
    userId,
    companyId,
    permissions,
    isSystemAdmin: userData.is_system_admin,
  }
}

// ===========================================
// Permission Checking
// ===========================================

/**
 * Check if the context has a specific permission.
 */
export function hasPermission(
  context: RequestContext,
  permissionKey: string
): boolean {
  if (context.isSystemAdmin) return true
  return context.permissions[permissionKey] === true
}

/**
 * Require a permission or throw.
 */
export function requirePermission(
  context: RequestContext,
  permissionKey: string
): void {
  if (!hasPermission(context, permissionKey)) {
    throw new ForbiddenError(`Permission denied: ${permissionKey}`)
  }
}

// ===========================================
// API Response Helpers
// ===========================================

/**
 * Create a success response.
 */
export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  }
}

/**
 * Create an error response.
 */
export function errorResponse(error: unknown): ApiResponse {
  return formatErrorResponse(error)
}

// ===========================================
// API Route Handler Wrapper
// ===========================================

/**
 * Wrap an API route handler with error handling and logging.
 */
export function createApiHandler<TInput, TOutput>(
  handler: (req: ApiRequest, context: RequestContext, input: TInput) => Promise<TOutput>,
  inputValidator?: (req: ApiRequest) => TInput
) {
  return async (req: ApiRequest): Promise<ApiResponse<TOutput>> => {
    const startTime = Date.now()
    
    try {
      // Log request
      logRequest(req.method, req.path)

      // Get Supabase client
      const supabase = getSupabase()

      // Resolve request context
      const companyId = req.query?.company_id || req.params?.company_id
      const context = await resolveRequestContext(supabase, companyId)

      // Validate and parse input
      let input: TInput
      if (inputValidator) {
        input = inputValidator(req)
      } else {
        input = req.body as TInput
      }

      // Execute handler
      const result = await handler(req, context, input)

      // Log response
      const duration = Date.now() - startTime
      logResponse(req.method, req.path, 200, duration)

      return successResponse(result)
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime
      logError(error, `${req.method} ${req.path}`)
      logResponse(req.method, req.path, 
        error instanceof AppError ? error.statusCode : 500, duration)

      return errorResponse(error) as ApiResponse<TOutput>
    }
  }
}

// ===========================================
// Database Transaction Helper
// ===========================================

/**
 * Execute a function within a database transaction.
 * Uses Supabase's RPC for transaction support.
 */
export async function withTransaction<T>(
  supabase: SupabaseClient<Database>,
  fn: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  // Note: Supabase doesn't have direct transaction support in the JS client
  // For V1, we execute operations sequentially with error handling
  // For critical transactions, use database-level transactions via RPC
  
  try {
    return await fn(supabase)
  } catch (error) {
    logError(error, 'Transaction failed')
    throw error
  }
}

// ===========================================
// Pagination Helpers
// ===========================================

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Calculate pagination offset and limit.
 */
export function getPaginationBounds(params: PaginationParams): {
  from: number
  to: number
  page: number
  pageSize: number
} {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { from, to, page, pageSize }
}

/**
 * Create pagination meta from result.
 */
export function createPaginationMeta(
  total: number,
  page: number,
  pageSize: number
): ApiResponse['meta'] {
  return {
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  }
}

// ===========================================
// Validation Helpers
// ===========================================

/**
 * Validate required fields in input.
 */
export function validateRequiredFields(
  input: Record<string, unknown>,
  requiredFields: string[]
): void {
  const errors: Record<string, string[]> = {}

  requiredFields.forEach(field => {
    const value = input[field]
    if (value === undefined || value === null || value === '') {
      errors[field] = [`${field} is required`]
    }
  })

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }
}

/**
 * Validate email format.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate UUID format.
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// ===========================================
// Company Isolation Helpers
// ===========================================

/**
 * Add company_id filter to a Supabase query.
 */
export function withCompanyFilter<T extends Record<string, unknown>>(
  query: { eq: (col: string, val: unknown) => any },
  companyId: string,
  column: string = 'company_id'
) {
  return query.eq(column, companyId)
}

/**
 * Validate that a record belongs to the specified company.
 */
export function validateCompanyOwnership(
  record: { company_id?: string },
  companyId: string
): void {
  if (record.company_id && record.company_id !== companyId) {
    throw new ForbiddenError('Record does not belong to this company')
  }
}
