/**
 * @fileoverview Standardized API error handling for calendar operations
 *
 * This module provides consistent error handling patterns across all calendar
 * API calls, including proper error classification, retry strategies, and
 * user-friendly error messages.
 *
 * @author MedBookings Development Team
 */
import { logger } from '@/lib/logger';

// =============================================================================
// ERROR TYPES AND INTERFACES
// =============================================================================

export interface ApiError extends Error {
  code: string;
  status: number;
  retryable: boolean;
  userMessage: string;
}

export interface ErrorContext {
  operation: string;
  resourceId?: string;
  providerId?: string;
  organizationId?: string;
}

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

/**
 * HTTP status code ranges for error classification
 */
const ERROR_RANGES = {
  CLIENT_ERROR: { min: 400, max: 499 },
  SERVER_ERROR: { min: 500, max: 599 },
  NETWORK_ERROR: { min: 0, max: 0 }, // Special case for network errors
} as const;

/**
 * Error codes mapped to user-friendly messages
 */
const ERROR_MESSAGES = {
  // Authentication & Authorization
  '401': 'Please log in to access calendar data',
  '403': 'You do not have permission to perform this action',

  // Not Found
  '404': 'The requested calendar data was not found',

  // Client Errors
  '400': 'Invalid request. Please check your input and try again',
  '409': 'This action conflicts with existing data',
  '422': 'The provided data is invalid',

  // Server Errors
  '500': 'Server error. Please try again later',
  '502': 'Service temporarily unavailable',
  '503': 'Service temporarily unavailable',
  '504': 'Request timeout. Please try again',

  // Network Errors
  NETWORK_ERROR: 'Network connection error. Please check your internet connection',
  TIMEOUT: 'Request timeout. Please try again',

  // Calendar-specific errors
  AVAILABILITY_CONFLICT: 'This availability conflicts with existing schedule',
  BOOKING_FULL: 'This time slot is no longer available',
  INVALID_TIME_RANGE: 'Invalid time range specified',
  RECURRING_SERIES_ERROR: 'Error processing recurring availability series',

  // Default fallback
  UNKNOWN: 'An unexpected error occurred. Please try again',
} as const;

// =============================================================================
// ERROR CREATION AND HANDLING
// =============================================================================

/**
 * Creates a standardized API error with proper classification
 *
 * @param response - Fetch response object
 * @param context - Error context information
 * @returns Standardized ApiError
 */
export async function createApiError(
  response: Response | null,
  context: ErrorContext
): Promise<ApiError> {
  let status = 0;
  let code = 'UNKNOWN';
  let errorData: any = {};

  // Handle network errors (no response)
  if (!response) {
    return {
      name: 'ApiError',
      message: `Network error during ${context.operation}`,
      code: 'NETWORK_ERROR',
      status: 0,
      retryable: true,
      userMessage: ERROR_MESSAGES.NETWORK_ERROR,
    } as ApiError;
  }

  status = response.status;

  // Try to parse error response
  try {
    errorData = await response.json();
    code = errorData.code || errorData.error || status.toString();
  } catch {
    // If we can't parse the response, use status as code
    code = status.toString();
  }

  // Determine if error is retryable
  const retryable = isRetryableError(status, code);

  // Get user-friendly message
  const userMessage = getUserMessage(code, status, context);

  // Create detailed error message for developers
  const developerMessage = `API Error: ${context.operation} failed - ${code} (${status})${
    context.resourceId ? ` for resource ${context.resourceId}` : ''
  }${context.providerId ? ` (provider: ${context.providerId})` : ''}${
    context.organizationId ? ` (organization: ${context.organizationId})` : ''
  }`;

  return {
    name: 'ApiError',
    message: developerMessage,
    code,
    status,
    retryable,
    userMessage,
  } as ApiError;
}

/**
 * Determines if an error should be retried
 *
 * @param status - HTTP status code
 * @param code - Error code
 * @returns True if the error is retryable
 */
