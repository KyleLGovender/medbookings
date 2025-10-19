# Mobile Calendar Navigation Bug - Executable Task List

## Overview

Bug fix for calendar mobile view navigation where month and week view options should be hidden on mobile devices, leaving only day and 3-day options. This affects user experience on small screens where these views are not practical.

## Instructions for Claude Code

- Complete tasks in order of priority
- Mark tasks as completed when finished
- Run tests after each task completion
- Update this file with completion status

## Task 1: Hide Month/Week View Options on Mobile Devices

**Priority:** High
**File:** `src/features/calendar/components/provider-calendar-view.tsx:525-537`
**Estimated Time:** 2-3 hours

### Problem Description

The calendar navigation in `provider-calendar-view.tsx` shows all view options (Day, Week, Month) on all devices. On mobile devices, month and week views provide poor user experience due to screen size constraints. Only day and 3-day view options should be available on mobile.

### Implementation Steps

1. Add mobile device detection using Tailwind CSS responsive classes or JavaScript viewport detection
2. Conditionally render view options in the Select component based on screen size
3. Consider iPad size threshold - determine if tablets should be treated as mobile (recommend treating iPad as non-mobile)
4. Hide Month and Week SelectItem components on mobile breakpoints
5. Ensure 3-day view option is available (currently missing from the SelectContent)
6. Test responsive breakpoints at various screen sizes

### Technical Details

**Current Code Location:** Lines 525-537

```typescript
<SelectContent>
  <SelectItem value="day">Day</SelectItem>
  <SelectItem value="week">Week</SelectItem>   // Hide on mobile
  <SelectItem value="month">Month</SelectItem> // Hide on mobile
</SelectContent>
```

**Suggested Implementation:**

- Use Tailwind `hidden sm:block` classes for Week/Month options
- Add 3-day view option: `<SelectItem value="3-day">3 Days</SelectItem>`
- Ensure default viewMode on mobile is "day" when current mode is not available

### Testing Requirements

- Test on various mobile devices (320px, 375px, 414px widths)
- Test on tablet devices (768px, 1024px widths)
- Verify iPad behavior (determine mobile vs desktop treatment)
- Test responsive breakpoints and view switching
- Ensure view mode persists correctly when switching between mobile/desktop
- Test that calendar functionality works properly with limited view options on mobile

### Acceptance Criteria

- [ ] Month and Week view options are hidden on mobile devices (< 640px width)
- [ ] Day and 3-day view options remain visible on all screen sizes
- [ ] 3-day view option is added to the calendar navigation
- [ ] iPad devices (>= 768px) show all view options
- [ ] Default view mode on mobile switches to "day" if current mode is unavailable
- [ ] Calendar functionality works correctly with mobile view restrictions
- [ ] No layout issues or broken responsive behavior
- [ ] All tests pass

### Notes

- Current implementation is missing the 3-day view option entirely, which should be available on all devices
- Consider using CSS media queries vs JavaScript for better performance
- Ensure the change doesn't break existing desktop functionality
- The viewMode state management may need updates to handle mobile restrictions

---

## Task 2: Add 3-Day View Option Support

**Priority:** Medium  
**File:** `src/features/calendar/components/provider-calendar-view.tsx:533-536`
**Estimated Time:** 1-2 hours

### Problem Description

The Select component for view modes is missing the 3-day view option, even though the component supports it (see line 576-585). This option should be available on all devices as a middle ground between day and week views.

### Implementation Steps

1. Add `<SelectItem value="3-day">3 Days</SelectItem>` to the SelectContent
2. Verify the 3-day view rendering works properly (ThreeDayView component)
3. Test navigation and date handling for 3-day view
4. Update any navigation logic that might be missing for 3-day view

### Testing Requirements

- Test 3-day view selection and rendering
- Verify navigation (prev/next) works correctly for 3-day spans
- Test date picker integration with 3-day view
- Ensure event display works properly in 3-day view

### Acceptance Criteria

- [ ] 3-day view option appears in view mode selector
- [ ] 3-day view renders correctly when selected
- [ ] Navigation works properly for 3-day view mode
- [ ] Events display correctly in 3-day view
- [ ] All tests pass

### Notes

The ThreeDayView component already exists and is conditionally rendered, so this is primarily a UI update to expose the option.
