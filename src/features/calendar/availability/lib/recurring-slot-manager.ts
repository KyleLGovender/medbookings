import { prisma } from '@/lib/prisma';
import { SlotGenerationService } from './slot-generation-service';
import { 
  AvailabilityWithRelations, 
  RecurrencePattern,
  SlotGenerationResult,
  AvailabilityStatus,
} from '../types';
import { generateRecurrenceOccurrences } from './recurrence-patterns';

export interface RecurringSlotGenerationResult {
  seriesId: string;
  masterAvailabilityId: string;
  totalOccurrences: number;
  processedOccurrences: number;
  totalSlotsGenerated: number;
  totalSlotsConflicted: number;
  errors: string[];
  occurrenceResults: Array<{
    availabilityId: string;
    startTime: Date;
    endTime: Date;
    slotsGenerated: number;
    slotsConflicted: number;
    errors: string[];
  }>;
}

export interface SeriesGroupingOptions {
  generateFutureOnly?: boolean;
  maxOccurrencesPerBatch?: number;
  preserveExistingSlots?: boolean;
  enableConflictDetection?: boolean;
}

/**
 * Manager for handling recurring availability slot generation
 */
export class RecurringSlotManager {
  private slotService: SlotGenerationService;
  private options: SeriesGroupingOptions;

  constructor(options: SeriesGroupingOptions = {}) {
    this.options = {
      generateFutureOnly: true,
      maxOccurrencesPerBatch: 100,
      preserveExistingSlots: false,
      enableConflictDetection: true,
      ...options,
    };

    this.slotService = new SlotGenerationService({
      enableConflictDetection: this.options.enableConflictDetection,
      generateFutureOnly: this.options.generateFutureOnly,
    });
  }

