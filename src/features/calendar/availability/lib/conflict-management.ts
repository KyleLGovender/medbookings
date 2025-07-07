import { prisma } from '@/lib/prisma';

import { AvailabilityConflict, SchedulingRule, SlotStatus } from '../types';
import { isSlotValidForSchedulingRule } from './scheduling-rules';

export interface ConflictDetectionOptions {
  checkOverlappingSlots?: boolean;
  checkCalendarEvents?: boolean;
  checkSchedulingRules?: boolean;
  checkLocationConflicts?: boolean;
  checkProviderAvailability?: boolean;
  bufferTimeMinutes?: number; // Buffer time between appointments
}

export interface ConflictResolutionResult {
  originalSlotsCount: number;
  validSlotsCount: number;
  conflictedSlotsCount: number;
  resolvedConflictsCount: number;
  conflicts: AvailabilityConflict[];
  validSlots: any[];
  conflictedSlots: any[];
}

export interface SlotConflictDetails {
  slotId?: string;
  startTime: Date;
  endTime: Date;
  conflictType:
    | 'OVERLAPPING_SLOTS'
    | 'CALENDAR_EVENT'
    | 'SCHEDULING_RULE'
    | 'LOCATION_CONFLICT'
    | 'PROVIDER_UNAVAILABLE';
  conflictingEntityId?: string;
  conflictingEntityType?: 'slot' | 'event' | 'availability' | 'location';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  canAutoResolve: boolean;
  suggestedResolution?: string;
}

/**
 * Comprehensive slot conflict management system
 */
export class ConflictManager {
  private options: ConflictDetectionOptions;

  constructor(options: ConflictDetectionOptions = {}) {
    this.options = {
      checkOverlappingSlots: true,
      checkCalendarEvents: true,
      checkSchedulingRules: true,
      checkLocationConflicts: true,
      checkProviderAvailability: true,
      bufferTimeMinutes: 0,
      ...options,
    };
  }

  /**
   * Detect and resolve conflicts for a set of new slots
   */
  async detectAndResolveConflicts(
    newSlots: any[],
    serviceProviderId: string,
    availabilityId: string
  ): Promise<ConflictResolutionResult> {
    const conflicts: AvailabilityConflict[] = [];
    const validSlots: any[] = [];
    const conflictedSlots: any[] = [];
    let resolvedConflictsCount = 0;

    for (const slot of newSlots) {
      const slotConflicts = await this.detectSlotConflicts(slot, serviceProviderId, availabilityId);

      if (slotConflicts.length === 0) {
        validSlots.push(slot);
      } else {
        // Try to resolve conflicts
        const resolutionResult = await this.attemptConflictResolution(
          slot,
          slotConflicts,
          serviceProviderId
        );

        if (resolutionResult.resolved) {
          validSlots.push(resolutionResult.modifiedSlot || slot);
          resolvedConflictsCount++;
        } else {
          conflictedSlots.push(slot);
          conflicts.push(
            ...slotConflicts.map((conflict) => ({
              conflictType: conflict.conflictType as any,
              conflictingAvailabilityId: conflict.conflictingEntityId,
              conflictingEventId:
                conflict.conflictingEntityType === 'event'
                  ? conflict.conflictingEntityId
                  : undefined,
              message: conflict.description,
              startTime: conflict.startTime,
              endTime: conflict.endTime,
            }))
          );
        }
      }
    }

    return {
      originalSlotsCount: newSlots.length,
      validSlotsCount: validSlots.length,
      conflictedSlotsCount: conflictedSlots.length,
      resolvedConflictsCount,
      conflicts,
      validSlots,
      conflictedSlots,
    };
  }

  /**
   * Detect all types of conflicts for a single slot
   */
  async detectSlotConflicts(
    slot: any,
    serviceProviderId: string,
    availabilityId: string
  ): Promise<SlotConflictDetails[]> {
    const conflicts: SlotConflictDetails[] = [];

    // Add buffer time if configured
    const bufferMs = (this.options.bufferTimeMinutes || 0) * 60 * 1000;
    const bufferedStartTime = new Date(slot.startTime.getTime() - bufferMs);
    const bufferedEndTime = new Date(slot.endTime.getTime() + bufferMs);

    // Check overlapping slots
    if (this.options.checkOverlappingSlots) {
      const overlappingConflicts = await this.checkOverlappingSlots(
        slot,
        bufferedStartTime,
        bufferedEndTime,
        serviceProviderId
      );
      conflicts.push(...overlappingConflicts);
    }

    // Check calendar events
    if (this.options.checkCalendarEvents) {
      const calendarConflicts = await this.checkCalendarEvents(
        slot,
        bufferedStartTime,
        bufferedEndTime,
        serviceProviderId
      );
      conflicts.push(...calendarConflicts);
    }

    // Check scheduling rules
    if (this.options.checkSchedulingRules) {
      const schedulingConflicts = await this.checkSchedulingRuleConflicts(slot, availabilityId);
      conflicts.push(...schedulingConflicts);
    }

    // Check location conflicts
    if (this.options.checkLocationConflicts && slot.locationId) {
      const locationConflicts = await this.checkLocationConflicts(
        slot,
        bufferedStartTime,
        bufferedEndTime,
        slot.locationId
      );
      conflicts.push(...locationConflicts);
    }

    // Check provider availability
    if (this.options.checkProviderAvailability) {
      const providerConflicts = await this.checkProviderAvailability(
        slot,
        bufferedStartTime,
        bufferedEndTime,
        serviceProviderId
      );
      conflicts.push(...providerConflicts);
    }

    return conflicts;
  }

