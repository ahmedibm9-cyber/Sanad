import { useState, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'

// ── RequiredMark ────────────────────────────────────────────────

/** Red asterisk for required form fields */
export function RequiredMark() {
  return <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>
}

// ── FormError ───────────────────────────────────────────────────

interface FormErrorProps {
  message?: string
  className?: string
}

/** Inline error text announced to screen readers via role=alert */
export function FormError({ message, className = '' }: FormErrorProps) {
  if (!message) return null
  return (
    <p role="alert" className={`flex items-start gap-1.5 text-xs text-red-600 mt-1 ${className}`}>
      <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}

// ── FormErrorSummary ────────────────────────────────────────────

interface FormErrorSummaryProps {
  errors: Record<string, string>
  className?: string
}

/**
 * Visible list of all form errors, shown at the top of a form.
 * Focusable so screen readers can jump to it.
 */
export function FormErrorSummary({ errors, className = '' }: FormErrorSummaryProps) {
  const messages = Object.values(errors).filter(Boolean)
  if (messages.length === 0) return null

  return (
    <div
      role="alert"
      tabIndex={-1}
      className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 ${className}`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-red-800 mb-1">
            Please fix {messages.length} {messages.length === 1 ? 'error' : 'errors'} below
          </p>
          <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
            {messages.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── useFormValidation ───────────────────────────────────────────

type ValidationErrors = Record<string, string>
type Validator = () => ValidationErrors | null

interface UseFormValidationReturn {
  errors: ValidationErrors
  hasErrors: boolean
  validate: (validator: Validator) => boolean
  clearError: (field: string) => void
  clearErrors: () => void
  setError: (field: string, message: string) => void
}

/**
 * Hook that manages form-level validation state.
 *
 * Usage:
 * ```tsx
 * const { errors, hasErrors, validate, clearError, setError } = useFormValidation()
 *
 * const handleSubmit = () => {
 *   const ok = validate(() => {
 *     const errs: ValidationErrors = {}
 *     if (!name) errs.name = 'Name is required'
 *     return Object.keys(errs).length ? errs : null
 *   })
 *   if (!ok) return
 *   // submit
 * }
 * ```
 */
export function useFormValidation(): UseFormValidationReturn {
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validate = useCallback((validator: Validator): boolean => {
    const result = validator()
    setErrors(result ?? {})
    return !result
  }, [])

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }))
  }, [])

  const hasErrors = Object.values(errors).some(Boolean)

  return { errors, hasErrors, validate, clearError, clearErrors, setError }
}
