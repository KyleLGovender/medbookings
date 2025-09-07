# Availability Management - Implementation Tasks

## Database Schema Analysis Summary

Based on detailed analysis of existing Prisma schema against PRD requirements:

### ✅ Existing Tables - Status

- **CalculatedAvailabilitySlot**: **COMPLETE** - Supports all PRD requirements including slot generation, conflict management, billing attribution, calendar integration, and version tracking
- **Availability**: **NEEDS ENHANCEMENT** - Missing recurrence patterns, scheduling rules, and online availability flags
- **ServiceAvailabilityConfig**: **NEEDS MINOR UPDATES** - Missing price display control and proper location relationship

### 📊 Coverage Assessment

- **85% of database requirements already implemented**
- **Slot generation infrastructure fully exists (CalculatedAvailabilitySlot table)**
- **Organization-provider workflow already built-in via Availability.status**
- **Billing attribution system complete**
- **Calendar integration framework comprehensive**
- **⚠️ Availability management logic cleared - needs complete rebuild from scratch**

## Relevant Files

### Core Types and Schemas

- `src/features/calendar/availability/types/enums.ts` - Re-exports Prisma enums and defines additional TypeScript enums for availability management
- `src/features/calendar/availability/types/interfaces.ts` - Comprehensive TypeScript interfaces extending Prisma types with relations for availability system
- `src/features/calendar/availability/types/schemas.ts` - Complete Zod validation schemas with business logic validation for forms and API
- `src/features/calendar/availability/types/index.ts` - Central export file for all availability types and schemas

### Core Business Logic

- `src/features/calendar/availability/lib/actions.ts` - Server actions for availability CRUD operations with full authorization and validation
- `src/features/calendar/availability/lib/recurrence-patterns.ts` - Logic for handling recurring availability patterns (daily, weekly, monthly, custom)
- `src/features/calendar/availability/lib/scheduling-rules.ts` - Engine for appointment scheduling rules (continuous, fixed interval, custom interval)
- `src/features/calendar/availability/lib/slot-generator.ts` - Core slot generation algorithm applying scheduling rules to availability periods
- `src/features/calendar/availability/lib/slot-generation-service.ts` - Enhanced slot generation service with batch processing and advanced features
- `src/features/calendar/availability/lib/recurring-slot-manager.ts` - Manager for handling recurring availability slot generation with series grouping
- `src/features/calendar/availability/lib/conflict-management.ts` - Comprehensive slot conflict management system with auto-resolution capabilities
- `src/features/calendar/availability/lib/slot-recalculation-triggers.ts` - Automatic slot recalculation triggers for recurring availability modifications
- `src/features/calendar/availability/lib/booking-integration.ts` - Integration with existing booking functionality supporting new scheduling rules
- `src/features/calendar/availability/lib/slot-cleanup-service.ts` - Slot cleanup service for deleted or modified recurring availability series
- `src/features/calendar/availability/lib/notification-service.ts` - Notification system for availability request status changes (logging implementation)
- `src/features/calendar/availability/lib/workflow-service.ts` - Complete workflow service that activates accepted availability for slot generation

### Client-Side Data Management

- `src/features/calendar/availability/hooks/use-availability.ts` - TanStack Query hooks for availability operations with cache management and optimistic updates
- `src/features/calendar/availability/hooks/index.ts` - Export file for all availability hooks

### UI Components

