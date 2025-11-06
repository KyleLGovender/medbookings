/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures Sentry for edge runtime error tracking.
 * Runs in Vercel Edge Runtime (middleware, edge API routes).
 *
 * POPIA Compliance:
 * - No PHI is sent to Sentry (beforeSend hook scrubs sensitive data)
 * - User context limited to sanitized IDs only
 * - Request data scrubbed (headers, cookies, query params)
 * - Minimal data sent (edge runtime has limited capabilities)
 */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    // Edge runtime has minimal overhead, but still limit sampling for quota
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.05 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.SENTRY_DEBUG === 'true',

    // POPIA Compliance: Scrub sensitive data before sending to Sentry
    beforeSend(event, hint) {
      // Remove user PII - only keep sanitized IDs
      if (event.user) {
        // Keep only the user ID (already sanitized in our app)
        event.user = {
          id: event.user.id?.toString().startsWith('[USER:')
            ? event.user.id
            : event.user.id
              ? `[USER:${event.user.id}]`
              : undefined,
        };
        // Remove email, username, ip_address
      }

      // Scrub request data (critical for middleware)
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-csrf-token'];
          delete event.request.headers['x-api-key'];
        }

        // Scrub query string
        if (event.request.query_string) {
          const queryString = event.request.query_string;
          const sensitiveParams = ['token', 'password', 'email', 'phone', 'name'];
          const hasSensitiveParam = sensitiveParams.some((param) =>
            typeof queryString === 'string' ? queryString.includes(param) : false
          );
          if (hasSensitiveParam) {
            event.request.query_string = '[REDACTED]';
          }
        }

        // Redact entire request body (edge runtime doesn't need it)
        if (event.request.data) {
          event.request.data = '[REDACTED]';
        }
      }

      // Remove extra context that might contain PHI
      if (event.extra) {
        const sensitiveKeys = [
          'email',
          'phone',
          'phoneNumber',
          'name',
          'firstName',
          'lastName',
          'address',
          'password',
          'token',
          'apiKey',
          'secret',
        ];
        sensitiveKeys.forEach((key) => {
          if (event.extra && key in event.extra) {
            event.extra[key] = '[REDACTED]';
          }
        });
      }

      return event;
    },

    // Ignore common benign errors
    ignoreErrors: [
      // Expected errors
      'Non-Error promise rejection captured',

      // Next.js expected errors
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
    ],
  });
}
