/**
 * Sentry Server-Side Initialization for Serverless Functions
 *
 * This utility initializes Sentry for serverless API routes.
 * Import this file at the top of any API route to enable Sentry error tracking.
 *
 * Why this exists:
 * - instrumentation.ts doesn't work in Vercel serverless functions
 * - Serverless functions need Sentry initialized on each cold start
 * - This utility runs on import, ensuring Sentry is ready before route handlers execute
 */

/* eslint-disable no-console */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

let sentryInitialized = false;

/**
 * Initialize Sentry for serverless environment
 * This runs once per serverless function cold start
 */
function initializeSentry() {
  if (sentryInitialized) {
    console.log('[SENTRY-SERVERLESS] Already initialized, skipping...');
    return;
  }

  console.log('[SENTRY-SERVERLESS] Initializing Sentry...');
  console.log('[SENTRY-SERVERLESS] Environment:', SENTRY_ENVIRONMENT);
  console.log('[SENTRY-SERVERLESS] DSN exists:', !!SENTRY_DSN);

  if (!SENTRY_DSN) {
    console.warn('[SENTRY-SERVERLESS] SENTRY_DSN not found, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
      debug: true, // Temporarily enabled for debugging

      // POPIA Compliance: Scrub sensitive data
      beforeSend(event) {
        // Remove user PII - only keep sanitized IDs
        if (event.user) {
          event.user = {
            id: event.user.id?.toString().startsWith('[USER:')
              ? event.user.id
              : event.user.id
                ? `[USER:${event.user.id}]`
                : undefined,
          };
        }

        // Scrub request data
        if (event.request) {
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-csrf-token'];
            delete event.request.headers['x-api-key'];
          }

          if (event.request.query_string) {
            const queryString = event.request.query_string;
            const sensitiveParams = ['token', 'password', 'email', 'phone', 'name', 'apiKey'];
            const hasSensitiveParam = sensitiveParams.some((param) =>
              typeof queryString === 'string' ? queryString.includes(param) : false
            );
            if (hasSensitiveParam) {
              event.request.query_string = '[REDACTED]';
            }
          }

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

      ignoreErrors: [
        'Non-Error promise rejection captured',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'NEXT_NOT_FOUND',
        'NEXT_REDIRECT',
      ],
    });

    sentryInitialized = true;
    console.log('[SENTRY-SERVERLESS] ✅ Sentry initialized successfully');
  } catch (error) {
    console.error('[SENTRY-SERVERLESS] ❌ Failed to initialize Sentry:', error);
  }
}

// Initialize on import
initializeSentry();

// Export Sentry for use in API routes
export { Sentry };
