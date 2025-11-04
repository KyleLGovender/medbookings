import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const debugRouter = createTRPCRouter({
  // ✅ Disable debug endpoints in production for security
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        /**
         * Get session info for debugging (DEVELOPMENT ONLY)
         * Migrated from: /api/debug-session
         */
        session: publicProcedure.query(async ({ ctx }) => {
          return {
            session: ctx.session,
            user: ctx.session?.user || null,
          };
        }),
      }),
});
