/**
 * Global error handling for SANAD application.
 * 
 * This module provides a consistent error handling system
 * with typed errors, error codes, and user-friendly messages.
 */

// ===========================================
// Error Types
// ===========================================

/**
 * Base application error class.
 */
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details
  }
}

/**
 * Validation error for form fields.
 */
export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>

  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, true, { fieldErrors })
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

/**
 * Authentication error.
 */
export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message, code, 401, true)
    this.name = 'AuthError'
  }
}

/**
 * Authorization/Permission error.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403, true)
    this.name = 'ForbiddenError'
  }
}

/**
 * Not found error.
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404, true)
    this.name = 'NotFoundError'
  }
}

/**
 * Conflict error (e.g., duplicate document number).
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, true, details)
    this.name = 'ConflictError'
  }
}

/**
 * Storage error (R2 operations).
 */
export class StorageError extends AppError {
  constructor(message: string, operation?: string) {
    super(message, 'STORAGE_ERROR', 500, true, { operation })
    this.name = 'StorageError'
  }
}

/**
 * Database error.
 */
export class DatabaseError extends AppError {
  constructor(message: string, query?: string) {
    super(message, 'DATABASE_ERROR', 500, false, { query })
    this.name = 'DatabaseError'
  }
}

/**
 * Licensing error.
 */
export class LicensingError extends AppError {
  constructor(message: string, code: string = 'LICENSING_ERROR') {
    super(message, code, 503, true)
    this.name = 'LicensingError'
  }
}

// ===========================================
// Error Handling Utilities
// ===========================================

/**
 * Handle Supabase errors and convert to AppError.
 */
export function handleSupabaseError(error: { message: string; code?: string; details?: unknown }): AppError {
  if (error.code === 'PGRST116' || error.message.includes('not found')) {
    return new NotFoundError('Record')
  }
  if (error.code === '23505') {
    return new ConflictError('Record already exists', { details: error.details })
  }
  if (error.code === '23503') {
    return new ConflictError('Referenced record does not exist', { details: error.details })
  }
  if (error.code === '42501' || error.message.includes('permission denied')) {
    return new ForbiddenError('Database permission denied')
  }
  return new DatabaseError(error.message)
}

/**
 * Handle R2/S3 errors and convert to AppError.
 */
export function handleR2Error(error: unknown, operation: string): StorageError {
  if (error instanceof Error) {
    return new StorageError(`R2 ${operation} failed: ${error.message}`, operation)
  }
  return new StorageError(`R2 ${operation} failed with unknown error`, operation)
}

/**
 * Format error for API response.
 */
export function formatErrorResponse(error: unknown): {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
} {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred'
          : error.message,
      },
    }
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    },
  }
}

import { appLogger } from './logger'

/**
 * Log error for debugging (server-side only).
 */
export function logError(error: unknown, context?: string): void {
  appLogger.error(context || 'Unknown error', error)
}

/**
 * Check if an error is operational (expected) vs programming error.
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}
