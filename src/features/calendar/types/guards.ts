// =============================================================================
// CALENDAR FEATURE TYPE GUARDS
// =============================================================================
// Runtime type validation for calendar-specific types and API responses
import { isValidDate, isValidDateString, isValidUUID } from '@/types/guards';
import { AvailabilityStatus, BookingStatus, SchedulingRule, SlotStatus } from '@prisma/client';
import { RecurrenceOption } from './types';

// =============================================================================
// ENUM GUARDS
// =============================================================================

export function isAvailabilityStatus(value: unknown): value is AvailabilityStatus {
  return typeof value === 'string' && Object.values(AvailabilityStatus).includes(value as AvailabilityStatus);
}

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === 'string' && Object.values(BookingStatus).includes(value as BookingStatus);
}

export function isSchedulingRule(value: unknown): value is SchedulingRule {
  return typeof value === 'string' && Object.values(SchedulingRule).includes(value as SchedulingRule);
}

export function isSlotStatus(value: unknown): value is SlotStatus {
  return typeof value === 'string' && Object.values(SlotStatus).includes(value as SlotStatus);
}

export function isRecurrenceOption(value: unknown): value is RecurrenceOption {
  return typeof value === 'string' && Object.values(RecurrenceOption).includes(value as RecurrenceOption);
}

// =============================================================================
// AVAILABILITY GUARDS
// =============================================================================

export function isValidAvailabilityCreationData(value: unknown): value is {
  title: string;
  startTime: Date;
  endTime: Date;
  providerId: string;
  organizationId?: string;
  locationId?: string;
  schedulingRule?: string;
  services: Array<{ serviceId: string; duration: number; price: number }>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    'startTime' in value &&
    'endTime' in value &&
    'providerId' in value &&
    'services' in value &&
    typeof (value as any).title === 'string' &&
    (value as any).title.length > 0 &&
    isValidDate((value as any).startTime) &&
    isValidDate((value as any).endTime) &&
    isValidUUID((value as any).providerId) &&
    Array.isArray((value as any).services) &&
    (value as any).services.every(
      (service: any) =>
        typeof service === 'object' &&
        service !== null &&
        'serviceId' in service &&
        'duration' in service &&
        'price' in service &&
        isValidUUID(service.serviceId) &&
        typeof service.duration === 'number' &&
        service.duration > 0 &&
        typeof service.price === 'number' &&
        service.price >= 0
    ) &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId)) &&
    (!(value as any).locationId || isValidUUID((value as any).locationId)) &&
    (!(value as any).schedulingRule || isSchedulingRule((value as any).schedulingRule))
  );
}

export function isValidAvailabilityUpdateData(value: unknown): value is {
  title?: string;
  startTime?: Date;
  endTime?: Date;
  status?: string;
  schedulingRule?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).title ||
      (typeof (value as any).title === 'string' && (value as any).title.length > 0)) &&
    (!(value as any).startTime || isValidDate((value as any).startTime)) &&
    (!(value as any).endTime || isValidDate((value as any).endTime)) &&
    (!(value as any).status || isAvailabilityStatus((value as any).status)) &&
    (!(value as any).schedulingRule || isSchedulingRule((value as any).schedulingRule))
  );
}

// =============================================================================
// SLOT GUARDS
// =============================================================================

export function isValidSlotData(value: unknown): value is {
  startTime: Date;
  endTime: Date;
  serviceId: string;
  duration: number;
  price: number;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'startTime' in value &&
    'endTime' in value &&
    'serviceId' in value &&
    'duration' in value &&
    'price' in value &&
    isValidDate((value as any).startTime) &&
    isValidDate((value as any).endTime) &&
    isValidUUID((value as any).serviceId) &&
    typeof (value as any).duration === 'number' &&
    (value as any).duration > 0 &&
    typeof (value as any).price === 'number' &&
    (value as any).price >= 0
  );
}

export function isValidBookingRequest(value: unknown): value is {
  slotId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'slotId' in value &&
    'customerName' in value &&
    'customerEmail' in value &&
    isValidUUID((value as any).slotId) &&
    typeof (value as any).customerName === 'string' &&
    (value as any).customerName.length > 0 &&
    typeof (value as any).customerEmail === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value as any).customerEmail) &&
    (!(value as any).customerPhone || typeof (value as any).customerPhone === 'string') &&
    (!(value as any).notes || typeof (value as any).notes === 'string')
  );
}

// =============================================================================
// RECURRENCE GUARDS
// =============================================================================

export function isValidRecurrencePattern(value: unknown): value is {
  option: string;
  endDate?: string;
  customDays?: string[];
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'option' in value &&
    isRecurrenceOption((value as any).option) &&
    (!(value as any).endDate || isValidDateString((value as any).endDate)) &&
    (!(value as any).customDays ||
      (Array.isArray((value as any).customDays) &&
        (value as any).customDays.every((day: unknown) => typeof day === 'string')))
  );
}

// =============================================================================
// SERVICE CONFIGURATION GUARDS
// =============================================================================

export function isValidServiceConfig(value: unknown): value is {
  serviceId: string;
  duration: number;
  price: number;
  isOnlineAvailable: boolean;
  isInPerson: boolean;
  locationId?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'serviceId' in value &&
    'duration' in value &&
    'price' in value &&
    'isOnlineAvailable' in value &&
    'isInPerson' in value &&
    isValidUUID((value as any).serviceId) &&
    typeof (value as any).duration === 'number' &&
    (value as any).duration > 0 &&
    typeof (value as any).price === 'number' &&
    (value as any).price >= 0 &&
    typeof (value as any).isOnlineAvailable === 'boolean' &&
    typeof (value as any).isInPerson === 'boolean' &&
    (!(value as any).locationId || isValidUUID((value as any).locationId))
  );
}

// =============================================================================
// SEARCH AND FILTER GUARDS
// =============================================================================

export function isValidSearchParams(value: unknown): value is {
  startDate?: string;
  endDate?: string;
  serviceIds?: string[];
  providerIds?: string[];
  locationIds?: string[];
  organizationId?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).startDate || isValidDateString((value as any).startDate)) &&
    (!(value as any).endDate || isValidDateString((value as any).endDate)) &&
    (!(value as any).serviceIds ||
      (Array.isArray((value as any).serviceIds) &&
        (value as any).serviceIds.every((id: unknown) => isValidUUID(id)))) &&
    (!(value as any).providerIds ||
      (Array.isArray((value as any).providerIds) &&
        (value as any).providerIds.every((id: unknown) => isValidUUID(id)))) &&
    (!(value as any).locationIds ||
      (Array.isArray((value as any).locationIds) &&
        (value as any).locationIds.every((id: unknown) => isValidUUID(id)))) &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId))
  );
}

// =============================================================================
// MIGRATION NOTES - API RESPONSE GUARDS REMOVED
// =============================================================================
//
// Server data validation guards have been removed as part of the dual-source
// type safety architecture migration. These validated server response shapes
// that are now handled by tRPC's automatic type inference.
//
// Removed guards:
// - isAvailabilityListResponse (server availability list validation)
// - isSlotSearchResponse (server slot search validation)
//
// Domain logic guards (enum validation, user input validation, etc.) remain
// below as they represent client-side business logic validation.