  /**
   * Check for overlapping slots with the same provider
   */
  private async checkOverlappingSlots(
    slot: any,
    startTime: Date,
    endTime: Date,
    serviceProviderId: string
  ): Promise<SlotConflictDetails[]> {
    const overlappingSlots = await prisma.calculatedAvailabilitySlot.findMany({
      where: {
        availability: {
          serviceProviderId,
        },
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
        status: {
          in: [SlotStatus.AVAILABLE, SlotStatus.BOOKED],
        },
      },
      include: {
        availability: true,
        booking: true,
      },
    });

    return overlappingSlots.map((overlappingSlot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      conflictType: 'OVERLAPPING_SLOTS' as const,
      conflictingEntityId: overlappingSlot.id,
      conflictingEntityType: 'slot' as const,
      description: `Overlaps with existing ${overlappingSlot.booking ? 'booked' : 'available'} slot`,
      severity: overlappingSlot.booking ? ('critical' as const) : ('high' as const),
      canAutoResolve: !overlappingSlot.booking,
      suggestedResolution: overlappingSlot.booking
        ? 'Cannot resolve - slot is booked'
        : 'Adjust timing or merge slots',
    }));
  }

  /**
   * Check for conflicts with calendar events
   */
  private async checkCalendarEvents(
    slot: any,
    startTime: Date,
    endTime: Date,
    serviceProviderId: string
  ): Promise<SlotConflictDetails[]> {
    const blockingEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: serviceProviderId,
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
      },
    });

    return blockingEvents.map((event) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      conflictType: 'CALENDAR_EVENT' as const,
      conflictingEntityId: event.id,
      conflictingEntityType: 'event' as const,
      description: `Conflicts with calendar event: ${event.title || 'Untitled event'}`,
      severity: 'high' as const,
      canAutoResolve: false,
      suggestedResolution: 'Reschedule slot or update calendar event',
    }));
  }

  /**
   * Check for scheduling rule violations
   */
  private async checkSchedulingRuleConflicts(
    slot: any,
    availabilityId: string
  ): Promise<SlotConflictDetails[]> {
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      select: {
        schedulingRule: true,
        schedulingInterval: true,
      },
    });

    if (!availability) {
      return [];
    }

    const isValidSlot = isSlotValidForSchedulingRule(
      slot.startTime,
      slot.duration,
      availability.schedulingRule as SchedulingRule,
      {
        interval: availability.schedulingInterval || undefined,
        alignToHour: availability.schedulingRule === 'FIXED_INTERVAL',
        alignToHalfHour: false,
        alignToQuarterHour: false,
      }
    );

    if (!isValidSlot) {
      return [
        {
          startTime: slot.startTime,
          endTime: slot.endTime,
          conflictType: 'SCHEDULING_RULE' as const,
          conflictingEntityId: availabilityId,
          conflictingEntityType: 'availability' as const,
          description: `Violates ${availability.schedulingRule} scheduling rule`,
          severity: 'medium' as const,
          canAutoResolve: true,
          suggestedResolution: 'Adjust start time to comply with scheduling rule',
        },
      ];
    }

    return [];
  }

  /**
   * Check for location-based conflicts
   */
  private async checkLocationConflicts(
    slot: any,
    startTime: Date,
    endTime: Date,
    locationId: string
  ): Promise<SlotConflictDetails[]> {
    const conflictingSlots = await prisma.calculatedAvailabilitySlot.findMany({
      where: {
        locationId,
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
        status: {
          in: [SlotStatus.AVAILABLE, SlotStatus.BOOKED],
        },
        availability: {
          serviceProviderId: {
            not: slot.serviceProviderId,
          },
        },
      },
      include: {
        availability: {
          include: {
            serviceProvider: true,
          },
        },
        booking: true,
      },
    });

    return conflictingSlots.map((conflictingSlot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      conflictType: 'LOCATION_CONFLICT' as const,
      conflictingEntityId: conflictingSlot.id,
      conflictingEntityType: 'slot' as const,
      description: `Location conflict with ${conflictingSlot.availability.serviceProvider?.firstName} ${conflictingSlot.availability.serviceProvider?.lastName}`,
      severity: conflictingSlot.booking ? ('critical' as const) : ('medium' as const),
      canAutoResolve: false,
      suggestedResolution: 'Use different location or time',
    }));
  }

  /**
   * Check for general provider availability conflicts
   */
  private async checkProviderAvailability(
    slot: any,
    startTime: Date,
    endTime: Date,
    serviceProviderId: string
  ): Promise<SlotConflictDetails[]> {
    // Check if provider has any availability during this time
    const providerAvailability = await prisma.availability.findMany({
      where: {
        serviceProviderId,
        startTime: {
          lte: startTime,
        },
        endTime: {
          gte: endTime,
        },
        status: 'ACTIVE',
      },
    });

    if (providerAvailability.length === 0) {
      return [
        {
          startTime: slot.startTime,
          endTime: slot.endTime,
          conflictType: 'PROVIDER_UNAVAILABLE' as const,
          conflictingEntityId: serviceProviderId,
          conflictingEntityType: 'availability' as const,
          description: 'Provider has no availability during this time',
          severity: 'critical' as const,
          canAutoResolve: false,
          suggestedResolution: 'Create availability for this time period first',
        },
      ];
    }

    return [];
  }

  /**
   * Attempt to automatically resolve conflicts
   */
  private async attemptConflictResolution(
    slot: any,
    conflicts: SlotConflictDetails[],
    serviceProviderId: string
  ): Promise<{
    resolved: boolean;
    modifiedSlot?: any;
    resolutionMethod?: string;
  }> {
    // Only attempt resolution for conflicts that can be auto-resolved
    const resolvableConflicts = conflicts.filter((c) => c.canAutoResolve);

    if (resolvableConflicts.length === 0) {
      return { resolved: false };
    }

    // Try scheduling rule adjustments
    const schedulingRuleConflicts = resolvableConflicts.filter(
      (c) => c.conflictType === 'SCHEDULING_RULE'
    );

    if (schedulingRuleConflicts.length > 0) {
      const adjustedSlot = await this.adjustSlotForSchedulingRule(
        slot,
        schedulingRuleConflicts[0].conflictingEntityId!
      );

      if (adjustedSlot) {
        return {
          resolved: true,
          modifiedSlot: adjustedSlot,
          resolutionMethod: 'Adjusted start time for scheduling rule compliance',
        };
      }
    }

    // Try overlapping slot resolution (merge or adjust)
    const overlappingConflicts = resolvableConflicts.filter(
      (c) => c.conflictType === 'OVERLAPPING_SLOTS'
    );

    if (overlappingConflicts.length > 0) {
      // For now, we don't auto-resolve overlapping slots
      // In the future, we could implement slot merging logic
      return { resolved: false };
    }

    return { resolved: false };
  }

  /**
   * Adjust slot timing to comply with scheduling rules
   */
  private async adjustSlotForSchedulingRule(
    slot: any,
    availabilityId: string
  ): Promise<any | null> {
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      select: {
        schedulingRule: true,
        schedulingInterval: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!availability) {
      return null;
    }

    // For now, we'll implement basic adjustment for fixed intervals
    if (availability.schedulingRule === 'FIXED_INTERVAL') {
      // Adjust to nearest 15-minute boundary
      const minutes = slot.startTime.getMinutes();
      const adjustedMinutes = Math.round(minutes / 15) * 15;

      const adjustedStartTime = new Date(slot.startTime);
      adjustedStartTime.setMinutes(adjustedMinutes, 0, 0);

      const adjustedEndTime = new Date(adjustedStartTime.getTime() + slot.duration * 60 * 1000);

      // Ensure adjusted slot is within availability bounds
      if (adjustedStartTime >= availability.startTime && adjustedEndTime <= availability.endTime) {
        return {
          ...slot,
          startTime: adjustedStartTime,
          endTime: adjustedEndTime,
        };
      }
    }

    return null;
  }
}

/**
 * Detect conflicts for a set of slots
 */
export async function detectSlotConflicts(
  slots: any[],
  serviceProviderId: string,
  availabilityId: string,
  options?: ConflictDetectionOptions
): Promise<ConflictResolutionResult> {
  const manager = new ConflictManager(options);
  return await manager.detectAndResolveConflicts(slots, serviceProviderId, availabilityId);
}

/**
 * Get detailed conflict analysis for a time period
 */
export async function analyzeTimeSlotConflicts(
  startTime: Date,
  endTime: Date,
  serviceProviderId: string,
  locationId?: string
): Promise<{
  hasConflicts: boolean;
  conflicts: SlotConflictDetails[];
  suggestions: string[];
}> {
  const manager = new ConflictManager();

  const mockSlot = {
    startTime,
    endTime,
    duration: Math.floor((endTime.getTime() - startTime.getTime()) / (60 * 1000)),
    locationId,
    serviceProviderId,
  };

  const conflicts = await manager.detectSlotConflicts(
    mockSlot,
    serviceProviderId,
    'mock-availability-id'
  );

  const suggestions = conflicts.map((c) => c.suggestedResolution).filter(Boolean) as string[];

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    suggestions,
  };
}
