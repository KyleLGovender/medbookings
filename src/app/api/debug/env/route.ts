import { NextResponse } from 'next/server';

/**
 * Debug endpoint to verify environment variables NextAuth sees
 * DELETE THIS FILE after debugging!
 *
 * eslint-disable n/no-process-env -- This debug endpoint explicitly shows env vars
 */
export async function GET() {
  return NextResponse.json({
    // eslint-disable-next-line n/no-process-env
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    // eslint-disable-next-line n/no-process-env
    NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
    // eslint-disable-next-line n/no-process-env
    NODE_ENV: process.env.NODE_ENV,
    // Check if these are being set at build time or runtime
    // eslint-disable-next-line n/no-process-env
    buildTimeUrl: process.env.NEXTAUTH_URL,
  });
}
