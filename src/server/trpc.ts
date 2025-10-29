import { TRPCError, initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type Session } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

type CreateContextOptions = {
  session: Session | null;
};

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to
 * process every request that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get user using existing auth pattern (getCurrentUser instead of getServerSession)
  const user = await getCurrentUser();

  return createInnerTRPCContext({
    session: user ? { user, expires: '' } : null,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Create a server-side caller
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Logging middleware for all tRPC requests
 *
 * Logs all tRPC procedure calls with timing and error information.
 * Logs are automatically sent to CloudWatch for monitoring and alerting.
 */
const loggingMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  // eslint-disable-next-line rulesdir/no-new-date
  const start = Date.now();
  const userId = ctx.session?.user?.id;

  try {
    const result = await next();
    // eslint-disable-next-line rulesdir/no-new-date
    const durationMs = Date.now() - start;

    // Log successful requests at info level
    logger.info('tRPC request completed', {
      path,
      type,
      durationMs,
      userId,
      success: true,
    });

    return result;
  } catch (error) {
    // eslint-disable-next-line rulesdir/no-new-date
    const durationMs = Date.now() - start;

    // Log failed requests at error level
    logger.error('tRPC request failed', error as Error, {
      path,
      type,
      durationMs,
      userId,
      success: false,
      errorCode: error instanceof TRPCError ? error.code : 'UNKNOWN',
    });

    // Re-throw the error so tRPC can handle it properly
    throw error;
  }
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 *
 * Enhanced with automatic logging for CloudWatch monitoring.
 */
export const publicProcedure = t.procedure.use(loggingMiddleware);

/**
 * Middleware for enforcing user authentication
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Middleware for enforcing specific user roles
 */
const enforceUserHasRole = (allowedRoles: string[]) => {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(ctx.session.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action',
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
};

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * Enhanced with automatic logging for CloudWatch monitoring.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(loggingMiddleware).use(enforceUserIsAuthed);

/**
 * Admin procedure
 *
 * If you want a query or mutation to ONLY be accessible to users with ADMIN or SUPER_ADMIN role,
 * use this. It verifies the session is valid and the user has the required role.
 *
 * Enhanced with automatic logging for CloudWatch monitoring.
 */
export const adminProcedure = t.procedure
  .use(loggingMiddleware)
  .use(enforceUserHasRole(['ADMIN', 'SUPER_ADMIN']));

/**
 * Super Admin procedure
 *
 * If you want a query or mutation to ONLY be accessible to users with SUPER_ADMIN role,
 * use this. It verifies the session is valid and the user has the required role.
 *
 * Enhanced with automatic logging for CloudWatch monitoring.
 */
export const superAdminProcedure = t.procedure
  .use(loggingMiddleware)
  .use(enforceUserHasRole(['SUPER_ADMIN']));
