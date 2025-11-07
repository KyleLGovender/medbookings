/**
 * Calendar Conflict Detection Utilities
 *
 * Detects and manages conflicts between:
 * - External Google Calendar events
 * - MedBookings availability slots
 * - Existing bookings
 *
 * Provides detailed conflict information for resolution UI
 */
import type { Booking, CalculatedAvailabilitySlot, CalendarEvent } from '@prisma/client';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { nowUTC } from '@/lib/timezone';

// ============================================================================
// Types
// ============================================================================

export interface ConflictDetails {
  conflictId: string;
  conflictType:
    | 'EVENT_OVERLAPS_BOOKING' // External event overlaps with existing booking
    | 'DOUBLE_BOOKING' // Multiple bookings on same slot
    | 'SLOT_STATE_MISMATCH'; // Slot marked available but has booking

  // Calendar event details (if applicable)
  calendarEvent?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    externalEventId: string;
  };

  // Booking details (if applicable)
  booking?: {
    id: string;
    status: string;
    startTime: Date;
    endTime: Date;
    clientName?: string;
  };

  // Slot details
  slot: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
  };

  // Conflict metadata
  detectedAt: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoResolvable: boolean;
  suggestedResolution?: string;
}

export interface ConflictResolutionOptions {
  conflictId: string;
  resolution:
    | 'KEEP_BOOKING_REMOVE_EVENT' // Remove external event, keep MedBookings booking
    | 'KEEP_EVENT_CANCEL_BOOKING' // Cancel booking, keep external event
    | 'MANUAL_REVIEW'; // Escalate to manual review
}

export interface ConflictSummary {
  providerId: string;
  totalConflicts: number;
  conflictsByType: {
    eventOverlapsBooking: number;
    doubleBooking: number;
    slotStateMismatch: number;
  };
  conflictsBySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  autoResolvableCount: number;
  oldestConflictDate?: Date;
}

// ============================================================================
// Conflict Detection Functions
// ============================================================================

/**
 * Detect all conflicts for a provider
 * Scans for various types of conflicts and returns detailed information
 */
export async function detectConflicts(providerId: string): Promise<ConflictDetails[]> {
  logger.info('Detecting conflicts for provider', { providerId });

  const conflicts: ConflictDetails[] = [];

  // Type 1: External events overlapping with bookings
  const eventBookingConflicts = await detectEventBookingConflicts(providerId);
  conflicts.push(...eventBookingConflicts);

  // Type 2: Multiple bookings on same slot (data integrity issue)
  const doubleBookingConflicts = await detectDoubleBookingConflicts(providerId);
  conflicts.push(...doubleBookingConflicts);

  // Type 3: Slot status mismatches (AVAILABLE but has booking)
  const slotStateConflicts = await detectSlotStateMismatches(providerId);
  conflicts.push(...slotStateConflicts);

  logger.info('Conflict detection complete', {
    providerId,
    totalConflicts: conflicts.length,
    byType: {
      eventOverlaps: eventBookingConflicts.length,
      doubleBooking: doubleBookingConflicts.length,
      slotStateMismatch: slotStateConflicts.length,
    },
  });

  return conflicts;
}

/**
 * Detect conflicts where external calendar events overlap with MedBookings bookings
 * This is the most common conflict type
 */
