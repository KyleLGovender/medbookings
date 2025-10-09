/**
 * =============================================================================
 * CALENDAR AVAILABILITY TYPES
 * =============================================================================
 *
 * Comprehensive type definitions for the calendar availability feature.
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
// Import database enums from Prisma to prevent type drift
import {
  AvailabilityStatus,
  BillingEntity,
  BookingStatus,
  ProviderStatus,
  SchedulingRule,
  SlotStatus,
} from '@prisma/client';

import { nowUTC } from '@/lib/timezone';
// Import tRPC types for server data
import type { RouterOutputs } from '@/utils/api';

// CalendarEvent type removed - use AvailabilityData from RouterOutputs directly
type AvailabilityData = RouterOutputs['calendar']['searchAvailability'][number];

// =============================================================================
// MIGRATION NOTES - SERVER DATA IMPORTS REMOVED
// =============================================================================
//
// Removed server data imports:
// - Prisma client types (Organization, User, etc.)
// - Cross-feature dependencies (Provider, Service from providers)
// - Decimal type from Prisma runtime
//
// Components will use tRPC RouterOutputs for server data in Task 4.0
// Cross-feature types will be handled through tRPC procedures

// =============================================================================
// ENUMS (UI-SPECIFIC ONLY - Database enums imported from Prisma)
// =============================================================================

// NOTE: Database enums (AvailabilityStatus, BillingEntity, SchedulingRule, SlotStatus)
// are imported from @prisma/client to prevent type drift

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

/**
 * Slot creation data for database operations
 * Matches CalculatedAvailabilitySlot schema structure for slot generation
 *
 * @property {string} availabilityId - Reference to parent availability block
 * @property {string} serviceId - Service being offered in this slot
 * @property {string} serviceConfigId - Service configuration with pricing and duration
 * @property {Date} startTime - Slot start time in UTC
 * @property {Date} endTime - Slot end time in UTC
 * @property {SlotStatus} status - Current slot status (AVAILABLE, BOOKED, BLOCKED, etc.)
 * @property {Date} lastCalculated - Timestamp of last slot calculation
 * @property {number} version - Optimistic locking version number
 * @property {string} [billedToSubscriptionId] - Subscription being billed for this slot
 * @property {string} [blockedByEventId] - External calendar event blocking this slot
 */
export interface SlotCreateData {
  availabilityId: string;
  serviceId: string;
  serviceConfigId: string;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
  lastCalculated: Date;
  version: number;
  billedToSubscriptionId?: string;
  blockedByEventId?: string;
}

/**
 * Provider information for organization calendar views
 * Contains provider details, working hours, utilization metrics, and associated events
 *
 * @property {string} id - Unique provider identifier
 * @property {string} name - Provider display name
 * @property {string} type - Provider type (doctor, nurse, specialist, etc.)
 * @property {string} [specialization] - Provider medical specialization
 * @property {boolean} isActive - Whether provider is currently active
 * @property {object} workingHours - Standard working hours configuration
 * @property {string} workingHours.start - Working day start time (HH:MM format)
 * @property {string} workingHours.end - Working day end time (HH:MM format)
 * @property {number} utilizationRate - Provider utilization percentage (0-100)
 * @property {number} totalBookings - Total number of bookings for this provider
 * @property {number} pendingBookings - Number of pending/unconfirmed bookings
 * @property {AvailabilityData[]} events - Associated availability events and bookings
 */
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
  events: AvailabilityData[];
}

/**
 * Complete organization calendar data for multi-provider views
 * Aggregates all providers, locations, and scheduling statistics for an organization
 *
 * @property {string} organizationId - Unique organization identifier
 * @property {string} organizationName - Organization display name
 * @property {OrganizationProvider[]} providers - All providers in the organization
 * @property {Array} locations - Organization physical locations
 * @property {object} stats - Aggregated scheduling statistics
 * @property {number} stats.totalProviders - Total number of providers
 * @property {number} stats.activeProviders - Number of currently active providers
 * @property {number} stats.totalAvailableHours - Total available hours across all providers
 * @property {number} stats.totalBookedHours - Total booked hours across all providers
 * @property {number} stats.averageUtilization - Average utilization percentage across providers
 * @property {number} stats.totalPendingBookings - Total pending bookings requiring confirmation
 * @property {number} stats.coverageGaps - Number of identified coverage gaps
 */
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

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CalendarDataParams {
  providerIds: string[];
  dateRange: DateRange;
  statusFilter?: AvailabilityStatus | 'ALL';
}

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

/**
 * Props for organization calendar view component
 * Provides callbacks for user interactions and calendar display configuration
 *
 * @property {string} organizationId - Organization whose calendar is being displayed
 * @property {Function} [onProviderClick] - Callback when a provider is clicked
 * @property {Function} [onEventClick] - Callback when an availability event is clicked
 * @property {Function} [onTimeSlotClick] - Callback when an empty time slot is clicked
 * @property {Function} [onCreateAvailability] - Callback to create new availability
 * @property {Function} [onManageProvider] - Callback to manage provider settings
 * @property {Function} [onGapClick] - Callback when a coverage gap is clicked
 * @property {Function} [onRecommendationClick] - Callback when a scheduling recommendation is clicked
 * @property {CalendarViewMode} [viewMode] - Calendar view mode (day, 3-day, week, month)
 * @property {Date} [initialDate] - Initial date to display in calendar
 * @property {boolean} [showCoverageGaps] - Whether to highlight coverage gaps
 */