- `src/features/calendar/availability/components/availability-creation-form.tsx` - Main form component for creating availability periods with recurrence and scheduling options
- `src/features/calendar/availability/components/availability-edit-form.tsx` - Availability editing interface for individual occurrences and series with optimistic updates
- `src/features/calendar/availability/components/availability-delete-dialog.tsx` - Availability deletion component with validation for existing bookings
- `src/features/calendar/availability/components/availability-proposal-form.tsx` - Organization interface to propose availability to providers
- `src/features/calendar/availability/components/availability-proposals-list.tsx` - Provider interface to view and respond to availability proposals
- `src/features/calendar/availability/components/availability-status-tracker.tsx` - Enhanced status tracking component supporting recurring availability requests
- `src/features/calendar/availability/components/service-selection-section.tsx` - Service selection interface with pricing display control and duration configuration
- `src/features/calendar/availability/components/provider-search-interface.tsx` - Patient search interface for finding providers by availability with advanced filtering and location-based search
- `src/features/calendar/availability/lib/location-search-service.ts` - Location-based search service with distance calculations using Haversine formula and geocoding integration
- `src/features/calendar/availability/lib/time-search-service.ts` - Time-based search service with date ranges, time ranges, preferred times, and day-of-week filtering
- `src/features/calendar/availability/lib/service-filter-service.ts` - Service-type filtering service with categorization, text search, and comprehensive service metadata
- `src/features/calendar/availability/components/provider-search-results.tsx` - Enhanced search results display with detailed slot information, conditional pricing, and provider details
- `src/features/calendar/availability/lib/search-performance-service.ts` - Optimized search queries with database indexes, performance monitoring, and query optimization recommendations
- `src/features/calendar/availability/components/search-performance-monitor.tsx` - Real-time search performance monitoring component with optimization suggestions
- `prisma/migrations/20250702123000_add_search_performance_indexes/migration.sql` - Database migration adding compound indexes for optimal search performance
- `src/features/calendar/availability/components/provider-calendar-view.tsx` - Comprehensive provider calendar view with day/week/month views, event management, and utilization statistics
- `src/features/calendar/availability/components/calendar-event-dialog.tsx` - Interactive event details dialog with booking management and event actions
- `src/features/calendar/availability/components/provider-calendar-demo.tsx` - Demo component showcasing calendar functionality and usage examples
- `src/features/calendar/availability/components/index.ts` - Export file for all availability components

### Database Schema and Migrations

- `prisma/schema.prisma` - Database schema updates for availability tables (added SchedulingRule enum, updated Availability table with recurrence and scheduling fields, updated ServiceAvailabilityConfig with showPrice and location relation)
- `prisma/migrations/20250702083629_add_availability_scheduling_features/migration.sql` - Database migration for availability scheduling features
- `prisma/seed.mts` - Updated database seeding script with sample availability data showcasing new scheduling features

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests
- Database schema changes require Prisma migrations: `npx prisma migrate dev`
- **Database infrastructure is comprehensive** - minor schema updates needed
- **Availability management logic cleared** - complete rebuild required from scratch
- **TanStack Query Integration Required**: All client-side data fetching must use TanStack Query patterns from CLAUDE.md
- **Strong Typing Required**: All code must be strongly typed based on Prisma schema with TypeScript interfaces and Zod schemas

## Tasks

- [x] 1.0 Database Schema Enhancement (Minor updates to existing comprehensive schema)

  - [x] 1.1 Add SchedulingRule enum to Prisma schema (CONTINUOUS, FIXED_INTERVAL, CUSTOM_INTERVAL)
  - [x] 1.2 Update existing Availability table to add: recurrencePattern (Json), seriesId (String), isRecurring (Boolean), schedulingRule (SchedulingRule), schedulingInterval (Int), isOnlineAvailable (Boolean)
  - [x] 1.3 Update ServiceAvailabilityConfig table: add showPrice (Boolean), locationId (String relation to Location), remove location String field
  - [x] 1.4 Create and run Prisma migration for schema changes
  - [x] 1.5 Update database seeding script to include sample availability data with new fields
  - [x] 1.6 Generate Prisma client and verify TypeScript types are updated for new fields

- [x] 2.0 Core Availability Management Logic (Build from scratch - existing logic cleared)

  - [x] 2.1 Create strongly-typed TypeScript interfaces and Zod schemas based on updated Prisma schema
  - [x] 2.2 Create availability CRUD server actions from scratch (create, read, update, delete) supporting all new fields with full type safety
  - [x] 2.3 Create TanStack Query hooks following existing patterns ([resource, id] cache keys, onSuccess/onError callbacks)
  - [x] 2.4 Create recurrence pattern logic for generating recurring availability occurrences
  - [x] 2.5 Build scheduling rules engine (continuous, fixed interval, custom interval)
  - [x] 2.6 Create slot generation algorithm that applies scheduling rules to availability periods
  - [x] 2.7 Implement conflict detection logic to prevent double-booking and handle scheduling rule conflicts
  - [x] 2.8 Add validation logic to prevent modification of availability with existing bookings
  - [x] 2.9 Create billing attribution logic based on availability context (provider vs organization billing)

