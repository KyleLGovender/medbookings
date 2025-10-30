import { NextResponse } from 'next/server';

/**
 * Debug endpoint to verify environment variables NextAuth sees
 * DELETE THIS FILE after debugging!
 */
export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    // Check if these are being set at build time or runtime
    buildTimeUrl: process.env.NEXTAUTH_URL,
  });
}