export interface OrganizationCalendarViewProps {
  organizationId: string;
  onProviderClick?: (provider: OrganizationProvider) => void;
  onEventClick?: (event: AvailabilityData, provider: OrganizationProvider) => void;
  onTimeSlotClick?: (date: Date, hour: number, provider: OrganizationProvider) => void;
  onCreateAvailability?: (providerId?: string) => void;
  onManageProvider?: (provider: OrganizationProvider) => void;
  onGapClick?: (gap: CoverageGap) => void;
  onRecommendationClick?: (recommendation: string) => void;
  viewMode?: CalendarViewMode;
  initialDate?: Date;
  showCoverageGaps?: boolean;
}

/**
 * Props for organization week view component
 * Displays weekly calendar grid for multiple providers with availability styling
 *
 * @property {Date} currentDate - The current week being displayed
 * @property {OrganizationProvider[]} providers - Providers to show in the week view
 * @property {Function} [onEventClick] - Callback when an availability event is clicked
 * @property {Function} [onTimeSlotClick] - Callback when an empty time slot is clicked
 * @property {Function} getAvailabilityStyle - Function to determine CSS classes for availability styling
 * @property {boolean} showUtilizationOnly - Whether to show only utilization metrics vs full availability
 */
export interface OrganizationWeekViewProps {
  currentDate: Date;
  providers: OrganizationProvider[];
  onEventClick?: (event: AvailabilityData, provider: OrganizationProvider) => void;
  onTimeSlotClick?: (date: Date, hour: number, provider: OrganizationProvider) => void;
  getAvailabilityStyle: (availability: AvailabilityData) => string;
  showUtilizationOnly: boolean;
}

/**
 * Props for organization month view component
 * Displays monthly calendar overview for multiple providers
 */
export interface OrganizationMonthViewProps {
  currentDate: Date;
  providers: OrganizationProvider[];
  onEventClick?: (event: AvailabilityData, provider: OrganizationProvider) => void;
  getAvailabilityStyle: (availability: AvailabilityData) => string;
}

/**
 * Physical location information for in-person appointments
 * Contains location details and contact information
 *
 * @property {string} id - Unique location identifier
 * @property {string} name - Location display name
 * @property {string} formattedAddress - Full formatted address string
 * @property {object} [coordinates] - Geographic coordinates for mapping
 * @property {number} [coordinates.lat] - Latitude coordinate
 * @property {number} [coordinates.lng] - Longitude coordinate
 * @property {string} [phone] - Location contact phone number
 * @property {string} [email] - Location contact email address
 */
export interface Location {
  id: string;
  name: string;
  formattedAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null; // JSON field with lat/lng
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
  status: BookingStatus;
  startTime: Date;
  endTime: Date;
}

// =============================================================================
// BOOKING TYPES (User-facing booking functionality)
// =============================================================================

/**
 * Booking slot information for user-facing booking interfaces
 * Contains availability window, pricing, and associated service/provider details
 *
 * @property {string} id - Unique slot identifier
 * @property {string} availabilityId - Parent availability block reference
 * @property {Date} startTime - Slot start time
 * @property {Date} endTime - Slot end time
 * @property {number} durationMinutes - Slot duration in minutes
 * @property {boolean} isAvailable - Whether the slot is available for booking
 * @property {number} [price] - Slot price if pricing is enabled
 * @property {object} [service] - Associated service information
 * @property {string} [service.id] - Service unique identifier
 * @property {string} [service.name] - Service display name
 * @property {string} [service.description] - Service description
 * @property {object} provider - Provider offering this slot
 * @property {string} provider.id - Provider unique identifier
 * @property {string} provider.name - Provider display name
 * @property {string} [provider.image] - Provider profile image URL
 * @property {object} [location] - Location information for in-person appointments
 * @property {string} [location.id] - Location unique identifier
 * @property {string} [location.name] - Location display name
 * @property {boolean} [location.isOnline] - Whether this is an online appointment
 */
export interface BookingSlot {
  id: string;
  availabilityId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isAvailable: boolean;
  price?: number;
  service?: {
    id: string;
    name: string;
    description?: string;
  };
  provider: {
    id: string;
    name: string;
    image?: string;
  };
  location?: {
    id: string;
    name: string;
    isOnline: boolean;
  };
}

/**
 * Filter criteria for searching and filtering booking slots
 * Supports filtering by date range, time, location type, services, duration, and price
 *
 * @property {object} [dateRange] - Filter by date range
 * @property {Date} [dateRange.start] - Start date for filtering
 * @property {Date} [dateRange.end] - End date for filtering
 * @property {object} [timeRange] - Filter by time of day
 * @property {string} [timeRange.startTime] - Start time in HH:MM format
 * @property {string} [timeRange.endTime] - End time in HH:MM format
 * @property {string} [location] - Location type filter (online, in-person, or all)
 * @property {string[]} [providerTypes] - Filter by provider types
 * @property {string[]} [services] - Filter by service IDs
 * @property {object} [duration] - Filter by appointment duration
 * @property {number} [duration.min] - Minimum duration in minutes
 * @property {number} [duration.max] - Maximum duration in minutes
 * @property {object} [priceRange] - Filter by price range
 * @property {number} [priceRange.min] - Minimum price
 * @property {number} [priceRange.max] - Maximum price
 */
