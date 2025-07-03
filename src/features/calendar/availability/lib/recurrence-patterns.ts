import { addDays, addWeeks, addMonths, startOfDay, isBefore, isAfter } from 'date-fns';
import { RecurrencePattern, RecurrenceType, DayOfWeek } from '../types';

export interface RecurrenceOccurrence {
  startTime: Date;
  endTime: Date;
  occurrenceNumber: number;
  isException?: boolean;
}

export interface GenerateRecurrenceOptions {
  pattern: RecurrencePattern;
  baseStartTime: Date;
  baseEndTime: Date;
  maxOccurrences?: number;
  endDate?: Date;
}

/**
 * Generate recurring availability occurrences based on recurrence pattern
 */
export function generateRecurrenceOccurrences({
  pattern,
  baseStartTime,
  baseEndTime,
  maxOccurrences = 100,
  endDate,
}: GenerateRecurrenceOptions): RecurrenceOccurrence[] {
  const occurrences: RecurrenceOccurrence[] = [];
  const duration = baseEndTime.getTime() - baseStartTime.getTime();
  
  // Use pattern end date if no explicit end date provided
  const finalEndDate = endDate || (pattern.endDate ? new Date(pattern.endDate) : null);
  
  // Use pattern count if no max occurrences specified
  const maxCount = pattern.count || maxOccurrences;
  
  let currentDate = new Date(baseStartTime);
  let occurrenceNumber = 0;
  
  while (occurrences.length < maxCount) {
    // Check if we've exceeded the end date
    if (finalEndDate && isAfter(currentDate, finalEndDate)) {
      break;
    }
    
    const occurrence = generateOccurrenceForDate(
      currentDate,
      duration,
      pattern,
      occurrenceNumber
    );
    
    if (occurrence) {
      occurrences.push(occurrence);
    }
    
    // Move to next date based on recurrence type
    const nextDate = getNextRecurrenceDate(currentDate, pattern);
    if (!nextDate || nextDate.getTime() === currentDate.getTime()) {
      // Prevent infinite loop
      break;
    }
    
    currentDate = nextDate;
    occurrenceNumber++;
  }
  
  return occurrences;
}

/**
 * Generate a single occurrence for a specific date
 */
function generateOccurrenceForDate(
  date: Date,
  duration: number,
  pattern: RecurrencePattern,
  occurrenceNumber: number
): RecurrenceOccurrence | null {
  // Check if this date is in the exceptions list
  const dateString = formatDateForComparison(date);
  const isException = pattern.exceptions?.includes(dateString) || false;
  
  // For weekly patterns, check if this day of week is included
  if (pattern.type === RecurrenceType.WEEKLY && pattern.daysOfWeek) {
    const dayOfWeek = date.getDay() as DayOfWeek;
    if (!pattern.daysOfWeek.includes(dayOfWeek)) {
      return null;
    }
  }
  
  // For monthly patterns, validate day of month or week of month
  if (pattern.type === RecurrenceType.MONTHLY) {
    if (pattern.dayOfMonth && date.getDate() !== pattern.dayOfMonth) {
      return null;
    }
    
    if (pattern.weekOfMonth) {
      const weekOfMonth = getWeekOfMonth(date);
      if (weekOfMonth !== pattern.weekOfMonth) {
        return null;
      }
    }
  }
  
  // Apply time overrides if specified in pattern
  let startTime = new Date(date);
  if (pattern.startTime) {
    const [hours, minutes] = pattern.startTime.split(':').map(Number);
    startTime.setHours(hours, minutes, 0, 0);
  }
  
  const endTime = new Date(startTime.getTime() + duration);
  if (pattern.endTime) {
    const [hours, minutes] = pattern.endTime.split(':').map(Number);
    endTime.setHours(hours, minutes, 0, 0);
  }
  
  return {
    startTime,
    endTime,
    occurrenceNumber,
    isException,
  };
}

/**
 * Get the next recurrence date based on pattern type and interval
 */
function getNextRecurrenceDate(currentDate: Date, pattern: RecurrencePattern): Date | null {
  const interval = pattern.interval || 1;
  
  switch (pattern.type) {
    case RecurrenceType.DAILY:
      return addDays(currentDate, interval);
      
    case RecurrenceType.WEEKLY:
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        return getNextWeeklyOccurrence(currentDate, pattern.daysOfWeek, interval);
      }
      return addWeeks(currentDate, interval);
      
    case RecurrenceType.MONTHLY:
      return addMonths(currentDate, interval);
      
    case RecurrenceType.CUSTOM:
      // For custom patterns, use daily interval as default
      return addDays(currentDate, interval);
      
    case RecurrenceType.NONE:
    default:
      return null;
  }
}

/**
 * Get the next weekly occurrence based on days of week
 */
function getNextWeeklyOccurrence(
  currentDate: Date,
  daysOfWeek: DayOfWeek[],
  weekInterval: number
): Date {
  const currentDayOfWeek = currentDate.getDay() as DayOfWeek;
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
  
  // Find the next day of week in the current week
  const nextDayInWeek = sortedDays.find(day => day > currentDayOfWeek);
  
  if (nextDayInWeek !== undefined) {
    // Next occurrence is in the same week
    const daysToAdd = nextDayInWeek - currentDayOfWeek;
    return addDays(currentDate, daysToAdd);
  } else {
    // Next occurrence is in the next interval week
    const daysToNextWeek = (7 * weekInterval) - currentDayOfWeek + sortedDays[0];
    return addDays(currentDate, daysToNextWeek);
  }
}

/**
 * Get the week of month for a date (1-4, or -1 for last week)
 */
