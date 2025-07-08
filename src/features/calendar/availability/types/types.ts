// =============================================================================
// CALENDAR AVAILABILITY TYPES
// =============================================================================
// All type definitions for the calendar availability feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import { Decimal } from '@prisma/client/runtime/library';

import { Service } from '@/features/providers/types';

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
  FIXED_INTERVAL = 'FIXED_INTERVAL',
  CUSTOM_INTERVAL = 'CUSTOM_INTERVAL',
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

// Recurrence and scheduling enums
export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
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

export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  email?: string | null;
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
  avatar?: string;
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

export interface OrganizationCalendarViewProps {
  organizationId: string;
  onProviderClick?: (provider: OrganizationProvider) => void;
  onEventClick?: (event: CalendarEvent, provider: OrganizationProvider) => void;
  onTimeSlotClick?: (date: Date, hour: number, provider: OrganizationProvider) => void;
  onCreateAvailability?: (providerId?: string) => void;
  onManageProvider?: (provider: OrganizationProvider) => void;
  onGapClick?: (gap: CoverageGap) => void;
  onRecommendationClick?: (recommendation: string) => void;
  viewMode?: 'day' | 'week' | 'month';
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
}

// =============================================================================
// AVAILABILITY INTERFACES
// =============================================================================

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

export interface AvailabilityWithRelations extends Availability {
  serviceProvider: ServiceProvider;
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
  serviceProviderId: string;
  locationId?: string | null;
  duration: number;
  price: Decimal;
  showPrice: boolean;
  isOnlineAvailable: boolean;
  isInPerson: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAvailabilityConfigWithRelations extends ServiceAvailabilityConfig {
  service: Service;
  serviceProvider?: ServiceProvider;
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
  schedulingInterval?: number; // in minutes, for CUSTOM_INTERVAL
  alignToHour?: boolean; // for FIXED_INTERVAL
  alignToHalfHour?: boolean; // for FIXED_INTERVAL
  alignToQuarterHour?: boolean; // for FIXED_INTERVAL
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
  interval?: number; // For CUSTOM_INTERVAL
  alignToHour?: boolean; // For FIXED_INTERVAL
  alignToHalfHour?: boolean; // For FIXED_INTERVAL
  alignToQuarterHour?: boolean; // For FIXED_INTERVAL
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
  serviceProviderId: string;
  estimatedSlots: number;
  estimatedCost: number;
}

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
