import { z } from 'zod';

import {
  cancelSubscriptionRequestSchema,
  createSubscriptionRequestSchema,
  getSubscriptionsQuerySchema,
  updateSubscriptionRequestSchema
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
   * Migrated from: POST /api/subscriptions
   */
  createSubscription: protectedProcedure
    .input(createSubscriptionRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Additional validation: Check that the referenced entity exists
      if (input.organizationId) {
        const organization = await ctx.prisma.organization.findUnique({
          where: { id: input.organizationId },
        });
        if (!organization) {
          throw new Error('Organization not found');
        }
      }

      if (input.locationId) {
        const location = await ctx.prisma.location.findUnique({
          where: { id: input.locationId },
        });
        if (!location) {
          throw new Error('Location not found');
        }
      }

      if (input.providerId) {
        const provider = await ctx.prisma.provider.findUnique({
          where: { id: input.providerId },
        });
        if (!provider) {
          throw new Error('Service provider not found');
        }
      }

      // Check that the plan exists
      const plan = await ctx.prisma.subscriptionPlan.findUnique({
        where: { id: input.planId },
      });
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Create the subscription
      const subscription = await ctx.prisma.subscription.create({
        data: {
          planId: input.planId,
          organizationId: input.organizationId,
          locationId: input.locationId,
          providerId: input.providerId,
          type: input.type,
          status: input.status,
          startDate: input.startDate,
          endDate: input.endDate,
          stripeCustomerId: input.stripeCustomerId,
          stripeSubscriptionId: input.stripeSubscriptionId,
          billingCycleStart: input.startDate,
          billingCycleEnd: new Date(input.startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          currentMonthSlots: 0,
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
   * Migrated from: PATCH /api/subscriptions/[id]
   */
  updateSubscription: protectedProcedure
    .input(updateSubscriptionRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if subscription exists
      const existingSubscription = await ctx.prisma.subscription.findUnique({
        where: { id: input.id },
      });

      if (!existingSubscription) {
        throw new Error('Subscription not found');
      }

      // Additional validation: Check that referenced entities exist
      if (input.organizationId) {
        const organization = await ctx.prisma.organization.findUnique({
          where: { id: input.organizationId },
        });
        if (!organization) {
          throw new Error('Organization not found');
        }
      }

      if (input.locationId) {
        const location = await ctx.prisma.location.findUnique({
          where: { id: input.locationId },
        });
        if (!location) {
          throw new Error('Location not found');
        }
      }

      if (input.providerId) {
        const provider = await ctx.prisma.provider.findUnique({
          where: { id: input.providerId },
        });
        if (!provider) {
          throw new Error('Service provider not found');
        }
      }

      if (input.planId) {
        const plan = await ctx.prisma.subscriptionPlan.findUnique({
          where: { id: input.planId },
        });
        if (!plan) {
          throw new Error('Subscription plan not found');
        }
      }

      // Handle polymorphic relationship updates carefully
      const updateData: any = { ...input };
      delete updateData.id; // Remove ID from update data

      // If updating the polymorphic relationship, we need to clear the other fields
      if (
        input.organizationId !== undefined ||
        input.locationId !== undefined ||
        input.providerId !== undefined
      ) {
        // Clear all polymorphic fields first
        updateData.organizationId = null;
        updateData.locationId = null;
        updateData.providerId = null;

        // Then set the one that was provided
        if (input.organizationId) {
          updateData.organizationId = input.organizationId;
        } else if (input.locationId) {
          updateData.locationId = input.locationId;
        } else if (input.providerId) {
          updateData.providerId = input.providerId;
        }
      }

      // Update the subscription
      const updatedSubscription = await ctx.prisma.subscription.update({
        where: { id: input.id },
        data: updateData,
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
   * Migrated from: DELETE /api/subscriptions/[id]
   */
  cancelSubscription: protectedProcedure
    .input(cancelSubscriptionRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if subscription exists
      const existingSubscription = await ctx.prisma.subscription.findUnique({
        where: { id: input.id },
      });

      if (!existingSubscription) {
        throw new Error('Subscription not found');
      }

      // Instead of hard delete, mark as cancelled
      const cancelledSubscription = await ctx.prisma.subscription.update({
        where: { id: input.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: input.cancelReason,
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
