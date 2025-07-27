import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const debugRouter = createTRPCRouter({
  /**
   * Get session info for debugging
   * Migrated from: /api/debug-session
   */
  session: publicProcedure.query(async ({ ctx }) => {
    return {
      session: ctx.session,
      user: ctx.session?.user || null,
    };
  }),
});