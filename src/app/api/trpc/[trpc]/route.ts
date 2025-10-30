import { type NextRequest } from 'next/server';

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { logger } from '@/lib/logger';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/trpc';

// CRITICAL: Runtime configuration for AWS Lambda
// Tells AWS Amplify to use Node.js runtime and not cache this dynamic route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 *
 * Note: For fetch adapter (App Router), we pass minimal context as createTRPCContext
 * retrieves auth from cookies/headers directly via getCurrentUser().
 */
const createContext = async (_req: NextRequest) => {
  // createTRPCContext doesn't actually use req/res in App Router - it uses getCurrentUser()
  // Type assertion to bypass type mismatch between App Router (Web API) and Pages Router (Node API)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createTRPCContext({
    req: undefined,
    res: undefined,
  } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
};

const handler = async (req: NextRequest) => {
  try {
    return await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: () => createContext(req),
      onError: ({ path, error, type, input }) => {
        // Log all errors in both development and production
        // CRITICAL: This ensures errors are logged even in AWS Lambda
        logger.error('tRPC failed', {
          path: path ?? '<no-path>',
          type,
          error: error.message,
          code: error.code,
          // Only log input in development to avoid leaking sensitive data
          input: process.env.NODE_ENV === 'development' ? input : undefined,
        });
      },
      responseMeta() {
        // CRITICAL: Ensure all responses have JSON content type
        // This prevents Next.js error pages from returning HTML
        return {
          headers: {
            'Content-Type': 'application/json',
          },
        };
      },
    });
  } catch (error) {
    // CRITICAL: Catch routing-level errors before Next.js error page
    // This prevents HTML 500 responses and returns JSON instead
    logger.error('[tRPC Route Handler] Catastrophic error - returning JSON', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
    });

    return new Response(
      JSON.stringify({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export { handler as GET, handler as POST };
