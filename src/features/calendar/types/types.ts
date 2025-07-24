// =============================================================================
// CALENDAR AVAILABILITY TYPES
// =============================================================================

/**
 * @fileoverview Comprehensive type definitions for the calendar availability feature.
 *
 * This module contains all type definitions related to calendar functionality including:
 * - Availability management and scheduling
 * - Slot generation and booking compatibility
 * - Recurrence patterns and series management
 * - Provider and organization calendar views
 * - Service configuration and billing integration
 * - Search and filtering capabilities
 * - External integrations (Google Calendar, etc.)
 *
 * The types are organized by complexity: Enums → Base Interfaces → Complex Types → Utility Types
 *
 * @author MedBookings Development Team
 * @version 1.0.0
 */
// All type definitions for the calendar availability feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import {
  Organization,
  OrganizationMembership,
  OrganizationProviderConnection,
  Prisma,
  User,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { Provider, Service } from '@/features/providers/types/types';

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

// Calendar view type constants and types moved from global directory
export const CalendarViewType = {
  slots: 'slots',
} as const;

export const ProviderCalendarViewType = {
  day: 'day',
  week: 'week',
  schedule: 'schedule',
} as const;

export type CalendarViewType = (typeof CalendarViewType)[keyof typeof CalendarViewType];
export type ProviderCalendarViewType =
  (typeof ProviderCalendarViewType)[keyof typeof ProviderCalendarViewType];

