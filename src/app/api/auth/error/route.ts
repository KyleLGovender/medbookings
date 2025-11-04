/* eslint-disable n/no-process-env -- Error handler needs process.env for fallback URL */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

/**
 * NextAuth error handler API route
 *
 * This catches errors from NextAuth when it tries to redirect to /api/auth/error
 * and redirects to our custom error page at /error
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error') || 'Configuration';

  // Log the error for monitoring
  logger.error('NextAuth Error Captured', {
    error,
    allParams: Object.fromEntries(searchParams.entries()),
    timestamp: nowUTC().toISOString(),
    url: request.url,
    headers: {
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
    },
  });

  // Use NEXTAUTH_URL or construct from request headers to avoid localhost
  const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get('host')}`;
  const redirectUrl = new URL('/error', baseUrl);
  redirectUrl.searchParams.set('error', error);

  return NextResponse.redirect(redirectUrl);
}
