import { formatInTimeZone, toDate, toZonedTime } from 'date-fns-tz';

// Set default timezone to Pretoria (GMT+2)
const DEFAULT_TIMEZONE = 'Africa/Johannesburg';

export function convertUTCToLocal(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): Date {
  return toZonedTime(new Date(utcDate), timezone);
}

export function convertLocalToUTC(localDate: Date, timezone = DEFAULT_TIMEZONE): Date {
  return toDate(localDate, { timeZone: timezone });
}

export function formatLocalTime(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(new Date(utcDate), timezone, 'HH:mm');
}

export function formatLocalDate(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(new Date(utcDate), timezone, 'yyyy-MM-dd');
}

export function getLocalDayBounds(utcDate: string | Date, timezone = DEFAULT_TIMEZONE) {
  const localDate = convertUTCToLocal(utcDate, timezone);

  // Start of day in local timezone
  const startOfDay = new Date(localDate);
  startOfDay.setHours(0, 0, 0, 0);

  // End of day in local timezone
  const endOfDay = new Date(localDate);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    start: convertLocalToUTC(startOfDay, timezone),
    end: convertLocalToUTC(endOfDay, timezone),
  };
}
