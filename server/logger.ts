/**
 * Structured logging utility for the application.
 * Provides different log levels with timestamps and context.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    error?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function formatLogEntry(entry: LogEntry): string {
    const parts = [
        entry.timestamp,
        `[${entry.level.toUpperCase()}]`,
        entry.message,
    ];

    if (entry.context) {
        parts.push(JSON.stringify(entry.context));
    }

    if (entry.error) {
        parts.push(`\n  Stack: ${entry.error}`);
    }

    return parts.join(' ');
}

function createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
): LogEntry | null {
    if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
        return null;
    }

    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        error: error?.stack || error?.message,
    };
}

function log(entry: LogEntry): void {
    if (!entry) return;

    const formatted = formatLogEntry(entry);

    switch (entry.level) {
        case 'debug':
            console.debug(formatted);
            break;
        case 'info':
            console.info(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        case 'error':
            console.error(formatted);
            break;
    }
}

export const logger = {
    debug(message: string, context?: Record<string, unknown>): void {
        log(createLogEntry('debug', message, context)!);
    },

    info(message: string, context?: Record<string, unknown>): void {
        log(createLogEntry('info', message, context)!);
    },

    warn(message: string, context?: Record<string, unknown>): void {
        log(createLogEntry('warn', message, context)!);
    },

    error(message: string, error?: Error, context?: Record<string, unknown>): void {
        log(createLogEntry('error', message, context, error)!);
    },

    // HTTP request logging helper
    logRequest(method: string, path: string, status: number, duration: number): void {
        const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
        log(createLogEntry(level, `${method} ${path} ${status}`, { duration })!);
    },
};

export default logger;
