'use server';

import { revalidatePath } from 'next/cache';

import { UserRole } from '@/features/profile/types/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import {
  AvailabilitySearchParams,
  AvailabilityStatus,
  AvailabilityWithRelations,
  BillingEntity,
  CreateAvailabilityData,
  UpdateAvailabilityData,
  availabilitySearchParamsSchema,
  createAvailabilityDataSchema,
  updateAvailabilityDataSchema,
} from '../types';
import { notifyAvailabilityProposed } from './notification-service';
import { processAvailabilityAcceptance, processAvailabilityRejection } from './workflow-service';

// Helper function to include common relations
const includeAvailabilityRelations = {
  serviceProvider: true,
  organization: true,
  location: true,
  providerConnection: true,
  createdBy: true,
  createdByMembership: true,
  acceptedBy: true,
  defaultSubscription: true,
  availableServices: {
    include: {
      service: true,
      serviceProvider: true,
      location: true,
    },
  },
  calculatedSlots: {
    include: {
      service: true,
      booking: true,
      billedToSubscription: true,
      blockedByCalendarEvent: true,
    },
  },
};

/**
 * Create new availability period
 */
export async function createAvailability(
  data: CreateAvailabilityData
): Promise<{ success: boolean; data?: AvailabilityWithRelations; error?: string }> {
  try {
    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input data
    const validatedData = createAvailabilityDataSchema.parse(data);

    // Check if user has permission to create availability for this provider
    const canCreateForProvider =
      currentUser.id === validatedData.serviceProviderId ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN;

    if (!canCreateForProvider && validatedData.organizationId) {
      // Check if user has organization membership with appropriate role
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: validatedData.organizationId,
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
        },
      });

      if (!membership) {
        return { success: false, error: 'Insufficient permissions' };
      }
    } else if (!canCreateForProvider) {
      return {
        success: false,
        error: 'Can only create availability for your own provider account',
      };
    }

    // Determine initial status based on context
    const isProviderCreated = currentUser.id === validatedData.serviceProviderId;
    const initialStatus = isProviderCreated
      ? AvailabilityStatus.ACTIVE
      : AvailabilityStatus.PENDING;

    // Determine billing entity if not specified
    const billingEntity =
      validatedData.billingEntity ||
      (isProviderCreated ? BillingEntity.PROVIDER : BillingEntity.ORGANIZATION);

    // Generate series ID for recurring availability
    const seriesId = validatedData.isRecurring
      ? validatedData.seriesId || crypto.randomUUID()
      : null;

    // Get current organization membership for context
    const createdByMembership = validatedData.organizationId
      ? await prisma.organizationMembership.findFirst({
          where: {
            userId: currentUser.id,
            organizationId: validatedData.organizationId,
          },
        })
      : null;

    // Create availability
    const availability = await prisma.availability.create({
      data: {
        serviceProviderId: validatedData.serviceProviderId,
        organizationId: validatedData.organizationId,
        locationId: validatedData.locationId,
        connectionId: validatedData.connectionId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        isRecurring: validatedData.isRecurring,
        recurrencePattern: validatedData.recurrencePattern || null,
        seriesId,
        schedulingRule: validatedData.schedulingRule,
        schedulingInterval: validatedData.schedulingInterval,
        isOnlineAvailable: validatedData.isOnlineAvailable,
        requiresConfirmation: validatedData.requiresConfirmation,
        billingEntity,
        status: initialStatus,
        createdById: currentUser.id,
        createdByMembershipId: createdByMembership?.id,
        defaultSubscriptionId: validatedData.defaultSubscriptionId,
        availableServices: {
          create: validatedData.services.map((service) => ({
            serviceId: service.serviceId,
            duration: service.duration,
            price: service.price,
            showPrice: service.showPrice,
            isOnlineAvailable: service.isOnlineAvailable,
            isInPerson: service.isInPerson,
            locationId: service.locationId,
          })),
        },
      },
      include: includeAvailabilityRelations,
    });

    // Send proposal notification if this is organization-created
    if (!isProviderCreated && availability.status === AvailabilityStatus.PENDING) {
      try {
        await notifyAvailabilityProposed(availability as AvailabilityWithRelations, {
          id: currentUser.id,
          name: currentUser.name || 'Organization Member',
          role: 'ORGANIZATION',
        });
      } catch (notificationError) {
        console.error('Failed to send proposal notification:', notificationError);
        // Don't fail the creation for notification errors
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');
    if (validatedData.organizationId) {
      revalidatePath(`/dashboard/organizations/${validatedData.organizationId}/availability`);
    }

    return { success: true, data: availability as AvailabilityWithRelations };
  } catch (error) {
    console.error('Error creating availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create availability',
    };
  }
}

/**
 * Get availability by ID with all relations
 */
