import { TRPCError, initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { type Session } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiRateLimit, authRateLimit } from '@/lib/rate-limit';

type CreateContextOptions = {
  session: Session | null;
  req?: Request;
  requestId?: string;
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
    req: opts.req,
    requestId: opts.requestId,
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

  // Extract request ID from headers (set by middleware)
  const requestAsRequest = req as unknown as Request;
  const requestId = requestAsRequest?.headers?.get('x-request-id') || undefined;

  return createInnerTRPCContext({
    session: user ? { user, expires: '' } : null,
    req: requestAsRequest,
    requestId,
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
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

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
 * Middleware for enforcing rate limits
 * Uses Upstash Redis for distributed rate limiting across serverless instances
 */
const enforceRateLimit = (rateLimit: typeof apiRateLimit | typeof authRateLimit) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.req) {
      // In testing or SSG scenarios where req is not available, skip rate limiting
      return next();
    }

    // Get identifier: user ID for authenticated requests, IP for anonymous
    const identifier = ctx.session?.user?.id || getIpFromRequest(ctx.req);

    // Check rate limit
    const { success, reset } = await rateLimit.limit(identifier);

    if (!success) {
      // Reset is a timestamp (ms since epoch) from rate limiter
      // Format in South Africa timezone (UTC+2)
      const resetTime = formatInTimeZone(reset, 'Africa/Johannesburg', 'PPpp');
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again at ${resetTime}`,
      });
    }

    return next();
  });
};

/**
 * Helper to extract IP address from request
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
function getIpFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'anonymous';
  return ip;
}

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Admin procedure
 *
 * If you want a query or mutation to ONLY be accessible to users with ADMIN or SUPER_ADMIN role,
 * use this. It verifies the session is valid and the user has the required role.
 */
export const adminProcedure = t.procedure.use(enforceUserHasRole(['ADMIN', 'SUPER_ADMIN']));

/**
 * Super Admin procedure
 *
 * If you want a query or mutation to ONLY be accessible to users with SUPER_ADMIN role,
 * use this. It verifies the session is valid and the user has the required role.
 */
export const superAdminProcedure = t.procedure.use(enforceUserHasRole(['SUPER_ADMIN']));

/**
 * Rate limited procedure
 *
 * Uses general API rate limiting (100 requests per minute)
 * Suitable for general API endpoints that need abuse prevention
 */
export const rateLimitedProcedure = t.procedure.use(enforceRateLimit(apiRateLimit));

/**
 * Auth rate limited procedure
 *
 * Uses strict authentication rate limiting (5 requests per 15 minutes)
 * Suitable for authentication endpoints to prevent brute force attacks
 * Applies to: email verification, password reset, etc.
 */
export const authRateLimitedProcedure = t.procedure.use(enforceRateLimit(authRateLimit));
