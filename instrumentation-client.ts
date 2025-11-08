/**
 * Next.js Client-Side Instrumentation
 *
 * This file is automatically loaded by Next.js in the browser when instrumentationHook is enabled.
 * It runs once when the client-side application loads.
 *
 * This file replaces the deprecated sentry.client.config.ts file.
 * All Sentry client configuration is now in this file for Turbopack compatibility.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */

import * as Sentry from '@sentry/nextjs';

// Initialize Sentry for client-side
// This content was previously in sentry.client.config.ts
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    // Free tier: 10,000 transactions/month
    // With 0.1 (10%), you can handle 100,000 page loads/month before hitting limit
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.SENTRY_DEBUG === 'true',

    // POPIA Compliance: Session replay is DISABLED
    // Session replay captures screenshots and could expose PHI
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // DISABLED: Session replay disabled for PHI protection
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

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

      // Scrub request headers (authorization tokens, cookies)
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-csrf-token'];
      }

      // Scrub query strings that might contain sensitive data
      if (event.request?.query_string) {
        const queryString = event.request.query_string;
        const sensitiveParams = ['token', 'password', 'email', 'phone', 'name'];
        const hasSensitiveParam = sensitiveParams.some((param) =>
          typeof queryString === 'string' ? queryString.includes(param) : false
        );
        if (hasSensitiveParam && event.request) {
          event.request.query_string = '[REDACTED]';
        }
      }

      // Scrub breadcrumbs (user interactions that might contain PHI)
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          // Remove data from console breadcrumbs
          if (crumb.category === 'console') {
            return {
              ...crumb,
              data: undefined,
            };
          }

          // Redact fetch URLs with sensitive params
          if (crumb.category === 'fetch' && crumb.data?.url) {
            const url = new URL(crumb.data.url, window.location.origin);
            const sensitiveParams = ['token', 'email', 'phone'];
            sensitiveParams.forEach((param) => {
              if (url.searchParams.has(param)) {
                url.searchParams.set(param, '[REDACTED]');
              }
            });
            crumb.data.url = url.toString();
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
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',

      // Browser issues
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',

      // Network errors (expected in poor connectivity)
      'Network request failed',
      'NetworkError',
      'Failed to fetch',

      // React hydration mismatches (common in Next.js, usually harmless)
      'Hydration failed',
      'There was an error while hydrating',

      // Third-party scripts
      'Script error.',
    ],

    // Ignore errors from browser extensions
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i],
  });
}

// Capture router transitions for navigation tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Export is required for Next.js to recognize this as an instrumentation file
export const onRequestError = () => {
  // This function is called when an unhandled error occurs
  // Sentry will automatically capture it via the global error handler
  // No additional logic needed here
};
