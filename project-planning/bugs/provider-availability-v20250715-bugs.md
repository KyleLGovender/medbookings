# Bug Fix & Improvement Task List

> **List:** Provider Availability V2
> 
> This list is intentionally blank for now. Populate the sections below as issues are discovered.

## High Priority Tasks

### 🔴 Critical Issues (Fix Immediately)
- [ ] **Bug Fix**: Availability creation not generating CalculatedAvailabilitySlots - `src/features/calendar/availability/lib/actions.ts:97`
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

### 🟡 High Priority (Next Sprint)
- [ ] **Bug Fix**: Provider-created availabilities default to PENDING instead of ACCEPTED - `src/features/calendar/availability/lib/actions.ts:97`
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

## Medium Priority Tasks

### 🔵 Medium Priority (Upcoming)
- [ ] **Technical Debt**: Missing series vs individual availability management workflow - `src/app/(dashboard)/providers/[id]/manage-calendar/page.tsx:178`
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

- [ ] **Bug Fix**: Missing comprehensive availability validation rules - `src/features/calendar/availability/lib/actions.ts:53`
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

- [ ] **Technical Debt**: Comprehensive cleanup of provider calendar components as reference pattern - `src/features/calendar/availability/components/provider-calendar-view.tsx:1`
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
    - Extract reusable components: `week-view.tsx`, `day-view.tsx`, `month-view.tsx`
  - **Testing**:
    - All existing functionality still works after cleanup.
    - Components can be imported and used as patterns in other contexts.
    - No console errors or warnings in browser developer tools.
    - TypeScript compilation without warnings.
    - Calendar navigation, event creation, and editing flows work smoothly.
    - Accessibility testing with screen readers.
    - Performance testing with large datasets.
  - **Estimated Time**: 6-8 hours

- [ ] **Technical Debt**: Critical cleanup of availability-creation-form.tsx as reference pattern - `src/features/calendar/availability/components/availability-creation-form.tsx:1`
  - **Issue**: The availability-creation-form.tsx component needs comprehensive cleanup to serve as a clean reference pattern before it can be used as a template for standardizing the edit form. Current issues include: potential legacy code, inconsistent patterns, TODO comments (line 237), unused variables, complex state management that may not follow CLAUDE.md patterns, and general code quality issues that make it difficult to maintain and use as a reliable reference.
  - **Impact**: Without a clean reference pattern, attempts to standardize the edit form will propagate existing technical debt and inconsistencies. This prevents the availability forms from serving as reliable patterns for other calendar implementations and makes future development more error-prone.
  - **Implementation**:
    1. **Critical Code Review**: Thoroughly review entire component for unnecessary code, legacy patterns, and development artifacts
    2. **Remove Dead Code**: Remove unused variables, commented code, and any development debugging artifacts
    3. **Resolve TODOs**: Address the TODO comment at line 237 for organization provider selection - either implement properly or remove
    4. **State Management Cleanup**: Simplify and standardize state management patterns following CLAUDE.md guidelines
    5. **Type Safety**: Ensure all types are properly defined, remove any 'any' types (line 99, 486, 487)
    6. **Component Structure**: Ensure component follows consistent patterns for form handling, validation, and error management
    7. **Code Organization**: Group related logic together, extract reusable functions if needed
    8. **Error Handling**: Standardize error handling patterns and loading states
    9. **Performance**: Review for unnecessary re-renders and optimize form watchers
    10. **Documentation**: Add JSDoc comments for complex logic and ensure code is self-documenting
    11. **CLAUDE.md Compliance**: Ensure all patterns follow the standards specified in CLAUDE.md
    12. **Testing Readiness**: Structure code to be easily testable and maintainable
  - **Testing**:
    - All existing functionality works exactly as before
    - No console errors or warnings
    - TypeScript compilation without warnings
    - Form validation works correctly
    - All form fields and interactions function properly
    - Custom recurrence modal works correctly
    - Service selection works as expected
    - Location selection functions properly
    - Profile selection works for both provider and organization modes
  - **Estimated Time**: 4-5 hours

