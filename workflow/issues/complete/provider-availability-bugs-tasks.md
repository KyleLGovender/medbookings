# Provider Availability - Executable Task List

## Overview
This task list addresses 8 critical bugs and improvements in the provider availability system. Total estimated time: 21-31 hours across 3 priority levels.

## Instructions for Claude Code
- Complete tasks in order of priority (🔴 Critical → 🟡 High → 🔵 Medium)
- Mark tasks as completed when finished
- Run `npm run lint` and `npm run build` after each task completion
- Update this file with completion status and notes
- Test thoroughly before marking as complete

---

## 🔴 Critical Issues (Fix Immediately)

### Task 1: Fix Recurring Availability Display Issue
**Priority:** Critical (🔴)
**File:** `src/features/calendar/availability/lib/actions.ts:107`
**Estimated Time:** 6-8 hours

#### Problem Description
When users create recurring availability (daily, weekly, custom), only the first instance appears in the calendar. The backend creates a single database record with `isRecurring=true` but doesn't generate multiple instances for the recurring series.

#### Root Cause Analysis
- Backend `createAvailability` action creates only one record regardless of recurrence pattern
- `seriesId` is generated but only used by single record
- `recurrencePattern` JSON is stored but never processed to create instances
- Frontend calendar expects multiple records with same `seriesId` but finds only one

#### Implementation Steps
1. **Create recurring instance generator utility** ✅
   - Add function `generateRecurringInstances` to `src/features/calendar/availability/lib/recurrence-utils.ts`
   - Function should take `recurrencePattern` and date range, return array of dates
   - Handle daily, weekly, monthly, and custom patterns
   - Respect end dates and occurrence limits

2. **Update backend availability creation** ✅
   - Modify `createAvailability` in `src/features/calendar/availability/lib/actions.ts`
   - When `isRecurring=true`, generate multiple instances using utility
   - Create database records for each instance with same `seriesId`
   - Ensure each instance has correct `startTime` and `endTime`

3. **Add validation for recurring series** ✅
   - Check for overlapping availability in same series
   - Limit maximum instances (e.g., 365 for daily recurring)
   - Validate end dates are after start dates

4. **Update database queries** ✅
   - Ensure `searchAvailability` returns all instances within date range
   - Optimize queries to handle large recurring series efficiently

5. **Test frontend calendar display** ✅
   - Verify `useAvailabilitySearch` hook fetches all instances
   - Confirm calendar views display all recurring instances
   - Test series editing/deletion functionality

#### Testing Requirements
- Create daily recurring availability for 30 days, verify all instances appear
- Test weekly recurring availability across 8 weeks
- Test custom recurring patterns (specific days of week)
- Verify recurring events maintain proper styling and status
- Test editing individual instances vs entire series
- Test deleting individual instances vs entire series
- Performance test with large recurring series (daily for 6 months)
- Test with different timezones
- Test recurring patterns with end dates

#### Acceptance Criteria
- [x] Daily recurring availability creates multiple instances in database
- [x] Weekly recurring availability displays correctly in calendar
- [x] Custom recurring patterns work with specific days
- [x] Calendar views show all recurring instances
- [x] Series editing affects all instances appropriately
- [x] Performance remains acceptable with large recurring series
- [x] No duplicate instances are created
- [x] Recurring instances respect end dates and occurrence limits
- [x] All tests pass

#### Notes
- This is a complete feature failure that needs immediate attention
- Consider database migration if existing recurring records need to be expanded
- May need to add background job for very large recurring series

#### Relevant Files Modified
- `src/features/calendar/availability/lib/recurrence-utils.ts` - Added generateRecurringInstances function for creating multiple date instances from recurrence patterns
- `src/features/calendar/availability/lib/actions.ts` - Updated createAvailability to generate multiple database records for recurring patterns, added validation for recurring series

---

## 🟡 High Priority (Next Sprint)

### Task 2: Fix Price Input Increment ✅
**Priority:** High (🟡)
**File:** `src/features/calendar/availability/components/service-selection-section.tsx:164`
**Estimated Time:** 1-2 hours

#### Problem Description
Price input uses `step="0.01"` allowing cent-level precision, but users want to price in R10 increments for simplicity.

#### Implementation Steps
1. **Update price input step** ✅
   - Change `step="0.01"` to `step="10"` in service-selection-section.tsx line 164
   - Update default price to be R10 multiple (change R600 to R600 - already is)

2. **Add price increment buttons (optional)** ⏭️
   - Add +/- buttons next to price input for easier adjustment
   - Each click increments/decrements by R10

3. **Update price validation** ✅
   - Ensure validation still works with new step value
   - Consider adding validation for R10 multiples

#### Testing Requirements
- Test price input with keyboard arrows (should increment by R10)
- Test manual input of prices not in R10 multiples
- Verify price validation works correctly
- Test that saved prices are properly formatted
- Test +/- buttons if implemented

#### Acceptance Criteria
- [x] Price input increments by R10 using keyboard arrows
- [x] Manual price input accepts any value but suggests R10 multiples
- [x] Price validation works correctly
- [x] Saved prices display properly
- [x] All tests pass

