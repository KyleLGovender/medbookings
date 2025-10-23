import { formatInTimeZone, toDate, toZonedTime } from 'date-fns-tz';

import { cloneDate, parseUTC } from '@/lib/timezone';

// Set default timezone to Pretoria (GMT+2)
const DEFAULT_TIMEZONE = 'Africa/Johannesburg';

export function convertUTCToLocal(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): Date {
  return toZonedTime(typeof utcDate === 'string' ? parseUTC(utcDate) : utcDate, timezone);
}

export function convertLocalToUTC(localDate: Date, timezone = DEFAULT_TIMEZONE): Date {
  return toDate(localDate, { timeZone: timezone });
}

export function formatLocalTime(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(
    typeof utcDate === 'string' ? parseUTC(utcDate) : utcDate,
    timezone,
    'HH:mm'
  );
}

export function formatLocalDate(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(
    typeof utcDate === 'string' ? parseUTC(utcDate) : utcDate,
    timezone,
    'yyyy-MM-dd'
  );
}

/**
 * Formats a UTC date into a local date string with the format 'EEE, MMM dd'.
 * Example: 'Tue, Apr 09'
 * @param utcDate The UTC date string or Date object.
 * @param timezone The target timezone (defaults to DEFAULT_TIMEZONE).
 * @returns The formatted local date string.
 */
export function formatLocalDateWeekdayMonthDay(
  utcDate: string | Date,
  timezone = DEFAULT_TIMEZONE
): string {
  return formatInTimeZone(
    typeof utcDate === 'string' ? parseUTC(utcDate) : utcDate,
    timezone,
    'EEE, MMM dd'
  );
}

export function getLocalDayBounds(utcDate: string | Date, timezone = DEFAULT_TIMEZONE) {
  const localDate = convertUTCToLocal(utcDate, timezone);

  // Start of day in local timezone
  const startOfDay = cloneDate(localDate);
  startOfDay.setHours(0, 0, 0, 0);

  // End of day in local timezone
  const endOfDay = cloneDate(localDate);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    start: convertLocalToUTC(startOfDay, timezone),
    end: convertLocalToUTC(endOfDay, timezone),
  };
}
