// =============================================================================
// TYPE VALIDATION GUARDS
// =============================================================================
// Runtime type validation for critical business types across all features
// Organized by: API Response Guards -> User Input Guards -> External Data Guards

// =============================================================================
// API RESPONSE GUARDS
// =============================================================================

/**
 * Generic API response guard that validates the standard API response structure.
 *
 * @param value - The unknown value to validate
 * @returns Type predicate indicating if value is a valid API response
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/users');
 * const data = await response.json();
 *
 * if (isApiResponse(data)) {
 *   if (data.success) {
 *     logger.info('Success', { data: data.data });
 *   } else {
 *     logger.error('Error', { error: data.error });
 *   }
 * }
 * ```
 */
export function isApiResponse<T>(
  value: unknown
): value is { success: boolean; data?: T; error?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  );
}

// =============================================================================
// USER INPUT GUARDS
// =============================================================================

/**
 * Validates email address format using RFC-compliant regex pattern.
 *
 * @param value - The unknown value to validate
 * @returns Type predicate indicating if value is a valid email string
 *
 * @example
 * ```typescript
 * const userInput = "user@example.com";
 *
 * if (isValidEmail(userInput)) {
 *   await sendEmail(userInput); // TypeScript knows this is a string
 * } else {
 *   throw new Error("Invalid email format");
 * }
 * ```
 */
export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validates UUID format according to RFC 4122 specification.
 * Supports versions 1-5 with proper format validation.
 *
 * @param value - The unknown value to validate
 * @returns Type predicate indicating if value is a valid UUID string
 *
 * @example
 * ```typescript
 * const userId = "550e8400-e29b-41d4-a716-446655440000";
 *
 * if (isValidUUID(userId)) {
 *   const user = await findUserById(userId); // Safe to use as UUID
 * } else {
 *   throw new Error("Invalid user ID format");
 * }
 * ```
 */
export function isValidUUID(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

// Phone number validation guard
export function isValidPhone(value: unknown): value is string {
  return typeof value === 'string' && /^\+?[\d\s-()]{10,}$/.test(value);
}

// Date validation guard
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// Date string validation guard (ISO format)
export function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && !isNaN(Date.parse(value));
}

// =============================================================================
// BUSINESS LOGIC GUARDS
// =============================================================================

// User role validation (domain logic - keep)
export function isValidUserRole(value: unknown): value is 'USER' | 'ADMIN' | 'SUPER_ADMIN' {
  return typeof value === 'string' && ['USER', 'ADMIN', 'SUPER_ADMIN'].includes(value);
}

// =============================================================================
// EXTERNAL DATA GUARDS
// =============================================================================

// Google Places API response guard
export function isValidGooglePlace(value: unknown): value is {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: { location: { lat: number; lng: number } };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'place_id' in value &&
    'formatted_address' in value &&
    'name' in value &&
    'geometry' in value &&
    typeof (value as any).place_id === 'string' &&
    typeof (value as any).formatted_address === 'string' &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).geometry === 'object' &&
    (value as any).geometry !== null &&
    'location' in (value as any).geometry &&
    typeof (value as any).geometry.location === 'object' &&
    (value as any).geometry.location !== null &&
    'lat' in (value as any).geometry.location &&
    'lng' in (value as any).geometry.location &&
    typeof (value as any).geometry.location.lat === 'number' &&
    typeof (value as any).geometry.location.lng === 'number'
  );
}

// Stripe webhook data guard
export function isValidStripeWebhook(value: unknown): value is {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'data' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).type === 'string' &&
    typeof (value as any).data === 'object' &&
    (value as any).data !== null &&
    'object' in (value as any).data &&
    typeof (value as any).data.object === 'object'
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validates and transforms unknown data using a type guard function.
 * Throws an error with a custom message if validation fails.
 *
 * @template T - The expected type after validation
 * @param value - The unknown value to validate and transform
 * @param guard - Type guard function that validates the value
 * @param errorMessage - Custom error message to throw on validation failure
 * @returns The validated and transformed value
 * @throws Error when validation fails
 *
 * @example
 * ```typescript
 * const userInput: unknown = { email: "user@example.com" };
 *
 * const validatedUser = validateAndTransform(
 *   userInput,
 *   isValidUserData,
 *   "Invalid user data provided"
 * );
 * // TypeScript now knows validatedUser is of type UserData
 * ```
 */
export function validateAndTransform<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): T {
  if (!guard(value)) {
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * Validates an array where each element must pass a type guard.
 * Provides detailed error messages including the index of invalid items.
 *
 * @template T - The expected type for each array element
 * @param value - The unknown value to validate as an array
 * @param guard - Type guard function to validate each array element
 * @param errorMessage - Base error message for validation failures
 * @returns Array of validated elements
 * @throws Error when validation fails, including specific index information
 *
 * @example
 * ```typescript
 * const userIds: unknown = ["uuid1", "uuid2", "invalid-id"];
 *
 * try {
 *   const validatedIds = validateArray(
 *     userIds,
 *     isValidUUID,
 *     "Invalid user ID array"
 *   );
 *   // TypeScript knows this is string[]
 * } catch (error) {
 *   // Error: "Invalid user ID array: Invalid item at index 2"
 * }
 * ```
 */
export function validateArray<T>(
  value: unknown,
  guard: (item: unknown) => item is T,
  errorMessage: string
): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${errorMessage}: Expected array`);
  }

  const result: T[] = [];
  for (let i = 0; i < value.length; i++) {
    if (!guard(value[i])) {
      throw new Error(`${errorMessage}: Invalid item at index ${i}`);
    }
    result.push(value[i]);
  }

  return result;
}

// Safe JSON parsing with validation
export function parseAndValidateJSON<T>(
  jsonString: string,
  guard: (value: unknown) => value is T,
  errorMessage: string
): T {
  try {
    const parsed = JSON.parse(jsonString);
    return validateAndTransform(parsed, guard, errorMessage);
  } catch (error) {
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
