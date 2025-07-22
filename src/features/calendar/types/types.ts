// =============================================================================
// CALENDAR AVAILABILITY TYPES
// =============================================================================
// All type definitions for the calendar availability feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import {
  Organization,
  OrganizationMembership,
  OrganizationProviderConnection,
  User,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { Provider, Service } from '@/features/providers/types';

// =============================================================================
// ENUMS
// =============================================================================

// Core availability enums (matching Prisma schema)
export enum AvailabilityStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum SchedulingRule {
  CONTINUOUS = 'CONTINUOUS',
  ON_THE_HOUR = 'ON_THE_HOUR',
  ON_THE_HALF_HOUR = 'ON_THE_HALF_HOUR',
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
  INVALID = 'INVALID',
}

export enum BillingEntity {
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  PROVIDER = 'PROVIDER',
}

// Simplified recurrence options (Google Calendar style)
export enum RecurrenceOption {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom',
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// Context and status enums
export enum AvailabilityContext {
  PROVIDER_CREATED = 'provider_created',
  ORGANIZATION_PROPOSED = 'organization_proposed',
}

export enum SlotGenerationStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// =============================================================================
// BASE INTERFACES (Client-safe versions of Prisma types)
// =============================================================================

export interface OrganizationProvider {
  id: string;
  name: string;
  type: string;
  specialization?: string;
  isActive: boolean;
  workingHours: { start: string; end: string };
  utilizationRate: number;
  totalBookings: number;
  pendingBookings: number;
  events: CalendarEvent[];
}

export interface OrganizationCalendarData {
  organizationId: string;
  organizationName: string;
  providers: OrganizationProvider[];
  locations: Array<{
    id: string;
    name: string;
    address: string;
    providerCount: number;
  }>;
  stats: {
    totalProviders: number;
    activeProviders: number;
    totalAvailableHours: number;
    totalBookedHours: number;
    averageUtilization: number;
    totalPendingBookings: number;
    coverageGaps: number;
  };
}

// =============================================================================
// CALENDAR VIEW TYPES
// =============================================================================

export type CalendarViewMode = 'day' | '3-day' | 'week' | 'month';

export interface OrganizationCalendarViewProps {
  organizationId: string;
  onProviderClick?: (provider: OrganizationProvider) => void;
  onEventClick?: (event: CalendarEvent, provider: OrganizationProvider) => void;
  onTimeSlotClick?: (date: Date, hour: number, provider: OrganizationProvider) => void;
  onCreateAvailability?: (providerId?: string) => void;
  onManageProvider?: (provider: OrganizationProvider) => void;
  onGapClick?: (gap: CoverageGap) => void;
  onRecommendationClick?: (recommendation: string) => void;
  viewMode?: CalendarViewMode;
  initialDate?: Date;
  showCoverageGaps?: boolean;
}

export interface OrganizationWeekViewProps {
  currentDate: Date;
  providers: OrganizationProvider[];
  onEventClick?: (event: CalendarEvent, provider: OrganizationProvider) => void;
  onTimeSlotClick?: (date: Date, hour: number, provider: OrganizationProvider) => void;
  getEventStyle: (event: CalendarEvent) => string;
  showUtilizationOnly: boolean;
}

export interface OrganizationMonthViewProps {
  currentDate: Date;
  providers: OrganizationProvider[];
  onEventClick?: (event: CalendarEvent, provider: OrganizationProvider) => void;
  getEventStyle: (event: CalendarEvent) => string;
}

export interface Location {
  id: string;
  name: string;
  formattedAddress: string;
  coordinates?: any; // JSON field with lat/lng
  phone?: string | null;
  email?: string | null;
}

export interface Subscription {
  id: string;
  status: string;
  type?: string;
  isActive?: boolean;
}

export interface Booking {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date;
}

export interface CalendarEvent {
  id: string;
  type: 'availability' | 'booking' | 'blocked';
  title: string;
  startTime: Date;
  endTime: Date;
  status: string;
  schedulingRule?: SchedulingRule;
  isRecurring?: boolean;
  seriesId?: string;
  location?: {
    id: string;
    name: string;
    isOnline: boolean;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  notes?: string;
  // Creator information for availabilities
  createdBy?: {
    id: string;
    name: string;
    type: 'provider' | 'organization';
  };
  organization?: {
    id: string;
    name: string;
  };
  isProviderCreated?: boolean;
}

// =============================================================================
// AVAILABILITY INTERFACES
// =============================================================================

export interface Availability {
  id: string;
  providerId: string;
  organizationId?: string | null;
  locationId?: string | null;
  connectionId?: string | null;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: any | null; // JSON field from Prisma
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
  isProviderCreated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilityWithRelations extends Availability {
  provider: Provider;
  organization?: Organization | null;
  location?: Location | null;
  providerConnection?: OrganizationProviderConnection | null;
  createdBy: User;
  createdByMembership?: OrganizationMembership | null;
  acceptedBy?: User | null;
  defaultSubscription?: Subscription | null;
  availableServices?: ServiceAvailabilityConfigWithRelations[];
  calculatedSlots?: CalculatedAvailabilitySlotWithRelations[];
}

export interface ServiceAvailabilityConfig {
  id: string;
  serviceId: string;
  providerId: string;
  locationId?: string | null;
  duration: number;
  price: Decimal;
  isOnlineAvailable: boolean;
  isInPerson: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAvailabilityConfigWithRelations extends ServiceAvailabilityConfig {
  service: Service;
  provider?: Provider;
  location?: Location | null;
  availabilities?: Availability[];
  calculatedSlots?: CalculatedAvailabilitySlot[];
}

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
  availability?: AvailabilityWithRelations;
  service?: Service;
  serviceConfig?: ServiceAvailabilityConfigWithRelations;
  booking?: Booking | null;
  billedToSubscription?: Subscription | null;
  blockedByCalendarEvent?: CalendarEvent | null;
}

// =============================================================================
// RECURRENCE AND PATTERNS
// =============================================================================

// Recurrence pattern (Google Calendar style)
export interface RecurrencePattern {
  option: RecurrenceOption;
  // For weekly recurrence (determined from start date)
  weeklyDay?: DayOfWeek;
  // For custom weekly recurrence
  customDays?: DayOfWeek[];
  // End date for all recurrence types (required for non-NONE options)
  endDate?: string; // YYYY-MM-DD format - required for DAILY, WEEKLY, and CUSTOM
}

// Custom recurrence modal data
export interface CustomRecurrenceData {
  selectedDays: DayOfWeek[];
  endDate: Date; // Required - no longer optional
}

// Helper type for day of week display
export interface DayOfWeekOption {
  value: DayOfWeek;
  label: string;
  shortLabel: string;
}

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

// =============================================================================
// COVERAGE ANALYSIS TYPES
// =============================================================================

export interface CoverageGap {
  id: string;
  type: 'no_coverage' | 'insufficient_coverage' | 'skill_gap' | 'location_gap';
  startTime: Date;
  endTime: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedLocations: string[];
  requiredSkills: string[];
  suggestedActions: string[];
  impactScore: number;
  coveragePercentage: number;
}

export interface CoverageAnalysis {
  totalGaps: number;
  criticalGaps: number;
  highPriorityGaps: number;
  averageCoveragePercentage: number;
  gaps: CoverageGap[];
  recommendations: string[];
  coverageByHour: Array<{
    hour: number;
    date: Date;
    providerCount: number;
    coveragePercentage: number;
    gaps: CoverageGap[];
  }>;
}

export interface CoverageRequirements {
  minProvidersPerHour: number;
  requiredSkills: string[];
  businessHours: { start: number; end: number };
  workingDays: number[]; // 0-6, Sunday-Saturday
  locationRequirements: Array<{
    locationId: string;
    minProviders: number;
    requiredSkills: string[];
  }>;
}

// =============================================================================
// EXPORT FUNCTIONALITY TYPES
// =============================================================================

export interface ExportConfig {
  format: 'ical' | 'csv' | 'json' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeFields: {
    eventDetails: boolean;
    customerInfo: boolean;
    serviceInfo: boolean;
    locationInfo: boolean;
    notes: boolean;
    recurringInfo: boolean;
  };
  filters: {
    eventTypes: ('availability' | 'booking' | 'blocked')[];
    statuses: string[];
    providers: string[];
    locations: string[];
  };
  customization: {
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    includePrivateEvents: boolean;
    anonymizeCustomerData: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  format: string;
  filename: string;
  data?: string | Blob;
  downloadUrl?: string;
  eventCount: number;
  errors?: string[];
  metadata: {
    exportedAt: Date;
    timezone: string;
    totalEvents: number;
    filteredEvents: number;
  };
}

export interface GoogleCalendarIntegration {
  enabled: boolean;
  calendarId?: string;
  syncDirection: 'import' | 'export' | 'bidirectional';
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

// =============================================================================
// SEARCH AND FILTERING TYPES
// =============================================================================

export interface AvailabilitySearchParams {
  providerId?: string;
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
  providerId?: string;
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

// =============================================================================
// SCHEDULING AND SLOT GENERATION TYPES
// =============================================================================

// Simple time slot for scheduling rules
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

// Comprehensive time slot for UI and business logic
export interface TimeSlotWithDetails {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  isAvailable: boolean;
  price?: number;
  serviceId: string;
  serviceName: string;
  slotId?: string; // If slot exists in database
}

// Internal slot representation for generation
export interface GeneratedSlot {
  availabilityId: string;
  serviceId: string;
  serviceConfigId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  price: number;
  isOnlineAvailable: boolean;
  status: SlotStatus;
  billedToSubscriptionId?: string;
  locationId?: string;
}

// Options for scheduling rule generation
export interface SchedulingOptions {
  availabilityStart: Date;
  availabilityEnd: Date;
  serviceDuration: number; // in minutes
  schedulingRule: SchedulingRule;
  schedulingInterval?: number; // in minutes (deprecated)
}

// Result from time slot generation
export interface TimeSlotGenerationResult {
  slots: TimeSlot[];
  totalSlots: number;
  errors: string[];
}

// =============================================================================
// CRUD OPERATION TYPES
// =============================================================================

export interface CreateAvailabilityData {
  providerId: string;
  organizationId?: string;
  locationId?: string;
  connectionId?: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: any; // JSON field to match Prisma schema
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
  }[];
}

export interface UpdateAvailabilityData extends Partial<CreateAvailabilityData> {
  id: string;
}

// =============================================================================
// SCHEDULING AND SLOT GENERATION TYPES
// =============================================================================

export interface SchedulingRuleConfig {
  rule: SchedulingRule;
}

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

// =============================================================================
// BILLING AND CONTEXT TYPES
// =============================================================================

export interface AvailabilityBillingContext {
  billingEntity: BillingEntity;
  subscriptionId?: string;
  organizationId?: string;
  locationId?: string;
  providerId: string;
  estimatedSlots: number;
  estimatedCost: number;
}

// =============================================================================
// PRISMA INCLUDE CONFIGURATIONS
// =============================================================================

// Helper function to include common availability relations
export const includeAvailabilityRelations = {
  serviceProvider: true,
  organization: true,
  location: true,
  providerConnection: true,
  createdBy: true,
  createdByMembership: true,
  acceptedBy: true,
  defaultSubscription: true,
  availableServices: {
    include: {
      service: true,
      serviceProvider: true,
      location: true,
    },
  },
  calculatedSlots: {
    include: {
      service: true,
      booking: true,
      billedToSubscription: true,
      blockedByCalendarEvent: true,
    },
  },
};

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

export type AvailabilityContextType = AvailabilityContext;

// Default configurations
export const getDefaultExportConfig = (): ExportConfig => ({
  format: 'ical',
  dateRange: {
    start: new Date(),
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  includeFields: {
    eventDetails: true,
    customerInfo: true,
    serviceInfo: true,
    locationInfo: true,
    notes: false,
    recurringInfo: true,
  },
  filters: {
    eventTypes: ['availability', 'booking'],
    statuses: [],
    providers: [],
    locations: [],
  },
  customization: {
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    includePrivateEvents: false,
    anonymizeCustomerData: false,
  },
});
