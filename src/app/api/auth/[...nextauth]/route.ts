import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import NextAuth from 'next-auth/next';

import { authOptions } from '@/lib/auth';

// DIAGNOSTIC: Add comprehensive error handling to catch NextAuth initialization errors
let handler: any;
let initializationError: Error | null = null;

try {
  // eslint-disable-next-line no-console
  console.log('[NextAuth Route Handler] Initializing NextAuth with authOptions...');
  // eslint-disable-next-line no-console
  console.log('[NextAuth Route Handler] Environment check:', {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length || 0,
    hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    NODE_ENV: process.env.NODE_ENV,
  });

  handler = NextAuth(authOptions);

  // eslint-disable-next-line no-console
  console.log('[NextAuth Route Handler] NextAuth initialized successfully');
} catch (error) {
  initializationError = error as Error;
  // eslint-disable-next-line no-console
  console.error('[NextAuth Route Handler] CRITICAL: Failed to initialize NextAuth');
  // eslint-disable-next-line no-console
  console.error('[NextAuth Route Handler] Error details:', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    fullError: error,
  });
}

export async function GET(req: NextRequest, context: any) {
  // eslint-disable-next-line no-console
  console.log('[NextAuth GET] Handler invoked', {
    url: req.url,
    method: req.method,
    hasHandler: !!handler,
    hasInitError: !!initializationError,
  });

  if (!handler) {
    // eslint-disable-next-line no-console
    console.error('[NextAuth GET] Handler not initialized, returning error');
    return NextResponse.json(
      {
        error: 'Authentication service failed to initialize',
        details: initializationError?.message || 'Unknown initialization error',
        stack: initializationError?.stack,
      },
      { status: 500 }
    );
  }

  try {
    // eslint-disable-next-line no-console
    console.log('[NextAuth GET] Calling NextAuth handler...');
    return await handler(req, context);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[NextAuth GET] Error during handler execution:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Authentication request failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: any) {
  // eslint-disable-next-line no-console
  console.log('[NextAuth POST] Handler invoked', {
    url: req.url,
    method: req.method,
    hasHandler: !!handler,
    hasInitError: !!initializationError,
  });

  if (!handler) {
    // eslint-disable-next-line no-console
    console.error('[NextAuth POST] Handler not initialized, returning error');
    return NextResponse.json(
      {
        error: 'Authentication service failed to initialize',
        details: initializationError?.message || 'Unknown initialization error',
        stack: initializationError?.stack,
      },
      { status: 500 }
    );
  }

  try {
    // eslint-disable-next-line no-console
    console.log('[NextAuth POST] Calling NextAuth handler...');
    return await handler(req, context);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[NextAuth POST] Error during handler execution:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Authentication request failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