export interface TimeRange {
  earliestTime: number; // 24-hour format (e.g., 9 for 9:00, 13 for 13:00)
  latestTime: number; // 24-hour format (e.g., 17 for 17:00)
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

/**
 * Represents a calendar event that can be displayed in calendar views.
 * Supports different event types including availability slots, bookings, and blocked time.
 *
 * @interface CalendarEvent
 *
 * @example
 * ```typescript
 * const availability: CalendarEvent = {
 *   id: "av-123",
 *   type: "availability",
 *   title: "Available for Consultation",
 *   startTime: new Date("2024-01-15T09:00:00Z"),
 *   endTime: new Date("2024-01-15T17:00:00Z"),
 *   status: "ACCEPTED",
 *   schedulingRule: SchedulingRule.ON_THE_HOUR,
 *   service: {
 *     id: "srv-456",
 *     name: "General Consultation",
 *     duration: 30,
 *     price: 150
 *   }
 * };
 * ```
 */
export interface CalendarEvent {
  /** Unique identifier for the calendar event */
  id: string;
  /** Type of calendar event - determines display style and behavior */
  type: 'availability' | 'booking' | 'blocked';
  /** Display title for the event */
  title: string;
  /** Event start time */
  startTime: Date;
  /** Event end time */
  endTime: Date;
  /** Current status of the event */
  status: string;
  /** Scheduling rule for slot generation (availability events only) */
  schedulingRule?: SchedulingRule;
  /** Whether this event is part of a recurring series */
  isRecurring?: boolean;
  /** Series identifier for recurring events */
  seriesId?: string;
  /** Location information where the event takes place */
  location?: {
    id: string;
    name: string;
    isOnline: boolean;
  };
  /** Service information for the event */
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  /** Customer information for booking events */
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  /** Additional notes or description */
  notes?: string;
  /** Information about who created the event */
  createdBy?: {
    id: string;
    name: string;
    type: 'provider' | 'organization';
  };
  /** Organization context for the event */
  organization?: {
    id: string;
    name: string;
  };
  /** Whether the event was created by a provider (vs organization admin) */
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

/**
 * Defines recurrence patterns for repeating availability slots.
 * Supports Google Calendar-style recurrence options with customizable end dates.
 *
 * @interface RecurrencePattern
 *
 * @example
 * ```typescript
 * // Weekly recurrence every Monday for 3 months
 * const weeklyPattern: RecurrencePattern = {
 *   option: RecurrenceOption.WEEKLY,
 *   weeklyDay: DayOfWeek.MONDAY,
 *   endDate: "2024-04-15"
 * };
 *
 * // Custom recurrence on specific days
 * const customPattern: RecurrencePattern = {
 *   option: RecurrenceOption.CUSTOM,
 *   customDays: [
 *     DayOfWeek.MONDAY,
 *     DayOfWeek.WEDNESDAY,
 *     DayOfWeek.FRIDAY
 *   ],
 *   endDate: "2024-06-30"
 * };
 * ```
 */
export interface RecurrencePattern {
  /** Type of recurrence pattern */
  option: RecurrenceOption;
  /** Specific day of week for weekly recurrence (auto-determined from start date) */
  weeklyDay?: DayOfWeek;
  /** Array of days for custom weekly recurrence pattern */
  customDays?: DayOfWeek[];
  /** End date for recurrence in YYYY-MM-DD format (required for non-NONE options) */
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
// SERVICE LAYER TYPES (moved from lib files)
// =============================================================================

// Location Search Service Types
export interface LocationSearchParams {
  coordinates: {
    lat: number;
    lng: number;
  };
  maxDistance: number;
  serviceTypes?: string[];
  preferredDate?: Date;
  preferredTime?: string;
  duration?: number;
  isOnlineAvailable?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface ProviderLocationResult {
  providerId: string;
  providerName: string;
  providerType: string;
  distance: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  location?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  availableServices: Array<{
    serviceId: string;
    serviceName: string;
    duration: number;
    price: number;
    showPrice: boolean;
  }>;
  nearestAvailableSlot?: {
    slotId: string;
    startTime: Date;
    endTime: Date;
    isOnlineAvailable: boolean;
    price: number;
  };
  totalAvailableSlots: number;
}

// Time Search Service Types
export interface TimeSearchParams {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  specificDate?: Date;
  timeRange?: {
    startTime: string; // Format: "HH:MM" (24-hour)
    endTime: string; // Format: "HH:MM" (24-hour)
  };
  preferredTimes?: string[]; // Array of preferred times ["09:00", "14:30"]
  timeFlexibility?: number; // Minutes of flexibility around preferred times
  dayOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
  minDuration?: number; // Minimum appointment duration in minutes
  maxDuration?: number; // Maximum appointment duration in minutes
}

export interface TimeFilteredSlot {
  slotId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  dayOfWeek: number;
  timeOfDay: string;
  isWeekend: boolean;
  providerId: string;
  serviceId: string;
  locationId?: string;
  price: number;
  isOnlineAvailable: boolean;
  status: string;
}

export interface TimeSearchResult {
  totalSlotsFound: number;
  slotsInTimeRange: TimeFilteredSlot[];
  availableDates: Date[];
  availableTimeSlots: Array<{
    time: string;
    slotCount: number;
    avgPrice: number;
  }>;
  dayOfWeekStats: Array<{
    dayOfWeek: number;
    dayName: string;
    slotCount: number;
    earliestTime: string;
    latestTime: string;
  }>;
}

// Availability Validation Types (moved from availability-validation.ts)
export interface AvailabilityValidationOptions {
  providerId: string;
  startTime: Date;
  endTime: Date;
  excludeAvailabilityId?: string; // For update operations
  instances?: Array<{ startTime: Date; endTime: Date }>; // For recurring validation
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Slot Generation Types (moved from slot-generation.ts)
export interface SlotGenerationOptions {
  availabilityId: string;
  startTime: Date;
  endTime: Date;
  providerId: string;
  organizationId: string;
  locationId?: string;
  schedulingRule: SchedulingRule;
  schedulingInterval?: number;
  services: Array<{
    serviceId: string;
    duration: number;
    price: number;
  }>;
}

export interface SlotGenerationResult {
  success: boolean;
  slotsGenerated: number;
  errors?: string[];
}

// Workflow Service Types
export interface WorkflowResult {
  success: boolean;
  availability?: AvailabilityWithRelations;
  slotsGenerated?: number;
  error?: string;
  notifications?: {
    sent: number;
    failed: number;
  };
}

// Booking Integration Types
export interface BookingValidationResult {
  isValid: boolean;
  slot?: any;
  availability?: any;
  conflicts: string[];
  warnings: string[];
  schedulingRuleCompliant: boolean;
  requiresConfirmation: boolean;
  estimatedDuration: number;
  price: number;
}

export interface SlotBookingRequest {
  slotId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  preferredStartTime?: Date;
}

export interface BookingCompatibilityCheck {
  slotId: string;
  requestedStartTime?: Date;
  requestedDuration?: number;
  schedulingRule: SchedulingRule;
  schedulingInterval?: number;
  isCompatible: boolean;
  adjustedStartTime?: Date;
  adjustedEndTime?: Date;
  reason?: string;
}

// Slot Cleanup Service Types
export interface CleanupOptions {
  preserveBookedSlots?: boolean;
  notifyAffectedCustomers?: boolean;
  createCancellationRecords?: boolean;
  cleanupOrphanedSlots?: boolean;
}

export interface CleanupResult {
  totalSlotsProcessed: number;
  slotsDeleted: number;
  slotsMarkedUnavailable: number;
  bookingsAffected: number;
  customersNotified: number;
  errors: string[];
  warnings: string[];
  processingTimeMs: number;
}

export interface SeriesCleanupResult extends CleanupResult {
  availabilitiesProcessed: number;
  availabilitiesDeleted: number;
  seriesId: string;
}

// Communication Service Type (moved from types.ts)
export interface BookingView {
  id: string;
  status: string;
  notificationPreferences: {
    whatsapp: boolean;
  };
  guestInfo: {
    name: string;
    whatsapp?: string;
  };
  slot: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
    service: {
      id: string;
      name: string;
      description?: string;
      displayPriority?: number;
    };
    serviceConfig: {
      id: string;
      price: number;
      duration: number;
      isOnlineAvailable: boolean;
      isInPerson: boolean;
      location?: string;
    };
    provider: {
      id: string;
      name: string;
      whatsapp?: string;
      image?: string;
    };
  };
}

// Notification Service Types (moved from notification-service.ts)
export interface NotificationPayload {
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  type: 'email' | 'sms' | 'in_app';
  subject: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface AvailabilityNotificationContext {
  availability: AvailabilityWithRelations;
  previousStatus?: AvailabilityStatus;
  newStatus: AvailabilityStatus;
  actionBy: {
    id: string;
    name: string;
    role: string;
  };
  rejectionReason?: string;
}

// Service Filter Types (moved from service-filter-service.ts)
export interface ServiceFilterParams {
  serviceTypeIds?: string[]; // Service type IDs (e.g., "consultation", "imaging")
  serviceIds?: string[]; // Specific service IDs
  serviceNames?: string[]; // Service names for text-based filtering
  serviceCategories?: string[]; // Service categories
  providerTypeIds?: string[]; // Healthcare provider types
  specializations?: string[]; // Provider specializations
  priceRange?: {
    min?: number;
    max?: number;
  };
  durationRange?: {
    min?: number; // minutes
    max?: number; // minutes
  };
  excludeServices?: string[]; // Service IDs to exclude
  includeInactive?: boolean; // Include inactive services (default: false)
}

export interface ServiceResult {
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  serviceCategory?: string;
  serviceType: {
    id: string;
    name: string;
    category?: string;
  };
  provider: {
    id: string;
    name: string;
    type: string;
    specialization?: string;
  };
  pricing: {
    price: number;
    showPrice: boolean;
    defaultDuration: number;
    minDuration?: number;
    maxDuration?: number;
  };
  availability: {
    hasSlots: boolean;
    nextAvailableSlot?: Date;
    totalSlots: number;
    locations: Array<{
      locationId?: string;
      locationName?: string;
      isOnline: boolean;
    }>;
  };
  rating?: number;
  reviewCount?: number;
}

export interface ServiceFilterResult {
  services: ServiceResult[];
  totalCount: number;
  serviceTypes: Array<{
    id: string;
    name: string;
    count: number;
    category?: string;
  }>;
  providerTypes: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  durationRange: {
    min: number;
    max: number;
    average: number;
  };
  categories: Array<{
    name: string;
    count: number;
    services: string[];
  }>;
}

// Conflict Management Types (moved from conflict-management.ts)
export interface ConflictDetectionOptions {
  checkOverlappingSlots?: boolean;
  checkCalendarEvents?: boolean;
  checkSchedulingRules?: boolean;
  checkLocationConflicts?: boolean;
  checkProviderAvailability?: boolean;
  bufferTimeMinutes?: number; // Buffer time between appointments
}

export interface ConflictResolutionResult {
  originalSlotsCount: number;
  validSlotsCount: number;
  conflictedSlotsCount: number;
  resolvedConflictsCount: number;
  conflicts: AvailabilityConflict[];
  validSlots: any[];
  conflictedSlots: any[];
}

export interface SlotConflictDetails {
  slotId?: string;
  startTime: Date;
  endTime: Date;
  conflictType:
    | 'OVERLAPPING_SLOTS'
    | 'CALENDAR_EVENT'
    | 'SCHEDULING_RULE'
    | 'LOCATION_CONFLICT'
    | 'PROVIDER_UNAVAILABLE';
  conflictingEntityId?: string;
  conflictingEntityType?: 'slot' | 'event' | 'availability' | 'location';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  canAutoResolve: boolean;
  suggestedResolution?: string;
}

// Search Performance Types (moved from search-performance-service.ts)
export interface SearchPerformanceOptions {
  enableCaching?: boolean;
  useIndexHints?: boolean;
  limitResults?: number;
  enableParallelQueries?: boolean;
  optimizeForDistance?: boolean;
  prefetchRelations?: boolean;
}

export interface PerformanceMetrics {
  queryExecutionTime: number;
  totalResults: number;
  indexesUsed: string[];
  cacheHitRatio?: number;
  memoryUsage?: number;
  optimizationSuggestions: string[];
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

export interface SlotGenerationResultDetailed {
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

// =============================================================================
// PRISMA-DERIVED TYPES
// =============================================================================

// Availability with comprehensive relations for detailed views
export type AvailabilityDetailSelect = Prisma.AvailabilityGetPayload<{
  include: {
    provider: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            phone: true;
          };
        };
        typeAssignments: {
          include: {
            providerType: {
              select: {
                id: true;
                name: true;
              };
            };
          };
        };
      };
    };
    organization: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    location: {
      select: {
        id: true;
        name: true;
        formattedAddress: true;
        phone: true;
        email: true;
      };
    };
    providerConnection: {
      select: {
        id: true;
        status: true;
        defaultBilledBy: true;
      };
    };
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    acceptedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    defaultSubscription: {
      select: {
        id: true;
        status: true;
        type: true;
        plan: {
          select: {
            id: true;
            name: true;
            basePrice: true;
            currency: true;
          };
        };
      };
    };
    availableServices: {
      include: {
        service: {
          select: {
            id: true;
            name: true;
            description: true;
            serviceType: {
              select: {
                id: true;
                name: true;
                category: true;
              };
            };
          };
        };
      };
    };
    calculatedSlots: {
      select: {
        id: true;
        startTime: true;
        endTime: true;
        status: true;
        booking: {
          select: {
            id: true;
            status: true;
            guestName: true;
            guestEmail: true;
          };
        };
      };
    };
  };
}>;

// Availability for list views (minimal relations)
export type AvailabilityListSelect = Prisma.AvailabilityGetPayload<{
  include: {
    provider: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    organization: {
      select: {
        id: true;
        name: true;
      };
    };
    location: {
      select: {
        id: true;
        name: true;
        formattedAddress: true;
      };
    };
    _count: {
      select: {
        calculatedSlots: true;
        availableServices: true;
      };
    };
  };
}>;

// Calculated slot with full relations for booking views
export type CalculatedSlotDetailSelect = Prisma.CalculatedAvailabilitySlotGetPayload<{
  include: {
    availability: {
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true;
                name: true;
                email: true;
                phone: true;
              };
            };
          };
        };
        organization: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
        location: {
          select: {
            id: true;
            name: true;
            formattedAddress: true;
            phone: true;
          };
        };
      };
    };
    service: {
      select: {
        id: true;
        name: true;
        description: true;
        serviceType: {
          select: {
            id: true;
            name: true;
            category: true;
          };
        };
      };
    };
    serviceConfig: {
      select: {
        id: true;
        duration: true;
        price: true;
        isOnlineAvailable: true;
      };
    };
    booking: {
      select: {
        id: true;
        status: true;
        guestName: true;
        guestEmail: true;
        guestPhone: true;
        notes: true;
        createdAt: true;
      };
    };
    billedToSubscription: {
      select: {
        id: true;
        status: true;
        type: true;
      };
    };
  };
}>;

// Service availability config with relations
export type ServiceConfigDetailSelect = Prisma.ServiceAvailabilityConfigGetPayload<{
  include: {
    service: {
      select: {
        id: true;
        name: true;
        description: true;
        serviceType: {
          select: {
            id: true;
            name: true;
            category: true;
          };
        };
      };
    };
    provider: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    location: {
      select: {
        id: true;
        name: true;
        formattedAddress: true;
      };
    };
  };
}>;
