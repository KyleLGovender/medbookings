/**
 * Slot Blocking Utilities
 *
 * Handles blocking/unblocking of availability slots based on external calendar events.
 * Prevents double-booking by marking slots as BLOCKED when they overlap with
 * Google Calendar events.
 *
 * CRITICAL: Always call these functions in transactions to prevent race conditions
 */
import { type Prisma } from '@prisma/client';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { nowUTC } from '@/lib/timezone';

// ============================================================================
// Types
// ============================================================================

export interface SlotBlockingResult {
  blockedCount: number;
  unblockedCount: number;
  slotIds: string[];
}

export interface ConflictInfo {
  slotId: string;
  slotStartTime: Date;
  slotEndTime: Date;
  eventTitle: string;
  eventStartTime: Date;
  eventEndTime: Date;
  hasBooking: boolean;
}

// ============================================================================
// Slot Blocking Functions
// ============================================================================

/**
 * Block availability slots that overlap with a CalendarEvent
 * Returns count of slots blocked
 *
 * @param eventId - CalendarEvent ID that blocks the slots
 * @param providerId - Provider whose slots to block
 * @param tx - Prisma transaction client (optional, uses global prisma if not provided)
 */
export async function blockSlotsFromEvent(
  eventId: string,
  providerId: string,
  tx?: Prisma.TransactionClient
): Promise<SlotBlockingResult> {
  const db = tx || prisma;

  // Fetch the event to get time window
  const event = await db.calendarEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error(`CalendarEvent not found: ${eventId}`);
  }

  logger.info('Blocking slots from calendar event', {
    eventId,
    providerId,
    eventTitle: event.title,
    eventStartTime: event.startTime.toISOString(),
    eventEndTime: event.endTime.toISOString(),
  });

  // Find overlapping slots
  // Overlap condition: slot.startTime < event.endTime AND slot.endTime > event.startTime
  const overlappingSlots = await db.calculatedAvailabilitySlot.findMany({
    where: {
      availability: {
        providerId,
      },
      startTime: { lt: event.endTime },
      endTime: { gt: event.startTime },
      // Don't block already booked slots
      status: { in: ['AVAILABLE', 'BLOCKED'] },
    },
    include: {
      booking: true,
    },
  });

  if (overlappingSlots.length === 0) {
    logger.info('No overlapping slots found to block', {
      eventId,
      providerId,
    });
    return {
      blockedCount: 0,
      unblockedCount: 0,
      slotIds: [],
    };
  }

  // Check for conflicts with existing bookings
  const slotsWithBookings = overlappingSlots.filter((slot) => slot.booking);
  if (slotsWithBookings.length > 0) {
    logger.warn('Calendar event overlaps with existing bookings', {
      eventId,
      providerId,
      conflictCount: slotsWithBookings.length,
      conflictingSlotIds: slotsWithBookings.map((s) => s.id),
    });

    // Mark event as having conflicts
    await db.calendarEvent.update({
      where: { id: eventId },
      data: {
        hasConflict: true,
        conflictDetails: `Overlaps with ${slotsWithBookings.length} existing booking(s)`,
      },
    });
  }

  // Block slots (only those without bookings)
  const slotsToBlock = overlappingSlots.filter((slot) => !slot.booking);
  const slotIds = slotsToBlock.map((slot) => slot.id);

  if (slotIds.length > 0) {
    await db.calculatedAvailabilitySlot.updateMany({
      where: {
        id: { in: slotIds },
      },
      data: {
        status: 'BLOCKED',
        blockedByEventId: eventId,
      },
    });

    logger.info('Blocked slots successfully', {
      eventId,
      providerId,
      blockedCount: slotIds.length,
      conflictCount: slotsWithBookings.length,
    });
  }

  return {
    blockedCount: slotIds.length,
    unblockedCount: 0,
    slotIds,
  };
}

/**
 * Unblock availability slots when a CalendarEvent is removed
 * Returns count of slots unblocked
 */
export async function unblockSlotsFromEvent(
  eventId: string,
  tx?: Prisma.TransactionClient
): Promise<SlotBlockingResult> {
  const db = tx || prisma;

  logger.info('Unblocking slots from calendar event', { eventId });

  // Find slots blocked by this event
  const blockedSlots = await db.calculatedAvailabilitySlot.findMany({
    where: {
      blockedByEventId: eventId,
      status: 'BLOCKED',
    },
  });

  if (blockedSlots.length === 0) {
    logger.info('No slots found blocked by this event', { eventId });
    return {
      blockedCount: 0,
      unblockedCount: 0,
      slotIds: [],
    };
  }

  const slotIds = blockedSlots.map((slot) => slot.id);

  // Unblock slots
  await db.calculatedAvailabilitySlot.updateMany({
    where: {
      id: { in: slotIds },
    },
    data: {
      status: 'AVAILABLE',
      blockedByEventId: null,
    },
  });

  logger.info('Unblocked slots successfully', {
    eventId,
    unblockedCount: slotIds.length,
  });

  return {
    blockedCount: 0,
    unblockedCount: slotIds.length,
    slotIds,
  };
}

/**
 * Block all slots overlapping with multiple events
 * Useful for bulk operations during sync
 */
