/**
 * Timezone Utilities for MedBookings
 *
 * CRITICAL TIMEZONE RULES:
 * 1. Database stores ALL dates/times in UTC (PostgreSQL timestamptz)
 * 2. South Africa timezone: Africa/Johannesburg (UTC+2, no DST)
 * 3. Client sends dates in local time (SAST)
 * 4. Server converts to UTC before database storage
 * 5. Server sends UTC to client
 * 6. Client displays in local time
 *
 * WORKFLOW:
 * - User Input → Client (SAST) → Server (convert to UTC) → Database (UTC)
 * - Database (UTC) → Server (UTC) → Client (convert to SAST) → Display (SAST)
 */

/**
 * South African Standard Time (SAST) constants
 * - Timezone: Africa/Johannesburg
 * - Offset: UTC+2 (constant, no daylight saving time)
 */
export const SOUTH_AFRICA_TIMEZONE = 'Africa/Johannesburg';
export const SOUTH_AFRICA_UTC_OFFSET = 2; // Hours ahead of UTC

/**
 * Converts a date to UTC while preserving the local time representation
 * Use this when client sends "2025-10-01 14:00" in SAST and you need to store as UTC
 *
 * @param localDate - Date in local time (SAST)
 * @returns Date object representing the same time in UTC
 *
 * @example
 * // Client sends: "2025-10-01 14:00" (SAST)
 * const utcDate = toUTC(new Date("2025-10-01T14:00:00+02:00"));
 * // Database stores: "2025-10-01 12:00:00Z" (UTC)
 */
export function toUTC(localDate: Date): Date {
  return new Date(localDate.toISOString());
}

/**
 * Converts a UTC date to South African Standard Time
 * Use this when displaying dates to users
 *
 * @param utcDate - Date in UTC from database
 * @returns Date object in SAST
 *
 * @example
 * // Database has: "2025-10-01 12:00:00Z" (UTC)
 * const sastDate = fromUTC(new Date("2025-10-01T12:00:00Z"));
 * // Display shows: "2025-10-01 14:00" (SAST)
 */
export function fromUTC(utcDate: Date): Date {
  const offsetMs = SOUTH_AFRICA_UTC_OFFSET * 60 * 60 * 1000;
  return new Date(utcDate.getTime() + offsetMs);
}

/**
 * Gets the current date/time in UTC
 * Use this for server-side timestamp generation
 *
 * @returns Current date/time in UTC
 */
export function nowUTC(): Date {
  return new Date();
}

/**
 * Gets the current date/time in SAST
 * Use this when you need current local time
 *
 * @returns Current date/time in SAST
 */
export function nowSAST(): Date {
  return fromUTC(new Date());
}

/**
 * Formats a date for display in South African format
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 *
 * @example
 * formatSAST(new Date("2025-10-01T12:00:00Z"))
 * // Returns: "01/10/2025, 14:00" (in SAST)
 */
export function formatSAST(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SOUTH_AFRICA_TIMEZONE,
  }
): string {
  return new Intl.DateTimeFormat('en-ZA', options).format(date);
}

/**
 * Checks if two dates are on the same day in SAST
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are on the same day in SAST
 *
 * @example
 * // Database has: "2025-10-01 22:00:00Z" and "2025-10-02 00:00:00Z"
 * // In SAST these are: "2025-10-02 00:00" and "2025-10-02 02:00"
 * isSameDaySAST(date1, date2) // Returns: true
 */
export function isSameDaySAST(date1: Date, date2: Date): boolean {
  const sast1 = fromUTC(date1);
  const sast2 = fromUTC(date2);

  return (
    sast1.getFullYear() === sast2.getFullYear() &&
    sast1.getMonth() === sast2.getMonth() &&
    sast1.getDate() === sast2.getDate()
  );
}

/**
 * Gets the start of day in SAST, returns as UTC
 * Use this for date range queries
 *
 * @param date - Date to get start of day for
 * @returns UTC date representing start of day in SAST
 *
 * @example
 * // Input: any time on 2025-10-01 (SAST)
 * // Output: 2025-09-30 22:00:00Z (which is 2025-10-01 00:00:00 SAST)
 */
