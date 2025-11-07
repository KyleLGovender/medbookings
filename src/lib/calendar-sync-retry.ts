/**
 * Calendar Sync Retry & Backoff Utilities
 *
 * Implements exponential backoff for failed calendar sync operations:
 * - Attempt 1: Immediate (0 delay)
 * - Attempt 2: 1 minute
 * - Attempt 3: 5 minutes
 * - Attempt 4: 15 minutes
 * - Attempt 5: 1 hour
 * - Attempt 6+: 6 hours
 *
 * After MAX_SYNC_RETRIES consecutive failures, the integration is auto-disabled.
 */
import { addMinutes } from 'date-fns';

import env from '@/config/env/server';
import { sendEmail } from '@/lib/communications/email';
import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

// Maximum retry attempts before disabling sync (default: 5)
export const MAX_SYNC_RETRIES = parseInt(process.env.MAX_SYNC_RETRIES || '5', 10);

/**
 * Error types for calendar sync failures
 * Different error types may warrant different retry strategies
 */
export enum SyncErrorType {
  // Transient errors - retry with backoff
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Token errors - may need user intervention
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  AUTH_FAILED = 'AUTH_FAILED',

  // Permanent errors - should not retry
  INVALID_GRANT = 'INVALID_GRANT',
  CALENDAR_NOT_FOUND = 'CALENDAR_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}

/**
 * Exponential backoff schedule (in minutes)
 * Index represents retry attempt (0-based)
 */
const BACKOFF_SCHEDULE_MINUTES = [
  0, // Attempt 1: Immediate
  1, // Attempt 2: 1 minute
  5, // Attempt 3: 5 minutes
  15, // Attempt 4: 15 minutes
  60, // Attempt 5: 1 hour
  360, // Attempt 6+: 6 hours
];

/**
 * Calculate next retry time based on retry count
 */
export function calculateNextRetryAt(retryCount: number): Date {
  const delayMinutes =
    retryCount < BACKOFF_SCHEDULE_MINUTES.length
      ? BACKOFF_SCHEDULE_MINUTES[retryCount]
      : BACKOFF_SCHEDULE_MINUTES[BACKOFF_SCHEDULE_MINUTES.length - 1];

  return addMinutes(nowUTC(), delayMinutes);
}

/**
 * Determine error type from error message
 * Used to decide retry strategy
 */
export function categorizeError(error: Error | string): SyncErrorType {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  // Token/Auth errors
  if (lowerMessage.includes('invalid_grant') || lowerMessage.includes('invalid grant')) {
    return SyncErrorType.INVALID_GRANT;
  }
  if (
    lowerMessage.includes('token') &&
    (lowerMessage.includes('invalid') || lowerMessage.includes('expired'))
  ) {
    return SyncErrorType.TOKEN_INVALID;
  }
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('auth')) {
    return SyncErrorType.AUTH_FAILED;
  }

  // Rate limit errors
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('quota exceeded') ||
    lowerMessage.includes('429')
  ) {
    return SyncErrorType.RATE_LIMIT;
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound')
  ) {
    return SyncErrorType.NETWORK_ERROR;
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return SyncErrorType.TIMEOUT;
  }

  // Permission errors
  if (
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('403')
  ) {
    return SyncErrorType.PERMISSION_DENIED;
  }

  // Calendar not found
  if (
    lowerMessage.includes('calendar') &&
    (lowerMessage.includes('not found') || lowerMessage.includes('404'))
  ) {
    return SyncErrorType.CALENDAR_NOT_FOUND;
  }

  return SyncErrorType.UNKNOWN;
}

/**
 * Determine if error is retryable
 * Permanent errors should not be retried
 */
export function isRetryableError(errorType: SyncErrorType): boolean {
  const permanentErrors = [
    SyncErrorType.INVALID_GRANT,
    SyncErrorType.CALENDAR_NOT_FOUND,
    SyncErrorType.PERMISSION_DENIED,
  ];

  return !permanentErrors.includes(errorType);
}

/**
 * Send email notification when calendar sync is auto-disabled
 */
