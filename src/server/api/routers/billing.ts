import { SubscriptionType } from '@prisma/client';
import { z } from 'zod';

import {
  validateSubscriptionCancellation,
  validateSubscriptionCreation,
  validateSubscriptionUpdate,
} from '@/features/billing/lib/actions';
import {
  cancelSubscriptionRequestSchema,
  createSubscriptionRequestSchema,
  getSubscriptionsQuerySchema,
  updateSubscriptionRequestSchema,
} from '@/features/billing/types/schemas';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const billingRouter = createTRPCRouter({
  /**
   * Get subscriptions list with filtering
   * Migrated from: GET /api/subscriptions
   */
  getSubscriptions: protectedProcedure
    .input(getSubscriptionsQuerySchema)
    .query(async ({ ctx, input }) => {
      // Build where clause based on provided filters
      const whereClause: any = {};

      if (input.organizationId) {
        whereClause.organizationId = input.organizationId;
      }
      if (input.locationId) {
        whereClause.locationId = input.locationId;
      }
      if (input.providerId) {
        whereClause.providerId = input.providerId;
      }

      const subscriptions = await ctx.prisma.subscription.findMany({
        where: whereClause,
        include: {
          plan: true,
          organization: true,
          location: true,
          provider: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return subscriptions;
    }),

  /**
   * Get specific subscription by ID
   * Migrated from: GET /api/subscriptions/[id]
   */
  getSubscriptionById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { id: input.id },
        include: {
          plan: true,
          organization: true,
          location: true,
          provider: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          usageRecords: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      return subscription;
    }),

  /**
   * Create new subscription
   * OPTION C COMPLIANT: Single database query with server action business logic
   * Migrated from: POST /api/subscriptions
   */
  createSubscription: protectedProcedure
    .input(createSubscriptionRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Call server action for business logic validation
      const validation = await validateSubscriptionCreation(input);

      if (!validation.success) {
        throw new Error(validation.error);
      }

      // Single database query with all necessary relations and validations
      const subscription = await ctx.prisma.subscription.create({
        data: {
          planId: validation.validatedData!.planId,
          organizationId: validation.validatedData!.organizationId,
          locationId: validation.validatedData!.locationId,
          providerId: validation.validatedData!.providerId,
          type: validation.validatedData!.type as SubscriptionType,
          status: input.status,
          startDate: validation.validatedData!.startDate,
          endDate: validation.validatedData!.endDate,
          stripeCustomerId: validation.validatedData!.stripeCustomerId,
          stripeSubscriptionId: validation.validatedData!.stripeSubscriptionId,
          billingCycleStart: validation.validatedData!.startDate,
          billingCycleEnd: validation.validatedData!.billingCycleEnd,
          currentMonthSlots: validation.validatedData!.currentMonthSlots,
        },
        include: {
          plan: true,
          organization: true,
          location: true,
          provider: true,
        },
      });

      return subscription;
    }),

  /**
   * Update subscription
   * OPTION C COMPLIANT: Single database query with server action business logic
   * Migrated from: PATCH /api/subscriptions/[id]
   */
  updateSubscription: protectedProcedure
    .input(updateSubscriptionRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Call server action for business logic validation
      const validation = await validateSubscriptionUpdate(input);

      if (!validation.success) {
        throw new Error(validation.error);
      }

      // Prepare update data
      const updateData: any = { ...input };
      delete updateData.id; // Remove ID from update data

      // Apply polymorphic relationship updates if needed
      if (Object.keys(validation.validatedData!.polymorphicUpdateData).length > 0) {
        Object.assign(updateData, validation.validatedData!.polymorphicUpdateData);
      }

      // Single database query with all necessary relations and validations
      const updatedSubscription = await ctx.prisma.subscription.update({
        where: { id: validation.validatedData!.id },
        data: {
          ...updateData,
          // Connect to related entities if updated (Prisma will validate existence automatically)
          ...(input.planId && {
            plan: { connect: { id: input.planId } },
          }),
          ...(updateData.organizationId && {
            organization: { connect: { id: updateData.organizationId } },
          }),
          ...(updateData.locationId && {
            location: { connect: { id: updateData.locationId } },
          }),
          ...(updateData.providerId && {
            provider: { connect: { id: updateData.providerId } },
          }),
        },
        include: {
          plan: true,
          organization: true,
          location: true,
          provider: true,
        },
      });

      return updatedSubscription;
    }),

  /**
   * Cancel subscription (soft delete)
   * OPTION C COMPLIANT: Single database query with server action business logic
   * Migrated from: DELETE /api/subscriptions/[id]
   */
  cancelSubscription: protectedProcedure
    .input(cancelSubscriptionRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Call server action for business logic validation
      const validation = await validateSubscriptionCancellation(input);

      if (!validation.success) {
        throw new Error(validation.error);
      }

      // Single database query - Prisma will validate existence and update atomically
      const cancelledSubscription = await ctx.prisma.subscription.update({
        where: { id: validation.validatedData!.id },
        data: {
          status: validation.validatedData!.status,
          cancelledAt: validation.validatedData!.cancelledAt,
          cancelReason: validation.validatedData!.cancelReason,
        },
        include: {
          plan: true,
          organization: true,
          location: true,
          provider: true,
        },
      });

      return cancelledSubscription;
    }),
});
