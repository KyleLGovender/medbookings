import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { AvailabilityStatus, AvailabilityWithRelations } from '../types';
import {
  notifyAvailabilityAccepted,
  notifyAvailabilityCancelled,
  notifyAvailabilityRejected,
} from './notification-service';
import { generateSlotsForAvailability } from './slot-generator';

export interface WorkflowResult {
  success: boolean;
  availability?: AvailabilityWithRelations;
  slotsGenerated?: number;
  error?: string;
  notifications?: {
    sent: number;
    failed: number;
  };
}

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
        serviceProvider: true,
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

    // Verify user can accept this proposal
    if (currentUser.id !== availability.serviceProviderId) {
      return { success: false, error: 'Only the assigned provider can accept this proposal' };
    }

    if (availability.status !== AvailabilityStatus.PENDING) {
      return { success: false, error: 'Availability is not pending acceptance' };
    }

    // Update availability status to ACTIVE
    const updatedAvailability = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        status: AvailabilityStatus.ACTIVE,
        acceptedById: currentUser.id,
        acceptedAt: new Date(),
      },
      include: {
        serviceProvider: true,
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

    // Generate slots for the accepted availability
    const slotGenerationResult = await generateSlotsForAvailability({
      availabilityId: availabilityId,
      forceRegenerate: true,
    });

    if (slotGenerationResult.errors.length > 0) {
      console.error('Slot generation had errors:', slotGenerationResult.errors);
    }

    // Send acceptance notifications
    try {
      await notifyAvailabilityAccepted(updatedAvailability as AvailabilityWithRelations, {
        id: currentUser.id,
        name: currentUser.name || 'Provider',
        role: 'PROVIDER',
      });
    } catch (notificationError) {
      console.error('Failed to send acceptance notifications:', notificationError);
      // Don't fail the entire workflow for notification errors
    }

    return {
      success: true,
      availability: updatedAvailability as AvailabilityWithRelations,
      slotsGenerated: slotGenerationResult.slotsGenerated,
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
        serviceProvider: true,
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

    // Verify user can reject this proposal
    if (currentUser.id !== availability.serviceProviderId) {
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
        serviceProvider: true,
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
        updatedAvailability as AvailabilityWithRelations,
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
      availability: updatedAvailability as AvailabilityWithRelations,
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
        serviceProvider: true,
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

    // Check permissions
    const canCancel =
      currentUser.id === availability.serviceProviderId ||
      currentUser.id === availability.createdById ||
      currentUser.roles.includes('ADMIN') ||
      currentUser.roles.includes('SUPER_ADMIN');

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
        serviceProvider: true,
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
        status: 'UNAVAILABLE',
      },
    });

    // Send cancellation notifications
    try {
      await notifyAvailabilityCancelled(updatedAvailability as AvailabilityWithRelations, {
        id: currentUser.id,
        name: currentUser.name || 'User',
        role: currentUser.id === availability.serviceProviderId ? 'PROVIDER' : 'ORGANIZATION',
      });
    } catch (notificationError) {
      console.error('Failed to send cancellation notifications:', notificationError);
      // Don't fail the entire workflow for notification errors
    }

    return {
      success: true,
      availability: updatedAvailability as AvailabilityWithRelations,
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
        serviceProvider: true,
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

    // Verify permission
    if (currentUser.id !== masterAvailability.serviceProviderId) {
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
        status: AvailabilityStatus.ACTIVE,
        acceptedById: currentUser.id,
        acceptedAt: new Date(),
      },
    });

    // Generate slots for all accepted availability
    const seriesAvailabilities = await prisma.availability.findMany({
      where: {
        seriesId: masterAvailability.seriesId,
        status: AvailabilityStatus.ACTIVE,
      },
    });

    let totalSlotsGenerated = 0;
    for (const availability of seriesAvailabilities) {
      const slotResult = await generateSlotsForAvailability({
        availabilityId: availability.id,
        forceRegenerate: true,
      });
      totalSlotsGenerated += slotResult.slotsGenerated;
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
      entityType === 'organization'
        ? { organizationId: entityId }
        : { serviceProviderId: entityId };

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
      prisma.availability.count({ where: { ...whereClause, status: AvailabilityStatus.ACTIVE } }),
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
        bookingId: { not: null },
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
