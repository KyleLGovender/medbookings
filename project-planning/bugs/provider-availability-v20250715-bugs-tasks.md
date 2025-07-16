# Provider Availability V2 - Bug Fix Tasks

> **Generated from:** `provider-availability-v20250715-bugs.md`
> **Date:** July 16, 2025
> **Total Tasks:** 8 (1 Critical, 1 High, 5 Medium, 1 Low)

## Relevant Files

- `src/features/calendar/availability/lib/actions.ts` - Core availability creation and management logic (MODIFIED)
- `src/features/calendar/availability/lib/actions.test.ts` - Unit tests for availability actions
- `src/features/calendar/availability/lib/slot-generation.ts` - Slot generation service (CREATED)
- `src/features/calendar/availability/lib/slot-generation.test.ts` - Unit tests for slot generation (CREATED)
- `src/features/calendar/availability/lib/actions-slot-integration.test.ts` - Integration tests for availability creation with slot generation (CREATED)
- `src/features/calendar/availability/lib/workflow-service.ts` - Workflow service for availability acceptance/rejection (MODIFIED)
- `src/features/calendar/availability/lib/provider-status-logic.test.ts` - Tests for provider status logic (CREATED)
- `src/features/calendar/availability/lib/workflow-integration.test.ts` - Tests for workflow integration with provider status (CREATED)
- `src/features/calendar/availability/lib/availability-validation.ts` - Comprehensive validation logic (CREATED)
- `src/features/calendar/availability/lib/availability-validation.test.ts` - Unit tests for validation (CREATED)
- `src/features/calendar/availability/lib/validation-integration.test.ts` - Integration tests for validation in actions (CREATED)
- `src/features/calendar/availability/components/provider-calendar-view.tsx` - Main provider calendar component
- `src/features/calendar/availability/components/provider-calendar-view.test.tsx` - Unit tests for calendar view
- `src/features/calendar/availability/components/availability-creation-form.tsx` - Availability creation form component
- `src/features/calendar/availability/components/availability-creation-form.test.tsx` - Unit tests for creation form
- `src/features/calendar/availability/components/availability-edit-form.tsx` - Availability editing form component
- `src/features/calendar/availability/components/availability-edit-form.test.tsx` - Unit tests for edit form
- `src/features/calendar/availability/components/availability-view-modal.tsx` - Read-only availability view modal
- `src/features/calendar/availability/components/availability-view-modal.test.tsx` - Unit tests for view modal
- `src/features/calendar/availability/components/series-action-dialog.tsx` - Series management dialog component (CREATED)
- `src/features/calendar/availability/components/series-action-dialog.test.tsx` - Unit tests for series dialog
- `src/app/(dashboard)/providers/[id]/manage-calendar/page.tsx` - Provider calendar management page (MODIFIED)
- `src/features/calendar/availability/hooks/use-availability.ts` - Availability hooks with series scope support (MODIFIED)
- `src/features/calendar/availability/lib/actions.ts` - Availability actions with series operations (MODIFIED)
- `src/app/api/calendar/availability/delete/route.ts` - Delete API with series scope support (MODIFIED)
- `src/app/api/calendar/availability/cancel/route.ts` - Cancel API with series scope support (MODIFIED)
- `src/features/calendar/availability/lib/validation.ts` - Availability validation utilities
- `src/features/calendar/availability/lib/validation.test.ts` - Unit tests for validation utilities

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npm test` to run all tests or `npm test [file-pattern]` for specific tests
- Run `npm run lint` and `npm run format` after making changes
- Database changes may require `npx prisma db push` for development

## Tasks

- [x] 1.0 🔴 **CRITICAL**: Fix Availability Slot Generation System
  - [x] 1.1 Investigate current slot generation flow in `src/features/calendar/availability/lib/actions.ts:97`
  - [x] 1.2 Identify missing call to slot calculation/generation after availability creation
  - [x] 1.3 Verify slot generation service integration with availability creation action
  - [x] 1.4 Ensure both single and recurring availability creation trigger slot generation
  - [x] 1.5 Add proper error handling for slot generation failures
  - [x] 1.6 Implement synchronous or asynchronous slot generation based on performance needs
  - [x] 1.7 Write comprehensive tests for slot generation scenarios
  - [x] 1.8 Test with different availability configurations (duration, services, etc.)

- [x] 2.0 🟡 **HIGH**: Fix Provider Status Logic for Self-Created Availabilities
  - [x] 2.1 Identify the incorrect User ID vs ServiceProvider ID comparison in `src/features/calendar/availability/lib/actions.ts:97`
  - [x] 2.2 Fetch ServiceProvider record for current user using `prisma.serviceProvider.findUnique`
  - [x] 2.3 Update `isProviderCreated` logic to compare correct ServiceProvider IDs
  - [x] 2.4 Set `initialStatus = AvailabilityStatus.ACCEPTED` for provider-created availabilities
  - [x] 2.5 Maintain existing behavior for organization-created availabilities
  - [x] 2.6 Add unit tests covering provider vs organization creation paths
  - [x] 2.7 Test provider-created availability returns ACCEPTED status
  - [x] 2.8 Test organization-created availability returns PENDING status
  - [x] 2.9 Verify existing acceptance workflow continues to function

- [x] 3.0 🔵 **MEDIUM**: Implement Comprehensive Availability Validation
  - [x] 3.1 Create comprehensive overlap detection across ALL provider availabilities in `src/features/calendar/availability/lib/actions.ts:53`
  - [x] 3.2 Implement past date limits (max 30 days back from current date)
  - [x] 3.3 Add future scheduling limits (max 3 calendar months ahead)
  - [x] 3.4 Enforce 15-minute minimum duration for all availability periods
  - [x] 3.5 Create efficient database overlap detection query using `(newStart < existingEnd AND newEnd > existingStart)`
  - [x] 3.6 Extend overlap checking to validate recurring instances against existing availabilities
  - [x] 3.7 Implement specific, actionable error messages for each validation failure
  - [x] 3.8 Test overlapping availability creation is blocked with clear errors
  - [x] 3.9 Test past/future date limits and minimum duration enforcement
  - [x] 3.10 Test edge cases: same start/end times, midnight boundaries, timezone handling

- [x] 4.0 🔵 **MEDIUM**: Implement Series vs Individual Availability Management
  - [x] 4.1 Add series detection logic in `src/app/(dashboard)/providers/[id]/manage-calendar/page.tsx:178`
  - [x] 4.2 Create series-aware context menu options for recurring availabilities
  - [x] 4.3 Implement series action dialog component with scope options ("This occurrence only", "This and future", "All occurrences")
  - [x] 4.4 Update edit, delete, and cancel operations to accept `scope` parameter
  - [x] 4.5 Implement series-wide operation handling logic
  - [x] 4.6 Leverage existing `DragDropCalendar` component's `SeriesUpdateOptions` pattern
  - [x] 4.7 Add series management to organization calendar views
  - [x] 4.8 Test recurring availability context menu shows series options
  - [x] 4.9 Test single occurrence vs entire series editing functionality
  - [x] 4.10 Test series deletion and booking conflict scenarios

- [x] 5.0 🔵 **MEDIUM**: Clean Up Availability Creation Form as Reference Pattern
  - [x] 5.1 Conduct critical code review of `src/features/calendar/availability/components/availability-creation-form.tsx`
  - [x] 5.2 Remove unused variables, commented code, and development debugging artifacts
  - [x] 5.3 Resolve TODO comment at line 237 for organization provider selection
  - [x] 5.4 Simplify and standardize state management patterns following CLAUDE.md guidelines
  - [x] 5.5 Remove any 'any' types (lines 99, 486, 487) and ensure strict TypeScript typing
  - [x] 5.6 Standardize form handling, validation, and error management patterns
  - [x] 5.7 Group related logic and extract reusable functions if needed
  - [x] 5.8 Implement consistent error handling and loading states
  - [x] 5.9 Review and optimize form watchers for performance
  - [x] 5.10 Add JSDoc comments and ensure CLAUDE.md compliance
  - [x] 5.11 Test all form functionality works exactly as before
  - [x] 5.12 Verify no console errors and TypeScript compiles without warnings

- [x] 6.0 🔵 **MEDIUM**: Standardize Edit Form to Match Creation Form Pattern
  - [x] 6.1 Analyze cleaned creation form structure and identify all sections and patterns
  - [x] 6.2 Add missing profile selection section adapted for edit mode
  - [x] 6.3 Implement recurrence settings section with custom recurrence modal support
  - [x] 6.4 Add location section with online/physical location management
  - [x] 6.5 Implement proper form organization with consistent separators and headings
  - [x] 6.6 Adapt profile selection for edit mode (may be read-only based on permissions)
  - [x] 6.7 Add recurrence editing with series update options (single/series/future)
  - [x] 6.8 Implement location change restrictions when bookings exist
  - [x] 6.9 Align state management patterns with creation form
  - [x] 6.10 Ensure consistent UI components, validation, and error handling
  - [x] 6.11 Test all existing edit functionality continues to work
  - [x] 6.12 Verify new sections display correctly and work with booking restrictions

- [x] 7.0 🔵 **MEDIUM**: Comprehensive Calendar Component Cleanup
  - [x] 7.1 Remove all console.log statements, TODO comments, and debug code from `src/features/calendar/availability/components/provider-calendar-view.tsx`
  - [x] 7.2 Fix `selectedEvent` state management - either complete modal implementation or remove unused references
  - [x] 7.3 Implement consistent error boundaries and loading states following CLAUDE.md patterns
  - [x] 7.4 Add strict TypeScript typing and remove any 'any' types
  - [x] 7.5 Extract reusable sub-components (WeekView, DayView, MonthView) into separate files
  - [x] 7.6 Consolidate duplicate time calculation, event positioning, and styling logic
  - [x] 7.7 Standardize TanStack Query usage, error handling, and cache invalidation patterns
  - [x] 7.8 Add proper ARIA labels, keyboard navigation, and screen reader support
  - [x] 7.9 Implement memoization for expensive calculations and optimize re-renders
  - [x] 7.10 Add comprehensive JSDoc comments explaining component architecture
  - [x] 7.11 Clean up related files: `availability-creation-form.tsx` and `page.tsx`
  - [x] 7.12 Test all functionality works after cleanup with no console errors
  - [x] 7.13 Verify accessibility and performance improvements

- [ ] 8.0 🟢 **LOW**: Implement Availability View Modal Component
  - [ ] 8.1 Create new `availability-view-modal.tsx` component in `src/features/calendar/availability/components/`
  - [ ] 8.2 Design modal structure to mirror `availability-creation-form.tsx` with read-only display
  - [ ] 8.3 Implement profile info section (creator type, provider)
  - [ ] 8.4 Add time settings display (date, start/end times)
  - [ ] 8.5 Create recurrence settings section (pattern, custom details)
  - [ ] 8.6 Add location section (online/physical) and services display
  - [ ] 8.7 Implement status indicator with appropriate styling (PENDING, ACCEPTED, CANCELLED)
  - [ ] 8.8 Add proper date/time formatting and close button functionality
  - [ ] 8.9 Implement accessibility features (ARIA labels, keyboard navigation)
  - [ ] 8.10 Update `handleViewDetails` function at `src/app/(dashboard)/providers/[id]/manage-calendar/page.tsx:179`
  - [ ] 8.11 Add state management for showing/hiding the view modal
  - [ ] 8.12 Test modal displays all information correctly across different availability types
  - [ ] 8.13 Verify responsive design and accessibility compliance

## Priority Implementation Order

1. **Task 1.0** (Critical) - Fix slot generation (system-breaking)
2. **Task 2.0** (High) - Fix provider status logic (user experience)
3. **Task 3.0** (Medium) - Implement validation (prevent conflicts)
4. **Task 5.0** (Medium) - Clean creation form (reference pattern)
5. **Task 6.0** (Medium) - Standardize edit form (depends on 5.0)
6. **Task 7.0** (Medium) - Clean calendar components (large refactor)
7. **Task 4.0** (Medium) - Implement series management (depends on 7.0)
8. **Task 8.0** (Low) - Implement view modal (UX enhancement)

*Generated from provider-availability-v20250715-bugs.md using bug-task-generate.md guidelines*
