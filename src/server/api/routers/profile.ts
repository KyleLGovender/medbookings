import { z } from 'zod';

import { deleteUser, updateProfile } from '@/features/profile/lib/actions';
import {
  deleteAccountRequestSchema,
  updateProfileRequestSchema,
} from '@/features/profile/types/schemas';
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

  /**
   * Update current user's profile
   * Migrated from: PATCH /api/profile
   */
  update: protectedProcedure.input(updateProfileRequestSchema).mutation(async ({ input }) => {
    const result = await updateProfile(input);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update profile');
    }

    return result.user;
  }),

  /**
   * Delete current user's account
   * Migrated from: DELETE /api/profile
   */
  delete: protectedProcedure.input(deleteAccountRequestSchema.optional()).mutation(async () => {
    const result = await deleteUser();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete account');
    }

    return { success: true };
  }),
});
