/**
 * Structured logger for MedBookings
 *
 * CRITICAL: This logger is designed to prevent PHI (Protected Health Information) leakage.
 * All PHI must be sanitized before logging using the sanitization utilities.
 *
 * CloudWatch Integration: Logs are automatically captured by AWS Amplify and sent to CloudWatch.
 * - JSON format in production for structured log parsing
 * - Human-readable format in development for easier debugging
 * - Automatic metadata (environment, service, branch) for filtering
 *
 * Usage:
 * - logger.info() - General information (development only)
 * - logger.warn() - Warnings that need attention
 * - logger.error() - Errors that need investigation
 * - logger.audit() - Security/compliance events (always logged)
 */
import { nowUTC } from '@/lib/timezone';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

/**
 * Debug feature flags - enable specific debug logging in development or production
 * Set these in your .env file to enable debug logging for specific features:
 *
 * DEBUG_ALL=true              - Enable all debug logs
 * DEBUG_FORMS=true            - Form validation and submission
 * DEBUG_MAPS=true             - Google Maps initialization and location selection
 * DEBUG_ADMIN=true            - Admin operations and optimistic updates
 * DEBUG_CALENDAR=true         - Calendar operations
 * DEBUG_BOOKINGS=true         - Booking operations
 * DEBUG_ORGANIZATIONS=true    - Organization operations
 * DEBUG_PROVIDERS=true        - Provider operations
 */
