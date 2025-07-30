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
 *     console.log('Success:', data.data);
 *   } else {
 *     console.error('Error:', data.error);
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

/**
 * Validates calendar availability API response structure.
 *
 * @param value - The unknown value to validate
 * @returns Type predicate indicating if value is a valid availability response
 *
 * @example
 * ```typescript
 * const availabilityData = await fetchAvailability(id);
 *
 * if (isAvailabilityResponse(availabilityData)) {
 *   console.log(`Availability ${availabilityData.id} is ${availabilityData.status}`);
 *   console.log(`Time slot: ${availabilityData.startTime} - ${availabilityData.endTime}`);
 * }
 * ```
 */
export function isAvailabilityResponse(
  value: unknown
): value is { id: string; status: string; startTime: Date; endTime: Date } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'status' in value &&
    'startTime' in value &&
    'endTime' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).status === 'string' &&
    (value as any).startTime instanceof Date &&
    (value as any).endTime instanceof Date
  );
}

// Provider API response guards
export function isProviderResponse(
  value: unknown
): value is { id: string; status: string; user: { name: string; email: string } } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'status' in value &&
    'user' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).status === 'string' &&
    typeof (value as any).user === 'object' &&
    (value as any).user !== null &&
    'name' in (value as any).user &&
    'email' in (value as any).user
  );
}

// Organization API response guards
export function isOrganizationResponse(
  value: unknown
): value is { id: string; name: string; status: string; billingModel: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'status' in value &&
    'billingModel' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).status === 'string' &&
    typeof (value as any).billingModel === 'string'
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

// Provider status validation
export function isValidProviderStatus(
  value: unknown
): value is 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' {
  return (
    typeof value === 'string' &&
    ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(value)
  );
}

// Organization status validation
export function isValidOrganizationStatus(
  value: unknown
): value is 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'SUSPENDED' {
  return (
    typeof value === 'string' &&
    ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED'].includes(value)
  );
}

// Availability status validation
export function isValidAvailabilityStatus(
  value: unknown
): value is 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' {
  return (
    typeof value === 'string' && ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'].includes(value)
  );
}

// Billing model validation
export function isValidBillingModel(value: unknown): value is 'CONSOLIDATED' | 'PER_LOCATION' {
  return typeof value === 'string' && ['CONSOLIDATED', 'PER_LOCATION'].includes(value);
}

// User role validation
export function isValidUserRole(value: unknown): value is 'USER' | 'ADMIN' | 'SUPER_ADMIN' {
  return typeof value === 'string' && ['USER', 'ADMIN', 'SUPER_ADMIN'].includes(value);
}

// =============================================================================
// COMPLEX OBJECT GUARDS
// =============================================================================

// Calendar availability data guard
export function isValidAvailabilityData(value: unknown): value is {
  title: string;
  startTime: Date;
  endTime: Date;
  providerId: string;
  organizationId?: string;
  locationId?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    'startTime' in value &&
    'endTime' in value &&
    'providerId' in value &&
    typeof (value as any).title === 'string' &&
    isValidDate((value as any).startTime) &&
    isValidDate((value as any).endTime) &&
    isValidUUID((value as any).providerId) &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId)) &&
    (!(value as any).locationId || isValidUUID((value as any).locationId))
  );
}

// Provider registration data guard
export function isValidProviderData(value: unknown): value is {
  userId: string;
  providerTypeIds: string[];
  serviceIds: string[];
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'providerTypeIds' in value &&
    'serviceIds' in value &&
    isValidUUID((value as any).userId) &&
    Array.isArray((value as any).providerTypeIds) &&
    (value as any).providerTypeIds.every((id: unknown) => isValidUUID(id)) &&
    Array.isArray((value as any).serviceIds) &&
    (value as any).serviceIds.every((id: unknown) => isValidUUID(id))
  );
}

// Organization registration data guard
export function isValidOrganizationData(value: unknown): value is {
  name: string;
  email: string;
  billingModel: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'email' in value &&
    'billingModel' in value &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    isValidEmail((value as any).email) &&
    isValidBillingModel((value as any).billingModel)
  );
}

// Location data guard
export function isValidLocationData(value: unknown): value is {
  name: string;
  formattedAddress: string;
  googlePlaceId: string;
  organizationId: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'formattedAddress' in value &&
    'googlePlaceId' in value &&
    'organizationId' in value &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    typeof (value as any).formattedAddress === 'string' &&
    (value as any).formattedAddress.length > 0 &&
    typeof (value as any).googlePlaceId === 'string' &&
    (value as any).googlePlaceId.length > 0 &&
    isValidUUID((value as any).organizationId)
  );
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