export function startOfDaySAST(date: Date): Date {
  const sast = fromUTC(date);
  sast.setHours(0, 0, 0, 0);
  // Convert back to UTC
  const offsetMs = SOUTH_AFRICA_UTC_OFFSET * 60 * 60 * 1000;
  return new Date(sast.getTime() - offsetMs);
}

/**
 * Gets the end of day in SAST, returns as UTC
 * Use this for date range queries
 *
 * @param date - Date to get end of day for
 * @returns UTC date representing end of day in SAST
 *
 * @example
 * // Input: any time on 2025-10-01 (SAST)
 * // Output: 2025-10-01 21:59:59.999Z (which is 2025-10-01 23:59:59.999 SAST)
 */
export function endOfDaySAST(date: Date): Date {
  const sast = fromUTC(date);
  sast.setHours(23, 59, 59, 999);
  // Convert back to UTC
  const offsetMs = SOUTH_AFRICA_UTC_OFFSET * 60 * 60 * 1000;
  return new Date(sast.getTime() - offsetMs);
}

/**
 * Validates that a date is within reasonable bounds
 * Prevents far-future or far-past dates
 *
 * @param date - Date to validate
 * @param options - Validation options
 * @returns True if date is valid
 */
export function isValidBookingDate(
  date: Date,
  options: {
    minDaysFromNow?: number;
    maxDaysFromNow?: number;
  } = {}
): boolean {
  const { minDaysFromNow = 0, maxDaysFromNow = 365 } = options;

  const now = nowUTC();
  const minDate = new Date(now);
  minDate.setDate(now.getDate() + minDaysFromNow);

  const maxDate = new Date(now);
  maxDate.setDate(now.getDate() + maxDaysFromNow);

  return date >= minDate && date <= maxDate;
}

/**
 * Creates a mutable copy of a Date object
 * Use this when you need to modify a date without affecting the original
 *
 * @param date - Date to clone
 * @returns New Date object with same timestamp
 *
 * @example
 * const original = new Date("2025-10-01T14:00:00Z");
 * const copy = cloneDate(original);
 * copy.setHours(15); // original is unchanged
 */
export function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

/**
 * Adds milliseconds to a date and returns a new Date
 * Use this for token expiry, timeouts, etc.
 *
 * @param date - Base date
 * @param milliseconds - Milliseconds to add (can be negative)
 * @returns New Date object with added time
 *
 * @example
 * const now = nowUTC();
 * const expires = addMilliseconds(now, 24 * 60 * 60 * 1000); // +24 hours
 */
export function addMilliseconds(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() + milliseconds);
}

/**
 * Creates a Date from a Unix timestamp (milliseconds)
 * Use this when receiving timestamps from external APIs
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Date object in UTC
 *
 * @example
 * const googleExpiry = fromTimestamp(tokens.expiry_date);
 */
export function fromTimestamp(timestamp: number): Date {
  return new Date(timestamp);
}

/**
 * Parses an ISO date string ensuring UTC interpretation
 * Use this when parsing dates from client
 *
 * @param isoString - ISO 8601 date string
 * @returns Date object in UTC
 *
 * @example
 * parseUTC("2025-10-01T14:00:00+02:00")
 * // Returns: Date object representing "2025-10-01 12:00:00Z"
 */
export function parseUTC(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Converts a date to ISO string in UTC
 * Use this when sending dates to client
 *
 * @param date - Date to convert
 * @returns ISO 8601 string in UTC
 */
export function toISOStringUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Type guard to check if a value is a valid Date object
 *
 * @param value - Value to check
 * @returns True if value is a valid Date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Helper for Zod schema date validation
 * Use in Zod schemas to ensure dates are valid
 *
 * @example
 * const schema = z.object({
 *   startTime: z.string().refine(validateDateString, {
 *     message: 'Invalid date format'
 *   })
 * });
 */
export function validateDateString(value: string): boolean {
  const date = new Date(value);
  return isValidDate(date);
}
