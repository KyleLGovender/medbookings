# MedBookings MVP Project Plan

## ✅ Completed

- [x] Claude Code Plan Upgrade
- [x] **Technical Debt**: Comprehensive cleanup of provider calendar components as reference pattern - `src/features/calendar/availability/components/provider-calendar-view.tsx:1`
  - **Issue**: Key provider calendar components contain development artifacts, orphaned code, inconsistent patterns, and architectural issues that prevent them from serving as clean reference patterns. Issues include: unused state management (`selectedEvent` declared but inconsistently used), multiple TODO comments for missing functionality, console.log statements left in production code, duplicated logic across view components, inconsistent error handling patterns, missing TypeScript strict typing, and poor separation of concerns.
  - **Impact**: Components can't serve as reliable patterns for other calendar implementations. Technical debt accumulates making future development slower and more error-prone. Code quality doesn't meet @CLAUDE.md standards for "high class" implementation.
  - **Implementation**:
    1. **Remove Development Artifacts**: Remove all console.log statements, TODO comments, and debug code from production components.
    2. **Fix State Management**: Properly implement `selectedEvent` state in ProviderCalendarView - either remove unused references or complete the modal implementation for event details.
    3. **Standardize Error Handling**: Implement consistent error boundaries and loading states following @CLAUDE.md patterns across all calendar components.
    4. **Type Safety**: Add strict TypeScript typing, remove any 'any' types, ensure all props and interfaces are properly typed.
    5. **Component Architecture**: Extract reusable sub-components (WeekView, DayView, MonthView) into separate files with proper exports.
    6. **Code Deduplication**: Consolidate duplicate time calculation, event positioning, and styling logic into shared utilities.
    7. **API Patterns**: Standardize TanStack Query usage, error handling, and cache invalidation patterns.
    8. **Accessibility**: Add proper ARIA labels, keyboard navigation, and screen reader support.
    9. **Performance**: Implement proper memoization for expensive calculations, optimize re-renders.
    10. **Documentation**: Add comprehensive JSDoc comments explaining component architecture and usage patterns.
  - **Files to clean**:
    - `src/features/calendar/availability/components/provider-calendar-view.tsx` - Main calendar component
    - `src/features/calendar/availability/components/availability-creation-form.tsx` - Form component
    - `src/app/(dashboard)/providers/[id]/manage-calendar/page.tsx` - Page orchestration
    - Extract reusable components: `week-view.tsx`, `day-view.tsx`, `month-view.tsx`, `three-day-view.tsx`
  - **Testing**:
    - All existing functionality still works after cleanup.
    - Components can be imported and used as patterns in other contexts.
    - No console errors or warnings in browser developer tools.
    - TypeScript compilation without warnings.
    - Calendar navigation, event creation, and editing flows work smoothly.
    - Accessibility testing with screen readers.
    - Performance testing with large datasets.
  - **Estimated Time**: 6-8 hours
- [x] Standardize feature type definitions across bulletproof-react structure - Refactor all features to define types consistently in feature-specific types folders instead of mixed Prisma imports
  - **Type:** Technical Debt
  - **Impact:** Eliminates developer confusion from inconsistent type definitions, prevents circular dependencies, improves maintainability
  - **Files:** All features in `@src/features/` types folders, based on `@prisma/schema.prisma`
  - **Added:** 2025-01-21
- [x] **UX/UI**: Fix compressed breadcrumbs in dashboard layout on mobile - `src/components/layout/dashboard-layout.tsx`
  - **Issue**: Breadcrumbs in dashboard layout look too compressed on mobile devices, particularly with long provider names like "Dashboard > Providers > Dr Shei Goldberg > Manage Calendar"
  - **Impact**: Poor mobile navigation experience, breadcrumbs may be unreadable or truncated poorly
  - **Implementation**:
    1. Review current breadcrumb responsive classes in dashboard-layout.tsx (line 296)
    2. Improve text truncation for long provider names
    3. Consider collapsing middle breadcrumb items on mobile (show "Dashboard > ... > Current Page")
    4. Add better responsive spacing and text sizing
    5. Test with various provider name lengths
  - **Testing**:
    - Test on various mobile screen sizes
    - Test with short and long provider names
    - Verify breadcrumb navigation still works after changes
    - Test tablet and desktop views aren't affected
  - **Estimated Time**: 3-4 hours
