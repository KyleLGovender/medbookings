import { SchedulingRule } from '@prisma/client';
import { addMinutes, setMinutes, startOfDay, startOfHour } from 'date-fns';

import {
  SchedulingOptions,
  SchedulingRuleConfig,
  TimeSlot,
  TimeSlotGenerationResult,
} from '@/features/calendar/types/types';

/**
 * Generate time slots based on scheduling rules
 */
export function generateTimeSlots(options: SchedulingOptions): TimeSlotGenerationResult {
  const errors: string[] = [];

  // Validate inputs
  if (options.availabilityEnd <= options.availabilityStart) {
    errors.push('Availability end time must be after start time');
  }

  if (options.serviceDuration <= 0) {
    errors.push('Service duration must be positive');
  }

  // Note: schedulingInterval is only used for backward compatibility and custom logic

  if (errors.length > 0) {
    return { slots: [], totalSlots: 0, errors };
  }

  let slots: TimeSlot[] = [];

  switch (options.schedulingRule) {
    case SchedulingRule.CONTINUOUS:
      slots = generateContinuousSlots(options);
      break;

    case SchedulingRule.ON_THE_HOUR:
      slots = generateOnTheHourSlots(options);
      break;

    case SchedulingRule.ON_THE_HALF_HOUR:
      slots = generateOnTheHalfHourSlots(options);
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
  // Round start time to clean minutes (zero seconds and milliseconds)
  let currentStart = new Date(options.availabilityStart);
  currentStart.setSeconds(0, 0);

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
 * Generate on-the-hour slots (appointments start only on the hour)
 */
function generateOnTheHourSlots(options: SchedulingOptions): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // For on-the-hour scheduling, appointments start only at the top of each hour
  const intervalMinutes = 60;

  // Round availability start to clean minutes first
  const cleanStart = new Date(options.availabilityStart);
  cleanStart.setSeconds(0, 0);
  
  // Find the first hour start time at or after availability start
  let currentStart = getNextAlignedTime(cleanStart, intervalMinutes);

  // If the aligned time is before availability start, move to next hour
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
 * Generate on-the-half-hour slots (appointments start only on the hour or half-hour)
 */
function generateOnTheHalfHourSlots(options: SchedulingOptions): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // For on-the-half-hour scheduling, appointments start at :00 or :30 minutes
  const intervalMinutes = 30;

  // Round availability start to clean minutes first
  const cleanStart = new Date(options.availabilityStart);
  cleanStart.setSeconds(0, 0);
  
  // Find the first half-hour start time at or after availability start
  let currentStart = getNextAlignedTime(cleanStart, intervalMinutes);

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

    // Next slot starts after 30 minutes
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
    case SchedulingRule.ON_THE_HALF_HOUR:
      // Interval validation would go here if the property existed
      break;

    case SchedulingRule.ON_THE_HOUR:
      // Alignment validation would go here if the properties existed

      // Alignment conflict validation would go here if the properties existed
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

    case SchedulingRule.ON_THE_HOUR:
      // Round up to nearest 15, 30, or 60 minute interval
      if (totalTime <= 15) return 15;
      if (totalTime <= 30) return 30;
      if (totalTime <= 60) return 60;
      return Math.ceil(totalTime / 60) * 60; // Round up to next hour

    case SchedulingRule.ON_THE_HALF_HOUR:
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

    case SchedulingRule.ON_THE_HOUR:
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

    case SchedulingRule.ON_THE_HALF_HOUR:
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

    case SchedulingRule.ON_THE_HOUR:
      let intervalMinutes = 15; // Default
      if (ruleConfig?.alignToQuarterHour) intervalMinutes = 15;
      if (ruleConfig?.alignToHalfHour) intervalMinutes = 30;
      if (ruleConfig?.alignToHour) intervalMinutes = 60;

      return getNextAlignedTime(fromTime, intervalMinutes);

    case SchedulingRule.ON_THE_HALF_HOUR:
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

    case SchedulingRule.ON_THE_HOUR:
      let intervalMinutes = 15;
      if (ruleConfig?.alignToHour) intervalMinutes = 60;
      else if (ruleConfig?.alignToHalfHour) intervalMinutes = 30;
      else if (ruleConfig?.alignToQuarterHour) intervalMinutes = 15;

      actualSlots = Math.floor(availabilityDuration / intervalMinutes);
      averageGapTime = Math.max(0, intervalMinutes - serviceDuration);
      break;

    case SchedulingRule.ON_THE_HALF_HOUR:
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
