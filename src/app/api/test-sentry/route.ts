import { NextResponse } from 'next/server';

import * as Sentry from '@sentry/nextjs';

import { nowUTC } from '@/lib/timezone';

export const dynamic = 'force-dynamic'; // Prevent static optimization

export async function GET() {
  try {
    // Delay to ensure runtime execution
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Create the test error
    const error = new Error('Sentry test error - explicitly captured for verification');

    // Explicitly capture the error with Sentry
    Sentry.captureException(error, {
      tags: {
        test: 'explicit-capture',
        endpoint: '/api/test-sentry',
      },
      extra: {
        message: 'This is a test error to verify Sentry integration',
        timestamp: nowUTC().toISOString(),
      },
    });

    // Flush to ensure event is sent before function terminates
    await Sentry.flush(2000);

    // Still throw to return 500 status
    throw error;
  } catch (error) {
    // Re-throw to trigger 500 response
    throw error;
  }
}

// TODO: DELETE THIS FILE AFTER SENTRY VERIFICATION
