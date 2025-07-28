import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const profileRouter = createTRPCRouter({
  /**
   * Get current user's profile
   * Migrated from: GET /api/profile
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        whatsapp: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }),
});
