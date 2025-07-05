import { addMinutes, setMinutes, startOfDay, startOfHour } from 'date-fns';

import { SchedulingRule } from '@/features/calendar/availability/types/enums';
import {
  SchedulingRuleConfig,
  SlotGenerationResult,
} from '@/features/calendar/availability/types/interfaces';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

export interface SchedulingOptions {
  availabilityStart: Date;
  availabilityEnd: Date;
  serviceDuration: number; // in minutes
  schedulingRule: SchedulingRule;
  schedulingInterval?: number; // in minutes, for CUSTOM_INTERVAL
  alignToHour?: boolean; // for FIXED_INTERVAL
  alignToHalfHour?: boolean; // for FIXED_INTERVAL
  alignToQuarterHour?: boolean; // for FIXED_INTERVAL
}

/**
 * Generate time slots based on scheduling rules
 */
export function generateTimeSlots(options: SchedulingOptions): SlotGenerationResult {
  const errors: string[] = [];

  // Validate inputs
  if (options.availabilityEnd <= options.availabilityStart) {
    errors.push('Availability end time must be after start time');
  }

  if (options.serviceDuration <= 0) {
    errors.push('Service duration must be positive');
  }

  if (options.schedulingRule === SchedulingRule.CUSTOM_INTERVAL && !options.schedulingInterval) {
    errors.push('Scheduling interval required for CUSTOM_INTERVAL rule');
  }

  if (errors.length > 0) {
    return { slots: [], totalSlots: 0, errors };
  }

  let slots: TimeSlot[] = [];

  switch (options.schedulingRule) {
    case SchedulingRule.CONTINUOUS:
      slots = generateContinuousSlots(options);
      break;

    case SchedulingRule.FIXED_INTERVAL:
      slots = generateFixedIntervalSlots(options);
      break;

    case SchedulingRule.CUSTOM_INTERVAL:
      slots = generateCustomIntervalSlots(options);
      break;

    default:
      errors.push(`Unsupported scheduling rule: ${options.schedulingRule}`);
  }

  // Filter out any slots that extend beyond availability end time
  slots = slots.filter((slot) => slot.endTime <= options.availabilityEnd);

  return {
    slots,
    totalSlots: slots.length,
    errors,
  };
}

/**
 * Generate continuous slots (appointments start immediately after previous ends)
 */
function generateContinuousSlots(options: SchedulingOptions): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let currentStart = new Date(options.availabilityStart);

  while (currentStart < options.availabilityEnd) {
    const currentEnd = addMinutes(currentStart, options.serviceDuration);

    // Stop if this slot would extend beyond availability
    if (currentEnd > options.availabilityEnd) {
      break;
    }

    slots.push({
      startTime: new Date(currentStart),
      endTime: new Date(currentEnd),
      duration: options.serviceDuration,
    });

    // Next slot starts immediately after this one ends
    currentStart = new Date(currentEnd);
  }

  return slots;
}

/**
 * Generate fixed interval slots (appointments start at regular intervals)
 */
function generateFixedIntervalSlots(options: SchedulingOptions): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Determine the interval based on alignment preferences
  let intervalMinutes: number;

  if (options.alignToQuarterHour) {
    intervalMinutes = 15;
  } else if (options.alignToHalfHour) {
    intervalMinutes = 30;
  } else if (options.alignToHour) {
    intervalMinutes = 60;
  } else {
    // Default to 15-minute intervals if no alignment specified
    intervalMinutes = 15;
  }

  // Find the first aligned start time at or after availability start
  let currentStart = getNextAlignedTime(options.availabilityStart, intervalMinutes);

  // If the aligned time is before availability start, move to next interval
  if (currentStart < options.availabilityStart) {
    currentStart = addMinutes(currentStart, intervalMinutes);
  }

  while (currentStart < options.availabilityEnd) {
    const currentEnd = addMinutes(currentStart, options.serviceDuration);

    // Stop if this slot would extend beyond availability
    if (currentEnd > options.availabilityEnd) {
      break;
    }

    slots.push({
      startTime: new Date(currentStart),
      endTime: new Date(currentEnd),
      duration: options.serviceDuration,
    });

    // Next slot starts at the next aligned interval
    currentStart = addMinutes(currentStart, intervalMinutes);
  }

  return slots;
}

