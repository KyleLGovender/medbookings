# Provider Appointment Booking View - Task List

## Implementation Strategy

**SIMPLIFIED APPROACH**: Based on analysis of `provider-calendar-view.tsx`, we will create a nearly identical component called `provider-calendar-slot-view.tsx` that displays slots instead of availabilities. This approach reuses 90% of existing code and patterns.

## Implementation Notes

- Main component name: `provider-calendar-slot-view` (based on `provider-calendar-view.tsx`)
- Route location: `/app/(general)/calendar/[id]/`
- Architecture: Mirror `provider-calendar-view.tsx` but fetch and display slots instead of availabilities
- Key difference: Add service selector dropdown instead of status filter

## Relevant Files

### New Files to Create (Only 7 files instead of 13)

- `src/app/(general)/calendar/[id]/page.tsx` - Main page component for the booking calendar view
- `src/features/calendar/components/provider-calendar-slot-view.tsx` - Main calendar component (copy of provider-calendar-view but for slots)
- `src/features/calendar/hooks/use-provider-slots.ts` - Hook for fetching slot data (simplified version)
- `src/features/calendar/components/booking-slot-modal.tsx` - Modal for booking form when slot is clicked
- `src/features/calendar/components/booking-success-toast.tsx` - Success notification after booking
- `src/features/calendar/hooks/use-create-booking.ts` - Hook for booking mutation
- `src/features/calendar/types/slot-booking-types.ts` - Minimal type definitions for slot booking

### Existing Components to Reuse (No modifications needed)

- `src/features/calendar/components/views/day-view.tsx` - Already handles slot display
- `src/features/calendar/components/views/three-day-view.tsx` - Already handles slot display
- `src/features/calendar/components/views/week-view.tsx` - Already handles slot display
- `src/features/calendar/components/views/month-view.tsx` - Already handles slot display
- `src/features/calendar/components/loading.tsx` - CalendarSkeleton for loading states
- `src/components/ui/date-picker.tsx` - Date picker component
- `src/features/calendar/lib/calendar-utils.ts` - Date navigation utilities
- `src/features/calendar/types/types.ts` - CalendarEvent type already supports slots

### Files NOT Needed (Removed from original plan)

- ~~`booking-calendar-grid.tsx`~~ - Use existing view components instead
- ~~`booking-calendar-header.tsx`~~ - Navigation handled in main component like provider-calendar-view
- ~~`booking-slot-item.tsx`~~ - Existing views already render slots properly
- ~~`booking-filter-bar.tsx`~~ - Only need service dropdown, not complex filtering
- ~~`use-booking-filters.ts`~~ - No filtering required
- ~~`mobile-slot-list.tsx`~~ - Existing views are already responsive

### Existing Files to Modify

- `src/server/api/routers/calendar.ts` - Add tRPC procedure for fetching slots by service

### Notes

- The existing calendar view components (DayView, ThreeDayView, etc.) already know how to display slots
- We're essentially creating a variant of provider-calendar-view that fetches different data
- This approach reduces code duplication and maintains consistency

## Tasks

### Phase 1: Cleanup Previous Implementation

- [x] 1.0 Remove unnecessary files from previous complex implementation
  - [x] 1.1 Delete `booking-calendar-grid.tsx`
  - [x] 1.2 Delete `booking-calendar-header.tsx`
  - [x] 1.3 Delete `booking-slot-item.tsx`
  - [x] 1.4 Delete `booking-filter-bar.tsx` (already deleted)
  - [x] 1.5 Delete `use-booking-filters.ts`
  - [x] 1.6 Delete `mobile-slot-list.tsx`
  - [x] 1.7 Delete `provider-slot-view.tsx` (to be replaced)

### Phase 2: Create Simplified Provider Calendar Slot View

- [x] 2.0 Create `provider-calendar-slot-view.tsx` (based on provider-calendar-view.tsx)
  - [x] 2.1 Copy structure from provider-calendar-view.tsx as starting point
  - [x] 2.2 Replace availability data fetching with slot data fetching
  - [x] 2.3 Add service selector dropdown (replacing status filter)
  - [x] 2.4 Transform CalculatedAvailabilitySlot data to CalendarEvent format
  - [x] 2.5 Keep same header with provider info (avatar, name, stats)
  - [x] 2.6 Keep same navigation controls (date picker, left/right arrows, Today button)
  - [x] 2.7 Keep same view mode selector (day/3-day/week/month)
  - [x] 2.8 Reuse existing DayView, ThreeDayView, WeekView, MonthView components
  - [x] 2.9 Change stats to show available slots, booked slots, etc.
  - [x] 2.10 Implement slot click handler to open booking modal (instead of edit modal)
  - [x] 2.11 Add URL state management for date, view, and service parameters

### Phase 3: Create Data Fetching Hook

- [x] 3.0 Create `use-provider-slots.ts` hook
  - [x] 3.1 Fetch CalculatedAvailabilitySlot data for provider
  - [x] 3.2 Add optional service filter parameter
  - [x] 3.3 Include date range filtering based on current view
  - [x] 3.4 Transform slot data to match expected format
  - [x] 3.5 Include booking status for each slot
  - [x] 3.6 Hide past time slots for current day
  - [x] 3.7 Enforce 3-day advance booking limit

### Phase 4: Update/Simplify tRPC Procedures

- [x] 4.0 Update calendar router tRPC procedures
  - [x] 4.1 Simplify `getAvailableSlots` to remove complex filtering
  - [x] 4.2 Add service parameter to filter by specific service
  - [x] 4.3 Return slots in format compatible with CalendarEvent
  - [x] 4.4 Include provider and service information with each slot
  - [x] 4.5 Keep `createPublicBooking` procedure as is
  - [x] 4.6 Include booking information to show slot status

### Phase 5: Keep Booking-Specific Components

- [x] 5.0 Retain and integrate booking components
  - [x] 5.1 Keep `booking-slot-modal.tsx` for booking form
  - [x] 5.2 Keep `booking-success-toast.tsx` for success notifications
  - [x] 5.3 Keep `use-create-booking.ts` for booking mutations
  - [x] 5.4 Simplify `booking-types.ts` to only necessary types
  - [x] 5.5 Integrate modal with slot click handler in main component

### Phase 6: Update Page Component

- [x] 6.0 Update `/app/(general)/calendar/[id]/page.tsx`
  - [x] 6.1 Import and use `provider-calendar-slot-view` instead of `provider-slot-view`
  - [x] 6.2 Pass provider ID from route params
  - [x] 6.3 Keep existing error boundaries and loading states
  - [x] 6.4 Remove any reference to removed components
  - [x] 6.5 Pass searchParams for URL state management

### Key Implementation Details:

1. **Component Structure**: `provider-calendar-slot-view.tsx` will be 90% identical to `provider-calendar-view.tsx`
2. **Main Changes**:
   - Fetch slots instead of availabilities
   - Add service dropdown instead of status filter
   - Click handler opens booking modal instead of edit modal
   - Stats show slot-specific metrics (available/booked) instead of availability metrics
3. **Reused Components**: All existing calendar view components work as-is
4. **Data Format**: Transform slots to CalendarEvent format so existing views can render them
5. **Simplified Architecture**: 7 files instead of 13, maximum code reuse
