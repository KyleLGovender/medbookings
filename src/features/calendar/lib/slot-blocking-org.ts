/**
 * Organization Calendar Slot Blocking Utilities
 *
 * Location-aware slot blocking for organization calendar events.
 * Key differences from provider blocking:
 * - Location-scoped: Only blocks slots at specific locations
 * - Null locationId: Informational only (no blocking)
 * - Uses blockedByOrgEventId field instead of blockedByEventId
 */
import { type Prisma } from '@prisma/client';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export interface SlotBlockingResult {
  slotsBlocked: number;
  slotsUnblocked: number;
  message: string;
}

export interface OrganizationBlockingStats {
  totalSlots: number;
  blockedSlots: number;
  availableSlots: number;
  bookedSlots: number;
  blockingEvents: number;
  byLocation: Record<
    string,
    {
      locationId: string;
      locationName: string;
      blockedSlots: number;
    }
  >;
}

/**
 * Block availability slots at a specific location based on organization calendar event
 *
 * IMPORTANT: Only blocks if event has locationId set
 * - locationId = NULL → Informational only (no blocking)
 * - locationId = set → Block slots at that location
 */
export async function blockSlotsFromOrgEvent(
  eventId: string,
  organizationId: string,
  locationId: string | null,
  tx?: Prisma.TransactionClient
): Promise<SlotBlockingResult> {
  const db = tx || prisma;

  // If locationId is null, don't block any slots (per user requirement)
  if (!locationId) {
    logger.info('Organization event has no locationId - informational only', {
      eventId,
      organizationId,
    });

    return {
      slotsBlocked: 0,
      slotsUnblocked: 0,
      message: 'Organization-wide event (informational only - no slots blocked)',
    };
  }

  // Get the calendar event details
  const event = await db.organizationCalendarEvent.findUnique({
    where: { id: eventId },
    select: {
      startTime: true,
      endTime: true,
      title: true,
      blocksAvailability: true,
    },
  });

  if (!event) {
    throw new Error(`Organization calendar event ${eventId} not found`);
  }

  if (!event.blocksAvailability) {
    logger.info('Event does not block availability', {
      eventId,
      title: event.title,
    });

    return {
      slotsBlocked: 0,
      slotsUnblocked: 0,
      message: 'Event configured to not block availability',
    };
  }

  // Find overlapping AVAILABLE slots at this location
  const slotsToBlock = await db.calculatedAvailabilitySlot.findMany({
    where: {
      availability: {
        organizationId,
        locationId,
      },
      startTime: { lt: event.endTime },
      endTime: { gt: event.startTime },
      status: 'AVAILABLE',
    },
    take: 1000, // Pagination: Block org event helper - bounded by org events (max 1000 overlapping slots)
  });

  // Block the slots
  const result = await db.calculatedAvailabilitySlot.updateMany({
    where: {
      id: { in: slotsToBlock.map((s) => s.id) },
    },
    data: {
      status: 'BLOCKED',
      blockedByOrgEventId: eventId,
    },
  });

  logger.info('Blocked slots for organization calendar event', {
    eventId,
    organizationId,
    locationId,
    slotsBlocked: result.count,
    eventTitle: event.title,
  });

  return {
    slotsBlocked: result.count,
    slotsUnblocked: 0,
    message: `Blocked ${result.count} slots at location`,
  };
}

/**
 * Unblock slots that were blocked by organization calendar event
 */
export async function unblockSlotsFromOrgEvent(
  eventId: string,
  tx?: Prisma.TransactionClient
): Promise<SlotBlockingResult> {
  const db = tx || prisma;

  // Find slots blocked by this event
  const blockedSlots = await db.calculatedAvailabilitySlot.findMany({
    where: {
      blockedByOrgEventId: eventId,
      status: 'BLOCKED',
    },
    take: 1000, // Pagination: Unblock org event helper - bounded by org events (max 1000 previously blocked slots)
  });

  // Unblock them
  const result = await db.calculatedAvailabilitySlot.updateMany({
    where: {
      id: { in: blockedSlots.map((s) => s.id) },
    },
    data: {
      status: 'AVAILABLE',
      blockedByOrgEventId: null,
    },
  });

  logger.info('Unblocked slots for organization calendar event', {
    eventId,
    slotsUnblocked: result.count,
  });

  return {
    slotsBlocked: 0,
    slotsUnblocked: result.count,
    message: `Unblocked ${result.count} slots`,
  };
}

