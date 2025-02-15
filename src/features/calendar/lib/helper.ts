import { Prisma } from '@prisma/client';
import { BookingStatusSchema } from '@prisma/zod';
import { startOfWeek as dateFnsStartOfWeek, eachDayOfInterval } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { z } from 'zod';

import { Availability, Booking, BookingTypeSchema, Schedule } from './types';

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
export function calculateAvailableSpots({
  startTime,
  endTime,
  duration,
}: CalculateSpotsParams): number {
  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  return Math.floor(totalMinutes / duration);
}

export function isSameDay(date1: Date | null | undefined, date2: Date | null | undefined): boolean {
  if (!date1 || !date2) return false;
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return false;
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

export function generateDaysForDayCalendar(currentDate: Date) {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startPadding = firstDay.getDay();
  if (startPadding === 0) startPadding = 7;
  startPadding -= 1;

  const days: CalendarDay[] = [];

  const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  for (let i = startPadding; i > 0; i -= 1) {
    const dayNumber = daysInPrevMonth - i + 1;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, dayNumber);
    days.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, currentDate),
    });
  }

  for (let i = 1; i <= daysInMonth; i += 1) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    days.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, currentDate),
    });
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i += 1) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
    days.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, currentDate),
    });
  }

  return days;
}

export function generateDaysForWeekCalendar(rangeStartDate: Date) {
  const startOfWeek = dateFnsStartOfWeek(rangeStartDate, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return {
      date,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, rangeStartDate),
    };
  });

  return weekDays;
}

export function formatDateTime(date: string) {
  return new Date(date).toISOString().split('.')[0].slice(0, -3);
}

