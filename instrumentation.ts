/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js 14+ to initialize
 * server-side instrumentation before the application starts.
 *
 * Required for Sentry server-side error tracking.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import Sentry server config to initialize error tracking
    await import('./sentry.server.config');
  }

  // Only run on edge runtime (Vercel Edge Functions, Middleware)
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Import Sentry edge config for middleware error tracking
    await import('./sentry.edge.config');
  }
}
