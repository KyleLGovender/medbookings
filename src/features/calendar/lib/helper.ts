import { startOfWeek as dateFnsStartOfWeek, eachDayOfInterval } from 'date-fns';

import { AvailabilityWithBookings } from './types';

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
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

export function generateDaysForWeekCalendar(currentDate: Date) {
  const startOfWeek = dateFnsStartOfWeek(currentDate, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return {
      date,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, currentDate),
    };
  });

  return weekDays;
}

export function formatDateTime(date: string) {
  return new Date(date).toISOString().split('.')[0].slice(0, -3);
}

export function expandRecurringAvailability(
  availability: AvailabilityWithBookings,
  endDate: Date
): AvailabilityWithBookings[] {
  if (!availability.isRecurring || !availability.recurringDays) {
    return [availability];
  }

  const calendarEndDate = new Date(endDate);
  const recurrenceEndDate = availability.recurrenceEndDate
    ? new Date(availability.recurrenceEndDate)
    : null;

  const effectiveEndDate = recurrenceEndDate
    ? new Date(Math.min(calendarEndDate.getTime(), recurrenceEndDate.getTime()))
    : calendarEndDate;

  const dates = eachDayOfInterval({
    start: new Date(availability.startTime),
    end: effectiveEndDate,
  });

  const recurringDays = new Set(availability.recurringDays);
  const filteredDates = dates.filter((date) => recurringDays.has(date.getDay()));

  return filteredDates.map((date) => {
    const startTime = new Date(date);
    startTime.setHours(availability.startTime.getHours(), availability.startTime.getMinutes());

    const endTime = new Date(date);
    endTime.setHours(availability.endTime.getHours(), availability.endTime.getMinutes());

    const relevantBookings = availability.bookings.filter((booking) =>
      isSameDay(booking.startTime, date)
    );

    return {
      ...availability,
      id: `${availability.id}-${date.toISOString()}`,
      startTime,
      endTime,
      bookings: relevantBookings,
    };
  });
}