#### Relevant Files Modified
- `src/features/calendar/availability/components/service-selection-section.tsx` - Updated price input step from 0.01 to 10 for R10 increments

---

### Task 3: Add Location Selection Visual Feedback ✅
**Priority:** High (🟡)
**File:** `src/features/calendar/availability/components/availability-creation-form.tsx:360`
**Estimated Time:** 2-3 hours

#### Problem Description
When a location is selected, there's no clear visual indication that selection was successful beyond the placeholder text change.

#### Implementation Steps
1. **Add visual indicators** ✅
   - Add checkmark icon or pin icon next to selected location
   - Update SelectTrigger styling to show selected state more clearly
   - Add subtle background color change for selected state

2. **Enhance selected state display** ✅
   - Show selected location name more prominently
   - Add descriptive text below select showing chosen location
   - Consider adding location address or details

3. **Update component styling** ✅
   - Modify SelectTrigger to use different styling when value is selected
   - Add CSS classes for selected state
   - Ensure accessibility with proper ARIA labels

#### Testing Requirements
- Test location selection with different locations
- Verify visual feedback appears immediately upon selection
- Test that indicator clears when selection is changed
- Test accessibility with screen readers
- Test on mobile devices

#### Acceptance Criteria
- [x] Visual indicator appears when location is selected
- [x] Selected location name is prominently displayed
- [x] Indicator clears when selection is changed
- [x] Accessibility requirements are met
- [x] Works on mobile devices
- [x] All tests pass

#### Relevant Files Modified
- `src/features/calendar/availability/components/availability-creation-form.tsx` - Added visual feedback with checkmark icon, green border/background, selected location name display, and accessibility improvements

---

### Task 4: Simplify Form to Single-Day Scheduling ✅
**Priority:** High (🟡)
**File:** `src/features/calendar/availability/components/availability-creation-form.tsx:171`
**Estimated Time:** 2-3 hours

#### Problem Description
Form allows separate dates for start and end times, causing confusion about multi-day scheduling. Most availability should be same-day.

#### Implementation Steps
1. **Restructure date/time inputs** ✅
   - Replace two date+time pickers with single date picker + two time pickers
   - Move date picker to top of time section
   - Update labels to clarify single-day scheduling

2. **Update form validation** ✅
   - Ensure both times use the same date
   - Add validation to prevent end time before start time
   - Update error messages to be clear about single-day constraint

3. **Modify form data handling** ✅
   - Update form submission to use single date with separate times
   - Ensure recurrence functionality still works for multi-day patterns
   - Test that existing data structures still work

4. **Update component layout** ✅
   - Reorganize form sections for better flow
   - Update labels and descriptions
   - Ensure responsive design works

#### Testing Requirements
- Test that both start and end times use the same date
- Verify time validation prevents end before start
- Test recurrence still works for multi-day patterns
- Verify form validation messages are clear
- Test accessibility with screen readers
- Test responsive design on mobile

#### Acceptance Criteria
- [x] Single date picker controls both start and end date
- [x] Time validation prevents end before start
- [x] Recurrence functionality still works
- [x] Form validation messages are clear
- [x] Accessibility requirements are met
- [x] Responsive design works properly
- [x] All tests pass

#### Relevant Files Modified
- `src/features/calendar/availability/components/availability-creation-form.tsx` - Restructured form to use single date picker + two time pickers, updated labels and layout
- `src/features/calendar/availability/types/schemas.ts` - Added validation to ensure start and end times are on the same day

---

### Task 5: Add Profile Selection to Form ✅
**Priority:** High (🟡)
**File:** `src/features/calendar/availability/components/availability-creation-form.tsx:160`
**Estimated Time:** 4-6 hours

#### Problem Description
Form lacks clarity about who is creating the availability and for which provider. Users with organization roles need to specify context.

#### Implementation Steps
1. **Add profile selection section** ✅
   - Add section at top of form with two dropdowns
   - "Creating as" dropdown: Organization Role vs Provider
   - "Provider" dropdown: which provider this availability is for
   - Use existing hooks: `useCurrentUserOrganizations`, `useCurrentUserProvider`

2. **Update form validation** ✅
   - Make profile selection fields required
   - Add validation to ensure valid provider selection
   - Update form schema to include profile fields

3. **Modify form submission** ✅
   - Include profile context in form data
   - Update API calls to include creator context
   - Ensure proper ownership is recorded

4. **Update component props** ✅
   - Handle cases where `serviceProviderId` is pre-selected
   - Add props for organization role users
   - Maintain backward compatibility

#### Testing Requirements
- Test as organization admin creating availability for different providers
- Test as provider creating their own availability
- Verify form validation works correctly
- Test that created availability shows correct ownership
- Test with pre-selected provider ID
- Test error handling for invalid selections

