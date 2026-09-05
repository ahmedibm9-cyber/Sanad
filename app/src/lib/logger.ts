/**
 * Application logging utility for SANAD.
 * 
 * This module provides a consistent logging system with different
 * log levels and structured logging for production use.
 */

// ===========================================
// Log Levels
// ===========================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// ===========================================
// Logger Configuration
// ===========================================

interface LoggerConfig {
  level: LogLevel
  prefix: string
  enableConsole: boolean
  enableRemote: boolean
}

const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  prefix: '[SANAD]',
  enableConsole: true,
  enableRemote: false,
}

let config: LoggerConfig = { ...defaultConfig }

/**
 * Configure the logger.
 */
export function configureLogger(overrides: Partial<LoggerConfig>): void {
  config = { ...config, ...overrides }
}

// ===========================================
// Log Context
// ===========================================

export interface LogContext {
  userId?: string
  companyId?: string
  action?: string
  entityType?: string
  entityId?: string
  [key: string]: unknown
}

// ===========================================
// Logger Class
// ===========================================

class Logger {
  private context: LogContext

  constructor(context: LogContext = {}) {
    this.context = context
  }

  /**
   * Create a child logger with additional context.
   */
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context })
  }

  /**
   * Log a debug message.
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * Log an info message.
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * Log a warning message.
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * Log an error message.
   */
  error(message: string, error?: unknown): void {
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error
    this.log(LogLevel.ERROR, message, errorData)
  }

  /**
   * Log a fatal error.
   */
  fatal(message: string, error?: unknown): void {
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error
    this.log(LogLevel.FATAL, message, errorData)
  }

  /**
   * Internal log method.
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level < config.level) return

    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    const logEntry = {
      timestamp,
      level: levelName,
      prefix: config.prefix,
      message,
      ...this.context,
      ...(data ? { data } : {}),
    }

    if (config.enableConsole) {
      const consoleMethod = this.getConsoleMethod(level)
      consoleMethod(`${config.prefix} [${levelName}]`, message, data || '')
    }

    // In production, you would send to a remote logging service
    if (config.enableRemote && level >= LogLevel.ERROR) {
      this.sendToRemote(logEntry)
    }
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error
      default:
        return console.log
    }
  }

  private async sendToRemote(entry: Record<string, unknown>): Promise<void> {
    // Placeholder for remote logging service integration
    // In production, send to a service like Datadog, Sentry, or custom endpoint
    try {
      // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
    } catch {
      // Don't let logging errors break the application
    }
  }
}

// ===========================================
// Pre-configured Loggers
// ===========================================

/**
 * General application logger.
 */
export const appLogger = new Logger({ action: 'app' })

/**
 * Database operation logger.
 */
export const dbLogger = new Logger({ action: 'database' })

/**
 * API request logger.
 */
export const apiLogger = new Logger({ action: 'api' })

/**
 * Storage operation logger.
 */
export const storageLogger = new Logger({ action: 'storage' })

/**
 * Authentication logger.
 */
export const authLogger = new Logger({ action: 'auth' })

/**
 * Audit logger.
 */
export const auditLogger = new Logger({ action: 'audit' })

/**
 * Create a logger for a specific entity.
 */
export function createEntityLogger(entityType: string, entityId?: string): Logger {
  return new Logger({ action: 'entity', entityType, entityId })
}

/**
 * Create a logger for a specific operation.
 */
export function createOperationLogger(operation: string, context?: LogContext): Logger {
  return new Logger({ action: operation, ...context })
}

/**
 * Log an API request (for middleware use).
 */
export function logRequest(
  method: string,
  path: string,
  userId?: string,
  companyId?: string
): void {
  apiLogger.info(`${method} ${path}`, { userId, companyId, path })
}

/**
 * Log an API response (for middleware use).
 */
export function logResponse(
  method: string,
  path: string,
  statusCode: number,
  duration?: number
): void {
  const level = statusCode >= 500 ? LogLevel.ERROR 
    : statusCode >= 400 ? LogLevel.WARN 
    : LogLevel.INFO

  const logger = new Logger({ action: 'api-response' })
  logger[level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warn' : 'info'](`${method} ${path} ${statusCode}`, { duration })
}

/**
 * Log an audit event.
 */
export function logAuditEvent(
  userId: string,
  companyId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
): void {
  auditLogger.info(`Audit: ${action} on ${entityType}`, {
    userId,
    companyId,
    action,
    entityType,
    entityId,
    ...details,
  })
}
