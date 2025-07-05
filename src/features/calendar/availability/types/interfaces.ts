// Client-safe interface definitions (no Prisma imports)
import {
  AvailabilityContext,
  AvailabilityStatus,
  BillingEntity,
  DayOfWeek,
  RecurrenceType,
  SchedulingRule,
  SlotStatus,
} from './enums';

// Base types (client-safe versions of Prisma types)
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
}

export interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  serviceProviderTypeId?: string | null;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
}

export interface Subscription {
  id: string;
  name: string;
  status: string;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
}

export interface OrganizationProviderConnection {
  id: string;
  organizationId: string;
  serviceProviderId: string;
  status: string;
  serviceProvider: ServiceProvider;
}

export interface Booking {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

// Base availability interface
export interface Availability {
  id: string;
  serviceProviderId: string;
  organizationId?: string | null;
  locationId?: string | null;
  connectionId?: string | null;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: any; // JSON field
  seriesId?: string | null;
  status: AvailabilityStatus;
  schedulingRule: SchedulingRule;
  schedulingInterval?: number | null;
  isOnlineAvailable: boolean;
  requiresConfirmation: boolean;
  billingEntity?: BillingEntity | null;
  defaultSubscriptionId?: string | null;
  createdById: string;
  createdByMembershipId?: string | null;
  acceptedById?: string | null;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Availability with related data for UI components
export interface AvailabilityWithRelations extends Availability {
  serviceProvider: ServiceProvider;
  organization?: Organization | null;
  location?: Location | null;
  providerConnection?: OrganizationProviderConnection | null;
  createdBy: User;
  createdByMembership?: OrganizationMembership | null;
  acceptedBy?: User | null;
  defaultSubscription?: Subscription | null;
  availableServices: ServiceAvailabilityConfigWithRelations[];
  calculatedSlots: CalculatedAvailabilitySlotWithRelations[];
}

// Service availability configuration interfaces
export interface ServiceAvailabilityConfig {
  id: string;
  serviceId: string;
  serviceProviderId: string;
  locationId?: string | null;
  duration: number;
  price: number;
  showPrice: boolean;
  isOnlineAvailable: boolean;
  isInPerson: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAvailabilityConfigWithRelations extends ServiceAvailabilityConfig {
  service: Service;
  serviceProvider: ServiceProvider;
  location?: Location | null;
  availabilities: Availability[];
  calculatedSlots: CalculatedAvailabilitySlot[];
}

// Calculated availability slot interfaces
export interface CalculatedAvailabilitySlot {
  id: string;
  availabilityId: string;
  serviceId: string;
  serviceConfigId: string;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
  bookingId?: string | null;
  billedToSubscriptionId?: string | null;
  blockedByCalendarEventId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalculatedAvailabilitySlotWithRelations extends CalculatedAvailabilitySlot {
  availability: AvailabilityWithRelations;
  service: Service;
  serviceConfig: ServiceAvailabilityConfigWithRelations;
  booking?: Booking | null;
  billedToSubscription?: Subscription | null;
  blockedByCalendarEvent?: CalendarEvent | null;
}

// Recurrence pattern interface (for JSON field)
export interface RecurrencePattern {
  type: RecurrenceType;
  interval?: number; // For custom intervals (e.g., every 2 weeks)
  daysOfWeek?: DayOfWeek[]; // For weekly patterns
  dayOfMonth?: number; // For monthly patterns (1-31)
  weekOfMonth?: number; // For monthly patterns (1-4, or -1 for last week)
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  endDate?: string; // YYYY-MM-DD format
  count?: number; // Number of occurrences
  exceptions?: string[]; // Array of dates to exclude (YYYY-MM-DD format)
}

// Time slot interface for UI components
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  isAvailable: boolean;
  price?: number;
  serviceId: string;
  serviceName: string;
  slotId?: string; // If slot exists in database
}

// Availability creation/update interfaces
export interface CreateAvailabilityData {
  serviceProviderId: string;
  organizationId?: string;
  locationId?: string;
  connectionId?: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  seriesId?: string;
  schedulingRule: SchedulingRule;
  schedulingInterval?: number;
  isOnlineAvailable: boolean;
  requiresConfirmation: boolean;
  billingEntity?: BillingEntity;
  defaultSubscriptionId?: string;
  services: {
    serviceId: string;
    duration: number;
    price: number;
    showPrice: boolean;
    isOnlineAvailable: boolean;
    isInPerson: boolean;
    locationId?: string;
  }[];
}

export interface UpdateAvailabilityData extends Partial<CreateAvailabilityData> {
  id: string;
}

// Availability search/filter interfaces
export interface AvailabilitySearchParams {
  serviceProviderId?: string;
  organizationId?: string;
  locationId?: string;
  serviceId?: string;
  startDate?: Date;
  endDate?: Date;
  isOnlineAvailable?: boolean;
  status?: AvailabilityStatus;
  schedulingRule?: SchedulingRule;
  seriesId?: string;
}

export interface SlotSearchParams {
  serviceProviderId?: string;
  organizationId?: string;
  locationId?: string;
  serviceId?: string;
  startDate?: Date;
  endDate?: Date;
  isOnlineAvailable?: boolean;
  status?: SlotStatus;
  minDuration?: number;
  maxDuration?: number;
  maxDistance?: number; // for location-based search
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Scheduling rule configuration
export interface SchedulingRuleConfig {
  rule: SchedulingRule;
  interval?: number; // For CUSTOM_INTERVAL
  alignToHour?: boolean; // For FIXED_INTERVAL
  alignToHalfHour?: boolean; // For FIXED_INTERVAL
  alignToQuarterHour?: boolean; // For FIXED_INTERVAL
}

// Slot generation interfaces
export interface SlotGenerationRequest {
  availabilityId: string;
  forceRegenerate?: boolean;
}

export interface SlotGenerationResult {
  availabilityId: string;
  slotsGenerated: number;
  slotsConflicted: number;
  errors: string[];
  duration: number; // generation time in ms
}

// Conflict detection interfaces
export interface AvailabilityConflict {
  conflictType:
    | 'OVERLAPPING_AVAILABILITY'
    | 'PROVIDER_UNAVAILABLE'
    | 'LOCATION_UNAVAILABLE'
    | 'CALENDAR_CONFLICT';
  conflictingAvailabilityId?: string;
  conflictingEventId?: string;
  message: string;
  startTime: Date;
  endTime: Date;
}

// Availability series management
export interface AvailabilitySeries {
  seriesId: string;
  masterAvailabilityId: string;
  recurrencePattern: RecurrencePattern;
  instances: Availability[];
  totalInstances: number;
  activeInstances: number;
  createdAt: Date;
  lastModified: Date;
}

// Billing context for availability
export interface AvailabilityBillingContext {
  billingEntity: BillingEntity;
  subscriptionId?: string;
  organizationId?: string;
  locationId?: string;
  serviceProviderId: string;
  estimatedSlots: number;
  estimatedCost: number;
}

// Export types for external use
export type AvailabilityContextType = AvailabilityContext;
export type {
  AvailabilityStatus as AvailabilityStatusType,
  BillingEntity as BillingEntityType,
  DayOfWeek as DayOfWeekType,
  RecurrenceType as RecurrenceTypeType,
  SchedulingRule as SchedulingRuleType,
  SlotStatus as SlotStatusType,
};
