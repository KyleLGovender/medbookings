/**
 * @fileoverview Shared utility functions for calendar components
 *
 * This module contains reusable utility functions for:
 * - Event positioning and layout calculations
 * - Event styling and visual appearance
 * - Time calculations and date manipulations
 * - Calendar grid calculations
 *
 * These utilities are used across all calendar view components to ensure
 * consistent behavior and reduce code duplication.
 *
 * @author MedBookings Development Team
 */
import { AvailabilityStatus } from '@prisma/client';

import type { RouterOutputs } from '@/utils/api';

// Extract proper types from tRPC
type AvailabilityData = RouterOutputs['calendar']['searchAvailability'][number];
type SlotData = RouterOutputs['calendar']['getProviderSlots'][number];

// =============================================================================
// EVENT STYLING UTILITIES
// =============================================================================

/**
 * Calculates the appropriate CSS classes for styling a calendar event
 * based on its type, status, and properties.
 *
 * @param event - The calendar event to style
 * @returns CSS class string for styling the event
 */
export function getEventStyle(event: AvailabilityData): string {
  // Base style for recurring events with left border indicator
  const recurringBorder = event.isRecurring ? 'border-l-4 border-l-blue-600' : '';

  // Provider-created availabilities (green tones)
  if (event.isProviderCreated) {
    switch (event.status) {
      case AvailabilityStatus.ACCEPTED:
        return `bg-green-100 border-green-400 text-green-800 ${recurringBorder}`;
      default:
        return `bg-green-100 border-green-400 text-green-800 ${recurringBorder}`;
    }
  }
  // Organization-created availabilities (blue/yellow tones)
  else {
    switch (event.status) {
      case AvailabilityStatus.PENDING:
        return `bg-yellow-100 border-yellow-400 text-yellow-800 ${recurringBorder}`;
      case AvailabilityStatus.ACCEPTED:
        return `bg-blue-100 border-blue-400 text-blue-800 ${recurringBorder}`;
      case AvailabilityStatus.REJECTED:
        return `bg-red-100 border-red-400 text-red-800 ${recurringBorder}`;
      default:
        return `bg-blue-100 border-blue-400 text-blue-800 ${recurringBorder}`;
    }
  }
}

// =============================================================================
// EVENT POSITIONING UTILITIES
// =============================================================================

/**
 * Interface for event position calculations
 */
export interface EventPosition {
  gridRow: string;
  gridColumn?: string;
  height?: string;
}

/**
 * Interface for time range configuration
 */
export interface TimeRange {
  start: number; // Start hour (24-hour format)
  end: number; // End hour (24-hour format)
}

/**
 * Calculates the grid position for an event in a time-based calendar view
 *
 * @param event - The calendar event to position
 * @param timeRange - The visible time range for the calendar
 * @returns Grid positioning information for CSS Grid
 */
export function calculateEventPosition(
  event: AvailabilityData,
  timeRange: TimeRange
): EventPosition {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  const startHour = startTime.getHours() - timeRange.start;
  const endHour = endTime.getHours() - timeRange.start;

  // Calculate grid row position (add 1 because CSS Grid is 1-indexed)
  const gridRowStart = Math.max(1, startHour + 1);
  const gridRowEnd = Math.min(timeRange.end - timeRange.start + 1, endHour + 1);

  return {
    gridRow: `${gridRowStart} / ${gridRowEnd}`,
  };
}

/**
 * Calculates the grid position for an event in a multi-day calendar view
 *
 * @param event - The calendar event to position
 * @param timeRange - The visible time range for the calendar
 * @param dayIndex - The day index (0-based) for multi-day views
 * @returns Grid positioning information for CSS Grid with column positioning
 */
export function calculateEventGridPosition(
  event: AvailabilityData,
  timeRange: TimeRange,
  dayIndex: number
): EventPosition {
  const basePosition = calculateEventPosition(event, timeRange);

  return {
    ...basePosition,
    gridColumn: `${dayIndex + 1}`,
  };
}

// =============================================================================
// TIME CALCULATION UTILITIES
// =============================================================================

/**
 * Gets the working time range for a calendar view
 *
 * @param workingHours - Working hours configuration
 * @returns TimeRange object with start and end hours
 */
export function getWorkingTimeRange(workingHours: { start: string; end: string }): TimeRange {
  const startHour = parseInt(workingHours.start.split(':')[0], 10);
  const endHour = parseInt(workingHours.end.split(':')[0], 10);

  return {
    start: startHour,
    end: endHour,
  };
}

/**
 * Filters events to only include those within the working hours range
 *
 * @param events - Array of calendar events to filter
 * @param timeRange - The time range to filter by
 * @returns Filtered array of events within the time range
 */
export function getEventsInTimeRange(
  events: AvailabilityData[],
  timeRange: TimeRange
): AvailabilityData[] {
  return events.filter((event) => {
    const startHour = new Date(event.startTime).getHours();
    const endHour = new Date(event.endTime).getHours();

    // Event overlaps with time range if:
    // - Event starts before range ends AND
    // - Event ends after range starts
    return startHour < timeRange.end && endHour > timeRange.start;
  });
}

/**
 * Checks if an event is happening during a specific hour
 *
 * @param event - The calendar event to check
 * @param hour - The hour to check (24-hour format)
 * @returns True if the event is active during the specified hour
 */
export function isEventActiveAtHour(event: AvailabilityData, hour: number): boolean {
  const eventDate = new Date(event.startTime);
  const eventEndTime = new Date(event.endTime);

  return eventDate.getHours() <= hour && eventEndTime.getHours() > hour;
}

// =============================================================================
// DATE MANIPULATION UTILITIES
// =============================================================================