export interface BookingFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  timeRange?: {
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  location?: 'online' | 'in-person' | 'all';
  providerTypes?: string[];
  services?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Public provider information for booking interfaces
 * Contains provider profile details visible to users when booking
 *
 * @property {string} id - Unique provider identifier
 * @property {object} [user] - Associated user account information
 * @property {string} [user.id] - User account identifier
 * @property {string} [user.name] - User display name
 * @property {string} [user.email] - User email address
 * @property {string} [user.image] - User profile image URL
 * @property {ProviderStatus} status - Provider account status
 * @property {string[]} [specialties] - Provider medical specialties
 * @property {string} [bio] - Provider biography/description
 * @property {string[]} [languages] - Languages spoken by provider
 * @property {number} [yearsOfExperience] - Years of professional experience
 */
export interface ProviderPublicData {
  id: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  status: ProviderStatus;
  specialties?: string[];
  bio?: string;
  languages?: string[];
  yearsOfExperience?: number;
}

export interface SlotClickEvent {
  slot: BookingSlot;
  clickEvent: React.MouseEvent;
}

/**
 * Props for calendar grid component
 * Displays booking slots in a grid layout with loading and error states
 *
 * @property {string} providerId - Provider whose slots are being displayed
 * @property {Date} currentDate - Current date being viewed
 * @property {CalendarViewMode} viewMode - Calendar view mode (day, 3-day, week, month)
 * @property {BookingSlot[]} slots - Available booking slots to display
 * @property {boolean} isLoading - Whether slot data is currently loading
 * @property {Error} [error] - Error object if slot loading failed
 * @property {Function} onSlotClick - Callback when a slot is clicked
 * @property {BookingSlot} [selectedSlot] - Currently selected slot
 */
export interface CalendarGridProps {
  providerId: string;
  currentDate: Date;
  viewMode: CalendarViewMode;
  slots: BookingSlot[];
  isLoading: boolean;
  error?: Error | null;
  onSlotClick: (slot: BookingSlot) => void;
  selectedSlot?: BookingSlot | null;
}

/**
 * Props for filter bar component
 * Provides filter controls and state management for booking slot filtering
 *
 * @property {object} filters - Filter state and control functions
 * @property {BookingFilters} filters.activeFilters - Currently active filter values
 * @property {Function} filters.updateFilter - Function to update a single filter
 * @property {Function} filters.clearAllFilters - Function to clear all active filters
 * @property {boolean} filters.hasActiveFilters - Whether any filters are currently active
 * @property {ProviderPublicData} provider - Provider information for context
 */
export interface FilterBarProps {
  filters: {
    activeFilters: BookingFilters;
    updateFilter: (
      key: keyof BookingFilters,
      value:
        | { start: Date; end: Date }
        | { startTime: string; endTime: string }
        | 'online'
        | 'in-person'
        | 'all'
        | string[]
        | { min?: number; max?: number }
    ) => void;
    clearAllFilters: () => void;
    hasActiveFilters: boolean;
  };
  provider: ProviderPublicData;
}

/**
 * Props for calendar header component
 * Provides calendar navigation controls and view mode selection
 *
 * @property {Date} currentDate - Currently displayed date
 * @property {CalendarViewMode} viewMode - Current calendar view mode
 * @property {Function} onDateChange - Callback when date is changed
 * @property {Function} onViewModeChange - Callback when view mode is changed
 * @property {Function} onNavigate - Callback for prev/next navigation
 */
export interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

/**
 * User booking information for booking management
 * Contains complete booking details including slot, service, and provider information
 *
 * @property {string} id - Unique booking identifier
 * @property {string} status - Booking status (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
 * @property {string} guestName - Guest name for non-registered bookings
 * @property {string} guestEmail - Guest email for non-registered bookings
 * @property {string} guestPhone - Guest phone for non-registered bookings
 * @property {string} notes - Additional booking notes or special requests
 * @property {Date} createdAt - Booking creation timestamp
 * @property {Date} updatedAt - Last booking update timestamp
 * @property {object} slot - Booked time slot details
 * @property {string} slot.id - Slot unique identifier
 * @property {Date} slot.startTime - Slot start time
 * @property {Date} slot.endTime - Slot end time
 * @property {string} slot.status - Slot status
 * @property {object} [slot.service] - Service information
 * @property {object} [slot.serviceConfig] - Service configuration with pricing
 * @property {object} slot.availability - Availability and provider information
 */
export interface UserBooking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  slot: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
    service?: {
      id: string;
      name: string;
      description?: string;
    };
    serviceConfig?: {
      id: string;
      duration: number;
      price: number;
    };
    availability: {
      id: string;
      provider: {
        id: string;
        user: {
          id: string;
          name?: string;
          email?: string;
          image?: string;
        };
      };
    };
  };
}

export interface BookingUpdateData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes: string;
}

// =============================================================================
// MODAL TYPES (Availability modal actions and permissions)
// =============================================================================

export type AvailabilityAction = 'view' | 'edit' | 'delete' | 'accept' | 'reject';

export type SeriesActionScope = 'single' | 'all' | 'future';

export interface AvailabilityPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAccept: boolean;
  canReject: boolean;
  canCreate: boolean;
}

// =============================================================================
// AVAILABILITY INTERFACES
// =============================================================================

