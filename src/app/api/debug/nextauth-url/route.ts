import { NextResponse } from 'next/server';

import { nowUTC } from '@/lib/timezone';

/**
 * Debug endpoint to check actual NEXTAUTH_URL value at runtime
 *
 * This endpoint reveals what value NextAuth v4 actually sees when it runs.
 * If NEXTAUTH_URL is localhost:3000, we know the environment variable is not being set correctly.
 */
export async function GET() {
  const diagnostics = {
    timestamp: nowUTC().toISOString(),
    purpose: 'Check actual NEXTAUTH_URL value at runtime in AWS Amplify serverless environment',

    // What NextAuth v4's detectOrigin() function checks
    environmentVariables: {
      NEXTAUTH_URL: {
        value: process.env.NEXTAUTH_URL || 'NOT_SET',
        type: typeof process.env.NEXTAUTH_URL,
        length: process.env.NEXTAUTH_URL?.length || 0,
        isLocalhost: process.env.NEXTAUTH_URL?.includes('localhost') || false,
      },
      VERCEL: {
        value: process.env.VERCEL || 'NOT_SET',
        type: typeof process.env.VERCEL,
        isSet: !!process.env.VERCEL,
      },
      AUTH_TRUST_HOST: {
        value: process.env.AUTH_TRUST_HOST || 'NOT_SET',
        type: typeof process.env.AUTH_TRUST_HOST,
        isSet: !!process.env.AUTH_TRUST_HOST,
      },
      NODE_ENV: {
        value: process.env.NODE_ENV || 'NOT_SET',
        type: typeof process.env.NODE_ENV,
      },
    },

    // Simulate NextAuth v4's detectOrigin() logic
    detectOriginSimulation: {
      trustHostCheck: !!(process.env.VERCEL ?? process.env.AUTH_TRUST_HOST),
      explanation:
        (process.env.VERCEL ?? process.env.AUTH_TRUST_HOST)
          ? 'NextAuth will try to use x-forwarded-host header (which may be undefined on AWS Amplify)'
          : 'NextAuth will fall back to NEXTAUTH_URL environment variable',
      expectedBehavior:
        (process.env.VERCEL ?? process.env.AUTH_TRUST_HOST)
          ? 'Will construct origin from headers (may result in undefined://undefined → localhost:3000)'
          : `Will use NEXTAUTH_URL directly: ${process.env.NEXTAUTH_URL || 'NOT_SET'}`,
    },

    // Check if this explains the localhost:3000 issue
    diagnosis: {
      issue: process.env.NEXTAUTH_URL?.includes('localhost')
        ? '❌ NEXTAUTH_URL is set to localhost! This explains the OAuth error.'
        : !process.env.NEXTAUTH_URL
          ? '❌ NEXTAUTH_URL is NOT SET! NextAuth falls back to localhost:3000.'
          : (process.env.VERCEL ?? process.env.AUTH_TRUST_HOST) && !process.env.NEXTAUTH_URL
            ? '⚠️ Trying to use headers but NEXTAUTH_URL is not set as fallback.'
            : '✅ NEXTAUTH_URL looks correct. The issue must be somewhere else.',

      recommendation: process.env.NEXTAUTH_URL?.includes('localhost')
        ? 'Fix: Set NEXTAUTH_URL to https://medbookings.co.za in AWS Amplify environment variables'
        : !process.env.NEXTAUTH_URL
          ? 'Fix: Add NEXTAUTH_URL=https://medbookings.co.za to AWS Amplify environment variables'
          : (process.env.VERCEL ?? process.env.AUTH_TRUST_HOST)
            ? 'Fix: Remove AUTH_TRUST_HOST and VERCEL env vars to force NextAuth to use NEXTAUTH_URL'
            : 'NextAuth v4 may be fundamentally incompatible with AWS Amplify. Consider upgrading to NextAuth v5.',
    },
  };

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
