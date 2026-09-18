import { useState, useCallback } from 'react'

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