/**
 * Availability time block configuration
 * Core availability entity with scheduling rules, recurrence patterns, and billing settings
 *
 * @property {string} id - Unique availability identifier
 * @property {string} providerId - Provider offering this availability
 * @property {string} [organizationId] - Organization if created by organization
 * @property {string} [locationId] - Physical location for in-person availability
 * @property {string} [connectionId] - External calendar connection reference
 * @property {Date} startTime - Availability start time in UTC
 * @property {Date} endTime - Availability end time in UTC
 * @property {boolean} isRecurring - Whether this availability repeats
 * @property {RecurrencePattern} [recurrencePattern] - Recurrence configuration (JSON field)
 * @property {string} [seriesId] - Series identifier for recurring availabilities
 * @property {AvailabilityStatus} status - Current status (PENDING, ACCEPTED, REJECTED, etc.)
 * @property {SchedulingRule} schedulingRule - Slot generation rule (OPEN, FIXED_INTERVALS, etc.)
 * @property {number} [schedulingInterval] - Interval in minutes for fixed scheduling
 * @property {boolean} isOnlineAvailable - Whether online appointments are available
 * @property {boolean} requiresConfirmation - Whether bookings require provider confirmation
 * @property {BillingEntity} [billingEntity] - Who is billed for generated slots
 * @property {string} [defaultSubscriptionId] - Default subscription for billing
 * @property {string} createdById - User who created this availability
 * @property {string} [createdByMembershipId] - Organization membership if org-created
 * @property {string} [acceptedById] - User who accepted/approved this availability
 * @property {Date} [acceptedAt] - Timestamp of acceptance/approval
 * @property {boolean} [isProviderCreated] - Whether created by provider vs organization
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
export interface Availability {
  id: string;
  providerId: string;
  organizationId?: string | null;
  locationId?: string | null;
  connectionId?: string | null;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern | null; // JSON field from Prisma
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

// =============================================================================
// MIGRATION NOTES - SERVER DATA INTERFACES REMOVED
// =============================================================================
//
// Server data interfaces with relations have been removed:
// - AvailabilityWithRelations (server data + Prisma relations)
// - ServiceAvailabilityConfigWithRelations (server data + relations)
// - CalculatedAvailabilitySlotWithRelations (server data + relations)
//
// Components will extract server data types from tRPC RouterOutputs in Task 4.0
// using patterns like: RouterOutputs['calendar']['getAvailabilityWithRelations']

/**
 * Service availability configuration
 * Defines service-specific pricing, duration, and location settings for availability blocks
 *
 * @property {string} id - Unique configuration identifier
 * @property {string} serviceId - Service being configured
 * @property {string} providerId - Provider offering this service
 * @property {string} [locationId] - Location for in-person service delivery
 * @property {number} duration - Service duration in minutes
 * @property {number} price - Service price (converted from Decimal for client-side)
 * @property {boolean} isOnlineAvailable - Whether service is available online
 * @property {boolean} isInPerson - Whether service is available in-person
 * @property {Date} createdAt - Configuration creation timestamp
 * @property {Date} updatedAt - Last configuration update timestamp
 */
