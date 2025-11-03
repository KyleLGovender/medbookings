import { z } from 'zod';

import { validateAccountDeletion, validateProfileUpdate } from '@/features/profile/lib/actions';
import {
  deleteAccountRequestSchema,
  updateProfileRequestSchema,
} from '@/features/profile/types/schemas';
import { createAuditLog } from '@/lib/audit';
import { logger, sanitizeEmail, sanitizeName } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';
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
   * OPTION C COMPLIANT: Single database query with server action business logic
   * Migrated from: PATCH /api/profile
   */
  update: protectedProcedure.input(updateProfileRequestSchema).mutation(async ({ ctx, input }) => {
    // Call server action for business logic validation
    const validation = await validateProfileUpdate(input);

    if (!validation.success) {
      throw new Error(validation.error);
    }

    // Single database query with automatic type inference
    const updatedUser = await ctx.prisma.user.update({
      where: { id: validation.validatedData!.userId },
      data: {
        name: validation.validatedData!.name,
        email: validation.validatedData!.email,
        phone: validation.validatedData!.phone,
        whatsapp: validation.validatedData!.whatsapp,
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

    // POPIA Compliance: Audit log for PHI update
    logger.audit('USER_PROFILE_UPDATED', {
      userId: updatedUser.id,
      updatedBy: ctx.session.user.id,
      updatedFields: Object.keys(validation.validatedData!).filter((key) => key !== 'userId'),
      name: sanitizeName(updatedUser.name),
      email: sanitizeEmail(updatedUser.email),
      action: 'PROFILE_UPDATE',
    });

    // Also persist to database for compliance reporting
    await createAuditLog({
      userId: updatedUser.id,
      userEmail: sanitizeEmail(updatedUser.email),
      action: 'USER_PROFILE_UPDATED',
      category: 'PHI_ACCESS',
      resource: 'User',
      resourceId: updatedUser.id,
      metadata: {
        updatedFields: Object.keys(validation.validatedData!).filter((key) => key !== 'userId'),
        updatedBy: ctx.session.user.id,
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
   * OPTION C COMPLIANT: Single transaction with server action business logic
   * Migrated from: DELETE /api/profile
   */
  delete: protectedProcedure
    .input(deleteAccountRequestSchema.optional())
    .mutation(async ({ ctx }) => {
      // Call server action for business logic validation
      const validation = await validateAccountDeletion();

      if (!validation.success) {
        throw new Error(validation.error);
      }

      // Single transaction with all database operations and validation
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Check if user has a service provider profile (must be done in transaction)
        const provider = await tx.provider.findFirst({
          where: { userId: validation.validatedData!.userId },
          select: { id: true }, // Minimal data needed
        });

        if (provider) {
          throw new Error(
            'Please delete your service provider profile first before deleting your account.'
          );
        }

        // Delete account connections (OAuth)
        await tx.account.deleteMany({
          where: { userId: validation.validatedData!.userId },
        });

        // Delete organization memberships
        await tx.organizationMembership.deleteMany({
          where: { userId: validation.validatedData!.userId },
        });

        // Finally delete the user
        await tx.user.delete({
          where: { id: validation.validatedData!.userId },
        });

        return { success: true, deletedUserId: validation.validatedData!.userId };
      });

      // POPIA Compliance: Audit log for account deletion (PHI removal)
      logger.audit('USER_ACCOUNT_DELETED', {
        userId: result.deletedUserId,
        deletedBy: ctx.session.user.id,
        action: 'ACCOUNT_DELETION',
        timestamp: nowUTC().toISOString(),
      });

      // Also persist to database for compliance reporting
      await createAuditLog({
        userId: result.deletedUserId,
        action: 'USER_ACCOUNT_DELETED',
        category: 'PHI_ACCESS',
        resource: 'User',
        resourceId: result.deletedUserId,
        metadata: {
          deletedBy: ctx.session.user.id,
        },
      });

      return result;
    }),
});