  /**
   * Generate slots for an entire recurring availability series
   */
  async generateSlotsForRecurringSeries(
    masterAvailabilityId: string
  ): Promise<RecurringSlotGenerationResult> {
    try {
      // Get master availability
      const masterAvailability = await prisma.availability.findUnique({
        where: { id: masterAvailabilityId },
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
        },
      });

      if (!masterAvailability) {
        throw new Error('Master availability not found');
      }

      if (!masterAvailability.isRecurring || !masterAvailability.seriesId) {
        throw new Error('This is not a recurring availability series');
      }

      if (!masterAvailability.recurrencePattern) {
        throw new Error('No recurrence pattern defined');
      }

      // Generate all occurrences for the series
      const occurrences = this.generateSeriesOccurrences(
        masterAvailability.recurrencePattern,
        masterAvailability.startTime,
        masterAvailability.endTime
      );

      // Filter future occurrences if configured
      const filteredOccurrences = this.options.generateFutureOnly
        ? occurrences.filter(occ => occ.startTime > new Date())
        : occurrences;

      // Create or update availability records for each occurrence
      const availabilityIds = await this.ensureAvailabilityOccurrences(
        masterAvailability,
        filteredOccurrences
      );

      // Generate slots for each occurrence
      const occurrenceResults: Array<{
        availabilityId: string;
        startTime: Date;
        endTime: Date;
        slotsGenerated: number;
        slotsConflicted: number;
        errors: string[];
      }> = [];

      let totalSlotsGenerated = 0;
      let totalSlotsConflicted = 0;
      const errors: string[] = [];

      // Process in batches to avoid overwhelming the database
      const batchSize = this.options.maxOccurrencesPerBatch || 100;
      
      for (let i = 0; i < availabilityIds.length; i += batchSize) {
        const batch = availabilityIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (availabilityId, index) => {
          try {
            const occurrence = filteredOccurrences[i + index];
            const result = await this.slotService.generateSlotsForSingleAvailability(availabilityId);
            
            totalSlotsGenerated += result.slotsGenerated;
            totalSlotsConflicted += result.slotsConflicted;
            errors.push(...result.errors);

            return {
              availabilityId,
              startTime: occurrence.startTime,
              endTime: occurrence.endTime,
              slotsGenerated: result.slotsGenerated,
              slotsConflicted: result.slotsConflicted,
              errors: result.errors,
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Occurrence ${availabilityId}: ${errorMessage}`);
            
            return {
              availabilityId,
              startTime: filteredOccurrences[i + index].startTime,
              endTime: filteredOccurrences[i + index].endTime,
              slotsGenerated: 0,
              slotsConflicted: 0,
              errors: [errorMessage],
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        occurrenceResults.push(...batchResults);
      }

      return {
        seriesId: masterAvailability.seriesId,
        masterAvailabilityId,
        totalOccurrences: occurrences.length,
        processedOccurrences: filteredOccurrences.length,
        totalSlotsGenerated,
        totalSlotsConflicted,
        errors,
        occurrenceResults,
      };
    } catch (error) {
      console.error('Error generating slots for recurring series:', error);
      throw error;
    }
  }

  /**
   * Generate occurrences for a recurring series
   */
  private generateSeriesOccurrences(
    recurrencePattern: RecurrencePattern,
    baseStartTime: Date,
    baseEndTime: Date
  ): Array<{ startTime: Date; endTime: Date }> {
    const occurrences = generateRecurrenceOccurrences({
      pattern: recurrencePattern,
      baseStartTime,
      baseEndTime,
      maxOccurrences: 365, // Maximum one year of occurrences
    });

    return occurrences
      .filter(occ => !occ.isException)
      .map(occ => ({
        startTime: occ.startTime,
        endTime: occ.endTime,
      }));
  }

  /**
   * Ensure availability records exist for each occurrence
   */
  private async ensureAvailabilityOccurrences(
    masterAvailability: AvailabilityWithRelations,
    occurrences: Array<{ startTime: Date; endTime: Date }>
  ): Promise<string[]> {
    const availabilityIds: string[] = [];

    for (const occurrence of occurrences) {
      // Check if availability already exists for this occurrence
      let existingAvailability = await prisma.availability.findFirst({
        where: {
          seriesId: masterAvailability.seriesId,
          startTime: occurrence.startTime,
          endTime: occurrence.endTime,
        },
      });

      if (!existingAvailability) {
        // Create new availability for this occurrence
        existingAvailability = await prisma.availability.create({
          data: {
            serviceProviderId: masterAvailability.serviceProviderId,
            organizationId: masterAvailability.organizationId,
            locationId: masterAvailability.locationId,
            connectionId: masterAvailability.connectionId,
            startTime: occurrence.startTime,
            endTime: occurrence.endTime,
            isRecurring: true,
            recurrencePattern: masterAvailability.recurrencePattern,
            seriesId: masterAvailability.seriesId,
            schedulingRule: masterAvailability.schedulingRule,
            schedulingInterval: masterAvailability.schedulingInterval,
            isOnlineAvailable: masterAvailability.isOnlineAvailable,
            requiresConfirmation: masterAvailability.requiresConfirmation,
            billingEntity: masterAvailability.billingEntity,
            status: masterAvailability.status,
            createdById: masterAvailability.createdById,
            createdByMembershipId: masterAvailability.createdByMembershipId,
            defaultSubscriptionId: masterAvailability.defaultSubscriptionId,
            // Create service configurations for this occurrence
            availableServices: {
              create: masterAvailability.availableServices.map(config => ({
                serviceId: config.serviceId,
                duration: config.duration,
                price: config.price,
                showPrice: config.showPrice,
                isOnlineAvailable: config.isOnlineAvailable,
                isInPerson: config.isInPerson,
                locationId: config.locationId,
              })),
            },
          },
        });
      }

      availabilityIds.push(existingAvailability.id);
    }

    return availabilityIds;
  }

  /**
   * Update slots for all occurrences in a series when the master is modified
   */
  async updateSeriesSlots(
    seriesId: string,
    updateType: 'all' | 'future' | 'specific',
    specificDate?: Date
  ): Promise<RecurringSlotGenerationResult> {
    try {
      // Get all availabilities in the series
      const whereClause: any = { seriesId };
      
      if (updateType === 'future') {
        whereClause.startTime = { gte: new Date() };
      } else if (updateType === 'specific' && specificDate) {
        whereClause.startTime = { gte: specificDate };
      }

      const seriesAvailabilities = await prisma.availability.findMany({
        where: whereClause,
        include: {
          availableServices: true,
          serviceProvider: true,
          organization: true,
        },
      });

      if (seriesAvailabilities.length === 0) {
        throw new Error('No availabilities found in series');
      }

      // Regenerate slots for each availability
      const occurrenceResults: Array<{
        availabilityId: string;
        startTime: Date;
        endTime: Date;
        slotsGenerated: number;
        slotsConflicted: number;
        errors: string[];
      }> = [];

      let totalSlotsGenerated = 0;
      let totalSlotsConflicted = 0;
      const errors: string[] = [];

      for (const availability of seriesAvailabilities) {
        try {
          const result = await this.slotService.generateSlotsForSingleAvailability(availability.id);
          
          totalSlotsGenerated += result.slotsGenerated;
          totalSlotsConflicted += result.slotsConflicted;
          errors.push(...result.errors);

          occurrenceResults.push({
            availabilityId: availability.id,
            startTime: availability.startTime,
            endTime: availability.endTime,
            slotsGenerated: result.slotsGenerated,
            slotsConflicted: result.slotsConflicted,
            errors: result.errors,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Availability ${availability.id}: ${errorMessage}`);
          
          occurrenceResults.push({
            availabilityId: availability.id,
            startTime: availability.startTime,
            endTime: availability.endTime,
            slotsGenerated: 0,
            slotsConflicted: 0,
            errors: [errorMessage],
          });
        }
      }

      return {
        seriesId,
        masterAvailabilityId: seriesAvailabilities[0].id, // First availability as representative
        totalOccurrences: seriesAvailabilities.length,
        processedOccurrences: seriesAvailabilities.length,
        totalSlotsGenerated,
        totalSlotsConflicted,
        errors,
        occurrenceResults,
      };
    } catch (error) {
      console.error('Error updating series slots:', error);
      throw error;
    }
  }

  /**
   * Get series statistics and grouping information
   */
  async getSeriesGroupingStats(seriesId: string): Promise<{
    seriesId: string;
    totalOccurrences: number;
    activeOccurrences: number;
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    utilizationRate: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    occurrenceBreakdown: Array<{
      availabilityId: string;
      startTime: Date;
      endTime: Date;
      status: AvailabilityStatus;
      totalSlots: number;
      bookedSlots: number;
    }>;
  }> {
    try {
      // Get all availabilities in the series
      const seriesAvailabilities = await prisma.availability.findMany({
        where: { seriesId },
        include: {
          calculatedSlots: {
            include: {
              booking: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      if (seriesAvailabilities.length === 0) {
        throw new Error('No availabilities found in series');
      }

      const occurrenceBreakdown = seriesAvailabilities.map(availability => {
        const totalSlots = availability.calculatedSlots.length;
        const bookedSlots = availability.calculatedSlots.filter(slot => slot.booking).length;

        return {
          availabilityId: availability.id,
          startTime: availability.startTime,
          endTime: availability.endTime,
          status: availability.status as AvailabilityStatus,
          totalSlots,
          bookedSlots,
        };
      });

      const totalSlots = occurrenceBreakdown.reduce((sum, occ) => sum + occ.totalSlots, 0);
      const bookedSlots = occurrenceBreakdown.reduce((sum, occ) => sum + occ.bookedSlots, 0);
      const availableSlots = totalSlots - bookedSlots;
      const utilizationRate = totalSlots > 0 ? bookedSlots / totalSlots : 0;

      const activeOccurrences = seriesAvailabilities.filter(
        av => av.status === AvailabilityStatus.ACTIVE
      ).length;

      return {
        seriesId,
        totalOccurrences: seriesAvailabilities.length,
        activeOccurrences,
        totalSlots,
        availableSlots,
        bookedSlots,
        utilizationRate,
        dateRange: {
          start: seriesAvailabilities[0].startTime,
          end: seriesAvailabilities[seriesAvailabilities.length - 1].endTime,
        },
        occurrenceBreakdown,
      };
    } catch (error) {
      console.error('Error getting series grouping stats:', error);
      throw error;
    }
  }
}

/**
 * Generate slots for a recurring availability series
 */
export async function generateRecurringSeriesSlots(
  masterAvailabilityId: string,
  options?: SeriesGroupingOptions
): Promise<RecurringSlotGenerationResult> {
  const manager = new RecurringSlotManager(options);
  return await manager.generateSlotsForRecurringSeries(masterAvailabilityId);
}

/**
 * Update slots for all future occurrences in a series
 */
export async function updateFutureSeriesSlots(
  seriesId: string,
  options?: SeriesGroupingOptions
): Promise<RecurringSlotGenerationResult> {
  const manager = new RecurringSlotManager(options);
  return await manager.updateSeriesSlots(seriesId, 'future');
}

/**
 * Get comprehensive statistics for a recurring series
 */
export async function getRecurringSeriesStats(seriesId: string) {
  const manager = new RecurringSlotManager();
  return await manager.getSeriesGroupingStats(seriesId);
}