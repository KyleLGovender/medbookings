/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js 14+ to initialize
 * server-side instrumentation before the application starts.
 *
 * Required for Sentry server-side error tracking.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

/* eslint-disable no-console */
export async function register() {
  console.log('[INSTRUMENTATION] register() called');
  console.log('[INSTRUMENTATION] NEXT_RUNTIME:', process.env.NEXT_RUNTIME);
  console.log('[INSTRUMENTATION] SENTRY_DSN exists:', !!process.env.SENTRY_DSN);
  console.log(
    '[INSTRUMENTATION] SENTRY_DSN value:',
    `${process.env.SENTRY_DSN?.substring(0, 30)}...`
  );

  // Only run on server-side (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[INSTRUMENTATION] Loading sentry.server.config for Node.js runtime...');
    try {
      await import('./sentry.server.config');
      console.log('[INSTRUMENTATION] Successfully loaded sentry.server.config');
    } catch (error) {
      console.error('[INSTRUMENTATION] Failed to load sentry.server.config:', error);
    }
  }

  // Only run on edge runtime (Vercel Edge Functions, Middleware)
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('[INSTRUMENTATION] Loading sentry.edge.config for Edge runtime...');
    try {
      await import('./sentry.edge.config');
      console.log('[INSTRUMENTATION] Successfully loaded sentry.edge.config');
    } catch (error) {
      console.error('[INSTRUMENTATION] Failed to load sentry.edge.config:', error);
    }
  }

  console.log('[INSTRUMENTATION] register() completed');
}
