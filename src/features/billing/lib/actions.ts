'use server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Validate subscription creation and handle business logic
 * OPTION C: Business logic only - returns minimal metadata for tRPC procedure
 */
export async function validateSubscriptionCreation(data: {
  planId: string;
  organizationId?: string;
  locationId?: string;
  providerId?: string;
  type: string;
  startDate: Date;
  endDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<{
  success: boolean;
  validatedData?: typeof data & {
    userId: string;
    billingCycleEnd: Date;
    currentMonthSlots: number;
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Business logic validations
    if (!data.planId || !data.type || !data.startDate) {
      return { success: false, error: 'Missing required fields' };
    }

    // Validate only one entity type is specified (polymorphic relationship)
    const entityCount = [data.organizationId, data.locationId, data.providerId].filter(Boolean).length;
    if (entityCount !== 1) {
      return { success: false, error: 'Exactly one entity (organization, location, or provider) must be specified' };
    }

    // Validate date logic
    if (data.endDate && data.endDate <= data.startDate) {
      return { success: false, error: 'End date must be after start date' };
    }

    // TODO: Send subscription creation notification
    console.log(`=ç Subscription creation notification would be sent for plan: ${data.planId}`);

    // Calculate billing cycle end (30 days from start)
    const billingCycleEnd = new Date(data.startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      success: true,
      validatedData: {
        ...data,
        userId: currentUser.id,
        billingCycleEnd,
        currentMonthSlots: 0,
      },
    };
  } catch (error) {
    console.error('Subscription creation validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate subscription creation',
    };
  }
}

/**
 * Validate subscription update and handle business logic
 * OPTION C: Business logic only - returns minimal metadata for tRPC procedure
 */
export async function validateSubscriptionUpdate(data: {
  id: string;
  planId?: string;
  organizationId?: string;
  locationId?: string;
  providerId?: string;
  status?: string;
  endDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<{
  success: boolean;
  validatedData?: typeof data & {
    userId: string;
    polymorphicUpdateData: any;
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Business logic validations
    if (!data.id) {
      return { success: false, error: 'Subscription ID is required' };
    }

    // Handle polymorphic relationship updates
    let polymorphicUpdateData: any = {};
    
    if (
      data.organizationId !== undefined ||
      data.locationId !== undefined ||
      data.providerId !== undefined
    ) {
      // Validate only one entity type is specified when updating relationship
      const providedEntities = [data.organizationId, data.locationId, data.providerId].filter(val => val !== undefined);
      if (providedEntities.length > 1) {
        return { success: false, error: 'Can only specify one entity type at a time' };
      }

      // Clear all polymorphic fields first, then set the specified one
      polymorphicUpdateData = {
        organizationId: null,
        locationId: null,
        providerId: null,
      };

      if (data.organizationId !== undefined) {
        polymorphicUpdateData.organizationId = data.organizationId;
      } else if (data.locationId !== undefined) {
        polymorphicUpdateData.locationId = data.locationId;
      } else if (data.providerId !== undefined) {
        polymorphicUpdateData.providerId = data.providerId;
      }
    }

    // TODO: Send subscription update notification
    console.log(`=ç Subscription update notification would be sent for: ${data.id}`);

    return {
      success: true,
      validatedData: {
        ...data,
        userId: currentUser.id,
        polymorphicUpdateData,
      },
    };
  } catch (error) {
    console.error('Subscription update validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate subscription update',
    };
  }
}

/**
 * Validate subscription cancellation and handle business logic
 * OPTION C: Business logic only - returns minimal metadata for tRPC procedure
 */
export async function validateSubscriptionCancellation(data: {
  id: string;
  cancelReason?: string;
}): Promise<{
  success: boolean;
  validatedData?: typeof data & {
    userId: string;
    cancelledAt: Date;
    status: 'CANCELLED';
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Business logic validations
    if (!data.id) {
      return { success: false, error: 'Subscription ID is required' };
    }

    // TODO: Send subscription cancellation notification
    console.log(`=ç Subscription cancellation notification would be sent for: ${data.id}`);

    return {
      success: true,
      validatedData: {
        ...data,
        userId: currentUser.id,
        cancelledAt: new Date(),
        status: 'CANCELLED' as const,
      },
    };
  } catch (error) {
    console.error('Subscription cancellation validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate subscription cancellation',
    };
  }
}