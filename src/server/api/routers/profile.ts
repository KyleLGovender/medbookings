import { z } from 'zod';

import {
  deleteAccountRequestSchema,
  updateProfileRequestSchema,
} from '@/features/profile/types/schemas';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const profileRouter = createTRPCRouter({
  /*
   * ====================================
   * PROFILE DATA OPERATIONS
   * ====================================
   * Endpoints for retrieving and updating user profile information
   */

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
  update: protectedProcedure.input(updateProfileRequestSchema).mutation(async ({ ctx, input }) => {
    // Simple validation
    if (input.email && input.email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }
    
    if (input.name && input.name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    // TODO: Send profile update notification email
    console.log(`📧 Profile update notification would be sent to: ${ctx.session.user.email}`);

    // Update user profile with automatic type inference
    const updatedUser = await ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        whatsapp: input.whatsapp,
      },
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

    return updatedUser;
  }),

  /*
   * ====================================
   * ACCOUNT MANAGEMENT
   * ====================================
   * Endpoints for account lifecycle operations
   */

  /**
   * Delete current user's account
   * Migrated from: DELETE /api/profile
   */
  delete: protectedProcedure.input(deleteAccountRequestSchema.optional()).mutation(async ({ ctx }) => {
    // Check if user has a service provider profile
    const provider = await ctx.prisma.provider.findFirst({
      where: { userId: ctx.session.user.id },
    });

    if (provider) {
      throw new Error('Please delete your service provider profile first before deleting your account.');
    }

    // TODO: Send account deletion notification email
    console.log(`📧 Account deletion notification would be sent to: ${ctx.session.user.email}`);

    // Delete the user and all related records in a transaction
    await ctx.prisma.$transaction(async (tx) => {
      // Delete account connections (OAuth)
      await tx.account.deleteMany({
        where: { userId: ctx.session.user.id },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: ctx.session.user.id },
      });
    });

    return { success: true };
  }),
});
