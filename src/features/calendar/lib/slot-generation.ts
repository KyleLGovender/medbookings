import { addMinutes } from 'date-fns';

import {
  SchedulingRule,
  SlotGenerationOptions,
  SlotGenerationResult,
} from '@/features/calendar/types/types';
import { prisma } from '@/lib/prisma';

import { generateTimeSlots } from './scheduling-rules';

/**
 * Generate CalculatedAvailabilitySlots for a given availability
 */
export async function generateSlotsForAvailability(
  options: SlotGenerationOptions
): Promise<SlotGenerationResult> {
  try {
    const errors: string[] = [];
    let totalSlotsGenerated = 0;

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

      // Create CalculatedAvailabilitySlot records
      const slotRecords = slotResult.slots.map((slot) => ({
        availabilityId: options.availabilityId,
        serviceId: service.serviceId,
        serviceConfigId: 'default-config-id',
        providerId: options.providerId,
        organizationId: options.organizationId,
        locationId: options.locationId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        price: service.price,
        status: 'AVAILABLE' as const,
        isBlocked: false,
        lastCalculated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (slotRecords.length > 0) {
        await prisma.calculatedAvailabilitySlot.createMany({
          data: slotRecords,
        });
        totalSlotsGenerated += slotRecords.length;
      }
    }

    return {
      success: errors.length === 0,
      slotsGenerated: totalSlotsGenerated,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      slotsGenerated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}

/**
 * Generate slots for multiple availability records (for recurring availability)
 */
export async function generateSlotsForMultipleAvailability(
  availabilities: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    providerId: string;
    organizationId: string;
    locationId?: string;
    schedulingRule: SchedulingRule;
    schedulingInterval?: number;
    availableServices: Array<{
      serviceId: string;
      duration: number;
      price: number;
    }>;
  }>
): Promise<SlotGenerationResult> {
  try {
    let totalSlotsGenerated = 0;
    const allErrors: string[] = [];

    for (const availability of availabilities) {
      const result = await generateSlotsForAvailability({
        availabilityId: availability.id,
        startTime: availability.startTime,
        endTime: availability.endTime,
        providerId: availability.providerId,
        organizationId: availability.organizationId,
        locationId: availability.locationId,
        schedulingRule: availability.schedulingRule,
        schedulingInterval: availability.schedulingInterval,
        services: availability.availableServices,
      });

      if (result.success) {
        totalSlotsGenerated += result.slotsGenerated;
      } else {
        allErrors.push(...(result.errors || []));
      }
    }

    return {
      success: allErrors.length === 0,
      slotsGenerated: totalSlotsGenerated,
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      slotsGenerated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}

/**
 * Regenerate slots for an availability (useful for updates)
 */
export async function regenerateSlotsForAvailability(
  availabilityId: string
): Promise<SlotGenerationResult> {
  try {
    // Get the availability with its services
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: {
        availableServices: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!availability) {
      return {
        success: false,
        slotsGenerated: 0,
        errors: ['Availability not found'],
      };
    }

    // Delete existing slots
    await prisma.calculatedAvailabilitySlot.deleteMany({
      where: { availabilityId: availabilityId },
    });

    // Generate new slots
    return await generateSlotsForAvailability({
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
  } catch (error) {
    return {
      success: false,
      slotsGenerated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}