- [x] **UX/UI**: Hide month/week view options on mobile devices - `src/features/calendar/availability/components/calendar-navigation.tsx`
  - **Issue**: Calendar mobile view doesn't look good - month and week view options should be hidden on mobile devices, only showing day and 3-day options
  - **Impact**: Poor mobile user experience due to cluttered navigation and inappropriate view options for small screens
  - **Implementation**:
    1. Add mobile device detection logic (consider iPad size threshold)
    2. Conditionally render view options based on screen size
    3. Use CSS media queries or JavaScript viewport detection
    4. Hide month and week buttons on mobile, keep only day and 3-day options
  - **Testing**:
    - Test on various mobile devices and screen sizes
    - Verify iPad behavior (determine if it should be treated as mobile)
    - Test responsive breakpoints
    - Ensure view switching works properly on mobile
  - **Estimated Time**: 4-6 hours
- [x] **Technical Debt**: Missing series vs individual availability management workflow - `src/app/(dashboard)/providers/[id]/manage-calendar/page.tsx:178`
  - **Issue**: When performing actions (edit, delete, cancel) on availability that is part of a recurring series, the system lacks clear UI to specify whether the action applies to the individual occurrence or the entire series. Context menus and action buttons operate on single availabilities only, without considering series relationships.
  - **Impact**: Users cannot properly manage recurring availability series, leading to confusion about which occurrences are affected by changes. This breaks expected calendar behavior and forces users to manually edit each occurrence individually.
  - **Implementation**:
    1. Detect when an availability is part of a series (check `isRecurring` and `seriesId` properties).
    2. Add series-aware context menu options that show "Edit this occurrence" vs "Edit entire series" when applicable.
    3. Create a series action dialog component that prompts users to choose scope: "This occurrence only", "This and future occurrences", or "All occurrences in series".
    4. Update edit, delete, and cancel operations to accept a `scope` parameter and handle series-wide operations.
    5. Leverage existing `DragDropCalendar` component's `SeriesUpdateOptions` pattern for consistency.
    6. Add series management to organization calendar views as well.
  - **Testing**:
    - Create recurring availability ➜ verify context menu shows series options.
    - Edit single occurrence ➜ verify only that occurrence changes.
    - Edit entire series ➜ verify all occurrences in series change.
    - Delete series ➜ verify all future occurrences are removed.
    - Test with existing bookings on some occurrences.
  - **Estimated Time**: 4-6 hours
- [x] **Bug Fix**: Provider-created availabilities default to PENDING instead of ACCEPTED - `src/features/calendar/availability/lib/actions.ts:97`
  - **Issue**: Logic determines provider-created availability using `currentUser.id === validatedData.serviceProviderId`, incorrectly comparing a User ID to a ServiceProvider ID. This results in `isProviderCreated` being `false`, so the created availability is given a `PENDING` status.
  - **Impact**: Providers see their own availabilities as pending proposals, blocking slot generation and booking flows until manually accepted. This degrades user experience and causes scheduling errors.
  - **Implementation**:
    1. Fetch the `ServiceProvider` record for the current user (`prisma.serviceProvider.findUnique({ where: { userId: currentUser.id } })`).
    2. Update `isProviderCreated` to compare the fetched provider's `id` to `validatedData.serviceProviderId`.
    3. If they match, set `isProviderCreated = true` and `initialStatus = AvailabilityStatus.ACCEPTED`; otherwise keep existing behavior.
    4. Add/adjust unit tests covering provider vs organization creation paths.
  - **Testing**:
    - Create availability via provider UI ➜ API should return `status: ACCEPTED`.
    - Create availability proposal via organization UI ➜ API should return `status: PENDING`.
    - Regression: Existing organization acceptance workflow still functions.
  - **Estimated Time**: 1–2 hours
