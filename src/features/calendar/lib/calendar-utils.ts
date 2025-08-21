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

import { CalendarEvent } from '@/features/calendar/types/types';

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
export function getEventStyle(event: CalendarEvent): string {
  // Base style for recurring events with left border indicator
  const recurringBorder = event.isRecurring ? 'border-l-4 border-l-blue-600' : '';

  switch (event.type) {
    case 'availability':
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
    case 'booking':
      switch (event.status) {
        case 'BOOKED':
          return `bg-purple-100 border-purple-300 text-purple-800 ${recurringBorder}`;
        case 'PENDING':
          return `bg-orange-100 border-orange-300 text-orange-800 ${recurringBorder}`;
        default:
          return `bg-purple-100 border-purple-300 text-purple-800 ${recurringBorder}`;
      }
    case 'slot':
      // Available slots (green for clickable availability)
      return `bg-green-100 border-green-400 text-green-800 cursor-pointer hover:bg-green-200 ${recurringBorder}`;
    case 'blocked':
      return `bg-red-100 border-red-300 text-red-800 ${recurringBorder}`;
    default:
      return `bg-gray-100 border-gray-300 text-gray-800 ${recurringBorder}`;
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
export function calculateEventPosition(event: CalendarEvent, timeRange: TimeRange): EventPosition {
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
  event: CalendarEvent,
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
  events: CalendarEvent[],
  timeRange: TimeRange
): CalendarEvent[] {
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
export function isEventActiveAtHour(event: CalendarEvent, hour: number): boolean {
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
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 2);
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
 * Gets the events for a specific day
 *
 * @param events - Array of calendar events
 * @param date - The date to get events for
 * @returns Array of events occurring on the specified date
 */
export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => new Date(event.startTime).toDateString() === date.toDateString());
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
      newDate.setDate(newDate.getDate() + increment * 3);
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
