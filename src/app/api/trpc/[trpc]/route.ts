import { type NextRequest, NextResponse } from 'next/server';

/* eslint-disable n/no-process-env -- tRPC handler needs process.env for development mode check */
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { logger } from '@/lib/logger';
import { apiRateLimit, createRateLimitHeaders, getRateLimitIdentifier } from '@/lib/rate-limit';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/trpc';

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
  // Apply rate limiting to all tRPC requests
  // Uses IP address for anonymous requests, user ID for authenticated users
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await apiRateLimit.limit(identifier);

  // If rate limit exceeded, return 429 Too Many Requests
  if (!rateLimitResult.success) {
    logger.warn('Rate limit exceeded for tRPC request', {
      identifier,
      path: req.nextUrl.pathname,
      remaining: rateLimitResult.remaining,
      resetTimestamp: rateLimitResult.reset,
    });

    return NextResponse.json(
      {
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        },
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  // Rate limit passed - proceed with tRPC request
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            logger.error('tRPC failed', {
              path: path ?? '<no-path>',
              error: error.message,
            });
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };
