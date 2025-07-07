import { RecurrencePattern, SchedulingRule } from '@/features/calendar/availability/types/types';
import { prisma } from '@/lib/prisma';

import { RecurringSlotManager } from './recurring-slot-manager';
import { SlotGenerationService } from './slot-generation-service';

export interface RecalculationTrigger {
  triggerType:
    | 'availability_modified'
    | 'service_modified'
    | 'schedule_modified'
    | 'location_modified';
  entityId: string;
  changeType: 'create' | 'update' | 'delete';
  affectedFields: string[];
  seriesId?: string;
  recalculationScope: 'single' | 'series' | 'future_only';
}

export interface RecalculationResult {
  triggered: boolean;
  scope: 'single' | 'series' | 'future_only';
  totalAffectedAvailabilities: number;
  totalSlotsRecalculated: number;
  totalSlotsConflicted: number;
  errors: string[];
  processingTimeMs: number;
}

/**
 * Service for managing automatic slot recalculation triggers
 */
export class SlotRecalculationService {
  private slotService: SlotGenerationService;
  private recurringManager: RecurringSlotManager;

  constructor() {
    this.slotService = new SlotGenerationService({
      enableConflictDetection: true,
      generateFutureOnly: true,
    });

    this.recurringManager = new RecurringSlotManager({
      generateFutureOnly: true,
      preserveExistingSlots: false,
    });
  }

  /**
   * Process availability modification trigger
   */
  async processAvailabilityModification(
    availabilityId: string,
    changeType: 'create' | 'update' | 'delete',
    modifiedFields: string[]
  ): Promise<RecalculationResult> {
    const startTime = Date.now();

    try {
      // Get availability details
      const availability = await prisma.availability.findUnique({
        where: { id: availabilityId },
        include: {
          availableServices: true,
          calculatedSlots: {
            include: {
              booking: true,
            },
          },
        },
      });

      if (!availability) {
        return {
          triggered: false,
          scope: 'single',
          totalAffectedAvailabilities: 0,
          totalSlotsRecalculated: 0,
          totalSlotsConflicted: 0,
          errors: ['Availability not found'],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Determine if recalculation is needed
      const needsRecalculation = this.shouldTriggerRecalculation(modifiedFields, changeType);

      if (!needsRecalculation) {
        return {
          triggered: false,
          scope: 'single',
          totalAffectedAvailabilities: 0,
          totalSlotsRecalculated: 0,
          totalSlotsConflicted: 0,
          errors: [],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Check for existing bookings
      const hasBookings = availability.calculatedSlots.some((slot) => slot.booking);

      if (hasBookings && this.isDestructiveChange(modifiedFields)) {
        return {
          triggered: false,
          scope: 'single',
          totalAffectedAvailabilities: 0,
          totalSlotsRecalculated: 0,
          totalSlotsConflicted: 0,
          errors: ['Cannot recalculate slots with existing bookings for destructive changes'],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Determine recalculation scope
      const scope = this.determineRecalculationScope(availability, modifiedFields);

      // Execute recalculation based on scope
      let result: RecalculationResult;

      switch (scope) {
        case 'single':
          result = await this.recalculateSingleAvailability(availabilityId);
          break;
        case 'series':
          if (!availability.seriesId) {
            result = await this.recalculateSingleAvailability(availabilityId);
          } else {
            result = await this.recalculateEntireSeries(availability.seriesId);
          }
          break;
        case 'future_only':
          if (!availability.seriesId) {
            result = await this.recalculateSingleAvailability(availabilityId);
          } else {
            result = await this.recalculateFutureSeries(availability.seriesId);
          }
          break;
        default:
          result = await this.recalculateSingleAvailability(availabilityId);
      }

      result.processingTimeMs = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error('Error processing availability modification trigger:', error);
      return {
        triggered: false,
        scope: 'single',
        totalAffectedAvailabilities: 0,
        totalSlotsRecalculated: 0,
        totalSlotsConflicted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Process service configuration modification trigger
   */
  async processServiceModification(
    serviceConfigId: string,
    changeType: 'create' | 'update' | 'delete'
  ): Promise<RecalculationResult> {
    const startTime = Date.now();

    try {
      // Get service config and related availabilities
      const serviceConfig = await prisma.serviceAvailabilityConfig.findUnique({
        where: { id: serviceConfigId },
        include: {
          availabilities: {
            include: {
              calculatedSlots: {
                include: {
                  booking: true,
                },
              },
            },
          },
        },
      });

      if (!serviceConfig) {
        return {
          triggered: false,
          scope: 'single',
          totalAffectedAvailabilities: 0,
          totalSlotsRecalculated: 0,
          totalSlotsConflicted: 0,
          errors: ['Service configuration not found'],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Check for existing bookings for this service across all availabilities
      const allSlots = serviceConfig.availabilities.flatMap((availability) =>
        availability.calculatedSlots.filter((slot) => slot.serviceId === serviceConfig.serviceId)
      );
      const hasBookings = allSlots.some((slot: any) => slot.booking);

      if (hasBookings && changeType === 'delete') {
        return {
          triggered: false,
          scope: 'single',
          totalAffectedAvailabilities: 0,
          totalSlotsRecalculated: 0,
          totalSlotsConflicted: 0,
          errors: ['Cannot delete service configuration with existing bookings'],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Recalculate slots for all affected availabilities
      const availabilityIds = serviceConfig.availabilities.map((availability) => availability.id);
      const results = await Promise.all(
        availabilityIds.map((id) => this.recalculateSingleAvailability(id))
      );

      // Combine results
      const result: RecalculationResult = {
        triggered: true,
        scope: 'single',
        totalAffectedAvailabilities: availabilityIds.length,
        totalSlotsRecalculated: results.reduce((sum, r) => sum + r.totalSlotsRecalculated, 0),
        totalSlotsConflicted: results.reduce((sum, r) => sum + r.totalSlotsConflicted, 0),
        errors: results.flatMap((r) => r.errors),
        processingTimeMs: Date.now() - startTime,
      };
      result.processingTimeMs = Date.now() - startTime;

      return result;
    } catch (error) {
      console.error('Error processing service modification trigger:', error);
      return {
        triggered: false,
        scope: 'single',
        totalAffectedAvailabilities: 0,
        totalSlotsRecalculated: 0,
        totalSlotsConflicted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Process recurring pattern modification trigger
   */
  async processRecurrenceModification(
    seriesId: string,
    newPattern: RecurrencePattern,
    modificationScope: 'all' | 'future_only'
  ): Promise<RecalculationResult> {
    const startTime = Date.now();

    try {
      // Update recurrence pattern for all affected availabilities
      const whereClause: any = { seriesId };

      if (modificationScope === 'future_only') {
        whereClause.startTime = { gte: new Date() };
      }

      await prisma.availability.updateMany({
        where: whereClause,
        data: {
          recurrencePattern: newPattern as any,
        },
      });

      // Recalculate slots based on scope
      let result: RecalculationResult;

      if (modificationScope === 'all') {
        result = await this.recalculateEntireSeries(seriesId);
      } else {
        result = await this.recalculateFutureSeries(seriesId);
      }

      result.processingTimeMs = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error('Error processing recurrence modification trigger:', error);
      return {
        triggered: false,
        scope: 'series',
        totalAffectedAvailabilities: 0,
        totalSlotsRecalculated: 0,
        totalSlotsConflicted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Process scheduling rule modification trigger
   */
  async processSchedulingRuleModification(
    availabilityId: string,
    newRule: SchedulingRule,
    newInterval?: number,
    modificationScope: 'single' | 'series' | 'future_only' = 'single'
  ): Promise<RecalculationResult> {
    const startTime = Date.now();

    try {
      const availability = await prisma.availability.findUnique({
        where: { id: availabilityId },
        include: {
          calculatedSlots: {
            include: {
              booking: true,
            },
          },
        },
      });

      if (!availability) {
        return {
          triggered: false,
          scope: modificationScope,
          totalAffectedAvailabilities: 0,
          totalSlotsRecalculated: 0,
          totalSlotsConflicted: 0,
          errors: ['Availability not found'],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Check for existing bookings
      const hasBookings = availability.calculatedSlots.some((slot) => slot.booking);

      if (hasBookings) {
        return {
          triggered: false,
          scope: modificationScope,
          totalAffectedAvailabilities: 0,
          totalSlotsRecalculated: 0,
          totalSlotsConflicted: 0,
          errors: ['Cannot modify scheduling rule with existing bookings'],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Update scheduling rule
      const updateData: any = {
        schedulingRule: newRule,
      };

      if (newInterval !== undefined) {
        updateData.schedulingInterval = newInterval;
      }

      if (modificationScope === 'single') {
        await prisma.availability.update({
          where: { id: availabilityId },
          data: updateData,
        });
      } else if (availability.seriesId) {
        const whereClause: any = { seriesId: availability.seriesId };

        if (modificationScope === 'future_only') {
          whereClause.startTime = { gte: new Date() };
        }

        await prisma.availability.updateMany({
          where: whereClause,
          data: updateData,
        });
      }

      // Recalculate slots based on scope
      let result: RecalculationResult;

      switch (modificationScope) {
        case 'single':
          result = await this.recalculateSingleAvailability(availabilityId);
          break;
        case 'series':
          if (!availability.seriesId) {
            result = await this.recalculateSingleAvailability(availabilityId);
          } else {
            result = await this.recalculateEntireSeries(availability.seriesId);
          }
          break;
        case 'future_only':
          if (!availability.seriesId) {
            result = await this.recalculateSingleAvailability(availabilityId);
          } else {
            result = await this.recalculateFutureSeries(availability.seriesId);
          }
          break;
        default:
          result = await this.recalculateSingleAvailability(availabilityId);
      }

      result.processingTimeMs = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error('Error processing scheduling rule modification trigger:', error);
      return {
        triggered: false,
        scope: modificationScope,
        totalAffectedAvailabilities: 0,
        totalSlotsRecalculated: 0,
        totalSlotsConflicted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Recalculate slots for a single availability
   */
  private async recalculateSingleAvailability(
    availabilityId: string
  ): Promise<RecalculationResult> {
    try {
      const result = await this.slotService.generateSlotsForSingleAvailability(availabilityId);

      return {
        triggered: true,
        scope: 'single',
        totalAffectedAvailabilities: 1,
        totalSlotsRecalculated: result.slotsGenerated,
        totalSlotsConflicted: result.slotsConflicted,
        errors: result.errors,
        processingTimeMs: result.duration,
      };
    } catch (error) {
      return {
        triggered: false,
        scope: 'single',
        totalAffectedAvailabilities: 0,
        totalSlotsRecalculated: 0,
        totalSlotsConflicted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Recalculate slots for an entire recurring series
   */
  private async recalculateEntireSeries(seriesId: string): Promise<RecalculationResult> {
    try {
      const result = await this.recurringManager.updateSeriesSlots(seriesId, 'all');

      return {
        triggered: true,
        scope: 'series',
        totalAffectedAvailabilities: result.processedOccurrences,
        totalSlotsRecalculated: result.totalSlotsGenerated,
        totalSlotsConflicted: result.totalSlotsConflicted,
        errors: result.errors,
        processingTimeMs: 0, // Will be set by caller
      };
    } catch (error) {
      return {
        triggered: false,
        scope: 'series',
        totalAffectedAvailabilities: 0,
        totalSlotsRecalculated: 0,
        totalSlotsConflicted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Recalculate slots for future occurrences in a series
   */
  private async recalculateFutureSeries(seriesId: string): Promise<RecalculationResult> {
    try {
      const result = await this.recurringManager.updateSeriesSlots(seriesId, 'future');

      return {
        triggered: true,
        scope: 'future_only',
        totalAffectedAvailabilities: result.processedOccurrences,
        totalSlotsRecalculated: result.totalSlotsGenerated,
        totalSlotsConflicted: result.totalSlotsConflicted,
        errors: result.errors,
        processingTimeMs: 0, // Will be set by caller
      };
    } catch (error) {
      return {
        triggered: false,
        scope: 'future_only',
        totalAffectedAvailabilities: 0,
        totalSlotsRecalculated: 0,
        totalSlotsConflicted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Determine if recalculation should be triggered based on modified fields
   */
  private shouldTriggerRecalculation(
    modifiedFields: string[],
    changeType: 'create' | 'update' | 'delete'
  ): boolean {
    if (changeType === 'create' || changeType === 'delete') {
      return true;
    }

    const triggerFields = [
      'startTime',
      'endTime',
      'schedulingRule',
      'schedulingInterval',
      'recurrencePattern',
      'isRecurring',
      'status',
    ];

    return modifiedFields.some((field) => triggerFields.includes(field));
  }

  /**
   * Check if the change is destructive (affects existing slots significantly)
   */
  private isDestructiveChange(modifiedFields: string[]): boolean {
    const destructiveFields = ['startTime', 'endTime', 'schedulingRule', 'schedulingInterval'];

    return modifiedFields.some((field) => destructiveFields.includes(field));
  }

  /**
   * Determine the scope of recalculation needed
   */
  private determineRecalculationScope(
    availability: any,
    modifiedFields: string[]
  ): 'single' | 'series' | 'future_only' {
    if (!availability.isRecurring || !availability.seriesId) {
      return 'single';
    }

    const seriesWideFields = ['recurrencePattern', 'schedulingRule', 'schedulingInterval'];

    const affectsEntireSeries = modifiedFields.some((field) => seriesWideFields.includes(field));

    if (affectsEntireSeries) {
      // For now, we'll be conservative and only update future occurrences
      // to avoid disrupting past appointments
      return 'future_only';
    }

    return 'single';
  }
}

/**
 * Trigger slot recalculation for availability modification
 */
export async function triggerAvailabilityRecalculation(
  availabilityId: string,
  changeType: 'create' | 'update' | 'delete',
  modifiedFields: string[]
): Promise<RecalculationResult> {
  const service = new SlotRecalculationService();
  return await service.processAvailabilityModification(availabilityId, changeType, modifiedFields);
}

/**
 * Trigger slot recalculation for service configuration changes
 */
export async function triggerServiceRecalculation(
  serviceConfigId: string,
  changeType: 'create' | 'update' | 'delete'
): Promise<RecalculationResult> {
  const service = new SlotRecalculationService();
  return await service.processServiceModification(serviceConfigId, changeType);
}

/**
 * Trigger slot recalculation for scheduling rule changes
 */
export async function triggerSchedulingRuleRecalculation(
  availabilityId: string,
  newRule: SchedulingRule,
  newInterval?: number,
  scope: 'single' | 'series' | 'future_only' = 'single'
): Promise<RecalculationResult> {
  const service = new SlotRecalculationService();
  return await service.processSchedulingRuleModification(
    availabilityId,
    newRule,
    newInterval,
    scope
  );
}
