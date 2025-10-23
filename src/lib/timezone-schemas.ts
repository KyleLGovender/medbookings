/**
 * Zod Schema Helpers for Timezone Handling
 *
 * These helpers ensure consistent timezone handling in tRPC input validation
 * Use these in your Zod schemas to automatically handle timezone conversion
 */
import { z } from 'zod';

import {
  isValidBookingDate,
  isValidDate,
  nowUTC,
  parseUTC,
  validateDateString,
} from '@/lib/timezone';

/**
 * Zod schema for ISO date strings with timezone
 * Validates and parses to UTC Date object
 *
 * @example
 * const schema = z.object({
 *   startTime: dateStringUTC,
 * });
 */
export const dateStringUTC = z
  .string()
  .refine(validateDateString, {
    message: 'Invalid date format. Expected ISO 8601 string',
  })
  .transform((str) => parseUTC(str));

/**
 * Zod schema for optional date strings
 *
 * @example
 * const schema = z.object({
 *   endTime: optionalDateStringUTC,
 * });
 */
export const optionalDateStringUTC = z
  .string()
  .optional()
  .refine((str) => !str || validateDateString(str), {
    message: 'Invalid date format. Expected ISO 8601 string',
  })
  .transform((str) => (str ? parseUTC(str) : undefined));

/**
 * Zod schema for booking dates with validation
 * Ensures date is not in the past and within reasonable future range
 *
 * @example
 * const schema = z.object({
 *   bookingTime: bookingDateStringUTC,
 * });
 */
export const bookingDateStringUTC = z
  .string()
  .refine(validateDateString, {
    message: 'Invalid date format. Expected ISO 8601 string',
  })
  .transform((str) => parseUTC(str))
  .refine((date) => isValidDate(date), {
    message: 'Invalid date',
  })
  .refine(
    (date) =>
      isValidBookingDate(date, {
        minDaysFromNow: 0,
        maxDaysFromNow: 365,
      }),
    {
      message: 'Booking date must be within the next 365 days',
    }
  );

/**
 * Zod schema for date ranges
 * Ensures start date is before end date
 *
 * @example
 * const schema = dateRangeSchema;
 * // Input: { startDate: "2025-10-01T08:00:00+02:00", endDate: "2025-10-01T17:00:00+02:00" }
 */
export const dateRangeSchema = z
  .object({
    startDate: dateStringUTC,
    endDate: dateStringUTC,
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

/**
 * Zod schema for optional date ranges
 */
export const optionalDateRangeSchema = z
  .object({
    startDate: optionalDateStringUTC,
    endDate: optionalDateStringUTC,
  })
  .refine(
    (data) => {
      // If both are provided, validate range
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

/**
 * Zod schema for time-of-day validation (24-hour format)
 * Validates format: "HH:MM" (e.g., "14:30")
 *
 * @example
 * const schema = z.object({
 *   startTime: timeOfDayString,
 * });
 */
export const timeOfDayString = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Invalid time format. Expected HH:MM (24-hour)',
  })
  .refine(
    (time) => {
      const parts = time.split(':');
      const hours = parts[0] ? Number(parts[0]) : NaN;
      const minutes = parts[1] ? Number(parts[1]) : NaN;
      return (
        !isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60
      );
    },
    {
      message: 'Invalid time value',
    }
  );

/**
 * Zod schema for same-day time range validation
 * Ensures start and end times are on the same day
 *
 * @example
 * const schema = sameDayTimeRangeSchema;
 */
export const sameDayTimeRangeSchema = z
  .object({
    startTime: dateStringUTC,
    endTime: dateStringUTC,
  })
  .refine(
    (data) => {
      const startDate = data.startTime;
      const endDate = data.endTime;

      // Compare UTC date components directly to avoid timezone issues
      return (
        startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
        startDate.getUTCMonth() === endDate.getUTCMonth() &&
        startDate.getUTCDate() === endDate.getUTCDate()
      );
    },
    {
      message: 'Start and end times must be on the same day',
      path: ['endTime'],
    }
  )
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

/**
 * Zod schema for duration validation (in minutes)
 * Ensures duration is positive and within reasonable bounds
 *
 * @example
 * const schema = z.object({
 *   duration: durationMinutes,
 * });
 */
export const durationMinutes = z
  .number()
  .int('Duration must be a whole number of minutes')
  .positive('Duration must be positive')
  .min(15, 'Minimum duration is 15 minutes')
  .max(480, 'Maximum duration is 8 hours (480 minutes)');

/**
 * Zod schema for recurrence end date
 * Ensures recurrence end date is after start date and within 2 years
 *
 * @example
 * const schema = z.object({
 *   recurrenceEndDate: recurrenceEndDateStringUTC,
 * });
 */
export const recurrenceEndDateStringUTC = z
  .string()
  .refine(validateDateString, {
    message: 'Invalid date format. Expected ISO 8601 string',
  })
  .transform((str) => parseUTC(str))
  .refine(
    (date) =>
      isValidBookingDate(date, {
        minDaysFromNow: 1,
        maxDaysFromNow: 730, // 2 years
      }),
    {
      message: 'Recurrence end date must be within the next 2 years',
    }
  );

/**
 * Helper function to create a date range query schema
 * Use this for search/filter operations
 *
 * @example
 * const searchSchema = createDateRangeQuerySchema();
 */
export function createDateRangeQuerySchema() {
  return z.object({
    startDate: z
      .string()
      .optional()
      .refine((str) => !str || validateDateString(str), {
        message: 'Invalid start date format',
      })
      .transform((str) => (str ? parseUTC(str) : undefined)),
    endDate: z
      .string()
      .optional()
      .refine((str) => !str || validateDateString(str), {
        message: 'Invalid end date format',
      })
      .transform((str) => (str ? parseUTC(str) : undefined)),
  });
}

/**
 * Helper function to validate that a date is not in the past
 *
 * @param date - Date to validate
 * @returns Zod refinement result
 */
export function validateNotPast(date: Date): boolean {
  return date >= nowUTC();
}

/**
 * Zod schema for future dates only
 *
 * @example
 * const schema = z.object({
 *   appointmentDate: futureDateStringUTC,
 * });
 */
export const futureDateStringUTC = dateStringUTC.refine(validateNotPast, {
  message: 'Date must be in the future',
});
