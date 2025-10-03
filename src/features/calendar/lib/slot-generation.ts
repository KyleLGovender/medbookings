import { SchedulingRule } from '@prisma/client';

import { SlotCreateData, SlotGenerationOptions } from '@/features/calendar/types/types';
import { nowUTC } from '@/lib/timezone';

import { generateTimeSlots } from './scheduling-rules';

/**
 * Generate slot data for a given availability (Option C: Pure utility function)
 * Returns slot data for tRPC procedures to create in database
 */
export function generateSlotDataForAvailability(options: SlotGenerationOptions): {
  slotRecords: SlotCreateData[];
  errors: string[];
  totalSlots: number;
} {
  const errors: string[] = [];
  const allSlotRecords: SlotCreateData[] = [];

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

      // Prepare slot records for database creation (no Prisma operations)
      const slotRecords = slotResult.slots.map((slot) => ({
        availabilityId: options.availabilityId,
        serviceId: service.serviceId,
        serviceConfigId: service.serviceConfigId, // Use the actual ServiceAvailabilityConfig ID
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'AVAILABLE' as const,
        lastCalculated: nowUTC(),
        version: 1,
      }));

      allSlotRecords.push(...slotRecords);
    }

    return {
      slotRecords: allSlotRecords,
      errors,
      totalSlots: allSlotRecords.length,
    };
  } catch (error) {
    return {
      slotRecords: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      totalSlots: 0,
    };
  }
}

/**
 * Generate slot data for multiple availability records (Option C: Pure utility function)
 * Returns combined slot data for tRPC procedures to create in database
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
  }>
): {
  slotRecords: SlotCreateData[];
  errors: string[];
  totalSlots: number;
} {
  const allSlotRecords: SlotCreateData[] = [];
  const allErrors: string[] = [];

  try {
    for (const availability of availabilities) {
      const result = generateSlotDataForAvailability({
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
      });

      allSlotRecords.push(...result.slotRecords);
      allErrors.push(...result.errors);
    }

    return {
      slotRecords: allSlotRecords,
      errors: allErrors,
      totalSlots: allSlotRecords.length,
    };
  } catch (error) {
    return {
      slotRecords: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      totalSlots: 0,
    };
  }
}

/**
 * Generate slot data from availability data (Option C: Pure utility function)
 * Used for regenerating slots - tRPC procedures handle database queries
 */
export function generateSlotDataFromAvailability(availability: {
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
}): {
  slotRecords: SlotCreateData[];
  errors: string[];
  totalSlots: number;
} {
  return generateSlotDataForAvailability({
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
  });
}
