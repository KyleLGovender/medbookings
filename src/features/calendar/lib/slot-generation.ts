import { SchedulingRule } from '@prisma/client';

import { SlotCreateData, SlotGenerationOptions } from '@/features/calendar/types/types';
import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

import { generateTimeSlots } from './scheduling-rules';

/**
 * Calendar Event interface for slot blocking
 * Used to mark slots as BLOCKED if they overlap with external calendar events
 */
export interface CalendarEventForBlocking {
  id: string;
  startTime: Date;
  endTime: Date;
  blocksAvailability: boolean;
  title?: string;
}

/**
 * Check if a slot overlaps with any calendar events
 * Returns the blocking event if found, null otherwise
 */
function findBlockingEvent(
  slotStart: Date,
  slotEnd: Date,
  calendarEvents: CalendarEventForBlocking[]
): CalendarEventForBlocking | null {
  for (const event of calendarEvents) {
    if (!event.blocksAvailability) continue;

    // Overlap condition: slot.startTime < event.endTime AND slot.endTime > event.startTime
    if (slotStart < event.endTime && slotEnd > event.startTime) {
      return event;
    }
  }
  return null;
}

/**
 * Generate slot data for a given availability (Option C: Pure utility function)
 * Returns slot data for tRPC procedures to create in database
 *
 * NEW: Supports calendar event blocking - pass calendarEvents to mark overlapping slots as BLOCKED
 */
export function generateSlotDataForAvailability(
  options: SlotGenerationOptions,
  calendarEvents?: CalendarEventForBlocking[]
): {
  slotRecords: SlotCreateData[];
  errors: string[];
  totalSlots: number;
  blockedCount: number;
} {
  const errors: string[] = [];
  const allSlotRecords: SlotCreateData[] = [];
  let blockedCount = 0;

  try {
    // Generate slots for each service
    for (const service of options.services) {
      const slotResult = generateTimeSlots({
        availabilityStart: options.startTime,
        availabilityEnd: options.endTime,
        serviceDuration: service.duration,
        schedulingRule: options.schedulingRule,
        schedulingInterval: options.schedulingInterval,
      });

      if (slotResult.errors.length > 0) {
        errors.push(...slotResult.errors);
        continue;
      }

      // Prepare slot records for database creation
      const slotRecords = slotResult.slots.map((slot) => {
        // Check if this slot overlaps with any calendar events
        const blockingEvent = calendarEvents
          ? findBlockingEvent(slot.startTime, slot.endTime, calendarEvents)
          : null;

        if (blockingEvent) {
          blockedCount++;
          logger.debug('calendar', 'Slot blocked by calendar event', {
            slotStart: slot.startTime.toISOString(),
            slotEnd: slot.endTime.toISOString(),
            eventId: blockingEvent.id,
            eventTitle: blockingEvent.title,
          });
        }

        return {
          availabilityId: options.availabilityId,
          serviceId: service.serviceId,
          serviceConfigId: service.serviceConfigId, // Use the actual ServiceAvailabilityConfig ID
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: blockingEvent ? ('BLOCKED' as const) : ('AVAILABLE' as const),
          blockedByEventId: blockingEvent?.id,
          lastCalculated: nowUTC(),
          version: 1,
        };
      });

      allSlotRecords.push(...slotRecords);
    }

    if (blockedCount > 0) {
      logger.info('Generated slots with calendar event blocking', {
        totalSlots: allSlotRecords.length,
        blockedSlots: blockedCount,
        availableSlots: allSlotRecords.length - blockedCount,
        calendarEventsCount: calendarEvents?.length || 0,
      });
    }

    return {
      slotRecords: allSlotRecords,
      errors,
      totalSlots: allSlotRecords.length,
      blockedCount,
    };
  } catch (error) {
    return {
      slotRecords: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      totalSlots: 0,
      blockedCount: 0,
    };
  }
}

/**
 * Generate slot data for multiple availability records (Option C: Pure utility function)
 * Returns combined slot data for tRPC procedures to create in database
 *
 * NEW: Supports calendar event blocking - pass calendarEvents to mark overlapping slots as BLOCKED
 */
export function generateSlotDataForMultipleAvailability(
  availabilities: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    schedulingRule: SchedulingRule;
    schedulingInterval?: number;
    availableServices: Array<{
      id: string;
      serviceId: string;
      duration: number;
      price: number;
    }>;
  }>,
  calendarEvents?: CalendarEventForBlocking[]
): {
  slotRecords: SlotCreateData[];
  errors: string[];
  totalSlots: number;
  blockedCount: number;
} {
  const allSlotRecords: SlotCreateData[] = [];
  const allErrors: string[] = [];
  let totalBlockedCount = 0;

  try {
    for (const availability of availabilities) {
      const result = generateSlotDataForAvailability(
        {
          availabilityId: availability.id,
          startTime: availability.startTime,
          endTime: availability.endTime,
          schedulingRule: availability.schedulingRule,
          schedulingInterval: availability.schedulingInterval,
          services: availability.availableServices.map((as) => ({
            serviceId: as.serviceId,
            serviceConfigId: as.id, // Use the ServiceAvailabilityConfig ID
            duration: as.duration,
            price: as.price,
          })),
        },
        calendarEvents
      );

      allSlotRecords.push(...result.slotRecords);
      allErrors.push(...result.errors);
      totalBlockedCount += result.blockedCount;
    }

    return {
      slotRecords: allSlotRecords,
      errors: allErrors,
      totalSlots: allSlotRecords.length,
      blockedCount: totalBlockedCount,
    };
  } catch (error) {
    return {
      slotRecords: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      totalSlots: 0,
      blockedCount: 0,
    };
  }
}

/**
 * Generate slot data from availability data (Option C: Pure utility function)
 * Used for regenerating slots - tRPC procedures handle database queries
 *
 * NEW: Supports calendar event blocking - pass calendarEvents to mark overlapping slots as BLOCKED
 */
export function generateSlotDataFromAvailability(
  availability: {
    id: string;
    startTime: Date;
    endTime: Date;
    schedulingRule: SchedulingRule;
    schedulingInterval: number | null;
    availableServices: Array<{
      id: string;
      serviceId: string;
      duration: number;
      price: number;
    }>;
  },
  calendarEvents?: CalendarEventForBlocking[]
): {
  slotRecords: SlotCreateData[];
  errors: string[];
  totalSlots: number;
  blockedCount: number;
} {
  return generateSlotDataForAvailability(
    {
      availabilityId: availability.id,
      startTime: availability.startTime,
      endTime: availability.endTime,
      schedulingRule: availability.schedulingRule,
      schedulingInterval: availability.schedulingInterval || undefined,
      services: availability.availableServices.map((as) => ({
        serviceId: as.serviceId,
        serviceConfigId: as.id, // Use the ServiceAvailabilityConfig ID
        duration: as.duration,
        price: Number(as.price),
      })),
    },
    calendarEvents
  );
}
