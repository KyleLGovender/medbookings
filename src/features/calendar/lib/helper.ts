import { endOfWeek, startOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { convertLocalToUTC, convertUTCToLocal, formatLocalDate } from '@/lib/timezone-helper';

import {
  AvailabilityView,
  CalendarViewType,
  ServiceProviderCalendarViewType,
  TimeRange,
} from './types';

// Define a union type for all view types
type ViewType = CalendarViewType | ServiceProviderCalendarViewType;

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface CalculateSpotsParams {
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * Calculates the number of available appointment slots based on time window and duration
 * @param startTime - Start time of the availability window
 * @param endTime - End time of the availability window
 * @param duration - Duration of each appointment in minutes
 * @returns number of available slots
 */

export function isSameDay(date1: Date | null | undefined, date2: Date | null | undefined): boolean {
  if (!date1 || !date2) return false;

  // Convert both dates to local timezone for comparison
  const d1 = convertUTCToLocal(date1 instanceof Date ? date1 : new Date(date1));
  const d2 = convertUTCToLocal(date2 instanceof Date ? date2 : new Date(date2));

  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return false;

  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

export function generateDaysForDayCalendar(currentDate: Date) {
  // Convert to local timezone first
  const localCurrentDate = convertUTCToLocal(currentDate);

  const firstDay = new Date(localCurrentDate.getFullYear(), localCurrentDate.getMonth(), 1);
  const lastDay = new Date(localCurrentDate.getFullYear(), localCurrentDate.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startPadding = firstDay.getDay();
  if (startPadding === 0) startPadding = 7;
  startPadding -= 1;

  const days: CalendarDay[] = [];
  const daysInPrevMonth = new Date(
    localCurrentDate.getFullYear(),
    localCurrentDate.getMonth(),
    0
  ).getDate();

  // Previous month days
  for (let i = startPadding; i > 0; i -= 1) {
    const dayNumber = daysInPrevMonth - i + 1;
    const date = new Date(
      localCurrentDate.getFullYear(),
      localCurrentDate.getMonth() - 1,
      dayNumber
    );
    days.push({
      date: formatLocalDate(date),
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, localCurrentDate),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i += 1) {
    const date = new Date(localCurrentDate.getFullYear(), localCurrentDate.getMonth(), i);
    days.push({
      date: formatLocalDate(date),
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, localCurrentDate),
    });
  }

  // Next month days
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i += 1) {
    const date = new Date(localCurrentDate.getFullYear(), localCurrentDate.getMonth() + 1, i);
    days.push({
      date: formatLocalDate(date),
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, localCurrentDate),
    });
  }

  return days;
}

export function generateDaysForWeekCalendar(rangeStartDate: Date) {
  // Convert to local timezone first
  const localDate = convertUTCToLocal(rangeStartDate);

  // Get Monday of the week (weekStartsOn: 1)
  const weekStart = startOfWeek(localDate, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);

    return {
      date: date,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, localDate),
    };
  });

  return weekDays;
}

export function getDateRange(date: Date, view: ViewType): DateRange {
  const localDate = convertUTCToLocal(date);
  let startDate = new Date(localDate);
  let endDate = new Date(localDate);

  switch (view) {
    case 'week':
    case 'schedule':
    case 'slots':
      startDate = startOfWeek(localDate, { weekStartsOn: 1 });
      endDate = endOfWeek(localDate, { weekStartsOn: 1 });
      break;
    case 'day':
      endDate.setDate(startDate.getDate() + 1);
      break;
  }

  return {
    from: convertLocalToUTC(startDate),
    to: convertLocalToUTC(endDate),
  };
}

export function getEventGridPosition(startTime: Date, endTime: Date, timeRange: TimeRange) {
  const startHour = timeRange.earliestTime;
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

  const adjustedStart = (startMinutes - startHour * 60) / 30 + 1;
  const duration = (endMinutes - startMinutes) / 30;

  const position = {
    gridRowStart: Math.round(adjustedStart),
    gridRowSpan: Math.max(1, Math.round(duration)),
  };

  return position;
}

export function getNextDate(rangeStartDate: Date, view: ViewType): Date {
  const date = new Date(rangeStartDate);

  switch (view) {
    case 'week':
    case 'schedule':
    case 'slots':
      date.setDate(date.getDate() + 7);
      break;
    case 'day':
      date.setDate(date.getDate() + 1);
      break;
  }

  return date;
}

export function getPreviousDate(rangeStartDate: Date, view: ViewType): Date {
  const date = new Date(rangeStartDate);

  switch (view) {
    case 'week':
    case 'schedule':
    case 'slots':
      date.setDate(date.getDate() - 7);
      break;
    case 'day':
      date.setDate(date.getDate() - 1);
      break;
  }

  return date;
}

export function roundToNearestMinute(date: Date): Date {
  return new Date(Math.floor(date.getTime() / 60000) * 60000);
}

export function getDistinctServices(availabilityData: AvailabilityView[]) {
  const servicesMap = new Map<
    string,
    { id: string; name: string; description: string | null; displayPriority: number }
  >();

  availabilityData.forEach((availability) => {
    availability.slots.forEach((slot) => {
      const service = slot.service;
      if (!servicesMap.has(service.id)) {
        servicesMap.set(service.id, {
          id: service.id,
          name: service.name,
          description: service.description,
          displayPriority: service.displayPriority,
        });
      }
    });
  });

  return Array.from(servicesMap.values()).sort((a, b) => a.displayPriority - b.displayPriority);
}

export function getTimeRangeOfMultipleAvailabilityView(
  availabilities: AvailabilityView[]
): TimeRange {
  if (!availabilities.length) {
    console.log('No availabilities, using default range 8:00-18:00');
    return { earliestTime: 8, latestTime: 18 };
  }

  const startHours = availabilities.map((a) => new Date(a.startTime).getHours());
  const endHours = availabilities.map((a) => new Date(a.endTime).getHours());

  const timeRange = {
    earliestTime: Math.max(0, Math.min(...startHours)),
    latestTime: Math.min(24, Math.max(...endHours)),
  };

  return timeRange;
}