export async function blockSlotsFromMultipleEvents(
  eventIds: string[],
  providerId: string,
  tx?: Prisma.TransactionClient
): Promise<SlotBlockingResult> {
  const db = tx || prisma;

  let totalBlocked = 0;
  const allSlotIds: string[] = [];

  for (const eventId of eventIds) {
    const result = await blockSlotsFromEvent(eventId, providerId, db);
    totalBlocked += result.blockedCount;
    allSlotIds.push(...result.slotIds);
  }

  logger.info('Bulk slot blocking complete', {
    providerId,
    eventCount: eventIds.length,
    totalBlocked,
  });

  return {
    blockedCount: totalBlocked,
    unblockedCount: 0,
    slotIds: allSlotIds,
  };
}

// ============================================================================
// Slot Regeneration
// ============================================================================

/**
 * Regenerate slots for a provider's availability after calendar sync
 * This ensures all external events are considered in slot generation
 *
 * NOTE: This is a placeholder - actual implementation requires importing
 * slot generation logic. For now, just recompute blocking status.
 */
export async function regenerateSlotsForProvider(
  providerId: string,
  tx?: Prisma.TransactionClient
): Promise<{ regeneratedCount: number }> {
  const db = tx || prisma;

  logger.info('Regenerating slots for provider after calendar sync', {
    providerId,
  });

  // Fetch all calendar events for this provider that block availability
  const calendarEvents = await db.calendarEvent.findMany({
    where: {
      calendarIntegration: {
        providerId,
      },
      blocksAvailability: true,
      endTime: { gte: nowUTC() }, // Only future/current events
    },
  });

  // For each event, ensure overlapping slots are blocked
  let totalRegenerated = 0;
  for (const event of calendarEvents) {
    const result = await blockSlotsFromEvent(event.id, providerId, db);
    totalRegenerated += result.blockedCount;
  }

  logger.info('Slot regeneration complete', {
    providerId,
    eventCount: calendarEvents.length,
    slotsRegenerated: totalRegenerated,
  });

  return {
    regeneratedCount: totalRegenerated,
  };
}

/**
 * Regenerate slots for all providers (used by cron job)
 */
export async function regenerateSlotsForAllProviders(): Promise<{
  providerCount: number;
  totalSlotsRegenerated: number;
}> {
  logger.info('Regenerating slots for all providers with calendar integrations');

  // Find all providers with active calendar integrations
  const integrations = await prisma.calendarIntegration.findMany({
    where: {
      syncEnabled: true,
    },
    select: {
      providerId: true,
    },
  });

  let totalSlotsRegenerated = 0;

  for (const integration of integrations) {
    const result = await regenerateSlotsForProvider(integration.providerId);
    totalSlotsRegenerated += result.regeneratedCount;
  }

  logger.info('Global slot regeneration complete', {
    providerCount: integrations.length,
    totalSlotsRegenerated,
  });

  return {
    providerCount: integrations.length,
    totalSlotsRegenerated,
  };
}

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Find all conflicts where external events overlap with existing bookings
 * Returns detailed conflict information for resolution
 */
export async function findConflicts(providerId: string): Promise<ConflictInfo[]> {
  logger.info('Finding conflicts for provider', { providerId });

  // Find all calendar events that have conflicts
  const eventsWithConflicts = await prisma.calendarEvent.findMany({
    where: {
      calendarIntegration: {
        providerId,
      },
      hasConflict: true,
    },
    include: {
      blockedSlots: {
        include: {
          booking: true,
        },
        where: {
          booking: {
            isNot: null,
          },
        },
      },
    },
  });

  const conflicts: ConflictInfo[] = [];

  for (const event of eventsWithConflicts) {
    for (const slot of event.blockedSlots) {
      if (slot.booking) {
        conflicts.push({
          slotId: slot.id,
          slotStartTime: slot.startTime,
          slotEndTime: slot.endTime,
          eventTitle: event.title,
          eventStartTime: event.startTime,
          eventEndTime: event.endTime,
          hasBooking: true,
        });
      }
    }
  }

  logger.info('Found conflicts', {
    providerId,
    conflictCount: conflicts.length,
  });

  return conflicts;
}

/**
 * Get blocking statistics for a provider
 * Useful for dashboards and reporting
 */
export async function getBlockingStats(providerId: string): Promise<{
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  blockedByEventsCount: number;
  conflictsCount: number;
}> {
  const [totalSlots, availableSlots, bookedSlots, blockedSlots, calendarEvents, conflicts] =
    await Promise.all([
      prisma.calculatedAvailabilitySlot.count({
        where: {
          availability: { providerId },
          endTime: { gte: nowUTC() },
        },
      }),
      prisma.calculatedAvailabilitySlot.count({
        where: {
          availability: { providerId },
          status: 'AVAILABLE',
          endTime: { gte: nowUTC() },
        },
      }),
      prisma.calculatedAvailabilitySlot.count({
        where: {
          availability: { providerId },
          status: 'BOOKED',
          endTime: { gte: nowUTC() },
        },
      }),
      prisma.calculatedAvailabilitySlot.count({
        where: {
          availability: { providerId },
          status: 'BLOCKED',
          endTime: { gte: nowUTC() },
        },
      }),
      prisma.calendarEvent.count({
        where: {
          calendarIntegration: { providerId },
          blocksAvailability: true,
          endTime: { gte: nowUTC() },
        },
      }),
      findConflicts(providerId),
    ]);

  return {
    totalSlots,
    availableSlots,
    bookedSlots,
    blockedSlots,
    blockedByEventsCount: calendarEvents,
    conflictsCount: conflicts.length,
  };
}
