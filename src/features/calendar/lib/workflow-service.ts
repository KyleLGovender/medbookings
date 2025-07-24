import {
  AvailabilityStatus,
  AvailabilityWithRelations,
  SchedulingRule,
  WorkflowResult,
} from '@/features/calendar/types/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import {
  notifyAvailabilityAccepted,
  notifyAvailabilityCancelled,
  notifyAvailabilityRejected,
} from './notification-service';
import { generateSlotsForAvailability } from './slot-generation';

/**
 * Complete workflow for accepting an availability proposal
 * 1. Update status to ACTIVE
 * 2. Generate slots
 * 3. Send notifications
 */
export async function processAvailabilityAcceptance(
  availabilityId: string
): Promise<WorkflowResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Get availability with all relations
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: {
        provider: true,
        organization: true,
        location: true,
        createdBy: true,
        availableServices: {
          include: {
            service: true,
          },
        },
        calculatedSlots: true,
      },
    });

    if (!availability) {
      return { success: false, error: 'Availability not found' };
    }

    // Get current user's provider record for authorization
    const currentUserProvider = await prisma.provider.findUnique({
      where: { userId: currentUser.id },
    });

    // Verify user can accept this proposal
    if (currentUserProvider?.id !== availability.providerId) {
      return { success: false, error: 'Only the assigned provider can accept this proposal' };
    }

    if (availability.status !== AvailabilityStatus.PENDING) {
      return { success: false, error: 'Availability is not pending acceptance' };
    }

    // Update availability status to ACCEPTED
    const updatedAvailability = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        status: AvailabilityStatus.ACCEPTED,
        acceptedById: currentUser.id,
        acceptedAt: new Date(),
      },
      include: {
        provider: true,
        organization: true,
        location: true,
        createdBy: true,
        availableServices: {
          include: {
            service: true,
          },
        },
        calculatedSlots: true,
      },
    });

    // Generate slots for accepted availability
    let slotsGenerated = 0;
    try {
      const slotResult = await generateSlotsForAvailability({
        availabilityId: updatedAvailability.id,
        startTime: updatedAvailability.startTime,
        endTime: updatedAvailability.endTime,
        providerId: updatedAvailability.providerId,
        organizationId: updatedAvailability.organizationId || '',
        locationId: updatedAvailability.locationId || undefined,
        schedulingRule: updatedAvailability.schedulingRule as SchedulingRule,
        schedulingInterval: updatedAvailability.schedulingInterval || undefined,
        services: updatedAvailability.availableServices.map((as) => ({
          serviceId: as.serviceId,
          duration: as.duration,
          price: Number(as.price),
        })),
      });

      if (slotResult.success) {
        slotsGenerated = slotResult.slotsGenerated;
      } else {
        console.error('Failed to generate slots during acceptance:', slotResult.errors);
      }
    } catch (slotError) {
      console.error('Error generating slots during acceptance:', slotError);
    }

    // Send acceptance notifications
    try {
      await notifyAvailabilityAccepted(
        updatedAvailability as unknown as AvailabilityWithRelations,
        {
          id: currentUser.id,
          name: currentUser.name || 'Provider',
          role: 'PROVIDER',
        }
      );
    } catch (notificationError) {
      console.error('Failed to send acceptance notifications:', notificationError);
      // Don't fail the entire workflow for notification errors
    }

    return {
      success: true,
      availability: updatedAvailability as unknown as AvailabilityWithRelations,
      slotsGenerated: slotsGenerated,
    };
  } catch (error) {
    console.error('Error processing availability acceptance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Complete workflow for rejecting an availability proposal
 * 1. Update status to REJECTED
 * 2. Send notifications
 */
export async function processAvailabilityRejection(
  availabilityId: string,
  reason?: string
): Promise<WorkflowResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Get availability with all relations
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: {
        provider: true,
        organization: true,
        location: true,
        createdBy: true,
        availableServices: {
          include: {
            service: true,
          },
        },
        calculatedSlots: true,
      },
    });

    if (!availability) {
      return { success: false, error: 'Availability not found' };
    }

    // Get current user's provider record for authorization
    const currentUserProvider = await prisma.provider.findUnique({
      where: { userId: currentUser.id },
    });

    // Verify user can reject this proposal
    if (currentUserProvider?.id !== availability.providerId) {
      return { success: false, error: 'Only the assigned provider can reject this proposal' };
    }

    if (availability.status !== AvailabilityStatus.PENDING) {
      return { success: false, error: 'Availability is not pending response' };
    }

    // Update availability status to REJECTED
    const updatedAvailability = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        status: AvailabilityStatus.REJECTED,
        // Note: rejectionReason field would need to be added to schema if needed
      },
      include: {
        provider: true,
        organization: true,
        location: true,
        createdBy: true,
        availableServices: {
          include: {
            service: true,
          },
        },
        calculatedSlots: true,
      },
    });

    // Send rejection notifications
    try {
      await notifyAvailabilityRejected(
        updatedAvailability as unknown as AvailabilityWithRelations,
        {
          id: currentUser.id,
          name: currentUser.name || 'Provider',
          role: 'PROVIDER',
        },
        reason
      );
    } catch (notificationError) {
      console.error('Failed to send rejection notifications:', notificationError);
      // Don't fail the entire workflow for notification errors
    }

    return {
      success: true,
      availability: updatedAvailability as unknown as AvailabilityWithRelations,
    };
  } catch (error) {
    console.error('Error processing availability rejection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Complete workflow for cancelling an availability
 * 1. Check for existing bookings
 * 2. Update status to CANCELLED
 * 3. Handle slots cleanup
 * 4. Send notifications
 */
export async function processAvailabilityCancellation(
  availabilityId: string,
  reason?: string
): Promise<WorkflowResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Get availability with all relations including bookings
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: {
        provider: true,
        organization: true,
        location: true,
        createdBy: true,
        availableServices: {
          include: {
            service: true,
          },
        },
        calculatedSlots: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!availability) {
      return { success: false, error: 'Availability not found' };
    }

    // Get current user's provider record for authorization
    const currentUserProvider = await prisma.provider.findUnique({
      where: { userId: currentUser.id },
    });

    // Check permissions
    const canCancel =
      currentUserProvider?.id === availability.providerId ||
      currentUser.id === availability.createdById ||
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'SUPER_ADMIN';

    if (!canCancel && availability.organizationId) {
      // Check organization membership
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: availability.organizationId,
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
        },
      });

      if (!membership) {
        return { success: false, error: 'Insufficient permissions to cancel this availability' };
      }
    } else if (!canCancel) {
      return { success: false, error: 'Access denied' };
    }

    // Check for existing bookings
    const bookedSlots = availability.calculatedSlots?.filter((slot) => slot.booking) || [];

    if (bookedSlots.length > 0) {
      return {
        success: false,
        error: `Cannot cancel availability with ${bookedSlots.length} existing booking(s). Cancel the bookings first.`,
      };
    }

    // Update availability status to CANCELLED
    const updatedAvailability = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        status: AvailabilityStatus.CANCELLED,
      },
      include: {
        provider: true,
        organization: true,
        location: true,
        createdBy: true,
        availableServices: {
          include: {
            service: true,
          },
        },
        calculatedSlots: true,
      },
    });

    // Mark calculated slots as unavailable
    await prisma.calculatedAvailabilitySlot.updateMany({
      where: { availabilityId: availabilityId },
      data: {
        status: 'BLOCKED',
      },
    });

    // Send cancellation notifications
    try {
      await notifyAvailabilityCancelled(
        updatedAvailability as unknown as AvailabilityWithRelations,
        {
          id: currentUser.id,
          name: currentUser.name || 'User',
          role: currentUser.id === availability.providerId ? 'PROVIDER' : 'ORGANIZATION',
        }
      );
    } catch (notificationError) {
      console.error('Failed to send cancellation notifications:', notificationError);
      // Don't fail the entire workflow for notification errors
    }

    return {
      success: true,
      availability: updatedAvailability as unknown as AvailabilityWithRelations,
    };
  } catch (error) {
    console.error('Error processing availability cancellation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Process recurring availability series acceptance
 * Handles accepting all future occurrences in a series
 */
export async function processRecurringSeriesAcceptance(
  masterAvailabilityId: string,
  acceptanceMode: 'all' | 'future_only' = 'all'
): Promise<WorkflowResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Get master availability
    const masterAvailability = await prisma.availability.findUnique({
      where: { id: masterAvailabilityId },
      include: {
        provider: true,
        organization: true,
        createdBy: true,
      },
    });

    if (!masterAvailability) {
      return { success: false, error: 'Master availability not found' };
    }

    if (!masterAvailability.isRecurring || !masterAvailability.seriesId) {
      return { success: false, error: 'This is not a recurring availability series' };
    }

    // Get current user's provider record for authorization
    const currentUserProvider = await prisma.provider.findUnique({
      where: { userId: currentUser.id },
    });

    // Verify permission
    if (currentUserProvider?.id !== masterAvailability.providerId) {
      return { success: false, error: 'Only the assigned provider can accept this series' };
    }

    // Find all related availability in the series
    const whereClause: any = {
      seriesId: masterAvailability.seriesId,
      status: AvailabilityStatus.PENDING,
    };

    if (acceptanceMode === 'future_only') {
      whereClause.startTime = { gte: new Date() };
    }

    // Update all pending availability in the series
    const updateResult = await prisma.availability.updateMany({
      where: whereClause,
      data: {
        status: AvailabilityStatus.ACCEPTED,
        acceptedById: currentUser.id,
        acceptedAt: new Date(),
      },
    });

    // Generate slots for all accepted availability in the series
    let totalSlotsGenerated = 0;
    try {
      // Get all accepted availability in the series
      const acceptedAvailabilities = await prisma.availability.findMany({
        where: {
          seriesId: masterAvailability.seriesId,
          status: AvailabilityStatus.ACCEPTED,
        },
        include: {
          availableServices: {
            include: {
              service: true,
            },
          },
        },
      });

      // Generate slots for each accepted availability
      for (const availability of acceptedAvailabilities) {
        const slotResult = await generateSlotsForAvailability({
          availabilityId: availability.id,
          startTime: availability.startTime,
          endTime: availability.endTime,
          providerId: availability.providerId,
          organizationId: availability.organizationId || '',
          locationId: availability.locationId || undefined,
          schedulingRule: availability.schedulingRule as SchedulingRule,
          schedulingInterval: availability.schedulingInterval || undefined,
          services: availability.availableServices.map((as) => ({
            serviceId: as.serviceId,
            duration: as.duration,
            price: Number(as.price),
          })),
        });

        if (slotResult.success) {
          totalSlotsGenerated += slotResult.slotsGenerated;
        } else {
          console.error(
            `Failed to generate slots for availability ${availability.id}:`,
            slotResult.errors
          );
        }
      }
    } catch (slotError) {
      console.error('Error generating slots for series acceptance:', slotError);
    }

    // Send notifications for series acceptance
    try {
      await notifyAvailabilityAccepted(masterAvailability as AvailabilityWithRelations, {
        id: currentUser.id,
        name: currentUser.name || 'Provider',
        role: 'PROVIDER',
      });
    } catch (notificationError) {
      console.error('Failed to send series acceptance notifications:', notificationError);
    }

    return {
      success: true,
      availability: masterAvailability as AvailabilityWithRelations,
      slotsGenerated: totalSlotsGenerated,
    };
  } catch (error) {
    console.error('Error processing recurring series acceptance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get workflow statistics for an organization or provider
 */
export async function getWorkflowStatistics(
  entityId: string,
  entityType: 'organization' | 'provider'
): Promise<{
  totalProposals: number;
  pendingProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  cancelledProposals: number;
  totalSlotsGenerated: number;
  utilizationRate: number;
}> {
  try {
    const whereClause =
      entityType === 'organization' ? { organizationId: entityId } : { providerId: entityId };

    const [
      totalProposals,
      pendingProposals,
      acceptedProposals,
      rejectedProposals,
      cancelledProposals,
      slotStats,
    ] = await Promise.all([
      prisma.availability.count({ where: whereClause }),
      prisma.availability.count({ where: { ...whereClause, status: AvailabilityStatus.PENDING } }),
      prisma.availability.count({ where: { ...whereClause, status: AvailabilityStatus.ACCEPTED } }),
      prisma.availability.count({ where: { ...whereClause, status: AvailabilityStatus.REJECTED } }),
      prisma.availability.count({
        where: { ...whereClause, status: AvailabilityStatus.CANCELLED },
      }),
      prisma.calculatedAvailabilitySlot.aggregate({
        where: {
          availability: whereClause,
        },
        _count: { id: true },
      }),
    ]);

    const bookedSlots = await prisma.calculatedAvailabilitySlot.count({
      where: {
        availability: whereClause,
        booking: { isNot: null },
      },
    });

    const totalSlotsGenerated = slotStats._count.id || 0;
    const utilizationRate = totalSlotsGenerated > 0 ? bookedSlots / totalSlotsGenerated : 0;

    return {
      totalProposals,
      pendingProposals,
      acceptedProposals,
      rejectedProposals,
      cancelledProposals,
      totalSlotsGenerated,
      utilizationRate,
    };
  } catch (error) {
    console.error('Error getting workflow statistics:', error);
    return {
      totalProposals: 0,
      pendingProposals: 0,
      acceptedProposals: 0,
      rejectedProposals: 0,
      cancelledProposals: 0,
      totalSlotsGenerated: 0,
      utilizationRate: 0,
    };
  }
}
