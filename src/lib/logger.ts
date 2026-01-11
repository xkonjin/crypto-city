/**
 * =============================================================================
 * LOGGING UTILITY
 * =============================================================================
 * A simple logging utility for Crypto City that:
 * - Only logs in development by default
 * - Supports log levels (debug < info < warn < error)
 * - Prefixes messages with timestamp and source
 * - Configurable via localStorage
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('[MyModule]', 'Debug message');
 *   logger.info('[MyModule]', 'Info message');
 *   logger.warn('[MyModule]', 'Warning message');
 *   logger.error('[MyModule]', 'Error message', error);
 * 
 * Enable verbose logging in production:
 *   localStorage.setItem('cryptoCity:logLevel', 'debug');
 * 
 * Issue #61: Remove console.log statements and add proper logging utility
 */

// =============================================================================
// TYPES
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

// =============================================================================
// LOG LEVEL CONFIGURATION
// =============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

const STORAGE_KEY = 'cryptoCity:logLevel';

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get the configured log level
 * Priority: localStorage > environment > default (warn in prod, debug in dev)
 */
function getLogLevel(): LogLevel {
  // Try localStorage first (allows enabling verbose logs in production)
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidLogLevel(stored)) {
        return stored as LogLevel;
      }
    } catch {
      // localStorage might be blocked
    }
  }
  
  // Default: debug in dev, warn in production
  return isDevelopment() ? 'debug' : 'warn';
}

/**
 * Validate a log level string
 */
function isValidLogLevel(level: string): level is LogLevel {
  return ['debug', 'info', 'warn', 'error', 'none'].includes(level);
}

/**
 * Check if a message at the given level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format timestamp for log messages
 */
function getTimestamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Format a log message with timestamp
 */
function formatMessage(level: LogLevel, message: string): string {
  const timestamp = getTimestamp();
  const levelTag = level.toUpperCase().padEnd(5);
  return `[${timestamp}] ${levelTag} ${message}`;
}

// =============================================================================
// LOGGER IMPLEMENTATION
// =============================================================================

/**
 * Create a log function for a specific level
 */
function createLogFn(
  level: LogLevel,
  consoleFn: (...args: unknown[]) => void
): (message: string, ...args: unknown[]) => void {
  return (message: string, ...args: unknown[]) => {
    if (!shouldLog(level)) return;
    
    const formattedMessage = formatMessage(level, message);
    
    if (args.length > 0) {
      consoleFn(formattedMessage, ...args);
    } else {
      consoleFn(formattedMessage);
    }
  };
}

/**
 * The logger instance
 * 
 * Use this throughout the application instead of console.log/warn/error
 */
export const logger: Logger = {
  debug: createLogFn('debug', console.log),
  info: createLogFn('info', console.info),
  warn: createLogFn('warn', console.warn),
  error: createLogFn('error', console.error),
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Set the log level programmatically
 * Persists to localStorage for the session
 */
export function setLogLevel(level: LogLevel): void {
  if (!isBrowser()) return;
  
  try {
    if (level === 'debug' && !isDevelopment()) {
      // In production, require explicit setting
      localStorage.setItem(STORAGE_KEY, level);
    } else if (level === 'none') {
      // Explicitly silence all logs
      localStorage.setItem(STORAGE_KEY, level);
    } else {
      localStorage.setItem(STORAGE_KEY, level);
    }
  } catch {
    // localStorage might be blocked
  }
}

/**
 * Clear custom log level (revert to defaults)
 */
export function resetLogLevel(): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage might be blocked
  }
}

/**
 * Get current effective log level
 */
export function getCurrentLogLevel(): LogLevel {
  return getLogLevel();
}

// =============================================================================
// DEV TOOLS INTEGRATION
// =============================================================================

// Expose logger utilities to window for debugging (only in browser)
if (isBrowser()) {
  // Make logger available globally for debugging
  (window as unknown as { cryptoCityLogger?: typeof loggerDevTools }).cryptoCityLogger = {
    setLevel: setLogLevel,
    resetLevel: resetLogLevel,
    getLevel: getCurrentLogLevel,
    levels: ['debug', 'info', 'warn', 'error', 'none'] as const,
  };
}

const loggerDevTools = {
  setLevel: setLogLevel,
  resetLevel: resetLogLevel,
  getLevel: getCurrentLogLevel,
  levels: ['debug', 'info', 'warn', 'error', 'none'] as const,
};

export { loggerDevTools };

export default logger;