function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const dayOfMonth = date.getDate();
  
  // Check if this is the last week of the month
  const daysFromEnd = lastDayOfMonth.getDate() - dayOfMonth;
  if (daysFromEnd < 7) {
    return -1; // Last week
  }
  
  // Calculate week number from beginning of month
  const firstWeekDay = firstDayOfMonth.getDay();
  const adjustedDay = dayOfMonth + firstWeekDay - 1;
  return Math.ceil(adjustedDay / 7);
}

/**
 * Format date for string comparison (YYYY-MM-DD)
 */
function formatDateForComparison(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Validate recurrence pattern
 */
export function validateRecurrencePattern(pattern: RecurrencePattern): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Basic validation
  if (!Object.values(RecurrenceType).includes(pattern.type)) {
    errors.push('Invalid recurrence type');
  }
  
  if (pattern.interval !== undefined && pattern.interval < 1) {
    errors.push('Interval must be at least 1');
  }
  
  // Type-specific validation
  switch (pattern.type) {
    case RecurrenceType.WEEKLY:
      if (pattern.daysOfWeek && pattern.daysOfWeek.length === 0) {
        errors.push('At least one day of week must be specified for weekly recurrence');
      }
      break;
      
    case RecurrenceType.MONTHLY:
      if (pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
        errors.push('Day of month must be between 1 and 31');
      }
      if (pattern.weekOfMonth && (pattern.weekOfMonth < -1 || pattern.weekOfMonth === 0 || pattern.weekOfMonth > 4)) {
        errors.push('Week of month must be 1-4 or -1 for last week');
      }
      break;
  }
  
  // Time validation
  if (pattern.startTime && !isValidTimeString(pattern.startTime)) {
    errors.push('Invalid start time format (use HH:MM)');
  }
  
  if (pattern.endTime && !isValidTimeString(pattern.endTime)) {
    errors.push('Invalid end time format (use HH:MM)');
  }
  
  if (pattern.startTime && pattern.endTime) {
    const startMinutes = timeStringToMinutes(pattern.startTime);
    const endMinutes = timeStringToMinutes(pattern.endTime);
    if (endMinutes <= startMinutes) {
      errors.push('End time must be after start time');
    }
  }
  
  // Date validation
  if (pattern.endDate && !isValidDateString(pattern.endDate)) {
    errors.push('Invalid end date format (use YYYY-MM-DD)');
  }
  
  if (pattern.count && pattern.count < 1) {
    errors.push('Count must be at least 1');
  }
  
  // Exception dates validation
  if (pattern.exceptions) {
    for (const exception of pattern.exceptions) {
      if (!isValidDateString(exception)) {
        errors.push(`Invalid exception date format: ${exception} (use YYYY-MM-DD)`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if time string is in valid HH:MM format
 */
function isValidTimeString(timeString: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * Check if date string is in valid YYYY-MM-DD format
 */
function isValidDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date.toISOString().split('T')[0] === dateString;
}

/**
 * Convert time string to minutes since midnight
 */
function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if a date falls within the recurrence pattern
 */
export function isDateInRecurrencePattern(
  date: Date,
  pattern: RecurrencePattern,
  baseDate: Date
): boolean {
  const dateString = formatDateForComparison(date);
  
  // Check if date is in exceptions
  if (pattern.exceptions?.includes(dateString)) {
    return false;
  }
  
  // Check if date is before base date
  if (isBefore(date, startOfDay(baseDate))) {
    return false;
  }
  
  // Check end date
  if (pattern.endDate && isAfter(date, new Date(pattern.endDate))) {
    return false;
  }
  
  const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
  const interval = pattern.interval || 1;
  
  switch (pattern.type) {
    case RecurrenceType.DAILY:
      return daysDiff >= 0 && daysDiff % interval === 0;
      
    case RecurrenceType.WEEKLY:
      const weeksDiff = Math.floor(daysDiff / 7);
      const dayOfWeek = date.getDay() as DayOfWeek;
      const isCorrectWeek = weeksDiff % interval === 0;
      const isCorrectDay = pattern.daysOfWeek?.includes(dayOfWeek) ?? true;
      return isCorrectWeek && isCorrectDay;
      
    case RecurrenceType.MONTHLY:
      const monthsDiff = (date.getFullYear() - baseDate.getFullYear()) * 12 + 
                        (date.getMonth() - baseDate.getMonth());
      const isCorrectMonth = monthsDiff >= 0 && monthsDiff % interval === 0;
      
      if (pattern.dayOfMonth) {
        return isCorrectMonth && date.getDate() === pattern.dayOfMonth;
      }
      
      if (pattern.weekOfMonth) {
        const weekOfMonth = getWeekOfMonth(date);
        return isCorrectMonth && weekOfMonth === pattern.weekOfMonth;
      }
      
      return isCorrectMonth && date.getDate() === baseDate.getDate();
      
    case RecurrenceType.CUSTOM:
      return daysDiff >= 0 && daysDiff % interval === 0;
      
    case RecurrenceType.NONE:
    default:
      return false;
  }
}

/**
 * Get the next occurrence date from a given date
 */
export function getNextOccurrenceDate(
  fromDate: Date,
  pattern: RecurrencePattern,
  baseDate: Date
): Date | null {
  if (pattern.type === RecurrenceType.NONE) {
    return null;
  }
  
  let currentDate = new Date(fromDate);
  const maxIterations = 1000; // Prevent infinite loops
  let iterations = 0;
  
  while (iterations < maxIterations) {
    currentDate = getNextRecurrenceDate(currentDate, pattern) || currentDate;
    
    if (isDateInRecurrencePattern(currentDate, pattern, baseDate)) {
      // Check if we haven't exceeded limits
      if (pattern.endDate && isAfter(currentDate, new Date(pattern.endDate))) {
        return null;
      }
      
      return currentDate;
    }
    
    iterations++;
  }
  
  return null;
}