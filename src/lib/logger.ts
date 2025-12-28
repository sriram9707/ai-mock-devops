/**
 * Enhanced Logging Utility for MVP 0.1
 * Structured logging for monitoring and debugging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
    userId?: string
    sessionId?: string
    packId?: string
    action?: string
    [key: string]: any
}

class Logger {
    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString()
        const contextStr = context ? JSON.stringify(context) : ''
        
        return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`
    }

    private log(level: LogLevel, message: string, context?: LogContext) {
        const formatted = this.formatMessage(level, message, context)
        
        // Console logging (for development)
        if (process.env.NODE_ENV === 'development') {
            console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](formatted)
        }
        
        // In production, you would send to logging service (e.g., Sentry, Datadog)
        // For MVP 0.1, we'll use console but structure it for easy migration
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to logging service
            // Example: Sentry.captureMessage(formatted, level)
        }
    }

    info(message: string, context?: LogContext) {
        this.log('info', message, context)
    }

    warn(message: string, context?: LogContext) {
        this.log('warn', message, context)
    }

    error(message: string, error?: Error | unknown, context?: LogContext) {
        const errorContext = {
            ...context,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : String(error)
        }
        this.log('error', message, errorContext)
    }

    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === 'development') {
            this.log('debug', message, context)
        }
    }

    // Interview-specific logging
    interviewStart(sessionId: string, userId: string, packId: string, isPractice: boolean) {
        this.info('Interview started', {
            sessionId,
            userId,
            packId,
            isPractice,
            action: 'interview_start'
        })
    }

    interviewEnd(sessionId: string, userId: string, packId: string, status: string) {
        this.info('Interview ended', {
            sessionId,
            userId,
            packId,
            status,
            action: 'interview_end'
        })
    }

    interviewError(sessionId: string, userId: string, error: Error | unknown) {
        this.error('Interview error', error, {
            sessionId,
            userId,
            action: 'interview_error'
        })
    }

    userAction(userId: string, action: string, details?: Record<string, any>) {
        this.info(`User action: ${action}`, {
            userId,
            action,
            ...details
        })
    }

    apiRequest(method: string, path: string, statusCode: number, duration?: number) {
        this.info(`API ${method} ${path}`, {
            method,
            path,
            statusCode,
            duration,
            action: 'api_request'
        })
    }
}

export const logger = new Logger()

