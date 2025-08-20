# Provider Appointment Booking View - Task List

## Implementation Notes

- Main component name: `provider-slot-view`
- Route location: `/app/(general)/calendar/[id]/`
- The provider-slot-view component should be displayed at this route

## Relevant Files

### New Files to Create
- `src/app/(general)/calendar/[id]/page.tsx` - Main page component for the booking calendar view
- `src/features/calendar/components/provider-slot-view.tsx` - Main calendar component displaying provider slots
- `src/features/calendar/components/booking-calendar-grid.tsx` - Calendar grid for displaying availability slots
- `src/features/calendar/components/booking-calendar-header.tsx` - Calendar navigation and view controls
- `src/features/calendar/components/booking-filter-bar.tsx` - Filter controls for searching availability
- `src/features/calendar/components/booking-slot-item.tsx` - Individual slot component with click handling
- `src/features/calendar/hooks/use-available-slots.ts` - Hook for fetching and managing availability data
- `src/features/calendar/hooks/use-booking-filters.ts` - Hook for managing filter state
- `src/features/calendar/types/booking-types.ts` - Type definitions for booking view

### Existing Files to Modify
- `src/server/api/routers/calendar.ts` - Add tRPC procedures for fetching filtered availability
- `src/components/ui/calendar-loader.tsx` - Reuse for loading states

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase
- Leverage existing provider-calendar-view patterns for consistency

## Tasks

- [ ] 1.0 Set up route and page structure at /app/(general)/calendar/[id]/
  - [ ] 1.1 Create page.tsx at /app/(general)/calendar/[id]/ with proper params handling
  - [ ] 1.2 Set up layout structure for public access (no auth required)
  - [ ] 1.3 Add metadata and SEO configuration for the page
  - [ ] 1.4 Implement provider ID validation and error handling

- [ ] 2.0 Create provider-slot-view calendar components
  - [ ] 2.1 Create provider-slot-view.tsx as the main container component
  - [ ] 2.2 Build booking-calendar-grid.tsx with day/3-day/week view layouts
  - [ ] 2.3 Implement booking-calendar-header.tsx with navigation controls (matching provider-calendar-view)
  - [ ] 2.4 Create booking-slot-item.tsx component with green/grey status colors
  - [ ] 2.5 Add duration text display on slot items
  - [ ] 2.6 Implement time grid with proper slot positioning based on time/duration

- [ ] 3.0 Implement filtering system
  - [ ] 3.1 Create booking-filter-bar.tsx with all required filter controls
  - [ ] 3.2 Implement date picker filter
  - [ ] 3.3 Add time range filter
  - [ ] 3.4 Create location/online toggle filter
  - [ ] 3.5 Add provider type dropdown filter
  - [ ] 3.6 Implement service selection filter
  - [ ] 3.7 Add duration filter control
  - [ ] 3.8 Create price range filter
  - [ ] 3.9 Add "clear all filters" button
  - [ ] 3.10 Create use-booking-filters.ts hook for filter state management
  - [ ] 3.11 Implement filter persistence across navigation

- [ ] 4.0 Integrate availability data
  - [ ] 4.1 Create use-available-slots.ts hook for data fetching
  - [ ] 4.2 Add tRPC procedure in calendar router for fetching CalculatedAvailabilitySlot data
  - [ ] 4.3 Implement real-time availability checking to prevent double-booking
  - [ ] 4.4 Add filtering logic in tRPC procedure based on filter parameters
  - [ ] 4.5 Hide past time slots for current day automatically
  - [ ] 4.6 Enforce 3-day advance booking limit in data query
  - [ ] 4.7 Implement loading states using calendar-loader.tsx
  - [ ] 4.8 Add error handling and retry logic
  - [ ] 4.9 Handle empty state when no slots match filters

- [ ] 5.0 Add slot interaction and booking initiation
  - [ ] 5.1 Implement click handler for available (green) slots
  - [ ] 5.2 Disable click interaction for unavailable (grey) slots
  - [ ] 5.3 Add hover effects for interactive slots
  - [ ] 5.4 Create slot selection state management
  - [ ] 5.5 Prepare slot data payload for booking form (to be implemented later)
  - [ ] 5.6 Add visual feedback on slot selection

- [ ] 6.0 Implement responsive design and view modes
  - [ ] 6.1 Create responsive breakpoints for mobile vs desktop
  - [ ] 6.2 Implement day view for mobile devices
  - [ ] 6.3 Add 3-day view option for mobile
  - [ ] 6.4 Implement week view for desktop
  - [ ] 6.5 Ensure filter bar is accessible and doesn't obstruct calendar on mobile
  - [ ] 6.6 Optimize slot display for high density (40+ slots per day)
  - [ ] 6.7 Test and adjust touch targets for mobile interaction
  - [ ] 6.8 Implement view mode switcher UI
  - [ ] 6.9 Persist selected view mode in local storage