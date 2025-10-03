import { cloneDate, parseUTC } from '@/lib/timezone';

import { DayOfWeek, DayOfWeekOption, RecurrenceOption, RecurrencePattern } from '../types/types';

/**
 * Day of week options for UI display
 */
export const dayOfWeekOptions: DayOfWeekOption[] = [
  { value: DayOfWeek.MONDAY, label: 'Monday', shortLabel: 'M' },
  { value: DayOfWeek.TUESDAY, label: 'Tuesday', shortLabel: 'T' },
  { value: DayOfWeek.WEDNESDAY, label: 'Wednesday', shortLabel: 'W' },
  { value: DayOfWeek.THURSDAY, label: 'Thursday', shortLabel: 'T' },
  { value: DayOfWeek.FRIDAY, label: 'Friday', shortLabel: 'F' },
  { value: DayOfWeek.SATURDAY, label: 'Saturday', shortLabel: 'S' },
  { value: DayOfWeek.SUNDAY, label: 'Sunday', shortLabel: 'S' },
];

/**
 * Get day of week from a Date object
 */
export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  return date.getDay() as DayOfWeek;
}

/**
 * Get day name from DayOfWeek enum
 */
export function getDayName(dayOfWeek: DayOfWeek): string {
  const option = dayOfWeekOptions.find((opt) => opt.value === dayOfWeek);
  return option?.label || 'Unknown';
}

/**
 * Get short day name from DayOfWeek enum
 */
export function getShortDayName(dayOfWeek: DayOfWeek): string {
  const option = dayOfWeekOptions.find((opt) => opt.value === dayOfWeek);
  return option?.shortLabel || 'U';
}

/**
 * Generate recurrence options for the dropdown
 */
export function getRecurrenceOptions(
  startDate: Date
): Array<{ value: RecurrenceOption; label: string }> {
  const dayOfWeek = getDayOfWeekFromDate(startDate);
  const dayName = getDayName(dayOfWeek);

  return [
    { value: RecurrenceOption.NONE, label: 'Does not repeat' },
    { value: RecurrenceOption.DAILY, label: 'Daily' },
    { value: RecurrenceOption.WEEKLY, label: `Weekly on ${dayName}` },
    { value: RecurrenceOption.CUSTOM, label: 'Custom...' },
  ];
}

/**
 * Create a recurrence pattern based on the selected option
 */
export function createRecurrencePattern(
  option: RecurrenceOption,
  startDate: Date,
  customDays?: DayOfWeek[],
  endDate?: string
): RecurrencePattern {
  const pattern: RecurrencePattern = {
    option,
  };

  // For all recurrence options except NONE, we need an end date
  if (option !== RecurrenceOption.NONE) {
    if (!endDate) {
      // Default to 4 weeks from start date if no end date provided
      const defaultEndDate = cloneDate(startDate);
      defaultEndDate.setDate(defaultEndDate.getDate() + 28);
      pattern.endDate = formatDateForInput(defaultEndDate);
    } else {
      pattern.endDate = endDate;
    }
  }

  switch (option) {
    case RecurrenceOption.WEEKLY:
      pattern.weeklyDay = getDayOfWeekFromDate(startDate);
      break;
    case RecurrenceOption.CUSTOM:
      pattern.customDays = customDays || [];
      break;
    default:
      // For NONE and DAILY, no additional fields needed beyond endDate
      break;
  }

  return pattern;
}

/**
 * Convert recurrence pattern to description text
 */
