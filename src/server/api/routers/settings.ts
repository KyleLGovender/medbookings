import { Languages } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { z } from 'zod';

import {
  accountSettingsSchema,
  communicationPreferencesSchema,
  providerBusinessSettingsSchema,
} from '@/features/settings/types/schemas';
import { sendEmailVerification } from '@/lib/communications/email';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const settingsRouter = createTRPCRouter({
  /*
   * ====================================
   * SETTINGS DATA RETRIEVAL
   * ====================================
   */

  /**
   * Get all user settings in one call
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get user data
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        whatsappVerified: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Get communication preferences (create default if doesn't exist)
    let communicationPreferences = await ctx.prisma.communicationPreference.findFirst({
      where: { userId },
    });

    if (!communicationPreferences) {
      communicationPreferences = await ctx.prisma.communicationPreference.create({
        data: {
          userId,
          email: true,
          sms: false,
          whatsapp: false,
          reminderHours: 24,
        },
      });
    }

    // Get provider data if user is a provider
    const provider = await ctx.prisma.provider.findFirst({
      where: { userId },
      select: {
        id: true,
        name: true,
        bio: true,
        website: true,
        showPrice: true,
        languages: true,
        status: true,
      },
    });

    return {
      user,
      communicationPreferences,
      provider,
      isProvider: !!provider,
      isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
    };
  }),

  /*
   * ====================================
   * ACCOUNT SETTINGS
   * ====================================
   */

  /**
   * Update account settings
   */
  updateAccount: protectedProcedure
    .input(accountSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          whatsapp: input.whatsapp || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsapp: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          whatsappVerified: true,
        },
      });

      return updatedUser;
    }),

  /*
   * ====================================
   * COMMUNICATION PREFERENCES
   * ====================================
   */

  /**
   * Update communication preferences
   */
  updateCommunicationPreferences: protectedProcedure
    .input(communicationPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Find existing preference
      const existingPreference = await ctx.prisma.communicationPreference.findFirst({
        where: { userId },
      });

      if (existingPreference) {
        // Update existing preference
        const updatedPreferences = await ctx.prisma.communicationPreference.update({
          where: { id: existingPreference.id },
          data: {
            email: input.email,
            sms: input.sms,
            whatsapp: input.whatsapp,
            phoneNumber: input.phoneNumber || null,
            whatsappNumber: input.whatsappNumber || null,
            reminderHours: input.reminderHours,
          },
        });
        return updatedPreferences;
      } else {
        // Create new preference
        const newPreferences = await ctx.prisma.communicationPreference.create({
          data: {
            userId,
            email: input.email,
            sms: input.sms,
            whatsapp: input.whatsapp,
            phoneNumber: input.phoneNumber || null,
            whatsappNumber: input.whatsappNumber || null,
            reminderHours: input.reminderHours,
          },
        });
        return newPreferences;
      }
    }),

  /*
   * ====================================
   * PROVIDER BUSINESS SETTINGS
   * ====================================
   */

  /**
   * Update provider business settings
   */
  updateProviderBusiness: protectedProcedure
    .input(providerBusinessSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user has a provider profile
      const provider = await ctx.prisma.provider.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider profile not found',
        });
      }

      const updatedProvider = await ctx.prisma.provider.update({
        where: { id: provider.id },
        data: {
          bio: input.bio || null,
          website: input.website || null,
          showPrice: input.showPrice,
          languages: input.languages as Languages[],
        },
        select: {
          id: true,
          name: true,
          bio: true,
          website: true,
          showPrice: true,
          languages: true,
          status: true,
        },
      });

      return updatedProvider;
    }),

  /*
   * ====================================
   * ACCOUNT DELETION
   * ====================================
   */

  /**
   * Request account deletion
   */
  requestAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Check if user has a provider profile
    const provider = await ctx.prisma.provider.findFirst({
      where: { userId },
      select: { id: true, status: true },
    });

    if (provider && provider.status === 'ACTIVE') {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Please deactivate your provider profile before deleting your account',
      });
    }

    // For now, just return success. In production, this might trigger an email or admin review
    return {
      success: true,
      message: 'Account deletion request submitted. You will receive an email confirmation.',
    };
  }),

  /*
   * ====================================
   * EMAIL VERIFICATION
   * ====================================
   */

  /**
   * Send email verification
   */
  sendEmailVerification: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get user data
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    if (!user.email) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'No email address found for this account',
      });
    }

    if (user.emailVerified) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Email address is already verified',
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token in database
    await ctx.prisma.emailVerificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: expiresAt,
      },
    });

    // Send verification email
    await sendEmailVerification(user.email, verificationToken, user.name || undefined);

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  }),
});
