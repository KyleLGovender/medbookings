/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js when instrumentationHook is enabled.
 * It runs once when the server starts (Node.js runtime) and when edge functions are initialized.
 *
 * This replaces the deprecated sentry.server.config.ts and sentry.edge.config.ts files.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Detect runtime environment
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js runtime (API routes, SSR, server components)
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime (middleware, edge API routes)
    await import('./sentry.edge.config');
  }
}