/**
 * Regenerate slots for organization after calendar sync
 *
 * Can be scoped to specific location or all organization locations
 */
export async function regenerateSlotsForOrganization(
  organizationId: string,
  locationId?: string,
  tx?: Prisma.TransactionClient
): Promise<{ regeneratedCount: number }> {
  const db = tx || prisma;

  logger.info('Regenerating slots for organization', {
    organizationId,
    locationId,
  });

  // For now, just log - actual regeneration would involve complex logic
  // to recalculate availability slots based on availability rules
  // This is a placeholder for future implementation

  logger.warn('Slot regeneration not yet implemented for organizations', {
    organizationId,
    locationId,
  });

  return {
    regeneratedCount: 0,
  };
}

/**
 * Find conflicts between organization events and existing bookings
 */
export async function findOrganizationConflicts(
  organizationId: string,
  locationId?: string
): Promise<
  Array<{
    eventId: string;
    eventTitle: string;
    slotId: string;
    bookingId: string;
    conflictType: string;
  }>
> {
  // Find organization events that overlap with booked slots
  const conflicts = await prisma.organizationCalendarEvent.findMany({
    where: {
      organizationCalendarIntegration: {
        organizationId,
        ...(locationId && { locationId }),
      },
      blocksAvailability: true,
      blockedSlots: {
        some: {
          booking: {
            isNot: null,
          },
        },
      },
    },
    include: {
      blockedSlots: {
        where: {
          booking: {
            isNot: null,
          },
        },
        include: {
          booking: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
    take: 100, // Pagination: Org conflict detection - bounded by conflicts (max 100 conflicting events)
  });

  return conflicts.flatMap((event) =>
    event.blockedSlots.map((slot) => ({
      eventId: event.id,
      eventTitle: event.title,
      slotId: slot.id,
      bookingId: slot.booking!.id,
      conflictType: 'ORG_EVENT_OVERLAPS_BOOKING',
    }))
  );
}

/**
 * Get blocking statistics for organization calendar
 */
export async function getOrganizationBlockingStats(
  organizationId: string,
  locationId?: string
): Promise<OrganizationBlockingStats> {
  // Get all slots for organization (optionally filtered by location)
  const slots = await prisma.calculatedAvailabilitySlot.findMany({
    where: {
      availability: {
        organizationId,
        ...(locationId && { locationId }),
      },
    },
    select: {
      id: true,
      status: true,
      blockedByOrgEventId: true,
      booking: {
        select: {
          id: true,
        },
      },
      availability: {
        select: {
          locationId: true,
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    take: 10000, // Pagination: Org blocking stats - bounded by org size (max 10k slots analyzed)
  });

  const totalSlots = slots.length;
  const blockedSlots = slots.filter((s) => s.status === 'BLOCKED').length;
  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE').length;
  const bookedSlots = slots.filter((s) => s.booking !== null).length;

  // Count unique blocking events
  const uniqueEventIds = new Set(
    slots.filter((s) => s.blockedByOrgEventId !== null).map((s) => s.blockedByOrgEventId)
  );

  // Group by location
  const byLocation: Record<
    string,
    {
      locationId: string;
      locationName: string;
      blockedSlots: number;
    }
  > = {};

  for (const slot of slots) {
    if (slot.status === 'BLOCKED' && slot.availability.locationId) {
      const locId = slot.availability.locationId;
      if (!byLocation[locId]) {
        byLocation[locId] = {
          locationId: locId,
          locationName: slot.availability.location?.name || 'Unknown',
          blockedSlots: 0,
        };
      }
      byLocation[locId].blockedSlots++;
    }
  }

  return {
    totalSlots,
    blockedSlots,
    availableSlots,
    bookedSlots,
    blockingEvents: uniqueEventIds.size,
    byLocation,
  };
}
