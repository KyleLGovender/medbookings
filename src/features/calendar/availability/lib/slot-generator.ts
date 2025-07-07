import {
  AvailabilityWithRelations,
  GeneratedSlot,
  SchedulingOptions,
  SchedulingRule,
  SlotGenerationRequest,
  SlotGenerationResult,
  SlotStatus,
  TimeSlot,
} from '@/features/calendar/availability/types/types';
import { prisma } from '@/lib/prisma';

import { generateRecurrenceOccurrences } from './recurrence-patterns';
import { generateTimeSlots } from './scheduling-rules';

/**
 * Generate all slots for an availability period
 */
export async function generateSlotsForAvailability(
  request: SlotGenerationRequest
): Promise<SlotGenerationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalSlotsGenerated = 0;
  let totalSlotsConflicted = 0;

  try {
    // Fetch availability with all relations
    const availability = await prisma.availability.findUnique({
      where: { id: request.availabilityId },
      include: {
        availableServices: {
          include: {
            service: true,
            location: true,
          },
        },
        serviceProvider: true,
        organization: true,
        location: true,
        defaultSubscription: true,
        createdBy: true,
        calculatedSlots: {
          include: {
            service: true,
            booking: true,
            billedToSubscription: true,
            blockedByCalendarEvent: true,
          },
        },
      },
    });

    if (!availability) {
      return {
        availabilityId: request.availabilityId,
        slotsGenerated: 0,
        slotsConflicted: 0,
        errors: ['Availability not found'],
        duration: Date.now() - startTime,
      };
    }

    // Delete existing slots if force regenerate is requested
    if (request.forceRegenerate) {
      await prisma.calculatedAvailabilitySlot.deleteMany({
        where: { availabilityId: request.availabilityId },
      });
    } else {
      // Check if slots already exist
      const existingSlots = await prisma.calculatedAvailabilitySlot.count({
        where: { availabilityId: request.availabilityId },
      });

      if (existingSlots > 0) {
        return {
          availabilityId: request.availabilityId,
          slotsGenerated: 0,
          slotsConflicted: 0,
          errors: ['Slots already exist. Use forceRegenerate to regenerate.'],
          duration: Date.now() - startTime,
        };
      }
    }

    // Generate occurrence dates (including recurring patterns)
    const occurrences = await generateAvailabilityOccurrences(
      availability as unknown as AvailabilityWithRelations
    );

    // Generate slots for each occurrence and service
    for (const occurrence of occurrences) {
      for (const serviceConfig of availability.availableServices) {
        const result = await generateSlotsForOccurrenceAndService(
          availability as unknown as AvailabilityWithRelations,
          occurrence,
          serviceConfig
        );

        totalSlotsGenerated += result.slotsGenerated;
        totalSlotsConflicted += result.slotsConflicted;
        errors.push(...result.errors);
      }
    }

    return {
      availabilityId: request.availabilityId,
      slotsGenerated: totalSlotsGenerated,
      slotsConflicted: totalSlotsConflicted,
      errors,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Error generating slots:', error);
    return {
      availabilityId: request.availabilityId,
      slotsGenerated: 0,
      slotsConflicted: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Generate availability occurrences based on recurrence pattern
 */
async function generateAvailabilityOccurrences(
  availability: AvailabilityWithRelations
): Promise<Array<{ startTime: Date; endTime: Date }>> {
  const occurrences: Array<{ startTime: Date; endTime: Date }> = [];

  if (!availability.isRecurring || !availability.recurrencePattern) {
    // Single occurrence
    occurrences.push({
      startTime: availability.startTime,
      endTime: availability.endTime,
    });
  } else {
    // Generate recurring occurrences
    const recurrenceOccurrences = generateRecurrenceOccurrences({
      pattern: availability.recurrencePattern,
      baseStartTime: availability.startTime,
      baseEndTime: availability.endTime,
      maxOccurrences: 100, // Configurable limit
    });

    occurrences.push(
      ...recurrenceOccurrences
        .filter((occ) => !occ.isException)
        .map((occ) => ({
          startTime: occ.startTime,
          endTime: occ.endTime,
        }))
    );
  }

  return occurrences;
}

/**
 * Generate slots for a specific occurrence and service configuration
 */
async function generateSlotsForOccurrenceAndService(
  availability: AvailabilityWithRelations,
  occurrence: { startTime: Date; endTime: Date },
  serviceConfig: any
): Promise<{
  slotsGenerated: number;
  slotsConflicted: number;
  errors: string[];
}> {
  try {
    // Prepare scheduling options
    const schedulingOptions: SchedulingOptions = {
      availabilityStart: occurrence.startTime,
      availabilityEnd: occurrence.endTime,
      serviceDuration: serviceConfig.duration,
      schedulingRule: availability.schedulingRule,
      schedulingInterval: availability.schedulingInterval || undefined,
      alignToHour: availability.schedulingRule === SchedulingRule.FIXED_INTERVAL,
      alignToHalfHour: false,
      alignToQuarterHour: false,
    };

    // Generate time slots using scheduling rules
    const timeSlotResult = generateTimeSlots(schedulingOptions);

    if (timeSlotResult.errors.length > 0) {
      return {
        slotsGenerated: 0,
        slotsConflicted: 0,
        errors: timeSlotResult.errors,
      };
    }

    // Convert time slots to database slots
    const generatedSlots: GeneratedSlot[] = timeSlotResult.slots.map((slot: TimeSlot) => ({
      availabilityId: availability.id,
      serviceId: serviceConfig.serviceId,
      serviceConfigId: serviceConfig.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      price: serviceConfig.price,
      isOnlineAvailable: serviceConfig.isOnlineAvailable && availability.isOnlineAvailable,
      status: SlotStatus.AVAILABLE,
      billedToSubscriptionId: availability.defaultSubscriptionId || undefined,
      locationId: serviceConfig.locationId || availability.locationId || undefined,
    }));

    // Check for conflicts with existing slots
    const { validSlots, conflictedSlots } = await detectSlotConflicts(
      generatedSlots,
      availability.serviceProviderId
    );

    // Insert valid slots into database
    if (validSlots.length > 0) {
      await prisma.calculatedAvailabilitySlot.createMany({
        data: validSlots.map((slot) => ({
          availabilityId: slot.availabilityId,
          serviceId: slot.serviceId,
          serviceConfigId: slot.serviceConfigId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          price: slot.price,
          isOnlineAvailable: slot.isOnlineAvailable,
          status: slot.status,
          billedToSubscriptionId: slot.billedToSubscriptionId,
          locationId: slot.locationId,
          version: 1, // Initial version for optimistic locking
          lastCalculated: new Date(),
        })),
      });
    }

    return {
      slotsGenerated: validSlots.length,
      slotsConflicted: conflictedSlots.length,
      errors: [],
    };
  } catch (error) {
    console.error('Error generating slots for occurrence:', error);
    return {
      slotsGenerated: 0,
      slotsConflicted: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Detect conflicts with existing slots and calendar events
 */
async function detectSlotConflicts(
  newSlots: GeneratedSlot[],
  serviceProviderId: string
): Promise<{
  validSlots: GeneratedSlot[];
  conflictedSlots: GeneratedSlot[];
}> {
  const validSlots: GeneratedSlot[] = [];
  const conflictedSlots: GeneratedSlot[] = [];

  for (const newSlot of newSlots) {
    const hasConflict = await checkSlotConflict(newSlot, serviceProviderId);

    if (hasConflict) {
      conflictedSlots.push(newSlot);
    } else {
      validSlots.push(newSlot);
    }
  }

  return { validSlots, conflictedSlots };
}

/**
 * Check if a slot conflicts with existing bookings or calendar events
 */
async function checkSlotConflict(slot: GeneratedSlot, serviceProviderId: string): Promise<boolean> {
  // Check for overlapping slots
  const overlappingSlots = await prisma.calculatedAvailabilitySlot.findMany({
    where: {
      availability: {
        serviceProviderId,
      },
      OR: [
        {
          startTime: {
            lt: slot.endTime,
          },
          endTime: {
            gt: slot.startTime,
          },
        },
      ],
    },
  });

  if (overlappingSlots.length > 0) {
    return true;
  }

  // Check for calendar events that would block this slot
  const blockingEvents = await prisma.calendarEvent.findMany({
    where: {
      calendarIntegration: {
        serviceProviderId,
      },
      OR: [
        {
          startTime: {
            lt: slot.endTime,
          },
          endTime: {
            gt: slot.startTime,
          },
        },
      ],
    },
  });

  if (blockingEvents.length > 0) {
    return true;
  }

  return false;
}

/**
 * Regenerate slots for an availability after changes
 */
export async function regenerateSlotsForAvailability(
  availabilityId: string
): Promise<SlotGenerationResult> {
  return generateSlotsForAvailability({
    availabilityId,
    forceRegenerate: true,
  });
}

/**
 * Generate slots for all availability in a date range
 */
export async function generateSlotsForDateRange(
  serviceProviderId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalAvailabilities: number;
  totalSlotsGenerated: number;
  totalSlotsConflicted: number;
  errors: string[];
}> {
  try {
    // Find all availability periods in the date range
    const availabilities = await prisma.availability.findMany({
      where: {
        serviceProviderId,
        OR: [
          {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            startTime: { lte: startDate },
            endTime: { gte: endDate },
          },
        ],
        status: 'ACCEPTED',
      },
    });

    let totalSlotsGenerated = 0;
    let totalSlotsConflicted = 0;
    const errors: string[] = [];

    // Generate slots for each availability
    for (const availability of availabilities) {
      const result = await generateSlotsForAvailability({
        availabilityId: availability.id,
        forceRegenerate: false,
      });

      totalSlotsGenerated += result.slotsGenerated;
      totalSlotsConflicted += result.slotsConflicted;
      errors.push(...result.errors);
    }

    return {
      totalAvailabilities: availabilities.length,
      totalSlotsGenerated,
      totalSlotsConflicted,
      errors,
    };
  } catch (error) {
    console.error('Error generating slots for date range:', error);
    return {
      totalAvailabilities: 0,
      totalSlotsGenerated: 0,
      totalSlotsConflicted: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Clean up slots for deleted or cancelled availability
 */
export async function cleanupSlotsForAvailability(
  availabilityId: string
): Promise<{ slotsDeleted: number }> {
  try {
    // Only delete slots that don't have bookings
    const deleteResult = await prisma.calculatedAvailabilitySlot.deleteMany({
      where: {
        availabilityId,
        booking: null, // Only delete unbooked slots
      },
    });

    // Mark booked slots as unavailable instead of deleting
    await prisma.calculatedAvailabilitySlot.updateMany({
      where: {
        availabilityId,
        NOT: {
          booking: null,
        },
      },
      data: {
        status: SlotStatus.INVALID,
      },
    });

    return { slotsDeleted: deleteResult.count };
  } catch (error) {
    console.error('Error cleaning up slots:', error);
    throw error;
  }
}

/**
 * Get slot generation statistics
 */
export async function getSlotGenerationStats(
  serviceProviderId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  unavailableSlots: number;
  utilizationRate: number;
}> {
  try {
    const whereClause: any = {
      availability: {
        serviceProviderId,
      },
    };

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = startDate;
      if (endDate) whereClause.startTime.lte = endDate;
    }

    const [totalSlots, availableSlots, bookedSlots, unavailableSlots] = await Promise.all([
      prisma.calculatedAvailabilitySlot.count({ where: whereClause }),
      prisma.calculatedAvailabilitySlot.count({
        where: { ...whereClause, status: SlotStatus.AVAILABLE },
      }),
      prisma.calculatedAvailabilitySlot.count({
        where: { ...whereClause, status: SlotStatus.BOOKED },
      }),
      prisma.calculatedAvailabilitySlot.count({
        where: { ...whereClause, status: SlotStatus.INVALID },
      }),
    ]);

    const utilizationRate = totalSlots > 0 ? bookedSlots / totalSlots : 0;

    return {
      totalSlots,
      availableSlots,
      bookedSlots,
      unavailableSlots,
      utilizationRate,
    };
  } catch (error) {
    console.error('Error getting slot generation stats:', error);
    throw error;
  }
}
