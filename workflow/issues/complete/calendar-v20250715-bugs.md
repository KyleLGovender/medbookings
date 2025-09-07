# Calendar Bug Fix & Improvement Task List

## High Priority Tasks

### 🔴 Critical Issues (Fix Immediately)

- [ ] **Bug Fix**: [Add critical calendar bug here] - `path/to/file.ts:123`
  - **Issue**: Brief description of the problem
  - **Impact**: How this affects users/system
  - **Implementation**: Step-by-step approach to fix
  - **Testing**: How to verify the fix works
  - **Estimated Time**: X hours/days

### 🟡 High Priority (Next Sprint)

- [ ] **UX/UI**: Hide month/week view options on mobile devices - `src/features/calendar/availability/components/calendar-navigation.tsx`

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

- [ ] **Technical Debt**: Create new 3-day calendar view - `src/features/calendar/availability/components/`
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

## Medium Priority Tasks

### 🔵 Medium Priority (Upcoming)

- [ ] **UX/UI**: Fix compressed breadcrumbs in dashboard layout on mobile - `src/components/layout/dashboard-layout.tsx`

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

- [ ] **UX/UI**: Fix calendar stats header stacking on mobile - `src/features/calendar/availability/components/provider-calendar-view.tsx`
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

## Low Priority Tasks

### 🟢 Low Priority (Backlog)

- [ ] **UX/UI**: [Add calendar UX/UI improvement here] - `path/to/file.tsx:101`
  - **Issue**: Description of UX/UI improvement
  - **Impact**: User experience enhancement
  - **Implementation**: UI/UX changes needed
  - **Testing**: User testing or visual regression testing
  - **Estimated Time**: X hours/days

## Completed Tasks

### ✅ Recently Completed

- [x] **Bug Fix**: [Completed Task Title] - `path/to/file.ts:123`
  - **Completed**: YYYY-MM-DD
  - **Notes**: Brief notes on implementation

## Task Management Guidelines

### Adding New Tasks

1. Identify the issue type and priority level
2. Include file path and line number where applicable
3. Provide clear problem description and impact assessment
4. Detail implementation approach with specific steps
5. Define testing strategy
6. Estimate time required

### Prioritization Criteria

- **Critical**: System-breaking bugs, security vulnerabilities
- **High**: Performance issues, user-facing bugs, blocking issues
- **Medium**: Technical debt, code quality improvements
- **Low**: Nice-to-have improvements, minor UX enhancements

### Implementation Context

For each task, provide:

- **Root Cause**: Why the issue exists
- **Dependencies**: Other tasks or external factors
- **Code Context**: Relevant functions, components, or modules
- **Testing Requirements**: Unit tests, integration tests, manual testing
- **Rollback Plan**: How to revert if issues arise

## Workflow Integration

### When to Add Tasks

- During code reviews
- When debugging issues
- During feature development
- From user feedback or bug reports
- During refactoring sessions

### Task Lifecycle

1. **Identified**: Task added to appropriate priority section
2. **In Progress**: Move to active work section (not shown in template)
3. **Testing**: Undergoing verification
4. **Completed**: Move to completed section with notes
5. **Archived**: Remove from active document (periodic cleanup)

## Notes for AI Assistant

- Always include file paths with line numbers when possible
- Provide concrete implementation steps, not just high-level descriptions
- Consider dependencies between tasks and order accordingly
- Include code snippets or examples in implementation notes
- Update priority levels based on business impact and technical complexity
- Maintain consistent formatting and categorization
- Archive completed tasks periodically to keep document manageable

## Target Audience

The task list should be detailed enough for a **junior to mid-level developer** to understand the problem, approach the solution methodically, and test their implementation thoroughly.