export async function getAvailabilityById(
  id: string
): Promise<{ success: boolean; data?: AvailabilityWithRelations; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    const availability = await prisma.availability.findUnique({
      where: { id },
      include: includeAvailabilityRelations,
    });

    if (!availability) {
      return { success: false, error: 'Availability not found' };
    }

    // Check if user has permission to view this availability
    const canView =
      currentUser.id === availability.serviceProviderId ||
      currentUser.id === availability.createdById ||
      currentUser.roles.includes('ADMIN') ||
      currentUser.roles.includes('SUPER_ADMIN');

    if (!canView && availability.organizationId) {
      // Check organization membership
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: availability.organizationId,
        },
      });

      if (!membership) {
        return { success: false, error: 'Access denied' };
      }
    } else if (!canView) {
      return { success: false, error: 'Access denied' };
    }

    return { success: true, data: availability as AvailabilityWithRelations };
  } catch (error) {
    console.error('Error fetching availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch availability',
    };
  }
}

/**
 * Search and filter availability periods
 */
export async function searchAvailability(
  params: AvailabilitySearchParams
): Promise<{ success: boolean; data?: AvailabilityWithRelations[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate search parameters
    const validatedParams = availabilitySearchParamsSchema.parse(params);

    // Build where clause
    const where: any = {};

    if (validatedParams.serviceProviderId) {
      where.serviceProviderId = validatedParams.serviceProviderId;
    }

    if (validatedParams.organizationId) {
      where.organizationId = validatedParams.organizationId;
    }

    if (validatedParams.locationId) {
      where.locationId = validatedParams.locationId;
    }

    if (validatedParams.serviceId) {
      where.availableServices = {
        some: {
          serviceId: validatedParams.serviceId,
        },
      };
    }

    if (validatedParams.startDate || validatedParams.endDate) {
      where.AND = [];

      if (validatedParams.startDate) {
        where.AND.push({
          endTime: { gte: validatedParams.startDate },
        });
      }

      if (validatedParams.endDate) {
        where.AND.push({
          startTime: { lte: validatedParams.endDate },
        });
      }
    }

    if (validatedParams.isOnlineAvailable !== undefined) {
      where.isOnlineAvailable = validatedParams.isOnlineAvailable;
    }

    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    if (validatedParams.schedulingRule) {
      where.schedulingRule = validatedParams.schedulingRule;
    }

    if (validatedParams.seriesId) {
      where.seriesId = validatedParams.seriesId;
    }

    // Add permission filters
    if (!currentUser.roles.includes('ADMIN') && !currentUser.roles.includes('SUPER_ADMIN')) {
      // Get user's organizations
      const userOrganizations = await prisma.organizationMembership.findMany({
        where: { userId: currentUser.id },
        select: { organizationId: true },
      });

      const organizationIds = userOrganizations.map((m) => m.organizationId);

      where.OR = [
        { serviceProviderId: currentUser.id },
        { createdById: currentUser.id },
        ...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
      ];
    }

    const availabilities = await prisma.availability.findMany({
      where,
      include: includeAvailabilityRelations,
      orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }],
    });

    return { success: true, data: availabilities as AvailabilityWithRelations[] };
  } catch (error) {
    console.error('Error searching availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search availability',
    };
  }
}

/**
 * Update existing availability
 */