function isRetryableError(status: number, code: string): boolean {
  // Network errors are retryable
  if (status === 0 || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return true;
  }

  // Server errors (5xx) are generally retryable
  if (status >= ERROR_RANGES.SERVER_ERROR.min && status <= ERROR_RANGES.SERVER_ERROR.max) {
    return true;
  }

  // Specific retryable server errors
  if (['502', '503', '504'].includes(code)) {
    return true;
  }

  // Client errors (4xx) are generally not retryable
  if (status >= ERROR_RANGES.CLIENT_ERROR.min && status <= ERROR_RANGES.CLIENT_ERROR.max) {
    return false;
  }

  // Default to not retryable for unknown errors
  return false;
}

/**
 * Gets user-friendly error message
 *
 * @param code - Error code
 * @param status - HTTP status code
 * @param context - Error context
 * @returns User-friendly error message
 */
function getUserMessage(code: string, status: number, context: ErrorContext): string {
  // Check for specific error codes first
  if (code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
  }

  // Check for HTTP status codes
  const statusString = status.toString();
  if (statusString in ERROR_MESSAGES) {
    return ERROR_MESSAGES[statusString as keyof typeof ERROR_MESSAGES];
  }

  // Context-specific messages
  if (context.operation.includes('create') && status === 409) {
    return 'This availability conflicts with existing schedule';
  }

  if (context.operation.includes('book') && status === 409) {
    return 'This time slot is no longer available';
  }

  // Default fallback
  return ERROR_MESSAGES.UNKNOWN;
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

/**
 * Configuration for retry behavior
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
} as const;

/**
 * Calculates delay for exponential backoff
 *
 * @param attempt - Current attempt number (0-based)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * Retry function for TanStack Query
 *
 * @param failureCount - Number of failed attempts
 * @param error - The error that occurred
 * @returns True if should retry, false otherwise
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry if we've exceeded max attempts
  if (failureCount >= RETRY_CONFIG.maxAttempts) {
    return false;
  }

  // If it's our ApiError type, use the retryable flag
  if (error && typeof error === 'object' && 'retryable' in error) {
    return (error as ApiError).retryable;
  }

  // For other errors, be conservative and don't retry
  return false;
}

// =============================================================================
// FETCH WRAPPER WITH ERROR HANDLING
// =============================================================================

/**
 * Enhanced fetch wrapper with standardized error handling
 *
 * @param url - Request URL
 * @param options - Fetch options
 * @param context - Error context
 * @returns Promise that resolves to parsed response data
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  context: ErrorContext
): Promise<T> {
  let response: Response | null = null;

  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw await createApiError(response, context);
    }

    return await response.json();
  } catch (error) {
    // If it's already our ApiError, re-throw it
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }

    // Handle network errors or JSON parsing errors
    throw await createApiError(null, context);
  }
}

// =============================================================================
// ERROR LOGGING
// =============================================================================

/**
 * Logs API errors for monitoring and debugging
 *
 * @param error - The error to log
 * @param context - Additional context
 */
export function logApiError(error: ApiError, context?: Record<string, any>): void {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    logger.error('API Error', {
      code: error.code,
      status: error.status,
      message: error.message,
      retryable: error.retryable,
      context,
    });
  }

  // In production, you would send to your error monitoring service
  // Example: Sentry, LogRocket, Datadog, etc.
  // errorMonitoringService.captureError(error, context);
}

// =============================================================================
// ERROR BOUNDARY HELPERS
// =============================================================================

/**
 * Determines if an error should break the error boundary
 *
 * @param error - The error to check
 * @returns True if error should be caught by error boundary
 */
export function shouldCatchInErrorBoundary(error: unknown): boolean {
  // Catch all API errors
  if (error && typeof error === 'object' && 'code' in error) {
    return true;
  }

  // Catch network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Don't catch programming errors (let them bubble up)
  return false;
}