- [x] **UX/UI**: Implement Availability View modal component - `src/features/calendar/availability/components/availability-view-modal.tsx`
  - **Issue**: The calendar system lacks a read-only view modal to display availability details. There's a TODO comment at `src/app/(dashboard)/providers/[id]/manage-calendar/page.tsx:179` in the `handleViewDetails` function that needs to be implemented. Users can only edit availabilities through the form, but there's no way to view complete availability information in a structured, non-editable format. This creates poor UX when users want to review availability details without accidentally modifying them.
  - **Impact**: Users cannot easily review availability details without opening the edit form, leading to potential accidental modifications. Poor information hierarchy makes it difficult to quickly understand availability configuration, services, location, and recurrence patterns. The "View Details" button exists but doesn't function.
  - **Implementation**:
    1. Create new `availability-view-modal.tsx` component in `src/features/calendar/availability/components/`
    2. Design modal to mirror the structure of `availability-creation-form.tsx` but with read-only display
    3. Display sections: Profile info (creator type, provider), Time settings (date, start/end times), Recurrence settings (pattern, custom details if applicable), Scheduling rules, Location (online/physical), Services (with descriptions), Additional settings (confirmation requirement)
    4. Use consistent UI components (Card, Separator, icons) but replace form inputs with display elements
    5. Add proper formatting for dates, times, and recurrence patterns
    6. Include status indicator (PENDING, ACCEPTED, CANCELLED) with appropriate styling
    7. Add close button and proper modal behavior
    8. Handle loading states and error scenarios
    9. Include accessibility features (ARIA labels, keyboard navigation)
    10. Update the `handleViewDetails` function at line 179 to import and use the new modal component
    11. Add state management for showing/hiding the view modal in the page component
  - **Testing**:
    - Modal displays all availability information correctly
    - Different recurrence patterns display properly (none, daily, weekly, custom)
    - Services section shows all associated services with descriptions
    - Location section displays online/physical location appropriately
    - Status indicators show correct styling for different states
    - Modal can be closed via button, ESC key, or clicking outside
    - Responsive design works on mobile devices
    - Screen readers can navigate the modal content
  - **Estimated Time**: 3-4 hours
- [x] **UX/UI**: Fix calendar stats header stacking on mobile - `src/features/calendar/availability/components/provider-calendar-view.tsx`
  - **Issue**: Calendar stats header (Utilization, Booked, Pending, Completed) looks too compressed on mobile and needs to stack on smaller screens
  - **Impact**: Stats are unreadable on mobile due to cramped 4-column grid layout
  - **Implementation**:
    1. Replace fixed `grid-cols-4` with responsive grid classes (e.g., `grid-cols-2 md:grid-cols-4`)
    2. Add responsive text sizing for stats numbers and labels
    3. Ensure proper spacing between stacked items
    4. Apply same fixes to organization calendar view (`grid-cols-5`)
    5. Test stats readability on mobile devices
  - **Testing**:
    - Test provider calendar stats on mobile (4 columns → 2x2 grid)
    - Test organization calendar stats on mobile (5 columns → appropriate mobile layout)
    - Verify stats data accuracy after layout changes
    - Test on various mobile screen sizes and orientations
  - **Estimated Time**: 2-3 hours
- [x] Create database view for direct Booking-ServiceProvider relationships - Improve query performance while maintaining data integrity
  - **Type:** Database Performance Optimization
  - **Impact:** Simplifies provider-booking queries without adding redundant foreign keys
  - **Files:** Database schema, potentially new view migrations
  - **Added:** 2025-01-18
