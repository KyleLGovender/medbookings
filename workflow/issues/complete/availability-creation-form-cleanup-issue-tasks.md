# Task List: availability-creation-form-cleanup

## Relevant Files

- `src/features/calendar/components/availability/availability-creation-form.tsx` - Main component requiring cleanup and simplification
- `src/features/calendar/hooks/use-availability.ts` - Hook for availability creation that may need updates
- `src/features/calendar/types/schemas.ts` - Zod schema for availability validation
- `src/features/calendar/types/types.ts` - Domain types for calendar feature (RecurrenceOption, etc.)
- `src/features/providers/hooks/use-current-user-provider.ts` - Hook for getting current provider data
- `src/features/calendar/components/availability/custom-recurrence-modal.tsx` - Modal component that needs integration for displaying pattern details
- `src/features/calendar/lib/recurrence-utils.ts` - Utility functions for recurrence patterns
- `src/utils/api.ts` - tRPC type imports (RouterOutputs)

### Notes

- This form will serve as the reference pattern for `availability-edit-form.tsx`
- Breaking changes are acceptable (v0 - no backward compatibility required)

## Tasks

- [x] 1.0 Remove Organization-Related Code and Simplify Component Purpose
  - [x] 1.1 Remove "Creating as" selector UI (lines 230-287)
  - [x] 1.2 Remove organization-related imports (useCurrentUserOrganizations, useOrganizationLocations)
  - [x] 1.3 Remove organization-related state variables (selectedCreatorType, organizationId props)
  - [x] 1.4 Remove organization conditional logic throughout the component
  - [x] 1.5 Add clear header text "Creating online availability for [Provider Name]"
  - [x] 1.6 Update component props interface to remove organizationId and locationId
  - [x] 1.7 Ensure form submission only handles provider self-scheduling logic

- [x] 2.0 Remove Location Selection UI and Enforce Online-Only Availability
  - [x] 2.1 Remove entire location section UI (lines 484-540 approximately)
  - [x] 2.2 Remove location-related imports and hooks (useOrganizationLocations)
  - [x] 2.3 Remove isOnlineAvailable checkbox - automatically set to true
  - [x] 2.4 Remove locationId from form values and submission
  - [x] 2.5 Update form schema to remove location validation
  - [x] 2.6 Ensure backend submission always sets isOnlineAvailable: true

- [x] 3.0 Implement Type Safety Using tRPC Patterns
  - [x] 3.1 Import RouterOutputs from '@/utils/api'
  - [x] 3.2 Extract availability types using RouterOutputs['calendar']['create']
  - [x] 3.3 Extract provider types using RouterOutputs for provider data
  - [x] 3.4 Replace any manual type definitions with tRPC-inferred types
  - [x] 3.5 Use domain types from '@/features/calendar/types/types' for RecurrenceOption
  - [x] 3.6 Ensure all hook returns are properly typed with tRPC types

- [x] 4.0 Add Custom Recurrence Pattern Display
  - [x] 4.1 Create a component to display selected recurrence pattern details
  - [x] 4.2 Track custom recurrence selection in form state
  - [x] 4.3 Display pattern details below custom recurrence selector
  - [x] 4.4 Show days selected, frequency, and end conditions clearly
  - [x] 4.5 Ensure pattern details update when user modifies selection

- [x] 5.0 Simplify State Management and Optimize Performance
  - [x] 5.1 Consolidate multiple useState hooks into fewer state objects
  - [x] 5.2 Optimize form.watch usage to prevent unnecessary re-renders
  - [x] 5.3 Implement useMemo for expensive computations
  - [x] 5.4 Remove unnecessary state related to organizations
  - [x] 5.5 Simplify form field dependencies and watchers
  - [x] 5.6 Ensure proper cleanup of subscriptions and watchers

- [x] 6.0 Add Error Handling and Loading States
  - [x] 6.1 Add loading states for provider data fetching
  - [x] 6.2 Add error boundaries for form submission failures
  - [x] 6.3 Implement proper error messages for validation failures
  - [x] 6.4 Add loading indicators during form submission
  - [x] 6.5 Handle edge cases (no provider found, API failures)
  - [x] 6.6 Add user-friendly error messages for all error scenarios

- [x] 7.0 Code Quality Cleanup and Validation
  - [x] 7.1 Remove all unused imports and variables
  - [x] 7.2 Remove any commented-out code
  - [x] 7.3 Add JSDoc comments for complex logic sections
  - [x] 7.4 Ensure all functions follow single responsibility principle
  - [x] 7.5 Run ESLint and fix all warnings
  - [x] 7.6 Verify component follows all CLAUDE.md patterns
  - [x] 7.7 Perform manual testing to confirm all functionality works
  - [x] 7.8 Ensure component is ready to serve as reference pattern