/**
 * Generate custom interval slots (appointments start at provider-defined intervals)
 */
function generateCustomIntervalSlots(options: SchedulingOptions): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const intervalMinutes = options.schedulingInterval!;

  let currentStart = new Date(options.availabilityStart);

  while (currentStart < options.availabilityEnd) {
    const currentEnd = addMinutes(currentStart, options.serviceDuration);

    // Stop if this slot would extend beyond availability
    if (currentEnd > options.availabilityEnd) {
      break;
    }

    slots.push({
      startTime: new Date(currentStart),
      endTime: new Date(currentEnd),
      duration: options.serviceDuration,
    });

    // Next slot starts after the custom interval
    currentStart = addMinutes(currentStart, intervalMinutes);
  }

  return slots;
}

/**
 * Get the next time aligned to the specified interval
 */
function getNextAlignedTime(date: Date, intervalMinutes: number): Date {
  const startOfHourTime = startOfHour(date);
  const minutesFromHour = date.getMinutes();

  // Find the next interval boundary
  const nextIntervalMinutes = Math.ceil(minutesFromHour / intervalMinutes) * intervalMinutes;

  if (nextIntervalMinutes >= 60) {
    // Move to next hour
    return setMinutes(addMinutes(startOfHourTime, 60), nextIntervalMinutes - 60);
  } else {
    return setMinutes(startOfHourTime, nextIntervalMinutes);
  }
}

/**
 * Validate scheduling rule configuration
 */