export type DebugFeature =
  | 'forms'
  | 'maps'
  | 'admin'
  | 'calendar'
  | 'bookings'
  | 'organizations'
  | 'providers';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  feature?: DebugFeature;
  // CloudWatch metadata
  environment?: string;
  service?: string;
  branch?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Check if debug logging is enabled for a specific feature
   */
  private isDebugEnabled(feature?: DebugFeature): boolean {
    // Always disabled in production unless explicitly enabled
    if (this.isProduction && !process.env['DEBUG_ALL']) {
      if (!feature) return false;
      const envVar = `DEBUG_${feature.toUpperCase()}`;
      return process.env[envVar] === 'true';
    }

    // In development, check for feature-specific or global flag
    if (process.env['DEBUG_ALL'] === 'true') return true;
    if (!feature) return true; // Default to enabled in development

    const envVar = `DEBUG_${feature.toUpperCase()}`;
    // If no env var is set, default to true in development
    return process.env[envVar] !== 'false';
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, feature } = entry;

    if (this.isDevelopment) {
      // Human-readable format for development
      const featureTag = feature ? `[${feature.toUpperCase()}]` : '';
      const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
      return `[${timestamp}] ${level.toUpperCase()}${featureTag}: ${message}${contextStr}`;
    }

    // JSON format for production (CloudWatch structured logging)
    const logObject = {
      timestamp,
      level,
      message,
      service: 'medbookings',
      environment: process.env.NODE_ENV || 'development',
      branch: process.env.AWS_BRANCH || 'local',
      ...(entry.context && { context: entry.context }),
      ...(feature && { feature }),
    };
    return JSON.stringify(logObject);
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    const formatted = this.formatLog(entry);

    switch (entry.level) {
      case 'debug':
        // Debug logs controlled by feature flags
        if (this.isDebugEnabled(entry.feature)) {
          console.log(`[DEBUG] ${formatted}`);
        }
        break;
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'audit':
        // Audit logs always go to stdout for monitoring systems
        console.log(`[AUDIT] ${formatted}`);
        break;
      default:
        if (this.isDevelopment) {
          console.log(formatted);
        }
        // In production, suppress info logs unless explicitly enabled
        break;
    }
  }

  /**
   * Log debug message (controlled by feature flags)
   *
   * Use this for verbose debugging that you want to be able to turn on/off.
   * Debug logs are:
   * - Enabled by default in development (unless DEBUG_FEATURE=false)
   * - Disabled by default in production (unless DEBUG_FEATURE=true or DEBUG_ALL=true)
   *
   * @param feature - The feature category for filtering (e.g., 'forms', 'maps')
   * @param message - The debug message
   * @param context - Additional context data
   *
   * @example
   * // Basic debug log (enabled in dev, disabled in prod)
   * logger.debug('forms', 'Form validation started', { formName: 'registration' });
   *
   * @example
   * // In production, enable with: DEBUG_FORMS=true
   * logger.debug('forms', 'Form submitted', { values: sanitizedData });
   */
  debug(feature: DebugFeature, message: string, context?: Record<string, any>): void {
    this.output({
      level: 'debug',
      message,
      timestamp: nowUTC().toISOString(),
      context,
      feature,
    });
  }

  /**
   * Log informational message (development only)
   */
  info(message: string, context?: Record<string, any>): void {
    this.output({
      level: 'info',
      message,
      timestamp: nowUTC().toISOString(),
      context,
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.output({
      level: 'warn',
      message,
      timestamp: nowUTC().toISOString(),
      context,
    });
  }

  /**
   * Log error message
   *
   * Enhanced for CloudWatch:
   * - Always includes error name and message
   * - Stack trace included in production for debugging
   * - Structured error object for CloudWatch filtering
   */
  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorContext =
      error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack, // Include stack in production for CloudWatch
            },
            ...context,
          }
        : { error: String(error), ...context };

    this.output({
      level: 'error',
      message,
      timestamp: nowUTC().toISOString(),
      context: errorContext,
    });
  }

  /**
   * Log audit event (always logged, for compliance)
   * Use this for security-sensitive operations:
   * - Authentication attempts
   * - PHI access
   * - Admin actions
   * - Data modifications
   */
  audit(message: string, context?: Record<string, any>): void {
    this.output({
      level: 'audit',
      message,
      timestamp: nowUTC().toISOString(),
      context: {
        ...context,
        environment: process.env.NODE_ENV,
      },
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * PHI Sanitization Utilities
 *
 * CRITICAL: Always use these functions before logging any PHI.
 * These utilities help maintain POPIA compliance.
 */

/**
 * Sanitize email address for logging
 * Example: "john.doe@example.com" -> "jo***@example.com"
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '[no-email]';

  const [local, domain] = email.split('@');
  if (!local || !domain) return '[invalid-email]';

  const visibleChars = Math.min(2, local.length);
  const sanitized = `${local.substring(0, visibleChars)}***`;

  return `${sanitized}@${domain}`;
}

/**
 * Sanitize phone number for logging
 * Example: "+27821234567" -> "+2782***4567"
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '[no-phone]';

  // Keep country code and last 4 digits
  if (phone.length < 8) return '***';

  const countryCode = phone.substring(0, 4);
  const lastFour = phone.substring(phone.length - 4);

  return `${countryCode}***${lastFour}`;
}

/**
 * Sanitize user ID for logging (keeps full ID but marks it as sensitive)
 */
export function sanitizeUserId(userId: string | null | undefined): string {
  if (!userId) return '[no-user-id]';
  return `[USER:${userId}]`;
}

/**
 * Sanitize provider ID for logging
 */
export function sanitizeProviderId(providerId: string | null | undefined): string {
  if (!providerId) return '[no-provider-id]';
  return `[PROVIDER:${providerId}]`;
}

/**
 * Sanitize organization ID for logging
 */
export function sanitizeOrgId(orgId: string | null | undefined): string {
  if (!orgId) return '[no-org-id]';
  return `[ORG:${orgId}]`;
}

/**
 * Sanitize token (show only first 10 characters)
 * Example: "abc123def456ghi789..." -> "abc123def4..."
 */
export function sanitizeToken(token: string | null | undefined): string {
  if (!token) return '[no-token]';
  if (token.length <= 10) return '***';

  return `${token.substring(0, 10)}...`;
}

/**
 * Sanitize user name for logging
 * Example: "John Doe" -> "Jo** Do*"
 */
export function sanitizeName(name: string | null | undefined): string {
  if (!name) return '[no-name]';

  const parts = name.split(' ');
  return parts
    .map((part) => {
      if (part.length <= 2) return part;
      return part.substring(0, 2) + '*'.repeat(Math.max(1, part.length - 2));
    })
    .join(' ');
}

/**
 * Create a sanitized context object for logging
 * This removes common PHI fields and sanitizes others
 */
export function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();

    // Skip sensitive fields entirely
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('key')
    ) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Sanitize known PHI fields
    if (lowerKey.includes('email') && typeof value === 'string') {
      sanitized[key] = sanitizeEmail(value);
    } else if (lowerKey.includes('phone') && typeof value === 'string') {
      sanitized[key] = sanitizePhone(value);
    } else if (lowerKey.includes('name') && typeof value === 'string') {
      sanitized[key] = sanitizeName(value);
    } else if (lowerKey === 'userid' && typeof value === 'string') {
      sanitized[key] = sanitizeUserId(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