async function detectEventBookingConflicts(providerId: string): Promise<ConflictDetails[]> {
  // Find all calendar events that have been marked with conflicts
  const eventsWithConflicts = await prisma.calendarEvent.findMany({
    where: {
      calendarIntegration: { providerId },
      hasConflict: true,
      endTime: { gte: nowUTC() }, // Only future/current conflicts
    },
    include: {
      blockedSlots: {
        include: {
          booking: true,
        },
        where: {
          booking: { isNot: null },
        },
      },
    },
  });

  const conflicts: ConflictDetails[] = [];

  for (const event of eventsWithConflicts) {
    for (const slot of event.blockedSlots) {
      if (slot.booking) {
        conflicts.push({
          conflictId: `event-booking-${event.id}-${slot.booking.id}`,
          conflictType: 'EVENT_OVERLAPS_BOOKING',
          calendarEvent: {
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            externalEventId: event.externalEventId,
          },
          booking: {
            id: slot.booking.id,
            status: slot.booking.status,
            startTime: slot.startTime,
            endTime: slot.endTime,
            clientName: slot.booking.isGuestBooking
              ? slot.booking.guestName || undefined
              : undefined,
          },
          slot: {
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: slot.status,
          },
          detectedAt: event.lastSyncedAt,
          severity: determineSeverity(slot.booking, event),
          autoResolvable: false, // Requires provider decision
          suggestedResolution: 'Contact client to reschedule or cancel the external calendar event',
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detect double-bookings (multiple bookings on same slot)
 * This indicates a data integrity issue
 */
async function detectDoubleBookingConflicts(providerId: string): Promise<ConflictDetails[]> {
  // Find slots with multiple bookings (should never happen)
  const slotsWithBookings = await prisma.calculatedAvailabilitySlot.findMany({
    where: {
      availability: { providerId },
      booking: { isNot: null },
      endTime: { gte: nowUTC() },
    },
    include: {
      booking: true,
    },
  });

  // Group by overlapping time windows
  const conflicts: ConflictDetails[] = [];
  const checkedPairs = new Set<string>();

  for (let i = 0; i < slotsWithBookings.length; i++) {
    for (let j = i + 1; j < slotsWithBookings.length; j++) {
      const slot1 = slotsWithBookings[i];
      const slot2 = slotsWithBookings[j];

      // Check if they overlap
      if (
        slot1.startTime < slot2.endTime &&
        slot1.endTime > slot2.startTime &&
        slot1.booking &&
        slot2.booking
      ) {
        const pairKey = [slot1.booking.id, slot2.booking.id].sort().join('-');

        if (!checkedPairs.has(pairKey)) {
          checkedPairs.add(pairKey);

          conflicts.push({
            conflictId: `double-booking-${slot1.booking.id}-${slot2.booking.id}`,
            conflictType: 'DOUBLE_BOOKING',
            booking: {
              id: slot1.booking.id,
              status: slot1.booking.status,
              startTime: slot1.startTime,
              endTime: slot1.endTime,
            },
            slot: {
              id: slot1.id,
              startTime: slot1.startTime,
              endTime: slot1.endTime,
              status: slot1.status,
            },
            detectedAt: nowUTC(),
            severity: 'CRITICAL',
            autoResolvable: false,
            suggestedResolution: 'Contact both clients immediately to resolve conflict',
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Detect slot state mismatches (AVAILABLE but has booking, or BOOKED but no booking)
 */
async function detectSlotStateMismatches(providerId: string): Promise<ConflictDetails[]> {
  const conflicts: ConflictDetails[] = [];

  // Find AVAILABLE slots that have bookings
  const availableSlotsWithBookings = await prisma.calculatedAvailabilitySlot.findMany({
    where: {
      availability: { providerId },
      status: 'AVAILABLE',
      booking: { isNot: null },
      endTime: { gte: nowUTC() },
    },
    include: {
      booking: true,
    },
  });

  for (const slot of availableSlotsWithBookings) {
    if (slot.booking) {
      conflicts.push({
        conflictId: `slot-state-${slot.id}`,
        conflictType: 'SLOT_STATE_MISMATCH',
        booking: {
          id: slot.booking.id,
          status: slot.booking.status,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        slot: {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
        },
        detectedAt: nowUTC(),
        severity: 'HIGH',
        autoResolvable: true,
        suggestedResolution: 'Auto-update slot status to BOOKED',
      });
    }
  }

  // Find BOOKED slots without bookings
  const bookedSlotsWithoutBookings = await prisma.calculatedAvailabilitySlot.findMany({
    where: {
      availability: { providerId },
      status: 'BOOKED',
      booking: null,
      endTime: { gte: nowUTC() },
    },
  });

  for (const slot of bookedSlotsWithoutBookings) {
    conflicts.push({
      conflictId: `slot-state-${slot.id}`,
      conflictType: 'SLOT_STATE_MISMATCH',
      slot: {
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
      },
      detectedAt: nowUTC(),
      severity: 'MEDIUM',
      autoResolvable: true,
      suggestedResolution: 'Auto-update slot status to AVAILABLE',
    });
  }

  return conflicts;
}

// ============================================================================
// Conflict Resolution
// ============================================================================

/**
 * Attempt to auto-resolve a conflict
 * Only works for auto-resolvable conflicts (e.g., slot state mismatches)
 */
export async function autoResolveConflict(
  conflictId: string
): Promise<{ success: boolean; message: string }> {
  logger.info('Attempting to auto-resolve conflict', { conflictId });

  // Extract slot ID from conflictId (format: "slot-state-{slotId}")
  if (conflictId.startsWith('slot-state-')) {
    const slotId = conflictId.replace('slot-state-', '');

    const slot = await prisma.calculatedAvailabilitySlot.findUnique({
      where: { id: slotId },
      include: { booking: true },
    });

    if (!slot) {
      return { success: false, message: 'Slot not found' };
    }

    // AVAILABLE but has booking → set to BOOKED
    if (slot.status === 'AVAILABLE' && slot.booking) {
      await prisma.calculatedAvailabilitySlot.update({
        where: { id: slotId },
        data: { status: 'BOOKED' },
      });

      logger.info('Auto-resolved conflict: updated slot to BOOKED', { slotId });
      return { success: true, message: 'Slot status updated to BOOKED' };
    }

    // BOOKED but no booking → set to AVAILABLE
    if (slot.status === 'BOOKED' && !slot.booking) {
      await prisma.calculatedAvailabilitySlot.update({
        where: { id: slotId },
        data: { status: 'AVAILABLE' },
      });

      logger.info('Auto-resolved conflict: updated slot to AVAILABLE', { slotId });
      return { success: true, message: 'Slot status updated to AVAILABLE' };
    }
  }

  return { success: false, message: 'Conflict is not auto-resolvable' };
}

/**
 * Manually resolve a conflict with user decision
 */
export async function resolveConflict(
  options: ConflictResolutionOptions
): Promise<{ success: boolean; message: string }> {
  logger.info('Manually resolving conflict', options);

  // This would implement different resolution strategies
  // For now, just mark the calendar event as resolved

  if (options.conflictId.startsWith('event-booking-')) {
    const [, , eventId, bookingId] = options.conflictId.split('-');

    if (options.resolution === 'KEEP_BOOKING_REMOVE_EVENT') {
      // Mark event to not block availability
      await prisma.calendarEvent.update({
        where: { id: eventId },
        data: {
          blocksAvailability: false,
          hasConflict: false,
          conflictResolvedAt: nowUTC(),
        },
      });

      logger.info('Conflict resolved: keeping booking, event no longer blocks', {
        eventId,
        bookingId,
      });

      return { success: true, message: 'Conflict resolved - booking kept, event unblocked' };
    }

    if (options.resolution === 'KEEP_EVENT_CANCEL_BOOKING') {
      // This would trigger booking cancellation
      // For now, just mark for manual cancellation
      logger.warn('Booking cancellation requested via conflict resolution', {
        bookingId,
      });

      return {
        success: true,
        message: 'Conflict marked for resolution - cancel booking manually',
      };
    }
  }

  return { success: false, message: 'Resolution not implemented for this conflict type' };
}

// ============================================================================
// Conflict Summary & Statistics
// ============================================================================

/**
 * Get conflict summary for a provider
 * Useful for dashboards and notifications
 */
export async function getConflictSummary(providerId: string): Promise<ConflictSummary> {
  const conflicts = await detectConflicts(providerId);

  const summary: ConflictSummary = {
    providerId,
    totalConflicts: conflicts.length,
    conflictsByType: {
      eventOverlapsBooking: conflicts.filter((c) => c.conflictType === 'EVENT_OVERLAPS_BOOKING')
        .length,
      doubleBooking: conflicts.filter((c) => c.conflictType === 'DOUBLE_BOOKING').length,
      slotStateMismatch: conflicts.filter((c) => c.conflictType === 'SLOT_STATE_MISMATCH').length,
    },
    conflictsBySeverity: {
      low: conflicts.filter((c) => c.severity === 'LOW').length,
      medium: conflicts.filter((c) => c.severity === 'MEDIUM').length,
      high: conflicts.filter((c) => c.severity === 'HIGH').length,
      critical: conflicts.filter((c) => c.severity === 'CRITICAL').length,
    },
    autoResolvableCount: conflicts.filter((c) => c.autoResolvable).length,
    oldestConflictDate: conflicts.length
      ? conflicts.reduce(
          (oldest, c) => (c.detectedAt < oldest ? c.detectedAt : oldest),
          conflicts[0].detectedAt
        )
      : undefined,
  };

  return summary;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine conflict severity based on booking status and timing
 */
function determineSeverity(
  booking: Booking,
  event: CalendarEvent
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // If booking is already cancelled, conflict is low severity
  if (booking.status === 'CANCELLED') {
    return 'LOW';
  }

  // If booking is pending, medium severity
  if (booking.status === 'PENDING') {
    return 'MEDIUM';
  }

  // If event is in the past, low severity (historical data)
  if (event.endTime < nowUTC()) {
    return 'LOW';
  }

  // If event is within 24 hours, critical
  const hoursTillEvent = (event.startTime.getTime() - nowUTC().getTime()) / (1000 * 60 * 60);
  if (hoursTillEvent < 24) {
    return 'CRITICAL';
  }

  // If event is within 7 days, high
  if (hoursTillEvent < 24 * 7) {
    return 'HIGH';
  }

  // Otherwise medium
  return 'MEDIUM';
}
