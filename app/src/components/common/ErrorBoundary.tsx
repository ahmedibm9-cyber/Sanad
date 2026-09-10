import { Component, type ErrorInfo, type ReactNode } from 'react'
import { appLogger } from '../../lib/logger'
import { useLanguage } from '../../contexts/LanguageContext'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryInner extends Component<
  ErrorBoundaryProps & { t: (en: string, ar: string) => string },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { t: (en: string, ar: string) => string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    appLogger.error('React Error Boundary caught an error', error)
    console.error('Error Boundary:', error, errorInfo)
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReloadPage = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { t } = this.props
      const { error } = this.state

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="card max-w-lg w-full p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-brand-800 mb-2">
              {t('Something went wrong', 'حدث خطأ ما')}
            </h2>
            <p className="text-brand-600 mb-6">
              {t(
                'An unexpected error occurred. You can try again or reload the page.',
                'حدث خطأ غير متوقع. يمكنك المحاولة مرة أخرى أو إعادة تحميل الصفحة.'
              )}
            </p>

            {error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-brand-500 hover:text-brand-700 mb-2">
                  {t('Error Details', 'تفاصيل الخطأ')}
                </summary>
                <pre className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-xs text-red-600 overflow-auto max-h-40">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={this.handleTryAgain} className="btn-primary">
                {t('Try Again', 'حاول مرة أخرى')}
              </button>
              <button onClick={this.handleReloadPage} className="btn-secondary">
                {t('Reload Page', 'إعادة تحميل الصفحة')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function ErrorBoundaryLanguageWrapper(props: ErrorBoundaryProps) {
  const { t } = useLanguage()
  return <ErrorBoundaryInner {...props} t={t} />
}

export default function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryLanguageWrapper {...props} />
}