export function validateSchedulingRuleConfig(config: SchedulingRuleConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate rule type
  if (!Object.values(SchedulingRule).includes(config.rule)) {
    errors.push('Invalid scheduling rule');
  }

  // Rule-specific validation
  switch (config.rule) {
    case SchedulingRule.CUSTOM_INTERVAL:
      if (!config.interval || config.interval <= 0) {
        errors.push('Custom interval must be a positive number');
      }
      if (config.interval && config.interval > 1440) {
        // 24 hours
        errors.push('Custom interval cannot exceed 24 hours (1440 minutes)');
      }
      break;

    case SchedulingRule.FIXED_INTERVAL:
      const hasAlignment =
        config.alignToHour || config.alignToHalfHour || config.alignToQuarterHour;
      if (!hasAlignment) {
        errors.push('Fixed interval rule requires at least one alignment option');
      }

      // Check for conflicting alignments
      const alignmentCount = [
        config.alignToHour,
        config.alignToHalfHour,
        config.alignToQuarterHour,
      ].filter(Boolean).length;

      if (alignmentCount > 1) {
        errors.push('Only one alignment option can be selected for fixed interval rule');
      }
      break;

    case SchedulingRule.CONTINUOUS:
      // No additional validation needed for continuous rule
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate the optimal scheduling interval based on service duration
 */
export function calculateOptimalInterval(
  serviceDuration: number,
  rule: SchedulingRule,
  preferences?: {
    allowOverlap?: boolean;
    bufferTime?: number; // in minutes
  }
): number {
  const bufferTime = preferences?.bufferTime || 0;
  const totalTime = serviceDuration + bufferTime;

  switch (rule) {
    case SchedulingRule.CONTINUOUS:
      return serviceDuration; // No gaps between appointments

    case SchedulingRule.FIXED_INTERVAL:
      // Round up to nearest 15, 30, or 60 minute interval
      if (totalTime <= 15) return 15;
      if (totalTime <= 30) return 30;
      if (totalTime <= 60) return 60;
      return Math.ceil(totalTime / 60) * 60; // Round up to next hour

    case SchedulingRule.CUSTOM_INTERVAL:
      // For custom intervals, use the service duration + buffer as base
      return Math.max(totalTime, 5); // Minimum 5-minute interval

    default:
      return serviceDuration;
  }
}

/**
 * Check if a time slot conflicts with scheduling rules
 */
export function isSlotValidForSchedulingRule(
  slotStart: Date,
  slotDuration: number,
  rule: SchedulingRule,
  ruleConfig?: {
    interval?: number;
    alignToHour?: boolean;
    alignToHalfHour?: boolean;
    alignToQuarterHour?: boolean;
  }
): boolean {
  const minutes = slotStart.getMinutes();

  switch (rule) {
    case SchedulingRule.CONTINUOUS:
      // Any start time is valid for continuous scheduling
      return true;

    case SchedulingRule.FIXED_INTERVAL:
      // Check if start time aligns with fixed intervals
      if (ruleConfig?.alignToQuarterHour) {
        return minutes % 15 === 0;
      }
      if (ruleConfig?.alignToHalfHour) {
        return minutes % 30 === 0;
      }
      if (ruleConfig?.alignToHour) {
        return minutes === 0;
      }
      // Default to quarter-hour alignment
      return minutes % 15 === 0;

    case SchedulingRule.CUSTOM_INTERVAL:
      // For custom intervals, we need to check against a base time
      // This would typically be validated in the context of the availability period
      return true;

    default:
      return false;
  }
}

/**
 * Get the next valid slot start time based on scheduling rules
 */
export function getNextValidSlotTime(
  fromTime: Date,
  rule: SchedulingRule,
  ruleConfig?: {
    interval?: number;
    alignToHour?: boolean;
    alignToHalfHour?: boolean;
    alignToQuarterHour?: boolean;
  }
): Date {
  switch (rule) {
    case SchedulingRule.CONTINUOUS:
      // For continuous scheduling, any time is valid
      return new Date(fromTime);

    case SchedulingRule.FIXED_INTERVAL:
      let intervalMinutes = 15; // Default
      if (ruleConfig?.alignToQuarterHour) intervalMinutes = 15;
      if (ruleConfig?.alignToHalfHour) intervalMinutes = 30;
      if (ruleConfig?.alignToHour) intervalMinutes = 60;

      return getNextAlignedTime(fromTime, intervalMinutes);

    case SchedulingRule.CUSTOM_INTERVAL:
      if (ruleConfig?.interval) {
        // Find next time that aligns with custom interval from start of day
        const startOfDayTime = startOfDay(fromTime);
        const minutesFromStart = Math.floor(
          (fromTime.getTime() - startOfDayTime.getTime()) / (60 * 1000)
        );
        const nextInterval =
          Math.ceil(minutesFromStart / ruleConfig.interval) * ruleConfig.interval;
        return addMinutes(startOfDayTime, nextInterval);
      }
      return new Date(fromTime);

    default:
      return new Date(fromTime);
  }
}

/**
 * Calculate schedule efficiency metrics
 */
export function calculateScheduleEfficiency(
  availabilityDuration: number, // in minutes
  serviceDuration: number, // in minutes
  rule: SchedulingRule,
  ruleConfig?: {
    interval?: number;
    alignToHour?: boolean;
    alignToHalfHour?: boolean;
    alignToQuarterHour?: boolean;
  }
): {
  maxPossibleSlots: number;
  actualSlots: number;
  utilizationRate: number; // 0-1
  averageGapTime: number; // in minutes
} {
  // Calculate theoretical maximum (continuous scheduling)
  const maxPossibleSlots = Math.floor(availabilityDuration / serviceDuration);

  // Calculate actual slots based on scheduling rule
  let actualSlots: number;
  let averageGapTime: number;

  switch (rule) {
    case SchedulingRule.CONTINUOUS:
      actualSlots = maxPossibleSlots;
      averageGapTime = 0;
      break;

    case SchedulingRule.FIXED_INTERVAL:
      let intervalMinutes = 15;
      if (ruleConfig?.alignToHour) intervalMinutes = 60;
      else if (ruleConfig?.alignToHalfHour) intervalMinutes = 30;
      else if (ruleConfig?.alignToQuarterHour) intervalMinutes = 15;

      actualSlots = Math.floor(availabilityDuration / intervalMinutes);
      averageGapTime = Math.max(0, intervalMinutes - serviceDuration);
      break;

    case SchedulingRule.CUSTOM_INTERVAL:
      const customInterval = ruleConfig?.interval || serviceDuration;
      actualSlots = Math.floor(availabilityDuration / customInterval);
      averageGapTime = Math.max(0, customInterval - serviceDuration);
      break;

    default:
      actualSlots = maxPossibleSlots;
      averageGapTime = 0;
  }

  const utilizationRate = actualSlots / maxPossibleSlots;

  return {
    maxPossibleSlots,
    actualSlots,
    utilizationRate,
    averageGapTime,
  };
}