export interface ServiceAvailabilityConfig {
  id: string;
  serviceId: string;
  providerId: string;
  locationId?: string | null;
  duration: number;
  price: number; // Changed from Decimal to number for client-side calculations
  isOnlineAvailable: boolean;
  isInPerson: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calculated availability slot
 * Generated time slots based on availability blocks and service configurations
 *
 * @property {string} id - Unique slot identifier
 * @property {string} availabilityId - Parent availability block
 * @property {string} serviceId - Service offered in this slot
 * @property {string} serviceConfigId - Service configuration with pricing
 * @property {Date} startTime - Slot start time in UTC
 * @property {Date} endTime - Slot end time in UTC
 * @property {SlotStatus} status - Current slot status (AVAILABLE, BOOKED, BLOCKED, etc.)
 * @property {string} [bookingId] - Associated booking if slot is booked
 * @property {string} [billedToSubscriptionId] - Subscription being billed for this slot
 * @property {string} [blockedByCalendarEventId] - External calendar event blocking this slot
 * @property {Date} createdAt - Slot creation timestamp
 * @property {Date} updatedAt - Last slot update timestamp
 */
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

/**
 * Availability series for recurring availabilities
 * Manages multiple availability instances created from a single recurrence pattern
 *
 * @property {string} seriesId - Unique series identifier shared by all instances
 * @property {string} masterAvailabilityId - Original availability that created the series
 * @property {RecurrencePattern} recurrencePattern - Recurrence configuration for the series
 * @property {Availability[]} instances - All availability instances in this series
 * @property {number} totalInstances - Total number of instances (including cancelled)
 * @property {number} activeInstances - Number of currently active instances
 * @property {Date} createdAt - Series creation timestamp
 * @property {Date} lastModified - Last modification timestamp for any instance
 */
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

/**
 * Coverage gap in organization scheduling
 * Identifies periods with insufficient provider coverage and suggests improvements
 *
 * @property {string} id - Unique gap identifier
 * @property {string} type - Type of coverage gap (no_coverage, insufficient_coverage, skill_gap, location_gap)
 * @property {Date} startTime - Gap start time
 * @property {Date} endTime - Gap end time
 * @property {string} severity - Gap severity level (critical, high, medium, low)
 * @property {string} description - Human-readable gap description
 * @property {string[]} affectedLocations - Locations affected by this gap
 * @property {string[]} requiredSkills - Skills needed to fill this gap
 * @property {string[]} suggestedActions - Recommended actions to resolve gap
 * @property {number} impactScore - Calculated impact score (0-100)
 * @property {number} coveragePercentage - Current coverage percentage for this period
 */
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

/**
 * Complete coverage analysis for organization scheduling
 * Aggregates coverage gaps, recommendations, and hourly coverage metrics
 *
 * @property {number} totalGaps - Total number of coverage gaps identified
 * @property {number} criticalGaps - Number of critical severity gaps
 * @property {number} highPriorityGaps - Number of high priority gaps
 * @property {number} averageCoveragePercentage - Average coverage across analyzed period
 * @property {CoverageGap[]} gaps - All identified coverage gaps
 * @property {string[]} recommendations - System-generated scheduling recommendations
 * @property {Array} coverageByHour - Hourly breakdown of coverage metrics
 */
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

/**
 * Coverage requirements configuration for organization scheduling
 * Defines minimum staffing and skill requirements for coverage analysis
 *
 * @property {number} minProvidersPerHour - Minimum providers required per hour
 * @property {string[]} requiredSkills - Essential skills that must be covered
 * @property {object} businessHours - Standard business operating hours
 * @property {number} businessHours.start - Business day start hour (0-23)
 * @property {number} businessHours.end - Business day end hour (0-23)
 * @property {number[]} workingDays - Working days (0-6, Sunday-Saturday)
 * @property {Array} locationRequirements - Location-specific coverage requirements
 */
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

/**
 * Configuration for calendar data export operations
 * Controls export format, date range, fields, filters, and formatting options
 *
 * @property {string} format - Export file format (ical, csv, json, pdf)
 * @property {object} dateRange - Date range for export
 * @property {Date} dateRange.start - Export start date
 * @property {Date} dateRange.end - Export end date
 * @property {object} includeFields - Fields to include in export
 * @property {boolean} includeFields.eventDetails - Include event details
 * @property {boolean} includeFields.customerInfo - Include customer information
 * @property {boolean} includeFields.serviceInfo - Include service details
 * @property {boolean} includeFields.locationInfo - Include location information
 * @property {boolean} includeFields.notes - Include notes and comments
 * @property {boolean} includeFields.recurringInfo - Include recurrence information
 * @property {object} filters - Filter criteria for export
 * @property {Array} filters.eventTypes - Event types to include
 * @property {string[]} filters.statuses - Statuses to include
 * @property {string[]} filters.providers - Provider IDs to include
 * @property {string[]} filters.locations - Location IDs to include
 * @property {object} customization - Export formatting options
 * @property {string} customization.timezone - Timezone for date/time formatting
 * @property {string} customization.dateFormat - Date format string
 * @property {string} customization.timeFormat - Time format (12h or 24h)
 * @property {boolean} customization.includePrivateEvents - Whether to include private events
 * @property {boolean} customization.anonymizeCustomerData - Whether to anonymize customer data
 */
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

/**
 * Calendar export operation result
 * Contains exported data, metadata, and error information for calendar exports
 *
 * @property {boolean} success - Whether export completed successfully
 * @property {string} format - Export format used
 * @property {string} filename - Generated filename for download
 * @property {string|Blob} [data] - Exported data (string or binary blob)
 * @property {string} [downloadUrl] - URL for downloading exported file
 * @property {number} eventCount - Number of events exported
 * @property {string[]} [errors] - Any errors encountered during export
 * @property {object} metadata - Export metadata
 * @property {Date} metadata.exportedAt - Export timestamp
 * @property {string} metadata.timezone - Timezone used for export
 * @property {number} metadata.totalEvents - Total events before filtering
 * @property {number} metadata.filteredEvents - Events after applying filters
 */
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

/**
 * Google Calendar integration configuration
 * Manages bidirectional sync settings and status for Google Calendar integration
 *
 * @property {boolean} enabled - Whether Google Calendar integration is enabled
 * @property {string} [calendarId] - Google Calendar ID for sync
 * @property {string} syncDirection - Sync direction (import, export, or bidirectional)
 * @property {Date} [lastSync] - Timestamp of last successful sync
 * @property {string} syncStatus - Current sync status (idle, syncing, error, success)
 */
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

/**
 * Location-based search parameters for finding nearby providers
 * Supports filtering by distance, service types, date/time preferences, and pricing
 *
 * @property {object} coordinates - Search origin coordinates
 * @property {number} coordinates.lat - Latitude coordinate
 * @property {number} coordinates.lng - Longitude coordinate
 * @property {number} maxDistance - Maximum search radius in kilometers
 * @property {string[]} [serviceTypes] - Filter by service type IDs
 * @property {Date} [preferredDate] - Preferred appointment date
 * @property {string} [preferredTime] - Preferred time in HH:MM format
 * @property {number} [duration] - Required appointment duration in minutes
 * @property {boolean} [isOnlineAvailable] - Include online-only providers
 * @property {object} [priceRange] - Price range filter
 * @property {number} [priceRange.min] - Minimum price
 * @property {number} [priceRange.max] - Maximum price
 */
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

/**
 * Provider search result with location and availability information
 * Contains provider details, distance, available services, and nearest slot
 *
 * @property {string} providerId - Unique provider identifier
 * @property {string} providerName - Provider display name
 * @property {string} providerType - Provider type classification
 * @property {number} distance - Distance from search origin in kilometers
 * @property {object} coordinates - Provider location coordinates
 * @property {number} coordinates.lat - Latitude
 * @property {number} coordinates.lng - Longitude
 * @property {object} [location] - Physical location details
 * @property {Array} availableServices - Services offered by this provider
 * @property {object} [nearestAvailableSlot] - Next available booking slot
 * @property {string} [nearestAvailableSlot.slotId] - Slot identifier
 * @property {Date} [nearestAvailableSlot.startTime] - Slot start time
 * @property {Date} [nearestAvailableSlot.endTime] - Slot end time
 * @property {boolean} [nearestAvailableSlot.isOnlineAvailable] - Online availability
 * @property {number} [nearestAvailableSlot.price] - Slot price
 * @property {number} totalAvailableSlots - Total number of available slots
 */
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

/**
 * Time-based search parameters for finding available slots
 * Supports filtering by date ranges, time windows, day of week, and duration
 *
 * @property {object} [dateRange] - Date range for search
 * @property {Date} [dateRange.startDate] - Search start date
 * @property {Date} [dateRange.endDate] - Search end date
 * @property {Date} [specificDate] - Search for specific date only
 * @property {object} [timeRange] - Time of day range
 * @property {string} [timeRange.startTime] - Start time in HH:MM 24-hour format
 * @property {string} [timeRange.endTime] - End time in HH:MM 24-hour format
 * @property {string[]} [preferredTimes] - Preferred times (e.g., ["09:00", "14:30"])
 * @property {number} [timeFlexibility] - Minutes of flexibility around preferred times
 * @property {number[]} [dayOfWeek] - Days of week filter (0-6, Sunday-Saturday)
 * @property {boolean} [excludeWeekends] - Exclude Saturday and Sunday
 * @property {boolean} [excludeHolidays] - Exclude public holidays
 * @property {number} [minDuration] - Minimum appointment duration in minutes
 * @property {number} [maxDuration] - Maximum appointment duration in minutes
 */
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

/**
 * Time-filtered slot result
 * Slot information filtered by time-based search criteria with metadata
 *
 * @property {string} slotId - Unique slot identifier
 * @property {Date} startTime - Slot start time
 * @property {Date} endTime - Slot end time
 * @property {number} duration - Slot duration in minutes
 * @property {number} dayOfWeek - Day of week (0-6, Sunday-Saturday)
 * @property {string} timeOfDay - Time in HH:MM format
 * @property {boolean} isWeekend - Whether slot is on weekend
 * @property {string} providerId - Provider offering this slot
 * @property {string} serviceId - Service for this slot
 * @property {string} [locationId] - Physical location if in-person
 * @property {number} price - Slot price
 * @property {boolean} isOnlineAvailable - Whether available online
 * @property {string} status - Slot status
 */
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

/**
 * Validation result for availability operations
 * Contains validation status and error messages if validation fails
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Slot Generation Types (moved from slot-generation.ts)
export interface SlotGenerationOptions {
  availabilityId: string;
  startTime: Date;
  endTime: Date;
  schedulingRule: SchedulingRule;
  schedulingInterval?: number;
  services: Array<{
    serviceId: string;
    serviceConfigId: string;
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
  // availability will be typed using tRPC RouterOutputs in Task 4.0
  availability?: Record<string, unknown>; // Generic object type for workflow results
  slotsGenerated?: number;
  error?: string;
  notifications?: {
    sent: number;
    failed: number;
  };
}

/**
 * Booking validation result for slot booking operations
 * Checks slot availability, conflicts, scheduling rules, and pricing before booking
 *
 * @property {boolean} isValid - Whether the booking request is valid
 * @property {CalculatedAvailabilitySlot} [slot] - Slot being booked if valid
 * @property {Availability} [availability] - Parent availability configuration
 * @property {string[]} conflicts - List of booking conflicts found
 * @property {string[]} warnings - Non-blocking warnings about the booking
 * @property {boolean} schedulingRuleCompliant - Whether booking follows scheduling rules
 * @property {boolean} requiresConfirmation - Whether provider confirmation is required
 * @property {number} estimatedDuration - Estimated appointment duration in minutes
 * @property {number} price - Total booking price
 */
export interface BookingValidationResult {
  isValid: boolean;
  slot?: CalculatedAvailabilitySlot;
  availability?: Availability;
  conflicts: string[];
  warnings: string[];
  schedulingRuleCompliant: boolean;
  requiresConfirmation: boolean;
  estimatedDuration: number;
  price: number;
}

/**
 * Slot booking request payload
 * Contains customer information and booking preferences for creating a booking
 *
 * @property {string} slotId - Slot to be booked
 * @property {string} [customerId] - Registered user ID if not guest
 * @property {string} customerName - Customer full name
 * @property {string} customerEmail - Customer email address
 * @property {string} [customerPhone] - Customer phone number
 * @property {string} [notes] - Additional booking notes or requests
 * @property {Date} [preferredStartTime] - Preferred start time if flexible booking
 */
export interface SlotBookingRequest {
  slotId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  preferredStartTime?: Date;
}

/**
 * Booking compatibility check result
 * Validates if requested booking time is compatible with scheduling rules and slot configuration
 *
 * @property {string} slotId - Slot being checked
 * @property {Date} [requestedStartTime] - Customer's preferred start time
 * @property {number} [requestedDuration] - Customer's preferred duration in minutes
 * @property {SchedulingRule} schedulingRule - Slot's scheduling rule
 * @property {number} [schedulingInterval] - Scheduling interval if applicable
 * @property {boolean} isCompatible - Whether request is compatible with rules
 * @property {Date} [adjustedStartTime] - Suggested adjusted start time if needed
 * @property {Date} [adjustedEndTime] - Suggested adjusted end time if needed
 * @property {string} [reason] - Explanation if not compatible
 */
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

/**
 * Booking view for communication services
 * Complete booking information for sending notifications and confirmations
 *
 * @property {string} id - Unique booking identifier
 * @property {BookingStatus} status - Current booking status
 * @property {object} notificationPreferences - User's notification preferences
 * @property {boolean} notificationPreferences.whatsapp - WhatsApp notifications enabled
 * @property {object} guestInfo - Guest customer information
 * @property {string} guestInfo.name - Guest name
 * @property {string} [guestInfo.whatsapp] - Guest WhatsApp number
 * @property {object} slot - Booked slot information
 * @property {string} slot.id - Slot identifier
 * @property {Date} slot.startTime - Appointment start time
 * @property {Date} slot.endTime - Appointment end time
 * @property {string} slot.status - Slot status
 * @property {object} slot.service - Service details
 * @property {object} slot.serviceConfig - Service configuration and pricing
 * @property {object} slot.provider - Provider details
 */
export interface BookingView {
  id: string;
  status: BookingStatus;
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

/**
 * Notification payload for sending notifications
 * Contains recipient information, message content, and notification metadata
 *
 * @property {string} recipientId - Unique recipient identifier
 * @property {string} recipientEmail - Recipient email address
 * @property {string} recipientName - Recipient display name
 * @property {string} type - Notification delivery method (email, sms, in_app)
 * @property {string} subject - Notification subject line
 * @property {string} message - Notification message body
 * @property {string} [actionUrl] - Optional action URL for buttons/links
 * @property {Record<string, unknown>} [metadata] - Additional notification metadata
 */
export interface NotificationPayload {
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  type: 'email' | 'sms' | 'in_app';
  subject: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface AvailabilityNotificationContext {
  // availability will be typed using tRPC RouterOutputs in Task 4.0
  availability: Record<string, unknown>; // Generic object type for notification context
  previousStatus?: AvailabilityStatus;
  newStatus: AvailabilityStatus;
  actionBy: {
    id: string;
    name: string;
    role: string;
  };
  rejectionReason?: string;
}

/**
 * Service filter parameters for availability searches
 * Supports filtering by service types, categories, providers, pricing, and duration
 *
 * @property {string[]} [serviceTypeIds] - Service type IDs (e.g., "consultation", "imaging")
 * @property {string[]} [serviceIds] - Specific service IDs to include
 * @property {string[]} [serviceNames] - Service names for text-based filtering
 * @property {string[]} [serviceCategories] - Service category filters
 * @property {string[]} [providerTypeIds] - Healthcare provider type filters
 * @property {string[]} [specializations] - Provider specialization filters
 * @property {object} [priceRange] - Price range filter
 * @property {number} [priceRange.min] - Minimum price
 * @property {number} [priceRange.max] - Maximum price
 * @property {object} [durationRange] - Duration range filter in minutes
 * @property {number} [durationRange.min] - Minimum duration in minutes
 * @property {number} [durationRange.max] - Maximum duration in minutes
 * @property {string[]} [excludeServices] - Service IDs to exclude from results
 * @property {boolean} [includeInactive] - Include inactive services (default: false)
 */
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

/**
 * Service search result
 * Complete service information including provider, pricing, availability, and ratings
 *
 * @property {string} serviceId - Unique service identifier
 * @property {string} serviceName - Service display name
 * @property {string} [serviceDescription] - Service description
 * @property {string} [serviceCategory] - Service category
 * @property {object} serviceType - Service type classification
 * @property {string} serviceType.id - Service type identifier
 * @property {string} serviceType.name - Service type name
 * @property {string} [serviceType.category] - Service type category
 * @property {object} provider - Provider offering this service
 * @property {string} provider.id - Provider identifier
 * @property {string} provider.name - Provider name
 * @property {string} provider.type - Provider type
 * @property {string} [provider.specialization] - Provider specialization
 * @property {object} pricing - Service pricing information
 * @property {number} pricing.price - Service price
 * @property {boolean} pricing.showPrice - Whether to display price publicly
 * @property {number} pricing.defaultDuration - Default service duration in minutes
 * @property {number} [pricing.minDuration] - Minimum duration in minutes
 * @property {number} [pricing.maxDuration] - Maximum duration in minutes
 * @property {object} availability - Service availability information
 * @property {boolean} availability.hasSlots - Whether slots are available
 * @property {Date} [availability.nextAvailableSlot] - Next available slot date/time
 * @property {number} availability.totalSlots - Total available slots
 * @property {Array} availability.locations - Available locations for this service
 * @property {number} [rating] - Average service rating (0-5)
 * @property {number} [reviewCount] - Number of reviews
 */
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

/**
 * Service filter aggregated results
 * Contains filtered services and aggregation data for faceted search (types, providers, price ranges)
 *
 * @property {ServiceResult[]} services - Filtered service results
 * @property {number} totalCount - Total number of matching services
 * @property {Array} serviceTypes - Available service types with counts
 * @property {Array} providerTypes - Available provider types with counts
 * @property {object} priceRange - Price range statistics
 * @property {number} priceRange.min - Minimum price across results
 * @property {number} priceRange.max - Maximum price across results
 * @property {number} priceRange.average - Average price across results
 * @property {object} durationRange - Duration range statistics in minutes
 * @property {number} durationRange.min - Minimum duration in minutes
 * @property {number} durationRange.max - Maximum duration in minutes
 * @property {number} durationRange.average - Average duration in minutes
 * @property {Array} categories - Service categories with counts
 */
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

/**
 * Conflict detection options for slot generation
 * Configures which types of conflicts to check when generating availability slots
 *
 * @property {boolean} [checkOverlappingSlots] - Check for overlapping time slots
 * @property {boolean} [checkCalendarEvents] - Check against external calendar events
 * @property {boolean} [checkSchedulingRules] - Validate against scheduling rules
 * @property {boolean} [checkLocationConflicts] - Check for location double-booking
 * @property {boolean} [checkProviderAvailability] - Verify provider availability
 * @property {number} [bufferTimeMinutes] - Buffer time between appointments in minutes
 */
export interface ConflictDetectionOptions {
  checkOverlappingSlots?: boolean;
  checkCalendarEvents?: boolean;
  checkSchedulingRules?: boolean;
  checkLocationConflicts?: boolean;
  checkProviderAvailability?: boolean;
  bufferTimeMinutes?: number; // Buffer time between appointments
}

/**
 * Conflict resolution result for slot generation
 * Contains conflict statistics and separated lists of valid vs conflicted slots
 *
 * @property {number} originalSlotsCount - Number of slots before conflict checking
 * @property {number} validSlotsCount - Number of valid slots after conflict checking
 * @property {number} conflictedSlotsCount - Number of conflicted slots found
 * @property {number} resolvedConflictsCount - Number of conflicts automatically resolved
 * @property {AvailabilityConflict[]} conflicts - List of all detected conflicts
 * @property {CalculatedAvailabilitySlot[]} validSlots - Slots with no conflicts
 * @property {CalculatedAvailabilitySlot[]} conflictedSlots - Slots with unresolved conflicts
 */
export interface ConflictResolutionResult {
  originalSlotsCount: number;
  validSlotsCount: number;
  conflictedSlotsCount: number;
  resolvedConflictsCount: number;
  conflicts: AvailabilityConflict[];
  validSlots: CalculatedAvailabilitySlot[];
  conflictedSlots: CalculatedAvailabilitySlot[];
}

/**
 * Detailed slot conflict information
 * Describes the nature, severity, and resolution options for scheduling conflicts
 *
 * @property {string} [slotId] - Conflicted slot identifier
 * @property {Date} startTime - Conflict period start time
 * @property {Date} endTime - Conflict period end time
 * @property {string} conflictType - Type of conflict detected
 * @property {string} [conflictingEntityId] - ID of conflicting entity
 * @property {string} [conflictingEntityType] - Type of conflicting entity (slot, event, availability, location)
 * @property {string} description - Human-readable conflict description
 * @property {string} severity - Conflict severity level (low, medium, high, critical)
 * @property {boolean} canAutoResolve - Whether conflict can be automatically resolved
 * @property {string} [suggestedResolution] - Suggested resolution action
 */
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

/**
 * Availability search parameters
 * Filters availability blocks by provider, organization, location, service, dates, and status
 */
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

/**
 * Slot search parameters
 * Filters calculated slots by provider, service, location, dates, duration, and proximity
 */
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

/**
 * Comprehensive time slot for UI and business logic
 * Includes availability status, pricing, and service information for display
 */
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

/**
 * Time slot generation result
 * Contains generated time slots and any errors encountered during generation
 */
export interface TimeSlotGenerationResult {
  slots: TimeSlot[];
  totalSlots: number;
  errors: string[];
}

// =============================================================================
// CRUD OPERATION TYPES
// =============================================================================

/**
 * Data for creating a new availability block
 * Contains all required fields for creating availability with services and scheduling rules
 *
 * @property {string} providerId - Provider creating the availability
 * @property {string} [organizationId] - Organization context if applicable
 * @property {string} [locationId] - Physical location for in-person availability
 * @property {string} [connectionId] - External calendar connection reference
 * @property {Date} startTime - Availability start time in UTC
 * @property {Date} endTime - Availability end time in UTC
 * @property {boolean} isRecurring - Whether this availability repeats
 * @property {RecurrencePattern} [recurrencePattern] - Recurrence configuration (JSON field)
 * @property {string} [seriesId] - Series identifier for recurring instances
 * @property {SchedulingRule} schedulingRule - Slot generation rule
 * @property {number} [schedulingInterval] - Interval in minutes for fixed scheduling
 * @property {boolean} isOnlineAvailable - Whether online appointments are available
 * @property {boolean} requiresConfirmation - Whether bookings require confirmation
 * @property {BillingEntity} [billingEntity] - Who gets billed for generated slots
 * @property {string} [defaultSubscriptionId] - Default subscription for billing
 * @property {Array} services - Services offered during this availability
 */
export interface CreateAvailabilityData {
  providerId: string;
  organizationId?: string;
  locationId?: string;
  connectionId?: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern; // JSON field to match Prisma schema
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
  scope?: 'single' | 'future' | 'all'; // SeriesActionScope for recurring availability edits
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
// MIGRATION NOTES - PRISMA CONFIGURATIONS REMOVED
// =============================================================================
//
// Prisma include configurations have been removed as they represent server-side
// data fetching patterns. These are now handled by tRPC procedures that return
// properly typed data automatically.
//
// Removed:
// - includeAvailabilityRelations (Prisma include configuration)
//
// Server procedures will handle data fetching and return appropriately typed data.

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

export type AvailabilityContextType = AvailabilityContext;

// Default configurations
export const getDefaultExportConfig = (): ExportConfig => ({
  format: 'ical',
  dateRange: {
    start: nowUTC(),
    end: (() => {
      const d = nowUTC();
      d.setDate(d.getDate() + 30);
      return d;
    })(), // 30 days from now
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
// MIGRATION NOTES - PRISMA-DERIVED TYPES REMOVED
// =============================================================================
//
// All Prisma-derived select types have been removed as they represent server-side
// data shapes that are now handled by tRPC's automatic type inference.
//
// Removed types:
// - AvailabilityDetailSelect (complex server data with relations)
// - AvailabilityListSelect (server data for list views)
// - CalculatedSlotDetailSelect (server data for booking views)
// - ServiceConfigDetailSelect (server data with service relations)
//
// Components will extract equivalent types from tRPC RouterOutputs:
// - RouterOutputs['calendar']['getAvailabilityDetail']
// - RouterOutputs['calendar']['getAvailabilityList']
// - RouterOutputs['calendar']['getCalculatedSlotDetail']
// - RouterOutputs['calendar']['getServiceConfigDetail']