export async function updateAvailability(
  data: UpdateAvailabilityData
): Promise<{ success: boolean; data?: AvailabilityWithRelations; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input data
    const validatedData = updateAvailabilityDataSchema.parse(data);

    // Get existing availability
    const existingAvailability = await prisma.availability.findUnique({
      where: { id: validatedData.id },
      include: {
        calculatedSlots: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!existingAvailability) {
      return { success: false, error: 'Availability not found' };
    }

    // Check permissions
    const canUpdate =
      currentUser.id === existingAvailability.serviceProviderId ||
      currentUser.id === existingAvailability.createdById ||
      currentUser.roles.includes('ADMIN') ||
      currentUser.roles.includes('SUPER_ADMIN');

    if (!canUpdate && existingAvailability.organizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: existingAvailability.organizationId,
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
        },
      });

      if (!membership) {
        return { success: false, error: 'Insufficient permissions' };
      }
    } else if (!canUpdate) {
      return { success: false, error: 'Access denied' };
    }

    // Check if there are existing bookings that would be affected
    const hasBookings = existingAvailability.calculatedSlots.some((slot) => slot.booking);

    if (hasBookings && (validatedData.startTime || validatedData.endTime)) {
      return {
        success: false,
        error: 'Cannot modify time for availability with existing bookings',
      };
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.startTime !== undefined) updateData.startTime = validatedData.startTime;
    if (validatedData.endTime !== undefined) updateData.endTime = validatedData.endTime;
    if (validatedData.isRecurring !== undefined) updateData.isRecurring = validatedData.isRecurring;
    if (validatedData.recurrencePattern !== undefined)
      updateData.recurrencePattern = validatedData.recurrencePattern;
    if (validatedData.schedulingRule !== undefined)
      updateData.schedulingRule = validatedData.schedulingRule;
    if (validatedData.schedulingInterval !== undefined)
      updateData.schedulingInterval = validatedData.schedulingInterval;
    if (validatedData.isOnlineAvailable !== undefined)
      updateData.isOnlineAvailable = validatedData.isOnlineAvailable;
    if (validatedData.requiresConfirmation !== undefined)
      updateData.requiresConfirmation = validatedData.requiresConfirmation;
    if (validatedData.billingEntity !== undefined)
      updateData.billingEntity = validatedData.billingEntity;

    // Update availability
    const updatedAvailability = await prisma.availability.update({
      where: { id: validatedData.id },
      data: updateData,
      include: includeAvailabilityRelations,
    });

    // Update services if provided
    if (validatedData.services) {
      // Delete existing service configs
      await prisma.serviceAvailabilityConfig.deleteMany({
        where: { availabilityId: validatedData.id },
      });

      // Create new service configs
      await prisma.serviceAvailabilityConfig.createMany({
        data: validatedData.services.map((service) => ({
          availabilityId: validatedData.id,
          serviceId: service.serviceId,
          duration: service.duration,
          price: service.price,
          showPrice: service.showPrice,
          isOnlineAvailable: service.isOnlineAvailable,
          isInPerson: service.isInPerson,
          locationId: service.locationId,
        })),
      });
    }

    // Revalidate paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');
    if (existingAvailability.organizationId) {
      revalidatePath(
        `/dashboard/organizations/${existingAvailability.organizationId}/availability`
      );
    }

    // Fetch updated availability with new relations
    const finalAvailability = await prisma.availability.findUnique({
      where: { id: validatedData.id },
      include: includeAvailabilityRelations,
    });

    return { success: true, data: finalAvailability as AvailabilityWithRelations };
  } catch (error) {
    console.error('Error updating availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update availability',
    };
  }
}

/**
 * Delete availability (soft delete by setting status to CANCELLED)
 */
export async function deleteAvailability(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Get existing availability with bookings
    const existingAvailability = await prisma.availability.findUnique({
      where: { id },
      include: {
        calculatedSlots: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!existingAvailability) {
      return { success: false, error: 'Availability not found' };
    }

    // Check permissions
    const canDelete =
      currentUser.id === existingAvailability.serviceProviderId ||
      currentUser.id === existingAvailability.createdById ||
      currentUser.roles.includes('ADMIN') ||
      currentUser.roles.includes('SUPER_ADMIN');

    if (!canDelete && existingAvailability.organizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: existingAvailability.organizationId,
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
        },
      });

      if (!membership) {
        return { success: false, error: 'Insufficient permissions' };
      }
    } else if (!canDelete) {
      return { success: false, error: 'Access denied' };
    }

    // Check for existing bookings
    const hasBookings = existingAvailability.calculatedSlots.some((slot) => slot.booking);

    if (hasBookings) {
      return {
        success: false,
        error: 'Cannot delete availability with existing bookings. Cancel the bookings first.',
      };
    }

    // Soft delete by setting status to CANCELLED
    await prisma.availability.update({
      where: { id },
      data: {
        status: AvailabilityStatus.CANCELLED,
      },
    });

    // Also mark calculated slots as unavailable
    await prisma.calculatedAvailabilitySlot.updateMany({
      where: { availabilityId: id },
      data: {
        status: 'UNAVAILABLE',
      },
    });

    // Revalidate paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');
    if (existingAvailability.organizationId) {
      revalidatePath(
        `/dashboard/organizations/${existingAvailability.organizationId}/availability`
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete availability',
    };
  }
}

/**
 * Accept availability proposal (for organization-created availability)
 */
export async function acceptAvailabilityProposal(
  id: string
): Promise<{ success: boolean; data?: AvailabilityWithRelations; error?: string }> {
  try {
    // Use the comprehensive workflow service
    const result = await processAvailabilityAcceptance(id);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Revalidate paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');

    return { success: true, data: result.availability };
  } catch (error) {
    console.error('Error accepting availability proposal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept availability proposal',
    };
  }
}

/**
 * Reject availability proposal
 */
export async function rejectAvailabilityProposal(
  id: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use the comprehensive workflow service
    const result = await processAvailabilityRejection(id, reason);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Revalidate paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');

    return { success: true };
  } catch (error) {
    console.error('Error rejecting availability proposal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject availability proposal',
    };
  }
}