- [x] **Bug Fix**: Missing comprehensive availability validation rules - `src/features/calendar/availability/lib/actions.ts:53`
  - **Issue**: Current validation is incomplete - only checks basic time logic and same-series overlaps. Missing strict overlap detection across all availabilities, past date limits, duration constraints, and future scheduling limits. Current code at lines 159-176 only prevents overlaps within the same recurring series, but providers can create completely overlapping availability periods for different series or standalone availabilities.
  - **Impact**: Providers can create conflicting schedules leading to double-bookings, system inconsistencies, and poor user experience. No guardrails against unreasonable scheduling (too far in future/past, too short duration).
  - **Implementation**:
    1. **Strict Overlap Prevention**: Add comprehensive overlap checking across ALL provider availabilities (not just same series) in `createAvailability` and `updateAvailability`.
    2. **Past Date Limits**: Allow past availabilities but limit to max 30 days back from current date.
    3. **Future Scheduling Limits**: Prevent scheduling more than 3 calendar months in future (if current month is July, max end date is end of October).
    4. **Minimum Duration**: Enforce 15-minute minimum duration for all availability periods.
    5. **Database Query**: Create efficient overlap detection query checking `(newStart < existingEnd AND newEnd > existingStart)` across all provider availabilities.
    6. **Recurring Validation**: Extend overlap checking to validate all generated recurring instances against existing availabilities.
    7. **Error Messages**: Provide specific, actionable error messages for each validation failure.
  - **Testing**:
    - Create overlapping availability ➜ should be blocked with clear error.
    - Create availability 31 days in past ➜ should be blocked.
    - Create availability 4+ months in future ➜ should be blocked.
    - Create 10-minute availability ➜ should be blocked.
    - Create recurring series that would overlap existing availability ➜ should be blocked.
    - Test edge cases: same start/end times, midnight boundaries, timezone handling.
  - **Estimated Time**: 3-4 hours
- [x] **Technical Debt**: Create new 3-day calendar view - `src/features/calendar/availability/components/`
  - **Issue**: Need a new 3-day calendar view that shows selected day in middle with day before and after (3 columns)
  - **Impact**: Better mobile experience providing more context than single day view while remaining mobile-friendly
  - **Implementation**:
    1. Create new `3-day-view.tsx` component in calendar components directory
    2. Implement 3-column layout: [Previous Day] [Selected Day] [Next Day]
    3. Ensure proper date navigation and event rendering across 3 days
    4. Add responsive design optimized for mobile phones
    5. Integrate with existing calendar navigation system
    6. Update calendar types to include '3-day' as a valid view mode
  - **Testing**:
    - Test 3-column layout on various mobile screen sizes
    - Verify date navigation works correctly
    - Test event rendering across all 3 days
    - Ensure integration with existing calendar features
    - Test performance with multiple days of events
  - **Estimated Time**: 8-12 hours
- [x] **Bug Fix**: Availability creation not generating CalculatedAvailabilitySlots - `src/features/calendar/availability/lib/actions.ts:97`
  - **Issue**: When an availability is created, the system is not automatically generating the accompanying CalculatedAvailabilitySlots records. These slots are essential for the booking system to function properly as they represent the actual time slots that can be booked by clients.
  - **Impact**: Without CalculatedAvailabilitySlots, created availabilities cannot be booked. This breaks the entire booking flow and prevents clients from scheduling appointments with providers, making the system non-functional for its core purpose.
  - **Implementation**:
    1. Investigate the slot generation logic in the availability creation flow.
    2. Check if there's a missing call to slot calculation/generation after availability creation.
    3. Verify that the slot generation service is properly integrated with the availability creation action.
    4. Ensure that both single and recurring availability creation trigger slot generation.
    5. Add proper error handling for slot generation failures.
    6. Consider whether slot generation should be synchronous or asynchronous.
  - **Testing**:
    - Create single availability ➜ verify CalculatedAvailabilitySlots are created.
    - Create recurring availability ➜ verify slots are generated for all occurrences.
    - Test with different availability configurations (duration, services, etc.).
    - Verify slot generation works for both provider-created and organization-created availabilities.
    - Test error scenarios where slot generation might fail.
  - **Estimated Time**: 2-3 hours
- [x] Standardize feature type definitions across bulletproof-react structure - Refactor all features to define types consistently in feature-specific types folders instead of mixed Prisma imports
  - **Type:** Technical Debt
  - **Impact:** Eliminates developer confusion from inconsistent type definitions, prevents circular dependencies, improves maintainability
  - **Files:** All features in `@src/features/` types folders, based on `@prisma/schema.prisma`
  - **Added:** 2025-01-21