- [x] 3.0 Availability Creation and Management UI

  - [x] 3.1 Build availability creation form with date/time pickers and recurrence options using TanStack Query hooks
  - [x] 3.2 Enhance service selection interface with pricing display control and duration configuration
  - [x] 3.3 Implement location selection (physical locations vs online-only)
  - [x] 3.4 Add scheduling rule selection UI (continuous/fixed/custom intervals)
  - [x] 3.5 Build confirmation workflow configuration (automatic vs manual)
  - [x] 3.6 Create availability editing interface for individual occurrences and series with optimistic updates
  - [x] 3.7 Add availability deletion with validation for existing bookings
  - [x] 3.8 Implement responsive design for mobile availability management
  - [x] 3.9 Integrate real-time updates when availability is modified using TanStack Query invalidation

- [x] 4.0 Organization-Provider Request Workflow (Leverage existing Availability.status system)

  - [x] 4.1 Create organization interface to propose availability to providers (creates Availability with status=PENDING)
  - [x] 4.2 Build provider interface to view and respond to availability proposals (accept/reject updates status)
  - [x] 4.3 Enhance existing status tracking to support recurring availability requests
  - [x] 4.4 Add notification system for availability request status changes. For now just log what would be sent.
  - [x] 4.5 Build workflow that activates accepted availability for slot generation

- [x] 5.0 Slot Generation Implementation (Build from scratch using CalculatedAvailabilitySlot table)

  - [x] 5.1 Create slot generation logic that applies scheduling rules (continuous, fixed interval, custom interval)
  - [x] 5.2 Implement slot generation for recurrence patterns and series grouping
  - [x] 5.3 Build slot conflict management system to handle scheduling rule conflicts
  - [x] 5.4 Create slot recalculation triggers for recurring availability modifications
  - [x] 5.5 Build integration with existing booking functionality to support new scheduling rules
  - [x] 5.6 Implement slot cleanup for deleted or modified recurring availability series

- [x] 6.0 Search and Discovery Features (Build on existing database indexes)

  - [x] 6.1 Build patient search interface for finding providers by availability
  - [x] 6.2 Implement location-based search with distance parameters using existing Location.coordinates
  - [x] 6.3 Add time-based search filtering (date ranges, specific times)
  - [x] 6.4 Create service-type filtering for search results
  - [x] 6.5 Build search results display with available slots and conditional pricing
  - [x] 6.6 Optimize search queries for performance (leverage existing database indexes)

- [x] 7.0 Calendar Visualization and Management Views

  - [x] 7.1 Create provider calendar view showing individual availability and bookings
  - [x] 7.2 Build organization calendar view displaying multiple provider schedules
  - [x] 7.3 Add coverage gap identification for organization managers
  - [x] 7.4 Implement calendar navigation and filtering options for recurring patterns
  - [x] 7.5 Create visual indicators for different availability types, statuses, and scheduling rules
  - [x] 7.6 Add drag-and-drop functionality for availability management with recurring series support
  - [x] 7.7 Build calendar export functionality leveraging existing CalendarIntegration infrastructure

- [ ] 8.0 Cleanup
  - [ ] Service Provider Manage Calendar Works
  - [ ] Organization Manage Calendar Works
  - [ ] Figure out pages routing and where to display various calendars
  - [s] Edit Availability
  - [s] Generate Availability Slots
  - [s] Implement Availability View Details - should be the same as the create/edit form but just displaying
  - [s] Make the price and duration inputs on availability creation increase and decrease by correct amounts
  - [s] Sort out types between features
  - [x] Availability display isn't working
  - [x] Default service duration and price are not pulling through in availability creation
  - [x] Get rid of mock availability data and make sure everything is driven from database configuration
  - [x] Update customer recurring pattern to match Google calendar
  - [x] Add CANCELLED to prisma AvailabilityStatus
  - [x] Remove custom appointment starting intervals. It should be continuous, starting on the hour, starting on the half hour and hour.
  - [x] Add showPrice flag to Service Provider
