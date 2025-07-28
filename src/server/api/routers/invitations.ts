import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const invitationsRouter = createTRPCRouter({
  /**
   * Validate invitation token
   * Migrated from: /api/invitations/[token]/validate
   */
  validate: publicProcedure.input(z.object({ token: z.string() })).query(async ({ ctx, input }) => {
    const { token } = input;

    // Find the invitation by token
    const invitation = await ctx.prisma.providerInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            email: true,
            phone: true,
            website: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        connection: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    return { invitation };
  }),
});
