import type { 
  Availability as PrismaAvailability,
  ServiceAvailabilityConfig as PrismaServiceAvailabilityConfig,
  CalculatedAvailabilitySlot as PrismaCalculatedAvailabilitySlot,
  ServiceProvider,
  Organization,
  Location,
  Service,
  User,
  OrganizationMembership,
  OrganizationProviderConnection,
  Subscription,
  Booking,
  CalendarEvent,
} from '@prisma/client';
import { 
  SchedulingRule, 
  AvailabilityStatus, 
  SlotStatus, 
  BillingEntity,
  RecurrenceType,
  DayOfWeek,
  AvailabilityContext,
} from './enums';

// Base availability interface extending Prisma type
export interface Availability extends PrismaAvailability {}

// Availability with related data for UI components
export interface AvailabilityWithRelations extends PrismaAvailability {
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
export interface ServiceAvailabilityConfig extends PrismaServiceAvailabilityConfig {}

export interface ServiceAvailabilityConfigWithRelations extends PrismaServiceAvailabilityConfig {
  service: Service;
  serviceProvider: ServiceProvider;
  location?: Location | null;
  availabilities: Availability[];
  calculatedSlots: CalculatedAvailabilitySlot[];
}

// Calculated availability slot interfaces
export interface CalculatedAvailabilitySlot extends PrismaCalculatedAvailabilitySlot {}

export interface CalculatedAvailabilitySlotWithRelations extends PrismaCalculatedAvailabilitySlot {
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
  conflictType: 'OVERLAPPING_AVAILABILITY' | 'PROVIDER_UNAVAILABLE' | 'LOCATION_UNAVAILABLE' | 'CALENDAR_CONFLICT';
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
  SchedulingRule as SchedulingRuleType,
  AvailabilityStatus as AvailabilityStatusType,
  SlotStatus as SlotStatusType,
  BillingEntity as BillingEntityType,
  RecurrenceType as RecurrenceTypeType,
  DayOfWeek as DayOfWeekType,
};