- [ ] **Technical Debt**: Standardize availability-edit-form.tsx to match cleaned creation form pattern - `src/features/calendar/availability/components/availability-edit-form.tsx:1`
  - **Issue**: The availability-edit-form.tsx component doesn't follow the same comprehensive pattern as the availability-creation-form.tsx. It's missing key sections like profile selection, recurrence settings, location management, and doesn't have the same level of form organization and structure. This inconsistency makes the codebase harder to maintain and creates confusion for developers working with both forms.
  - **Impact**: Inconsistent form patterns across the availability system create maintenance burden, confuse developers, and make it difficult to ensure feature parity between creation and editing workflows. Users may expect similar functionality in both forms but find missing features in the edit form.
  - **Implementation**:
    1. **PREREQUISITE**: Complete cleanup of availability-creation-form.tsx first to ensure clean reference pattern
    2. **Pattern Analysis**: Study the cleaned creation form structure and identify all sections and patterns
    3. **Add Missing Sections**: 
       - Profile selection section (creator type, provider selection) - adapted for edit mode
       - Recurrence settings section with custom recurrence modal support
       - Location section with online/physical location management
       - Proper form organization with consistent separators and headings
    4. **Adapt for Edit Mode**: Modify sections appropriately for editing:
       - Profile selection may be read-only or limited based on permissions
       - Recurrence editing needs series update options (single/series/future)
       - Location changes may be restricted if bookings exist
       - Time changes restricted when bookings exist (already implemented)
    5. **State Management**: Align state management patterns with creation form
    6. **Form Structure**: Use same form organization, validation, and error handling patterns
    7. **UI Components**: Use consistent UI components, icons, and styling patterns
    8. **Form Validation**: Ensure validation rules are consistent between forms
    9. **Error Handling**: Standardize error handling and loading states
    10. **Accessibility**: Ensure accessibility patterns match creation form
    11. **Testing Integration**: Ensure both forms can be tested using similar patterns
  - **Testing**:
    - All existing edit functionality continues to work
    - New sections (profile, recurrence, location) display correctly
    - Form validation works consistently with creation form
    - Booking restrictions still apply appropriately
    - Series editing options work correctly for recurring availabilities
    - Location changes respect booking constraints
    - Form submission and error handling work correctly
    - Accessibility features work properly
    - Both forms have consistent user experience
  - **Estimated Time**: 6-8 hours

## Low Priority Tasks

### 🟢 Low Priority (Backlog)
- [ ] **UX/UI**: Implement Availability View modal component - `src/features/calendar/availability/components/availability-view-modal.tsx`
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

## Completed Tasks

### ✅ Recently Completed
*(none yet)*

---

## Task Management Guidelines

### Adding New Tasks
1. Identify the issue type and priority level.
2. Include file path and line number where applicable.
3. Provide a clear problem description and impact assessment.
4. Detail the implementation approach with specific steps.
5. Define the testing strategy.
6. Estimate the time required.

### Prioritization Criteria
- **Critical**: System-breaking bugs, security vulnerabilities.
- **High**: Performance issues, user-facing bugs, blocking issues.
- **Medium**: Technical debt, code quality improvements.
- **Low**: Nice-to-have improvements, minor UX enhancements.

### Implementation Context
For each task, provide:
- **Root Cause**: Why the issue exists.
- **Dependencies**: Other tasks or external factors.
- **Code Context**: Relevant functions, components, or modules.
- **Testing Requirements**: Unit tests, integration tests, manual testing.
- **Rollback Plan**: How to revert if issues arise.

### Task Lifecycle
1. **Identified**: Task added to appropriate priority section.
2. **In Progress**: Move to active work section (not shown in template).
3. **Testing**: Undergoing verification.
4. **Completed**: Move to completed section with notes.
5. **Archived**: Remove from active document (periodic cleanup).

---

*Generated from `bug-spec-generate.md` template.* 
