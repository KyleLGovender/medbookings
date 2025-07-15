# Provider Availability Bug Fix & Improvement Task List

## High Priority Tasks

### 🔴 Critical Issues (Fix Immediately)
- [ ] **Bug Fix**: Recurring availabilities not showing in calendar view - `src/features/calendar/availability/lib/actions.ts:107`
  - **Issue**: When creating recurring availability, only the first instance appears in calendar, subsequent recurring instances are not displayed
  - **Impact**: Users cannot see their recurring availability schedule, leading to confusion about actual availability
  - **Root Cause**: Backend creates only a single database record even for recurring availability. No logic exists to generate multiple instances from recurrence patterns
  - **Technical Details**:
    - `createAvailability` action (lines 122-156) creates single record regardless of recurrence pattern
    - `seriesId` is generated (line 109) but only one record uses it
    - `recurrencePattern` JSON is stored but never processed to create instances
    - Frontend calendar expects multiple records with same `seriesId` but finds only one
    - Database schema supports recurring instances but generation logic is missing
  - **Implementation**: 
    1. **Backend**: Add recurring instance generation logic in `createAvailability` action
    2. **Utils**: Create function in `recurrence-utils.ts` to expand patterns into date ranges
    3. **Database**: Generate multiple availability records with same `seriesId` for recurring series
    4. **API**: Ensure search returns all instances within date range
    5. **Frontend**: Verify calendar handles multiple instances correctly
    6. **Validation**: Add logic to prevent overlapping recurring instances
  - **Key Files**:
    - `src/features/calendar/availability/lib/actions.ts` (lines 107-156)
    - `src/features/calendar/availability/lib/recurrence-utils.ts` (add expansion logic)
    - `src/features/calendar/availability/hooks/use-availability.ts` (lines 50-75)
    - `src/features/calendar/availability/components/provider-calendar-view.tsx` (lines 111-116)
  - **Testing**: 
    - Create daily recurring availability and verify all instances appear in calendar
    - Test weekly recurring availability across multiple weeks
    - Test custom recurring patterns with specific days
    - Verify recurring events maintain proper styling and status
    - Test editing/deleting recurring series vs individual instances
    - Test performance with large recurring series (e.g., daily for 6 months)
  - **Estimated Time**: 6-8 hours

### 🟡 High Priority (Next Sprint)
- [ ] **UX/UI**: Add profile selection to availability creation form - `src/features/calendar/availability/components/availability-creation-form.tsx:160`
  - **Issue**: Form lacks clarity about who is creating the availability and for which provider
  - **Impact**: Users (especially organization roles) are confused about profile context when creating availability
  - **Implementation**: 
    1. Add profile selection section at top of form with two dropdowns:
       - "Creating as" (Organization Role vs Provider)
       - "Provider" (which provider this availability is for)
    2. Update form validation to require these fields
    3. Modify form submission to include profile context
    4. Update component props to handle organization role users
  - **Testing**: 
    - Test as organization admin creating availability for different providers
    - Test as provider creating their own availability
    - Verify form validation works correctly
    - Test that created availability shows correct ownership
  - **Estimated Time**: 4-6 hours

- [ ] **UX/UI**: Improve location selection visual feedback - `src/features/calendar/availability/components/availability-creation-form.tsx:360`
  - **Issue**: When a location is selected, there's no clear visual indication that selection was successful
  - **Impact**: Users are unsure if their location selection registered, leading to confusion and potential re-selection
  - **Implementation**: 
    1. Add visual indicator when location is selected (icon, text, or styling change)
    2. Consider adding a pin icon or checkmark next to selected location
    3. Update SelectTrigger to show selected state more clearly
    4. Add descriptive text showing the selected location name
  - **Testing**: 
    - Test location selection with different locations
    - Verify visual feedback appears immediately upon selection
    - Test that indicator clears when selection is changed
    - Test accessibility with screen readers
  - **Estimated Time**: 2-3 hours

