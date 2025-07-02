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

- `src/features/calendar/components/availability-creation-form.tsx` - Main form component for creating availability periods
- `src/features/calendar/components/availability-creation-form.test.tsx` - Unit tests for availability creation form
- `src/features/calendar/components/availability-calendar-view.tsx` - Calendar visualization component
- `src/features/calendar/components/availability-calendar-view.test.tsx` - Unit tests for calendar view
- `src/features/calendar/components/availability-request-manager.tsx` - Component for managing org-provider availability requests
- `src/features/calendar/components/availability-request-manager.test.tsx` - Unit tests for request manager
- `src/features/calendar/hooks/use-availability.ts` - TanStack Query hooks for availability operations
- `src/features/calendar/hooks/use-availability.test.ts` - Unit tests for availability hooks
- `src/features/calendar/lib/actions.ts` - Server actions for availability CRUD operations
- `src/features/calendar/lib/actions.test.ts` - Unit tests for availability actions
- `src/features/calendar/lib/slot-generator.ts` - Logic for generating bookable slots from availability
- `src/features/calendar/lib/slot-generator.test.ts` - Unit tests for slot generation
- `src/features/calendar/lib/scheduling-rules.ts` - Logic for applying appointment scheduling rules
- `src/features/calendar/lib/scheduling-rules.test.ts` - Unit tests for scheduling rules
- `src/features/calendar/lib/recurrence-patterns.ts` - Logic for handling recurring availability
- `src/features/calendar/lib/recurrence-patterns.test.ts` - Unit tests for recurrence patterns
- `src/features/calendar/types/index.ts` - TypeScript types and Zod schemas for availability
- `prisma/schema.prisma` - Database schema updates for availability tables
- `src/app/api/availability/route.ts` - API route for availability operations
- `src/app/api/availability/route.test.ts` - Unit tests for availability API
- `src/app/api/availability/slots/route.ts` - API route for slot generation and search
- `src/app/api/availability/slots/route.test.ts` - Unit tests for slots API

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests
- Database schema changes require Prisma migrations: `npx prisma migrate dev`
- **Database infrastructure is comprehensive** - minor schema updates needed
- **Availability management logic cleared** - complete rebuild required from scratch
- **TanStack Query Integration Required**: All client-side data fetching must use TanStack Query patterns from CLAUDE.md
- **Strong Typing Required**: All code must be strongly typed based on Prisma schema with TypeScript interfaces and Zod schemas

## Tasks

- [ ] 1.0 Database Schema Enhancement (Minor updates to existing comprehensive schema)

  - [ ] 1.1 Add SchedulingRule enum to Prisma schema (CONTINUOUS, FIXED_INTERVAL, CUSTOM_INTERVAL)
  - [ ] 1.2 Update existing Availability table to add: recurrencePattern (Json), seriesId (String), isRecurring (Boolean), schedulingRule (SchedulingRule), schedulingInterval (Int), isOnlineAvailable (Boolean)
  - [ ] 1.3 Update ServiceAvailabilityConfig table: add showPrice (Boolean), locationId (String relation to Location), remove location String field
  - [ ] 1.4 Create and run Prisma migration for schema changes
  - [ ] 1.5 Update database seeding script to include sample availability data with new fields
  - [ ] 1.6 Generate Prisma client and verify TypeScript types are updated for new fields

- [ ] 2.0 Core Availability Management Logic (Build from scratch - existing logic cleared)

  - [ ] 2.1 Create strongly-typed TypeScript interfaces and Zod schemas based on updated Prisma schema
  - [ ] 2.2 Create availability CRUD server actions from scratch (create, read, update, delete) supporting all new fields with full type safety
  - [ ] 2.3 Create TanStack Query hooks following existing patterns ([resource, id] cache keys, onSuccess/onError callbacks)
  - [ ] 2.4 Create recurrence pattern logic for generating recurring availability occurrences
  - [ ] 2.5 Build scheduling rules engine (continuous, fixed interval, custom interval)
  - [ ] 2.6 Create slot generation algorithm that applies scheduling rules to availability periods
  - [ ] 2.7 Implement conflict detection logic to prevent double-booking and handle scheduling rule conflicts
  - [ ] 2.8 Add validation logic to prevent modification of availability with existing bookings
  - [ ] 2.9 Create billing attribution logic based on availability context (provider vs organization billing)

- [ ] 3.0 Availability Creation and Management UI

  - [ ] 3.1 Build availability creation form with date/time pickers and recurrence options using TanStack Query hooks
  - [ ] 3.2 Enhance service selection interface with pricing display control and duration configuration
  - [ ] 3.3 Implement location selection (physical locations vs online-only)
  - [ ] 3.4 Add scheduling rule selection UI (continuous/fixed/custom intervals)
  - [ ] 3.5 Build confirmation workflow configuration (automatic vs manual)
  - [ ] 3.6 Create availability editing interface for individual occurrences and series with optimistic updates
  - [ ] 3.7 Add availability deletion with validation for existing bookings
  - [ ] 3.8 Implement responsive design for mobile availability management
  - [ ] 3.9 Integrate real-time updates when availability is modified using TanStack Query invalidation

- [ ] 4.0 Organization-Provider Request Workflow (Leverage existing Availability.status system)

  - [ ] 4.1 Create organization interface to propose availability to providers (creates Availability with status=PENDING)
  - [ ] 4.2 Build provider interface to view and respond to availability proposals (accept/reject updates status)
  - [ ] 4.3 Enhance existing status tracking to support recurring availability requests
  - [ ] 4.4 Add notification system for availability request status changes. For now just log what would be sent.
  - [ ] 4.5 Build workflow that activates accepted availability for slot generation

- [ ] 5.0 Slot Generation Implementation (Build from scratch using CalculatedAvailabilitySlot table)

  - [ ] 5.1 Create slot generation logic that applies scheduling rules (continuous, fixed interval, custom interval)
  - [ ] 5.2 Implement slot generation for recurrence patterns and series grouping
  - [ ] 5.3 Build slot conflict management system to handle scheduling rule conflicts
  - [ ] 5.4 Create slot recalculation triggers for recurring availability modifications
  - [ ] 5.5 Build integration with existing booking functionality to support new scheduling rules
  - [ ] 5.6 Implement slot cleanup for deleted or modified recurring availability series

- [ ] 6.0 Search and Discovery Features (Build on existing database indexes)

  - [ ] 6.1 Build patient search interface for finding providers by availability
  - [ ] 6.2 Implement location-based search with distance parameters using existing Location.coordinates
  - [ ] 6.3 Add time-based search filtering (date ranges, specific times)
  - [ ] 6.4 Create service-type filtering for search results
  - [ ] 6.5 Build search results display with available slots and conditional pricing
  - [ ] 6.6 Optimize search queries for performance (leverage existing database indexes)

- [ ] 7.0 Calendar Visualization and Management Views
  - [ ] 7.1 Create provider calendar view showing individual availability and bookings
  - [ ] 7.2 Build organization calendar view displaying multiple provider schedules
  - [ ] 7.3 Add coverage gap identification for organization managers
  - [ ] 7.4 Implement calendar navigation and filtering options for recurring patterns
  - [ ] 7.5 Create visual indicators for different availability types, statuses, and scheduling rules
  - [ ] 7.6 Add drag-and-drop functionality for availability management with recurring series support
  - [ ] 7.7 Build calendar export functionality leveraging existing CalendarIntegration infrastructure