#### Acceptance Criteria
- [x] Profile selection dropdowns appear at top of form
- [x] Form validation requires profile selection
- [x] Created availability shows correct ownership
- [x] Works for both organization and provider roles
- [x] Backward compatibility maintained
- [x] Error handling works properly
- [x] All tests pass

#### Relevant Files Modified
- `src/features/calendar/availability/components/availability-creation-form.tsx` - Added profile selection section with creator type and provider dropdowns, integrated with existing hooks

---

### Task 6: Add Context Menu for Calendar Events ✅
**Priority:** High (🟡)
**File:** `src/features/calendar/availability/components/provider-calendar-view.tsx:724`
**Estimated Time:** 3-4 hours

#### Problem Description
Event details are only accessible via hover tooltip, which is difficult on mobile or for accessibility needs.

#### Implementation Steps
1. **Add context menu component** ✅
   - Create reusable context menu component
   - Support right-click on desktop and long-press on mobile
   - Include "View Details" option

2. **Update calendar views** ✅
   - Add context menu to events in WeekView, DayView, and MonthView
   - Ensure context menu positioning works within viewport
   - Handle edge cases for screen boundaries

3. **Implement details modal** ✅
   - Create modal/popover showing same content as tooltip
   - Make it persistent (doesn't disappear on hover)
   - Add close button and proper focus management

4. **Add accessibility support** ✅
   - Ensure keyboard navigation works
   - Add proper ARIA labels
   - Test with screen readers

#### Testing Requirements
- Test right-click context menu on desktop
- Test long-press context menu on mobile/touch devices
- Verify "View Details" shows all tooltip information
- Test context menu positioning at screen edges
- Verify accessibility with keyboard navigation
- Test with screen readers

#### Acceptance Criteria
- [x] Context menu appears on right-click (desktop) and long-press (mobile)
- [x] "View Details" option shows complete event information
- [x] Context menu positions correctly within viewport
- [x] Keyboard navigation works properly
- [x] Screen reader accessibility is maintained
- [x] Works across all calendar views
- [x] All tests pass

#### Relevant Files Modified
- `src/features/calendar/availability/components/provider-calendar-view.tsx` - Added context menu support with right-click and long-press handlers, implemented details modal with complete event information

---

### Task 7: Add Monthly View Hours Summary ✅
**Priority:** High (🟡)
**File:** `src/features/calendar/availability/components/provider-calendar-view.tsx:1079`
**Estimated Time:** 3-4 hours

#### Problem Description
Monthly view shows individual events but doesn't summarize total availability hours for each day, making capacity planning difficult.

#### Implementation Steps
1. **Create hours calculation utility** ✅
   - Add function to calculate total availability hours per day
   - Handle overlapping availability blocks
   - Consider different availability statuses

2. **Update MonthView component** ✅
   - Replace individual event display with hours summary
   - Show total available hours (e.g., "8.5h available")
   - Use different colors/styles based on availability status mix

3. **Add detailed tooltip** ✅
   - Show breakdown of availability blocks on hover
   - Include booking utilization percentage if applicable
   - Display individual event details

4. **Implement status-based styling** ✅
   - Different colors for different availability status mixes
   - Visual indicators for utilization levels
   - Consistent with existing calendar styling

#### Testing Requirements
- Test with days having multiple availability blocks
- Verify hours calculation is accurate across timezones
- Test with mixed availability statuses (pending, accepted, cancelled)
- Verify summary updates when availability changes
- Test tooltip shows detailed breakdown
- Test performance with many events

#### Acceptance Criteria
- [x] Monthly view shows hours summary instead of individual events
- [x] Hours calculation is accurate and handles overlaps
- [x] Different colors/styles for different status mixes
- [x] Tooltip shows detailed breakdown
- [x] Summary updates when availability changes
- [x] Performance remains acceptable
- [x] All tests pass

#### Relevant Files Modified
- `src/features/calendar/availability/lib/recurrence-utils.ts` - Added calculateDayAvailabilityHours function to calculate total availability hours per day and getDayStatusStyle function for status-based styling
- `src/features/calendar/availability/components/provider-calendar-view.tsx` - Updated MonthView component to display hours summary instead of individual events, with detailed tooltips and status-based styling

---

## Task Completion Summary

### Progress Tracking
- **Total Tasks:** 7
- **Completed:** 7
- **In Progress:** 0
- **Remaining:** 0

### Estimated Time Summary
- **Critical Issues:** 6-8 hours
- **High Priority:** 15-23 hours
- **Total:** 21-31 hours

### Dependencies
1. **Task 1 (Recurring Fix)** should be completed first - it's independent and critical
2. **Task 5 (Profile Selection)** affects form structure, complete before Task 4
3. **Task 4 (Single-Day Scheduling)** depends on Task 5 for proper context
4. **Task 7 (Monthly Summary)** benefits from Task 1 being complete for accurate data
5. **Tasks 2, 3, 6** are independent and can be done in parallel

### Notes for Implementation
- Test thoroughly after each task completion
- Consider database migrations for Task 1 if needed
- Maintain backward compatibility throughout
- Focus on user experience improvements
- Document any breaking changes
