'use client';

/**
 * Global Error Boundary (Root Level)
 *
 * This component catches errors in the root layout and all child components.
 * This is required by Next.js for the app directory.
 * Automatically sends errors to Sentry for monitoring.
 *
 * Note: This boundary catches errors even in the root layout.tsx file.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
import { useEffect } from 'react';

import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Send error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global-root',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '28rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                margin: '0 auto',
                display: 'flex',
                height: '4rem',
                width: '4rem',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                backgroundColor: '#fee2e2',
              }}
            >
              <svg
                style={{ height: '2rem', width: '2rem', color: '#dc2626' }}
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
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
                Application Error
              </h1>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                A critical error occurred. Our team has been notified and is working on a fix.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Go to Home
              </button>
            </div>

            {/* Support Link */}
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              If the problem persists, please contact{' '}
              <a
                href="mailto:support@medbookings.co.za"
                style={{ fontWeight: '500', color: '#2563eb', textDecoration: 'none' }}
              >
                support@medbookings.co.za
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