export async function notifyIntegrationDisabled(options: {
  providerId: string;
  providerName: string;
  providerEmail: string;
  failureCount: number;
  lastError: string;
}): Promise<void> {
  const { providerId, providerName, providerEmail, failureCount, lastError } = options;

  logger.info('Sending calendar sync disabled notification', {
    providerId,
    providerEmail: providerEmail,
  });

  try {
    await sendEmail({
      to: providerEmail,
      subject: 'MedBookings: Google Calendar Sync Disabled',
      text: `
Hi ${providerName},

Your Google Calendar integration has been automatically disabled after ${failureCount} consecutive sync failures.

Last error: ${lastError}

To re-enable calendar sync:
1. Go to your MedBookings provider settings
2. Navigate to Calendar Integration
3. Click "Reconnect Google Calendar"
4. Authorize MedBookings to access your calendar

If you continue experiencing issues, please contact support.

Best regards,
MedBookings Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .error-box { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .steps { background-color: #e7f3ff; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
    .steps ol { margin: 10px 0; padding-left: 20px; }
    .button { display: inline-block; background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Google Calendar Sync Disabled</h2>

    <p>Hi ${providerName},</p>

    <div class="alert">
      <strong>⚠️ Action Required:</strong> Your Google Calendar integration has been automatically disabled after ${failureCount} consecutive sync failures.
    </div>

    <div class="error-box">
      <strong>Last Error:</strong><br>
      <code>${lastError}</code>
    </div>

    <div class="steps">
      <strong>To re-enable calendar sync:</strong>
      <ol>
        <li>Go to your MedBookings provider settings</li>
        <li>Navigate to <strong>Calendar Integration</strong></li>
        <li>Click <strong>"Reconnect Google Calendar"</strong></li>
        <li>Authorize MedBookings to access your calendar</li>
      </ol>
    </div>

    <a href="${env.NEXTAUTH_URL}/provider/settings/calendar" class="button">
      Reconnect Calendar →
    </a>

    <p>If you continue experiencing issues, please contact our support team.</p>

    <p>
      Best regards,<br>
      <strong>MedBookings Team</strong>
    </p>
  </div>
</body>
</html>
      `.trim(),
    });

    // Also notify admin if configured
    if (env.ADMIN_NOTIFICATION_EMAIL) {
      await sendEmail({
        to: env.ADMIN_NOTIFICATION_EMAIL,
        subject: `[MedBookings Admin] Calendar Sync Disabled: ${providerName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h2>⚠️ Calendar Sync Auto-Disabled</h2>

    <div class="alert">
      <strong>Provider:</strong> ${providerName}<br>
      <strong>Status:</strong> Calendar sync has been automatically disabled
    </div>

    <table>
      <tr>
        <th>Field</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Provider ID</td>
        <td>${providerId}</td>
      </tr>
      <tr>
        <td>Provider Email</td>
        <td>${providerEmail}</td>
      </tr>
      <tr>
        <td>Failure Count</td>
        <td>${failureCount}</td>
      </tr>
      <tr>
        <td>Last Error</td>
        <td><code>${lastError}</code></td>
      </tr>
    </table>

    <p><strong>Action Required:</strong> Review provider's calendar integration and contact if needed.</p>
  </div>
</body>
</html>
        `.trim(),
        text: `
Calendar sync auto-disabled for provider: ${providerName} (${providerId})

Provider Email: ${providerEmail}
Failure Count: ${failureCount}
Last Error: ${lastError}

Review required.
        `.trim(),
      });
    }

    logger.info('Calendar sync disabled notification sent successfully', {
      providerId,
    });
  } catch (error) {
    logger.error('Failed to send calendar sync disabled notification', {
      providerId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - email failure shouldn't prevent sync disable
  }
}

/**
 * Get human-readable description of next retry time
 */
export function getRetryDelayDescription(retryCount: number): string {
  const delayMinutes =
    retryCount < BACKOFF_SCHEDULE_MINUTES.length
      ? BACKOFF_SCHEDULE_MINUTES[retryCount]
      : BACKOFF_SCHEDULE_MINUTES[BACKOFF_SCHEDULE_MINUTES.length - 1];

  if (delayMinutes === 0) return 'immediately';
  if (delayMinutes === 1) return 'in 1 minute';
  if (delayMinutes < 60) return `in ${delayMinutes} minutes`;
  if (delayMinutes === 60) return 'in 1 hour';
  return `in ${Math.floor(delayMinutes / 60)} hours`;
}