/**
 * Sets a date to the start of the day (00:00:00.000)
 *
 * @param date - The date to modify
 * @returns New date set to start of day
 */
export function setToStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Sets a date to the end of the day (23:59:59.999)
 *
 * @param date - The date to modify
 * @returns New date set to end of day
 */
export function setToEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Calculates the date range for different calendar view modes
 *
 * @param currentDate - The current selected date
 * @param viewMode - The calendar view mode
 * @returns Object with start and end dates for the view
 */
export function calculateDateRange(
  currentDate: Date,
  viewMode: 'day' | '3-day' | 'week' | 'month'
): { start: Date; end: Date } {
  const start = new Date(currentDate);
  const end = new Date(currentDate);

  switch (viewMode) {
    case 'day':
      return {
        start: setToStartOfDay(start),
        end: setToEndOfDay(end),
      };

    case '3-day':
      // 3-day view shows: previous day, current day, next day
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 2); // start - 1 + 2 = current + 1
      end.setHours(23, 59, 59, 999);
      break;

    case 'week':
      // Monday as first day (1 = Monday, 0 = Sunday)
      const dayOfWeek = currentDate.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(currentDate.getDate() - daysFromMonday);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;

    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

/**
 * Gets the availability for a specific day
 *
 * @param availabilities - Array of availability
 * @param date - The date to get availability for
 * @returns Array of availability occurring on the specified date
 */
export function getAvailabilityForDay(availabilities: AvailabilityData[], date: Date): AvailabilityData[] {
  return availabilities.filter((availability) => new Date(availability.startTime).toDateString() === date.toDateString());
}

/**
 * Gets the slots for a specific day
 *
 * @param slots - Array of slots
 * @param date - The date to get slots for
 * @returns Array of slots occurring on the specified date
 */
export function getSlotsForDay(slots: SlotData[], date: Date): SlotData[] {
  return slots.filter((slot) => new Date(slot.startTime).toDateString() === date.toDateString());
}

/**
 * Calculate display time range based on slots with padding
 *
 * @param slots - Array of slots to calculate time range from
 * @returns Time range object with start and end hours
 */
export function calculateSlotTimeRange(slots: SlotData[]): { start: number; end: number } {
  // If no slots, show default business hours
  if (slots.length === 0) {
    return { start: 9, end: 17 }; // 9 AM to 5 PM
  }

  let earliestHour = 24;
  let latestHour = 0;

  // Find the actual earliest and latest times from slots
  slots.forEach((slot) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);

    const startHour = startTime.getHours();
    const endHour = endTime.getHours();

    // Consider minutes for more precise range
    const startDecimal = startHour + startTime.getMinutes() / 60;
    const endDecimal = endHour + endTime.getMinutes() / 60;

    if (startDecimal < earliestHour) earliestHour = startDecimal;
    if (endDecimal > latestHour) latestHour = endDecimal;
  });

  // Round down for start hour and round up for end hour
  const startHour = Math.floor(earliestHour);
  const endHour = Math.ceil(latestHour);

  // Add some padding (1 hour before and after) but keep within reasonable bounds
  const paddedStart = Math.max(6, startHour - 1); // Don't start before 6 AM
  const paddedEnd = Math.min(22, endHour + 1); // Don't end after 10 PM

  return { start: paddedStart, end: paddedEnd };
}

/**
 * Calculate display time range based on availability without padding
 *
 * @param availabilities - Array of availability to calculate time range from
 * @returns Time range object with start and end hours
 */
export function calculateAvailabilityTimeRange(availabilities: AvailabilityData[]): { start: number; end: number } {
  const defaultStart = 6; // 6 AM
  const defaultEnd = 18; // 6 PM

  let earliestHour = defaultStart;
  let latestHour = defaultEnd;

  // Check all availability to extend range if needed
  availabilities.forEach((availability) => {
    const startHour = new Date(availability.startTime).getHours();
    const endHour = new Date(availability.endTime).getHours();

    if (startHour < earliestHour) earliestHour = startHour;
    if (endHour > latestHour) latestHour = endHour;
  });

  return { start: earliestHour, end: latestHour };
}

// =============================================================================
// CALENDAR NAVIGATION UTILITIES
// =============================================================================

/**
 * Navigates to the next or previous period based on view mode
 *
 * @param currentDate - The current selected date
 * @param direction - Navigation direction ('prev' or 'next')
 * @param viewMode - The calendar view mode
 * @returns New date after navigation
 */
export function navigateCalendarDate(
  currentDate: Date,
  direction: 'prev' | 'next',
  viewMode: 'day' | '3-day' | 'week' | 'month'
): Date {
  const newDate = new Date(currentDate);
  const increment = direction === 'next' ? 1 : -1;

  switch (viewMode) {
    case 'day':
      newDate.setDate(newDate.getDate() + increment);
      break;
    case '3-day':
      newDate.setDate(newDate.getDate() + increment);
      break;
    case 'week':
      newDate.setDate(newDate.getDate() + increment * 7);
      break;
    case 'month':
      newDate.setMonth(newDate.getMonth() + increment);
      break;
  }

  return newDate;
}

/**
 * Gets the title string for a calendar view
 *
 * @param currentDate - The current selected date
 * @param viewMode - The calendar view mode
 * @returns Formatted title string for the view
 */
export function getCalendarViewTitle(
  currentDate: Date,
  viewMode: 'day' | '3-day' | 'week' | 'month'
): string {
  switch (viewMode) {
    case 'day':
    case '3-day':
      return currentDate.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'week':
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = currentDate.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(currentDate.getDate() - daysFromMonday);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;

    case 'month':
      return currentDate.toLocaleDateString([], { year: 'numeric', month: 'long' });
  }
}
