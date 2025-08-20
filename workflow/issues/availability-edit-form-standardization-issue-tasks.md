## Relevant Files

- `src/features/calendar/components/availability/availability-edit-form.tsx` - Main component that needs complete rebuild from scratch
- `src/features/calendar/components/availability/availability-creation-form.tsx` - Reference implementation to copy structure and patterns from
- `src/features/calendar/hooks/use-availability-by-id.ts` - Hook for fetching existing availability data
- `src/features/calendar/hooks/use-update-availability.ts` - Hook for updating availability data
- `src/features/calendar/types/schemas.ts` - Contains updateAvailabilityDataSchema for form validation
- `src/features/calendar/components/calendar-loader.tsx` - Loading component to use for async states
- `src/features/calendar/components/provider-calendar-view.tsx` - Parent component that uses the edit form

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase
- This is a complete greenfield implementation following the creation form pattern exactly
- Edit form is provider-only (online-only availability, no organization context)

## Tasks

- [x] 1.0 Set Up Form Structure and Core Architecture
  - [x] 1.1 Copy complete component structure from availability-creation-form.tsx
  - [x] 1.2 Set up proper imports (React Hook Form, Zod, tRPC types, UI components)
  - [x] 1.3 Configure TypeScript types using RouterInputs/RouterOutputs patterns
  - [x] 1.4 Set up form with updateAvailabilityDataSchema validation
  - [x] 1.5 Implement basic component shell with proper prop interfaces
  - [x] 1.6 Add CalendarLoader component for loading states
- [x] 2.0 Implement Data Loading and Form Population
  - [x] 2.1 Integrate useAvailabilityById hook to fetch existing availability data
  - [x] 2.2 Handle loading states during data fetch
  - [x] 2.3 Implement form population from existing availability data
  - [x] 2.4 Transform database data to form field format (dates, times, recurrence)
  - [x] 2.5 Handle error states when availability data cannot be loaded
  - [x] 2.6 Set up form default values and reset functionality
- [x] 3.0 Build Edit Mode Adaptations and Constraints
  - [x] 3.1 Create read-only profile context section (creator type, provider info)
  - [x] 3.2 Implement booking constraint checking logic
  - [x] 3.3 Add disabled states for time/date fields when bookings exist
  - [x] 3.4 Build recurrence editing with series update options (single/series/future)
  - [x] 3.5 Adapt service selection for edit mode with pre-population
  - [x] 3.6 Handle location constraints (online-only for provider-created availability)
  - [x] 3.7 Add warning messages for constraint violations
- [x] 4.0 Implement Form Submission and Integration
  - [x] 4.1 Integrate useUpdateAvailability mutation hook
  - [x] 4.2 Handle form submission with proper data transformation
  - [x] 4.3 Implement optimistic updates for immediate UI feedback
  - [x] 4.4 Add comprehensive error handling for mutation failures
  - [x] 4.5 Handle success states and navigation after update
  - [x] 4.6 Add form validation and field-level error display
- [x] 5.0 Add User Experience Enhancements and Polish
  - [x] 5.1 Add clear visual indicators for read-only vs editable fields
  - [x] 5.2 Implement loading spinners and skeleton states
  - [x] 5.3 Add user feedback for booking constraints and warnings
  - [x] 5.4 Ensure proper accessibility attributes and keyboard navigation
  - [x] 5.5 Test responsive design across different screen sizes
  - [x] 5.6 Run ESLint/Prettier and fix all code quality issues