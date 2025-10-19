import { NextRequest, NextResponse } from 'next/server';

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
  console.error('NextAuth Error Captured:', {
    error,
    allParams: Object.fromEntries(searchParams.entries()),
    timestamp: new Date().toISOString(),
    url: request.url,
  });

  // Redirect to the custom error page
  const redirectUrl = new URL('/error', request.url);
  redirectUrl.searchParams.set('error', error);

  return NextResponse.redirect(redirectUrl);
}
