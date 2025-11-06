/**
 * Sentry Server-Side Configuration
 *
 * This file configures Sentry for server-side error tracking.
 * Runs in Node.js and tracks SSR errors, API route errors, and tRPC errors.
 *
 * POPIA Compliance:
 * - No PHI is sent to Sentry (beforeSend hook scrubs sensitive data)
 * - User context limited to sanitized IDs only
 * - Request data scrubbed (headers, body, query params)
 * - Stack traces preserved for debugging
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
    // Free tier: 10,000 transactions/month
    // With 0.1 (10%), you can handle 100,000 requests/month before hitting limit
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    // TEMPORARILY ENABLED: Debugging why errors aren't being captured
    debug: true,

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

      // Scrub request data
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
          const sensitiveParams = ['token', 'password', 'email', 'phone', 'name', 'apiKey'];
          const hasSensitiveParam = sensitiveParams.some((param) =>
            typeof queryString === 'string' ? queryString.includes(param) : false
          );
          if (hasSensitiveParam) {
            event.request.query_string = '[REDACTED]';
          }
        }

        // Scrub request body (POST data)
        if (event.request.data) {
          const sensitiveFields = [
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

          // If data is a string, try to parse it
          let data: any = event.request.data; // eslint-disable-line @typescript-eslint/no-explicit-any
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data) as Record<string, unknown>;
            } catch {
              // If not JSON, redact the whole thing
              event.request.data = '[REDACTED]';
              return event;
            }
          }

          // If data is an object, scrub sensitive fields
          if (typeof data === 'object' && data !== null) {
            const dataObj = data as Record<string, unknown>;
            sensitiveFields.forEach((field) => {
              if (field in dataObj) {
                dataObj[field] = '[REDACTED]';
              }
            });
            event.request.data = dataObj;
          }
        }
      }

      // Scrub breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          // Remove data from console breadcrumbs
          if (crumb.category === 'console') {
            return {
              ...crumb,
              data: undefined,
            };
          }

          // Redact HTTP request data
          if (crumb.category === 'http' && crumb.data) {
            const sensitiveParams = ['token', 'email', 'phone', 'password'];
            if (crumb.data.url) {
              try {
                const url = new URL(crumb.data.url);
                sensitiveParams.forEach((param) => {
                  if (url.searchParams.has(param)) {
                    url.searchParams.set(param, '[REDACTED]');
                  }
                });
                crumb.data.url = url.toString();
              } catch {
                // Invalid URL, leave as is
              }
            }
          }

          return crumb;
        });
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
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',

      // Next.js expected errors
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
    ],

    // Configure error sampling (if needed to reduce volume)
    // beforeSendTransaction(event) {
    //   // Sample transactions based on route
    //   if (event.transaction?.startsWith('/api/')) {
    //     // Only capture 10% of API route transactions
    //     return Math.random() < 0.1 ? event : null;
    //   }
    //   return event;
    // },
  });
}
