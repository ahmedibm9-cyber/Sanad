/**
 * Tests for error handling utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  StorageError,
  formatErrorResponse,
} from '@/lib/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400, true)
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error.name).toBe('AppError')
    })

    it('should default to 500 status code', () => {
      const error = new AppError('Error', 'CODE')
      expect(error.statusCode).toBe(500)
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with field errors', () => {
      const fieldErrors = {
        name: ['Name is required'],
        email: ['Invalid email format'],
      }
      const error = new ValidationError('Validation failed', fieldErrors)
      
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.fieldErrors).toEqual(fieldErrors)
    })
  })

  describe('AuthError', () => {
    it('should create auth error with correct code', () => {
      const error = new AuthError('Not authenticated')
      
      expect(error.code).toBe('AUTH_ERROR')
      expect(error.statusCode).toBe(401)
    })
  })

  describe('ForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = new ForbiddenError()
      expect(error.message).toBe('Insufficient permissions')
    })

    it('should create forbidden error with custom message', () => {
      const error = new ForbiddenError('Custom message')
      expect(error.message).toBe('Custom message')
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error for resource', () => {
      const error = new NotFoundError('User')
      expect(error.message).toBe('User not found')
    })

    it('should create not found error with ID', () => {
      const error = new NotFoundError('User', '123')
      expect(error.message).toBe('User with id 123 not found')
    })
  })

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Duplicate entry')
      expect(error.code).toBe('CONFLICT')
      expect(error.statusCode).toBe(409)
    })
  })

  describe('StorageError', () => {
    it('should create storage error with operation', () => {
      const error = new StorageError('Upload failed', 'upload')
      expect(error.code).toBe('STORAGE_ERROR')
      expect(error.details).toEqual({ operation: 'upload' })
    })
  })
})

describe('formatErrorResponse', () => {
  it('should format AppError correctly', () => {
    const error = new AppError('Test', 'CODE', 400)
    const response = formatErrorResponse(error)
    
    expect(response.success).toBe(false)
    expect(response.error.code).toBe('CODE')
    expect(response.error.message).toBe('Test')
  })

  it('should format generic Error correctly in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const error = new Error('Something went wrong')
    const response = formatErrorResponse(error)
    
    expect(response.success).toBe(false)
    expect(response.error.code).toBe('INTERNAL_ERROR')
    expect(response.error.message).toBe('Something went wrong')
    
    process.env.NODE_ENV = originalEnv
  })

  it('should format generic Error correctly in production', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    const error = new Error('Something went wrong')
    const response = formatErrorResponse(error)
    
    expect(response.success).toBe(false)
    expect(response.error.code).toBe('INTERNAL_ERROR')
    expect(response.error.message).toBe('An unexpected error occurred')
    
    process.env.NODE_ENV = originalEnv
  })

  it('should handle unknown errors', () => {
    const response = formatErrorResponse('unknown error')
    
    expect(response.success).toBe(false)
    expect(response.error.code).toBe('UNKNOWN_ERROR')
  })
})