- [ ] **UX/UI**: Change price input increment to R10 - `src/features/calendar/availability/components/service-selection-section.tsx:164`
  - **Issue**: Price input allows granular changes (0.01 step), making it difficult to set reasonable prices
  - **Impact**: Users struggle with too-granular price adjustments, leading to inefficient pricing workflow
  - **Implementation**: 
    1. Change step from "0.01" to "10" for R10 increments
    2. Consider adding +/- buttons for easier price adjustment
    3. Update default price logic to use R10 multiples
    4. Ensure validation still works with new step value
  - **Testing**: 
    - Test price input with keyboard arrows (should increment by R10)
    - Test manual input of prices not in R10 multiples
    - Verify price validation still works correctly
    - Test that saved prices are properly formatted
  - **Estimated Time**: 1-2 hours

- [ ] **UX/UI**: Add context menu "View Details" button for calendar events - `src/features/calendar/availability/components/provider-calendar-view.tsx:724`
  - **Issue**: Event details are only accessible via hover tooltip, which can be difficult to access on mobile or for users with accessibility needs
  - **Impact**: Users cannot easily access detailed event information without hovering, limiting usability
  - **Implementation**: 
    1. Add right-click context menu to calendar events in WeekView, DayView, and MonthView
    2. Include "View Details" option in context menu
    3. Show same tooltip content as persistent modal/popover when clicked
    4. Ensure context menu works on both desktop (right-click) and mobile (long press)
    5. Position context menu appropriately within viewport
  - **Testing**: 
    - Test right-click context menu on desktop
    - Test long press context menu on mobile/touch devices
    - Verify "View Details" shows all tooltip information
    - Test context menu positioning at screen edges
    - Verify accessibility with keyboard navigation
  - **Estimated Time**: 3-4 hours

- [ ] **UX/UI**: Simplify availability form to single-day scheduling - `src/features/calendar/availability/components/availability-creation-form.tsx:171`
  - **Issue**: Form allows separate dates for start and end times, causing confusion about multi-day scheduling
  - **Impact**: Users can accidentally create multi-day availability blocks, leading to scheduling confusion
  - **Implementation**: 
    1. Change to single date picker for the availability date
    2. Use only time pickers for start and end times (no date component)
    3. Ensure both start and end times are constrained to the same day
    4. Update form validation to prevent end time before start time
    5. Keep recurrence functionality for multi-day patterns
    6. Update form labels to clarify single-day scheduling
  - **Testing**: 
    - Test that both start and end times use the same date
    - Verify time validation prevents end before start
    - Test recurrence still works for multi-day patterns
    - Verify form validation messages are clear
    - Test accessibility with screen readers
  - **Estimated Time**: 2-3 hours

- [ ] **UX/UI**: Add availability hours summary to monthly view - `src/features/calendar/availability/components/provider-calendar-view.tsx:1079`
  - **Issue**: Monthly view shows individual events but doesn't summarize total availability hours for each day
  - **Impact**: Users cannot quickly see total available hours per day in month view, making capacity planning difficult
  - **Implementation**: 
    1. Calculate total availability hours for each day in MonthView component
    2. Add summary block showing total hours available (e.g., "8.5h available")
    3. Replace individual event display with consolidated availability summary
    4. Show different colors/styles based on availability status mix
    5. Include tooltip with breakdown of availability blocks
    6. Show booking utilization percentage if applicable
  - **Testing**: 
    - Test with days having multiple availability blocks
    - Verify hours calculation is accurate across different time zones
    - Test with mixed availability statuses (pending, accepted, cancelled)
    - Verify summary updates when availability changes
    - Test tooltip shows detailed breakdown
  - **Estimated Time**: 3-4 hours

## Medium Priority Tasks

### 🔵 Medium Priority (Upcoming)

## Low Priority Tasks

### 🟢 Low Priority (Backlog)

## Completed Tasks

### ✅ Recently Completed