'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

/**
 * Global Error Boundary for Next.js App Router
 *
 * This component catches and logs unhandled errors that occur during rendering.
 * Logs are automatically sent to CloudWatch for monitoring and alerting.
 *
 * Note: This only catches errors in client components. Server component errors
 * are caught by Next.js and logged automatically.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to CloudWatch via our structured logger
    logger.error('Application error boundary triggered', error, {
      digest: error.digest,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '[server]',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '[server]',
    });

    // Also log to console for immediate visibility in browser DevTools
    // eslint-disable-next-line no-console
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">
            We apologize for the inconvenience. Our team has been notified and will investigate this
            issue.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-lg bg-red-50 p-4 text-left">
            <p className="text-sm font-medium text-red-800">Development Mode Error Details:</p>
            <pre className="mt-2 overflow-auto text-xs text-red-700">{error.message}</pre>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600">
                Error Digest: <code>{error.digest}</code>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="w-full sm:w-auto" variant="default">
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            className="w-full sm:w-auto"
            variant="outline"
          >
            Go to home page
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Reference ID: <code className="rounded bg-muted px-1 py-0.5">{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