export function getRecurrenceDescription(pattern: RecurrencePattern): string {
  const endDateText = pattern.endDate
    ? ` until ${formatDateForDisplay(parseDateFromInput(pattern.endDate))}`
    : '';

  switch (pattern.option) {
    case RecurrenceOption.NONE:
      return 'Does not repeat';
    case RecurrenceOption.DAILY:
      return `Daily${endDateText}`;
    case RecurrenceOption.WEEKLY:
      if (pattern.weeklyDay !== undefined) {
        return `Weekly on ${getDayName(pattern.weeklyDay)}${endDateText}`;
      }
      return `Weekly${endDateText}`;
    case RecurrenceOption.CUSTOM:
      if (pattern.customDays && pattern.customDays.length > 0) {
        const dayNames = pattern.customDays
          .sort((a, b) => a - b)
          .map((day) => getShortDayName(day))
          .join(', ');
        return `Weekly on ${dayNames}${endDateText}`;
      }
      return `Custom weekly${endDateText}`;
    default:
      return 'Unknown';
  }
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date for form input (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse date from input string (YYYY-MM-DD)
 */
export function parseDateFromInput(dateString: string): Date {
  return parseUTC(`${dateString}T00:00:00`);
}

/**
 * Check if a recurrence pattern is valid
 */
export function isValidRecurrencePattern(pattern: RecurrencePattern): boolean {
  switch (pattern.option) {
    case RecurrenceOption.NONE:
    case RecurrenceOption.DAILY:
      return true;
    case RecurrenceOption.WEEKLY:
      return pattern.weeklyDay !== undefined;
    case RecurrenceOption.CUSTOM:
      return pattern.customDays !== undefined && pattern.customDays.length > 0;
    default:
      return false;
  }
}

/**
 * Generate recurring instances from a recurrence pattern
 */
export function generateRecurringInstances(
  pattern: RecurrencePattern,
  startTime: Date,
  endTime: Date,
  maxInstances: number = 365
): Array<{ startTime: Date; endTime: Date }> {
  const instances: Array<{ startTime: Date; endTime: Date }> = [];

  // Always include the original instance
  instances.push({ startTime, endTime });

  // If no recurrence, return just the original instance
  if (pattern.option === RecurrenceOption.NONE) {
    return instances;
  }

  // Calculate the duration between start and end
  const duration = endTime.getTime() - startTime.getTime();

  // Parse end date if provided
  let endDate: Date | null = null;
  if (pattern.endDate) {
    endDate = parseDateFromInput(pattern.endDate);
    // Set end date to end of day to include the full day
    endDate.setHours(23, 59, 59, 999);
  }

  let currentDate = cloneDate(startTime);
  let instanceCount = 1; // Start with 1 since we already have the original

  while (instanceCount < maxInstances) {
    let nextDate: Date | null = null;

    switch (pattern.option) {
      case RecurrenceOption.DAILY:
        nextDate = cloneDate(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        break;

      case RecurrenceOption.WEEKLY:
        nextDate = cloneDate(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
        break;

      case RecurrenceOption.CUSTOM:
        if (pattern.customDays && pattern.customDays.length > 0) {
          nextDate = getNextCustomDay(currentDate, pattern.customDays);
        }
        break;
    }

    if (!nextDate) break;

    // Check if we've exceeded the end date
    if (endDate && nextDate > endDate) {
      break;
    }

    // Create the new instance with the same time but different date
    const nextStartTime = cloneDate(nextDate);
    nextStartTime.setHours(
      startTime.getHours(),
      startTime.getMinutes(),
      startTime.getSeconds(),
      startTime.getMilliseconds()
    );

    const nextEndTime = cloneDate(nextStartTime);
    nextEndTime.setTime(nextEndTime.getTime() + duration);

    instances.push({ startTime: nextStartTime, endTime: nextEndTime });

    currentDate = nextDate;
    instanceCount++;
  }

  return instances;
}

/**
 * Get the next occurrence for custom weekly recurrence
 */
function getNextCustomDay(currentDate: Date, customDays: DayOfWeek[]): Date | null {
  const sortedDays = [...customDays].sort((a, b) => a - b);
  const currentDayOfWeek = currentDate.getDay();

  // Find the next day in the current week
  const nextDayThisWeek = sortedDays.find((day) => day > currentDayOfWeek);

  if (nextDayThisWeek !== undefined) {
    // Next occurrence is later this week
    const nextDate = cloneDate(currentDate);
    const daysToAdd = nextDayThisWeek - currentDayOfWeek;
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  } else {
    // Next occurrence is in the following week (first day of customDays)
    const nextDate = cloneDate(currentDate);
    const daysToAdd = 7 - currentDayOfWeek + sortedDays[0];
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  }
}

/**
 * Calculate total availability hours for a specific day
 */
export function calculateDayAvailabilityHours(
  events: Array<{ startTime: Date; endTime: Date; status?: string }>,
  targetDate: Date
): { totalHours: number; statusBreakdown: Record<string, number> } {
  const dayEvents = events.filter(
    (event) => event.startTime.toDateString() === targetDate.toDateString()
  );

  if (dayEvents.length === 0) {
    return { totalHours: 0, statusBreakdown: {} };
  }

  // Sort events by start time
  dayEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Merge overlapping events and calculate total hours
  const mergedEvents: Array<{ startTime: Date; endTime: Date; status?: string }> = [];
  const statusBreakdown: Record<string, number> = {};

  for (const event of dayEvents) {
    const lastMerged = mergedEvents[mergedEvents.length - 1];

    if (lastMerged && event.startTime <= lastMerged.endTime) {
      // Overlapping events - extend the end time if needed
      if (event.endTime > lastMerged.endTime) {
        lastMerged.endTime = event.endTime;
      }
    } else {
      // Non-overlapping event - add it to the merged list
      mergedEvents.push({ ...event });
    }

    // Track status breakdown (before merging)
    const status = event.status || 'unknown';
    const eventHours = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
    statusBreakdown[status] = (statusBreakdown[status] || 0) + eventHours;
  }

  // Calculate total hours from merged events
  const totalHours = mergedEvents.reduce((total, event) => {
    const hours = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  return { totalHours, statusBreakdown };
}

/**
 * Get status-based styling for day summary
 */
export function getDayStatusStyle(statusBreakdown: Record<string, number>): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
} {
  const statuses = Object.keys(statusBreakdown);

  if (statuses.length === 0) {
    return {
      backgroundColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-300',
    };
  }

  // If all events have the same status, use that status color
  if (statuses.length === 1) {
    const status = statuses[0];
    switch (status) {
      case 'PENDING':
        return {
          backgroundColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
        };
      case 'ACCEPTED':
        return {
          backgroundColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
        };
      case 'CANCELLED':
        return {
          backgroundColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-300',
        };
      case 'REJECTED':
        return {
          backgroundColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
        };
      default:
        return {
          backgroundColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
        };
    }
  }

  // Mixed statuses - use a neutral color
  return {
    backgroundColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
  };
}
