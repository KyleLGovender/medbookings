import { prisma } from '@/lib/prisma';
import { generateTimeSlots, SchedulingOptions } from './scheduling-rules';
import { generateRecurrenceOccurrences } from './recurrence-patterns';
import { 
  AvailabilityWithRelations, 
  SlotGenerationRequest, 
  SlotGenerationResult,
  SchedulingRule,
  SlotStatus,
  BillingEntity,
} from '../types';

export interface SlotGenerationConfig {
  batchSize?: number; // Process slots in batches to avoid memory issues
  enableConflictDetection?: boolean;
  enableCalendarSync?: boolean;
  generateFutureOnly?: boolean; // Only generate slots for future dates
  maxSlotsPerAvailability?: number;
}

export interface BatchSlotGenerationResult {
  totalAvailabilities: number;
  totalSlotsGenerated: number;
  totalSlotsConflicted: number;
  totalSlotsSkipped: number;
  processingTimeMs: number;
  errors: string[];
  batchResults: SlotGenerationResult[];
}

/**
 * Enhanced slot generation service with batch processing and advanced features
 */
export class SlotGenerationService {
  private config: SlotGenerationConfig;

  constructor(config: SlotGenerationConfig = {}) {
    this.config = {
      batchSize: 50,
      enableConflictDetection: true,
      enableCalendarSync: true,
      generateFutureOnly: true,
      maxSlotsPerAvailability: 500,
      ...config,
    };
  }

