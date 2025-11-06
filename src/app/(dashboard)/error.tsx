'use client';

/**
 * Dashboard Error Boundary
 *
 * This component catches errors within the dashboard section.
 * Automatically sends errors to Sentry and provides a contextual error UI.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
import { useEffect } from 'react';

import * as Sentry from '@sentry/nextjs';

import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Send error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'dashboard',
        section: 'dashboard',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Error Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Error</h2>
          <p className="mt-2 text-sm text-gray-600">
            An error occurred while loading the dashboard. Our team has been notified.
          </p>
        </div>

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
            <summary className="cursor-pointer font-medium text-gray-700">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <span className="font-semibold">Message:</span> {error.message}
              </div>
              {error.digest && (
                <div>
                  <span className="font-semibold">Digest:</span> {error.digest}
                </div>
              )}
              {error.stack && (
                <div>
                  <span className="font-semibold">Stack:</span>
                  <pre className="mt-1 overflow-x-auto text-xs">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = '/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
