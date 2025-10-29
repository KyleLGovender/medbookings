import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import NextAuth from 'next-auth/next';

/**
 * NextAuth route handler using DYNAMIC imports
 *
 * CRITICAL FIX: Use dynamic imports instead of static imports
 * Static imports fail silently in AWS Amplify serverless environment
 * Dynamic imports allow proper error handling and module loading at runtime
 */

// Cache the handler once it's successfully created
let cachedHandler: any = null;
let initializationAttempted = false;
let lastError: Error | null = null;

async function getHandler() {
  // Return cached handler if available
  if (cachedHandler) {
    return cachedHandler;
  }

  // Only attempt initialization once to avoid repeated failures
  if (initializationAttempted && !cachedHandler) {
    throw lastError || new Error('Handler initialization failed previously');
  }

  initializationAttempted = true;

  try {
    // eslint-disable-next-line no-console
    console.log('[NextAuth] Dynamically importing authOptions...');

    // CRITICAL: Use dynamic import instead of static import
    // This allows the import to happen at runtime and be caught by try-catch
    const authModule = await import('@/lib/auth');
    const authOptions = authModule.authOptions;

    // eslint-disable-next-line no-console
    console.log('[NextAuth] authOptions imported successfully');
    // eslint-disable-next-line no-console
    console.log('[NextAuth] Environment check:', {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length || 0,
      hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      NODE_ENV: process.env.NODE_ENV,
    });

    // eslint-disable-next-line no-console
    console.log('[NextAuth] Creating NextAuth handler...');

    cachedHandler = NextAuth(authOptions);

    // eslint-disable-next-line no-console
    console.log('[NextAuth] Handler created successfully');

    return cachedHandler;
  } catch (error) {
    lastError = error as Error;

    // eslint-disable-next-line no-console
    console.error('[NextAuth] CRITICAL: Failed to initialize handler');
    // eslint-disable-next-line no-console
    console.error('[NextAuth] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    throw error;
  }
}

export async function GET(req: NextRequest, context: any) {
  try {
    // eslint-disable-next-line no-console
    console.log('[NextAuth GET] Request received:', {
      url: req.url,
      method: req.method,
    });

    const handler = await getHandler();

    // eslint-disable-next-line no-console
    console.log('[NextAuth GET] Calling handler...');

    return await handler(req, context);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[NextAuth GET] Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Authentication service failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: any) {
  try {
    // eslint-disable-next-line no-console
    console.log('[NextAuth POST] Request received:', {
      url: req.url,
      method: req.method,
    });

    const handler = await getHandler();

    // eslint-disable-next-line no-console
    console.log('[NextAuth POST] Calling handler...');

    return await handler(req, context);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[NextAuth POST] Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Authentication service failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined,
      },
      { status: 500 }
    );
  }
}
