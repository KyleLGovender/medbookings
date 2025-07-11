import { DayOfWeek, DayOfWeekOption, RecurrenceOption, SimpleRecurrencePattern } from '../types/types';

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
  const option = dayOfWeekOptions.find(opt => opt.value === dayOfWeek);
  return option?.label || 'Unknown';
}

/**
 * Get short day name from DayOfWeek enum
 */
export function getShortDayName(dayOfWeek: DayOfWeek): string {
  const option = dayOfWeekOptions.find(opt => opt.value === dayOfWeek);
  return option?.shortLabel || 'U';
}

/**
 * Generate recurrence options for the dropdown
 */
export function getRecurrenceOptions(startDate: Date): Array<{ value: RecurrenceOption; label: string }> {
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
 * Create a simple recurrence pattern based on the selected option
 */
export function createSimpleRecurrencePattern(
  option: RecurrenceOption, 
  startDate: Date, 
  customDays?: DayOfWeek[],
  endDate?: string
): SimpleRecurrencePattern {
  const pattern: SimpleRecurrencePattern = {
    option,
  };

  // For all recurrence options except NONE, we need an end date
  if (option !== RecurrenceOption.NONE) {
    if (!endDate) {
      // Default to 4 weeks from start date if no end date provided
      const defaultEndDate = new Date(startDate);
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
 * Convert simple recurrence pattern to description text
 */
export function getRecurrenceDescription(pattern: SimpleRecurrencePattern): string {
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
          .map(day => getShortDayName(day))
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
  return new Date(dateString + 'T00:00:00');
}

/**
 * Check if a recurrence pattern is valid
 */
export function isValidRecurrencePattern(pattern: SimpleRecurrencePattern): boolean {
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
