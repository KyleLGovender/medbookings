import { endOfWeek, startOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { convertLocalToUTC, convertUTCToLocal, formatLocalDate } from '@/lib/timezone-helper';

import { ViewType } from './types';

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
      startDate = startOfWeek(localDate, { weekStartsOn: 1 });
      endDate = endOfWeek(localDate, { weekStartsOn: 1 });
      break;
    case 'day':
    case 'slots':
      endDate.setDate(startDate.getDate() + 1);
      break;
    case 'schedule':
      startDate.setDate(1);
      endDate.setMonth(startDate.getMonth() + 1, 0);
      break;
  }

  return {
    from: convertLocalToUTC(startDate),
    to: convertLocalToUTC(endDate),
  };
}

export function getEventGridPosition(start: Date, end: Date): string {
  // Convert to minutes since start of day
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const duration = endMinutes - startMinutes;

  return `${startMinutes} / span ${duration}`;
}

export function getNextDate(rangeStartDate: Date, view: ViewType): Date {
  const date = new Date(rangeStartDate);

  switch (view) {
    case 'week':
      date.setDate(date.getDate() + 7);
      break;
    case 'day':
    case 'slots': // Handle slots same as day view
      date.setDate(date.getDate() + 1);
      break;
    case 'schedule':
      date.setMonth(date.getMonth() + 1);
      break;
  }

  return date;
}

export function getPreviousDate(rangeStartDate: Date, view: ViewType): Date {
  const date = new Date(rangeStartDate);

  switch (view) {
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'day':
    case 'slots': // Handle slots same as day view
      date.setDate(date.getDate() - 1);
      break;
    case 'schedule':
      date.setMonth(date.getMonth() - 1);
      break;
  }

  return date;
}

export function roundToNearestMinute(date: Date): Date {
  return new Date(Math.floor(date.getTime() / 60000) * 60000);
}