  /**
   * Generate slots for multiple availabilities with batch processing
   */
  async generateSlotsForAvailabilities(
    availabilityIds: string[]
  ): Promise<BatchSlotGenerationResult> {
    const startTime = Date.now();
    const batchResults: SlotGenerationResult[] = [];
    let totalSlotsGenerated = 0;
    let totalSlotsConflicted = 0;
    let totalSlotsSkipped = 0;
    const errors: string[] = [];

    // Process in batches to avoid overwhelming the database
    const batchSize = this.config.batchSize || 50;
    
    for (let i = 0; i < availabilityIds.length; i += batchSize) {
      const batch = availabilityIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (availabilityId) => {
        try {
          const result = await this.generateSlotsForSingleAvailability(availabilityId);
          totalSlotsGenerated += result.slotsGenerated;
          totalSlotsConflicted += result.slotsConflicted;
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Availability ${availabilityId}: ${errorMessage}`);
          totalSlotsSkipped++;
          return {
            availabilityId,
            slotsGenerated: 0,
            slotsConflicted: 0,
            errors: [errorMessage],
            duration: 0,
          };
        }
      });

      const batchResult = await Promise.all(batchPromises);
      batchResults.push(...batchResult);
    }

    return {
      totalAvailabilities: availabilityIds.length,
      totalSlotsGenerated,
      totalSlotsConflicted,
      totalSlotsSkipped,
      processingTimeMs: Date.now() - startTime,
      errors,
      batchResults,
    };
  }

  /**
   * Generate slots for a single availability with enhanced features
   */
  async generateSlotsForSingleAvailability(
    availabilityId: string
  ): Promise<SlotGenerationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalSlotsGenerated = 0;
    let totalSlotsConflicted = 0;

    try {
      // Fetch availability with all relations
      const availability = await prisma.availability.findUnique({
        where: { id: availabilityId },
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
          calculatedSlots: true,
        },
      });

      if (!availability) {
        throw new Error('Availability not found');
      }

      // Check if availability is active
      if (availability.status !== 'ACTIVE') {
        throw new Error('Can only generate slots for active availability');
      }

      // Delete existing slots if regenerating
      await this.cleanupExistingSlots(availabilityId);

      // Generate occurrence dates (including recurring patterns)
      const occurrences = await this.generateAvailabilityOccurrences(availability);

      // Filter future occurrences if configured
      const filteredOccurrences = this.config.generateFutureOnly
        ? occurrences.filter(occ => occ.startTime > new Date())
        : occurrences;

      // Generate slots for each occurrence and service
      for (const occurrence of filteredOccurrences) {
        for (const serviceConfig of availability.availableServices) {
          const result = await this.generateSlotsForOccurrenceAndService(
            availability,
            occurrence,
            serviceConfig
          );

          totalSlotsGenerated += result.slotsGenerated;
          totalSlotsConflicted += result.slotsConflicted;
          errors.push(...result.errors);

          // Check slot limit
          if (totalSlotsGenerated >= (this.config.maxSlotsPerAvailability || 500)) {
            errors.push(`Reached maximum slot limit (${this.config.maxSlotsPerAvailability})`);
            break;
          }
        }

        if (totalSlotsGenerated >= (this.config.maxSlotsPerAvailability || 500)) {
          break;
        }
      }

      return {
        availabilityId,
        slotsGenerated: totalSlotsGenerated,
        slotsConflicted: totalSlotsConflicted,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error generating slots:', error);
      return {
        availabilityId,
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
  private async generateAvailabilityOccurrences(
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
        maxOccurrences: 200, // Increased limit for batch processing
      });

      occurrences.push(
        ...recurrenceOccurrences
          .filter(occ => !occ.isException)
          .map(occ => ({
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
  private async generateSlotsForOccurrenceAndService(
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
        alignToHour: this.getAlignmentSetting(availability.schedulingRule, 'hour'),
        alignToHalfHour: this.getAlignmentSetting(availability.schedulingRule, 'halfHour'),
        alignToQuarterHour: this.getAlignmentSetting(availability.schedulingRule, 'quarterHour'),
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
      const generatedSlots = timeSlotResult.slots.map(slot => ({
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

      // Check for conflicts if enabled
      let validSlots = generatedSlots;
      let conflictedSlots: any[] = [];

      if (this.config.enableConflictDetection) {
        const conflictResult = await this.detectSlotConflicts(
          generatedSlots,
          availability.serviceProviderId
        );
        validSlots = conflictResult.validSlots;
        conflictedSlots = conflictResult.conflictedSlots;
      }

      // Insert valid slots into database
      if (validSlots.length > 0) {
        await prisma.calculatedAvailabilitySlot.createMany({
          data: validSlots.map(slot => ({
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
  private async detectSlotConflicts(
    newSlots: any[],
    serviceProviderId: string
  ): Promise<{
    validSlots: any[];
    conflictedSlots: any[];
  }> {
    const validSlots: any[] = [];
    const conflictedSlots: any[] = [];

    for (const newSlot of newSlots) {
      const hasConflict = await this.checkSlotConflict(newSlot, serviceProviderId);
      
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
  private async checkSlotConflict(
    slot: any,
    serviceProviderId: string
  ): Promise<boolean> {
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

    // Check for calendar events if enabled
    if (this.config.enableCalendarSync) {
      const blockingEvents = await prisma.calendarEvent.findMany({
        where: {
          userId: serviceProviderId,
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
    }

    return false;
  }

  /**
   * Clean up existing slots for an availability
   */
  private async cleanupExistingSlots(availabilityId: string): Promise<void> {
    // Only delete slots that don't have bookings
    await prisma.calculatedAvailabilitySlot.deleteMany({
      where: {
        availabilityId,
        bookingId: null, // Only delete unbooked slots
      },
    });

    // Mark booked slots as unavailable instead of deleting
    await prisma.calculatedAvailabilitySlot.updateMany({
      where: {
        availabilityId,
        bookingId: { not: null },
      },
      data: {
        status: SlotStatus.UNAVAILABLE,
      },
    });
  }

  /**
   * Get alignment setting based on scheduling rule
   */
  private getAlignmentSetting(
    rule: SchedulingRule, 
    type: 'hour' | 'halfHour' | 'quarterHour'
  ): boolean {
    if (rule !== SchedulingRule.FIXED_INTERVAL) {
      return false;
    }

    // Default to quarter-hour alignment for fixed intervals
    return type === 'quarterHour';
  }
}

/**
 * Generate slots for availability with enhanced options
 */
export async function generateSlotsWithConfig(
  availabilityId: string,
  config?: SlotGenerationConfig
): Promise<SlotGenerationResult> {
  const service = new SlotGenerationService(config);
  return await service.generateSlotsForSingleAvailability(availabilityId);
}

/**
 * Batch generate slots for multiple availabilities
 */
export async function batchGenerateSlots(
  availabilityIds: string[],
  config?: SlotGenerationConfig
): Promise<BatchSlotGenerationResult> {
  const service = new SlotGenerationService(config);
  return await service.generateSlotsForAvailabilities(availabilityIds);
}

/**
 * Generate slots for all active availabilities of a provider
 */
export async function generateSlotsForProvider(
  serviceProviderId: string,
  config?: SlotGenerationConfig
): Promise<BatchSlotGenerationResult> {
  try {
    // Find all active availabilities for the provider
    const availabilities = await prisma.availability.findMany({
      where: {
        serviceProviderId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    const availabilityIds = availabilities.map(a => a.id);
    
    return await batchGenerateSlots(availabilityIds, config);
  } catch (error) {
    console.error('Error generating slots for provider:', error);
    return {
      totalAvailabilities: 0,
      totalSlotsGenerated: 0,
      totalSlotsConflicted: 0,
      totalSlotsSkipped: 0,
      processingTimeMs: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      batchResults: [],
    };
  }
}

/**
 * Generate slots for all active availabilities of an organization
 */
export async function generateSlotsForOrganization(
  organizationId: string,
  config?: SlotGenerationConfig
): Promise<BatchSlotGenerationResult> {
  try {
    // Find all active availabilities for the organization
    const availabilities = await prisma.availability.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    const availabilityIds = availabilities.map(a => a.id);
    
    return await batchGenerateSlots(availabilityIds, config);
  } catch (error) {
    console.error('Error generating slots for organization:', error);
    return {
      totalAvailabilities: 0,
      totalSlotsGenerated: 0,
      totalSlotsConflicted: 0,
      totalSlotsSkipped: 0,
      processingTimeMs: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      batchResults: [],
    };
  }
}