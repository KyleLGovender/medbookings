import { type NextRequest } from 'next/server';

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { logger } from '@/lib/logger';
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
  // Cast to any to bypass type mismatch between App Router (Web API) and Pages Router (Node API)
  return createTRPCContext({
    req: undefined,
    res: undefined,
  } as any);
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
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

export { handler as GET, handler as POST };