export function expandRecurringSchedule(schedule: Schedule, endDate: Date): Schedule[] {
  if (!schedule.isRecurring || !schedule.recurringDays) {
    return [schedule];
  }

  const calendarEndDate = new Date(endDate);
  const recurrenceEndDate = schedule.recurrenceEndDate
    ? new Date(schedule.recurrenceEndDate)
    : null;

  const effectiveEndDate = recurrenceEndDate
    ? new Date(Math.min(calendarEndDate.getTime(), recurrenceEndDate.getTime()))
    : calendarEndDate;

  const dates = eachDayOfInterval({
    start: new Date(schedule.startTime),
    end: effectiveEndDate,
  });

  const recurringDays = new Set(schedule.recurringDays);
  const filteredDates = dates.filter((date) => recurringDays.has(date.getDay()));

  return filteredDates.map((date) => {
    const startTime = new Date(date);
    const scheduleStart = new Date(schedule.startTime);
    startTime.setHours(scheduleStart.getHours(), scheduleStart.getMinutes());

    const endTime = new Date(date);
    const scheduleEndTime = new Date(schedule.endTime);
    endTime.setHours(scheduleEndTime.getHours(), scheduleEndTime.getMinutes());

    const relevantBookings = schedule.bookings.filter((booking) =>
      isSameDay(booking.startTime, date)
    );

    return {
      ...schedule,
      id: `${schedule.id}-${date.toISOString()}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      bookings: relevantBookings,
    };
  });
}

export function getDateRange(date: Date, view: 'day' | 'week' | 'schedule'): DateRange {
  const startDate = new Date(date);
  const endDate = new Date(date);

  switch (view) {
    case 'week':
      let day = startDate.getDay();
      if (day === 0) day = 7;
      startDate.setDate(startDate.getDate() - (day - 1));
      endDate.setDate(startDate.getDate() + 6);
      break;
    case 'day':
      endDate.setDate(startDate.getDate() + 1);
      break;
    case 'schedule':
      startDate.setDate(1);
      endDate.setMonth(startDate.getMonth() + 1, 0);
      break;
  }

  return { from: startDate, to: endDate };
}

// Add these new functions to the existing helper.ts file

export function getEventGridPosition(startTime: Date | string, endTime: Date | string) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  // Calculate grid positions (each row represents 5 minutes)
  const rowStart = Math.floor(startMinutes / 5) + 2; // +2 for header offset
  const rowSpan = Math.ceil((endMinutes - startMinutes) / 5);

  return `${rowStart} / span ${rowSpan}`;
}

export function filterScheduleForWeek(schedule: Schedule[], currentDate: Date): Schedule[] {
  const startOfWeek = startOfWeek(currentDate);
  const endOfWeek = endOfWeek(currentDate);

  return schedule.filter((item) => {
    const itemDate = new Date(item.startTime);
    return itemDate >= startOfWeek && itemDate <= endOfWeek;
  });
}

export function filterScheduleForDay(schedule: Schedule[], currentDate: Date): Schedule[] {
  return schedule.filter((item) => {
    const itemDate = new Date(item.startTime);
    return isSameDay(itemDate, currentDate);
  });
}

export function generateTimeSlots(availability: Availability): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startTime = new Date(availability.startTime);
  const endTime = new Date(availability.endTime);

  // Generate 15-minute slots
  let currentSlot = new Date(startTime);
  while (currentSlot < endTime) {
    const slotEnd = new Date(currentSlot);
    slotEnd.setMinutes(slotEnd.getMinutes() + 15);

    // Check if this slot overlaps with any bookings
    const isAvailable = !availability.bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return currentSlot < bookingEnd && slotEnd > bookingStart;
    });

    slots.push({
      startTime: new Date(currentSlot),
      endTime: new Date(slotEnd),
      isAvailable,
    });

    currentSlot = slotEnd;
  }

  return slots;
}

export function getNextDate(rangeStartDate: Date, view: 'day' | 'week' | 'schedule'): Date {
  const newDate = new Date(rangeStartDate);

  switch (view) {
    case 'week':
      newDate.setDate(newDate.getDate() + 7);
      break;
    case 'schedule':
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case 'day':
      newDate.setDate(newDate.getDate() + 1);
      break;
  }

  return newDate;
}

export function getPreviousDate(rangeStartDate: Date, view: 'day' | 'week' | 'schedule'): Date {
  const newDate = new Date(rangeStartDate);

  switch (view) {
    case 'week':
      newDate.setDate(newDate.getDate() - 7);
      break;
    case 'schedule':
      newDate.setMonth(newDate.getMonth() - 1);
      break;
    case 'day':
      newDate.setDate(newDate.getDate() - 1);
      break;
  }

  return newDate;
}

/**
 * Transforms raw availability data from the database into the expected Availability type
 * Handles conversion of decimal prices, dates, and recurring days array
 */
export function transformAvailability(availability: any): Availability {
  return {
    ...availability,
    price:
      typeof availability.price === 'object' && 'toNumber' in availability.price
        ? availability.price.toNumber()
        : Number(availability.price),
    recurrenceEndDate: availability.recurrenceEndDate
      ? new Date(availability.recurrenceEndDate).toISOString()
      : null,
    createdAt: new Date(availability.createdAt).toISOString(),
    updatedAt: new Date(availability.updatedAt).toISOString(),
    recurringDays: Array.isArray(availability.recurringDays)
      ? availability.recurringDays
      : JSON.parse(availability.recurringDays || '[]'),
  };
}

/**
 * Transforms raw booking data from the database into the expected Booking type
 * Handles conversion of prices, dates, status validation, and notifications
 */
export function transformBooking(booking: any): Booking {
  return {
    ...booking,
    price:
      booking.price instanceof Prisma.Decimal ? booking.price.toNumber() : Number(booking.price),
    startTime: new Date(booking.startTime).toISOString(),
    endTime: new Date(booking.endTime).toISOString(),
    status: BookingStatusSchema.parse(booking.status),
    notifications: booking.notifications?.map(transformNotification) ?? [],
    bookingType: BookingType.GUEST,
  };
}

/**
 * Transforms notification timestamps into ISO strings
 * Used for nested notifications within bookings
 */
export function transformNotification(notification: any) {
  return {
    ...notification,
    createdAt: new Date(notification.createdAt).toISOString(),
    updatedAt: new Date(notification.updatedAt).toISOString(),
  };
}

export function determineBookingType(booking: any): z.infer<typeof BookingTypeSchema> {
  if (booking.bookedBy?.id === booking.client?.id) return 'USER_SELF';
  if (booking.bookedBy && !booking.client) return 'USER_GUEST';
  if (!booking.bookedBy && !booking.client) return 'GUEST_SELF';
  return 'PROVIDER_GUEST';
}
