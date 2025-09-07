# Provider Calendar Components Cleanup - Bug Specification

## Task Status: 🔴 **UNRESOLVED - Technical Debt**

## Overview

Key provider calendar components contain development artifacts, orphaned code, inconsistent patterns, and architectural issues that prevent them from serving as clean reference patterns for other calendar implementations. This technical debt accumulates making future development slower and more error-prone, while code quality doesn't meet CLAUDE.md standards for "high class" implementation.

## Problem Description

### Current State Analysis

❌ **Critical Issues Identified**:

1. **Development Artifacts**: Console.log statements, TODO comments, and debug code left in production
2. **Incomplete State Management**: `selectedEvent` declared but inconsistently used across components
3. **Missing Error Boundaries**: Inconsistent error handling patterns and loading states
4. **Type Safety Issues**: Missing TypeScript strict typing, presence of 'any' types
5. **Poor Component Architecture**: Monolithic components lacking proper separation of concerns
6. **Code Duplication**: Duplicate time calculation, event positioning, and styling logic
7. **Inconsistent API Patterns**: Mixed TanStack Query usage and cache invalidation strategies
8. **Accessibility Gaps**: Missing ARIA labels, keyboard navigation, and screen reader support
9. **Performance Issues**: Lack of proper memoization for expensive calculations
10. **Documentation Deficit**: Missing JSDoc comments explaining component architecture

### Specific Component Issues

**File:** `src/features/calendar/availability/components/provider-calendar-view.tsx`

- Unused `selectedEvent` state management
- Multiple TODO comments indicating incomplete functionality
- Console.log statements in production code
- Inconsistent error handling patterns
- Mixed TypeScript typing with some 'any' types

**File:** `src/features/calendar/availability/components/availability-creation-form.tsx`

- Duplicated form validation logic
- Inconsistent error boundary implementation
- Missing proper TypeScript interfaces

**File:** `src/app/(dashboard)/providers/[id]/manage-calendar/page.tsx`

- Poor separation between page orchestration and business logic
- Inconsistent TanStack Query patterns
- Missing proper error states

### Impact Assessment

**Development Impact:**

- Components cannot serve as reliable patterns for other calendar implementations
- New developers struggle to understand inconsistent code patterns
- Technical debt slows down future calendar feature development
- Code review overhead increases due to quality inconsistencies

**User Experience Impact:**

- Inconsistent error states confuse users during calendar operations
- Poor accessibility support excludes users with disabilities
- Performance issues during calendar operations with large datasets
- Unreliable error recovery mechanisms

**Maintenance Impact:**

- Difficult to debug production issues due to inconsistent logging
- Hard to extend components due to poor architectural separation
- Increased risk of regressions when making changes
- Technical debt compounds over time

## Implementation Requirements

### Task 1: Remove Development Artifacts and Debug Code

**Priority:** High  
**Files:** All provider calendar components  
**Estimated Time:** 1-1.5 hours

#### Problem Description

Production components contain console.log statements, TODO comments, and debug code that should not exist in a production codebase.

#### Implementation Steps

1. **Audit All Calendar Components**: Search for console.log, TODO, FIXME, and debug comments
2. **Remove Debug Statements**: Remove all console.log statements except critical error logging
3. **Clean TODO Comments**: Either implement missing functionality or remove TODO comments
4. **Remove Dead Code**: Identify and remove unused variables, imports, and functions
5. **Standardize Logging**: Implement proper error logging using consistent patterns

#### Code Changes Required

```typescript
// DELETE
// Replace with proper error logging:
import { logger } from '@/lib/logger';

// Remove patterns like:
console.log('Debug: calendar data', data); // DELETE
// TODO: Implement event modal // IMPLEMENT OR DELETE
const unusedVariable = 'something'; // DELETE

logger.error('Calendar data fetch failed', { error, providerId });
```

#### Acceptance Criteria

- [ ] No console.log statements in production code except error logging
- [ ] No TODO or FIXME comments in codebase
- [ ] No unused variables or dead code
- [ ] Proper error logging implemented with consistent patterns

---

### Task 2: Fix State Management and Component Architecture

**Priority:** High  
**Files:** `provider-calendar-view.tsx`, extracted view components  
**Estimated Time:** 2-2.5 hours

#### Problem Description

`selectedEvent` state is declared but inconsistently used. Component architecture lacks proper separation of concerns with monolithic components.

#### Implementation Steps

1. **Audit State Usage**: Review all state declarations and their usage patterns
2. **Complete Event Selection**: Either implement full event modal functionality or remove unused state
3. **Extract View Components**: Separate WeekView, DayView, MonthView, ThreeDayView into individual files
4. **Standardize State Management**: Use consistent patterns for component state
5. **Implement Proper Props**: Define clear interfaces for all component props

#### Code Changes Required

```typescript
// Extract components:
// src/features/calendar/components/views/week-view.tsx
// src/features/calendar/components/views/day-view.tsx
// src/features/calendar/components/views/month-view.tsx
// src/features/calendar/components/views/three-day-view.tsx

// Fix state management:
interface ProviderCalendarViewState {
  selectedEvent: CalendarEvent | null;
  viewMode: CalendarViewMode;
  currentDate: Date;
}

// Either implement event modal or remove:
const handleEventClick = (event: CalendarEvent) => {
  setSelectedEvent(event);
  setShowEventModal(true); // Complete implementation
};
```

#### Acceptance Criteria

- [ ] All state variables are properly used or removed
- [ ] View components extracted into separate files
- [ ] Clear component interfaces defined
- [ ] State management follows consistent patterns
- [ ] Event selection functionality works or is removed

---

### Task 3: Implement Consistent Error Handling and Type Safety

**Priority:** High  
**Files:** All calendar components  
**Estimated Time:** 2-2.5 hours

#### Problem Description

Inconsistent error handling patterns and missing TypeScript strict typing prevent reliable error recovery and development confidence.

#### Implementation Steps

1. **Standardize Error Boundaries**: Implement consistent error boundary patterns
2. **Add Loading States**: Ensure all async operations have proper loading indicators
3. **Type Safety Audit**: Remove all 'any' types and add strict TypeScript typing
4. **Interface Definitions**: Create comprehensive interfaces for all props and data structures
5. **Error Recovery**: Implement proper error recovery mechanisms

#### Code Changes Required

```typescript
// Standardized error boundary:
interface CalendarErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

// Strict typing:
interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'availability' | 'booking' | 'blocked';
  status: AvailabilityStatus;
  // Remove any 'any' types
}

// Consistent loading states:
if (isLoading) return <CalendarSkeleton />;
if (error) return <CalendarError error={error} onRetry={refetch} />;
```

#### Acceptance Criteria

- [ ] No 'any' types in calendar components
- [ ] All props have proper TypeScript interfaces
- [ ] Consistent error boundary implementation
- [ ] Proper loading states for all async operations
- [ ] Error recovery mechanisms implemented

---

### Task 4: Code Deduplication and Shared Utilities

**Priority:** Medium  
**Files:** New utility files, all calendar components  
**Estimated Time:** 1.5-2 hours

#### Problem Description

Duplicate time calculation, event positioning, and styling logic across calendar components increases maintenance burden and inconsistency.

#### Implementation Steps

1. **Identify Duplicate Logic**: Audit all calendar components for repeated code
2. **Create Utility Functions**: Extract common logic into shared utilities
3. **Standardize Calculations**: Create consistent time and date calculation functions
4. **Event Positioning**: Centralize event positioning and styling logic
5. **Update Components**: Refactor components to use shared utilities

#### Code Changes Required

```typescript
// src/features/calendar/lib/calendar-utils.ts
export const calculateTimeSlots = (startTime: Date, endTime: Date, interval: number) => {
  // Centralized time calculation logic
};

export const getEventPosition = (event: CalendarEvent, dayStart: Date, dayEnd: Date) => {
  // Centralized event positioning logic
};

export const getEventStyles = (event: CalendarEvent) => {
  // Centralized event styling logic
};

// Usage in components:
import { calculateTimeSlots, getEventPosition, getEventStyles } from '../lib/calendar-utils';
```

#### Acceptance Criteria

- [ ] Duplicate code identified and extracted
- [ ] Shared utility functions created
- [ ] Components updated to use shared utilities
- [ ] Consistent time and date calculations
- [ ] Centralized event positioning and styling

---

### Task 5: API Patterns and Performance Optimization

**Priority:** Medium  
**Files:** All calendar components, hooks  
**Estimated Time:** 1.5-2 hours

#### Problem Description

Inconsistent TanStack Query usage, missing cache invalidation strategies, and lack of proper memoization for expensive calculations.

#### Implementation Steps

1. **Standardize Query Patterns**: Ensure consistent TanStack Query usage
2. **Cache Invalidation**: Implement proper cache invalidation strategies
3. **Performance Optimization**: Add memoization for expensive calculations
4. **Query Key Consistency**: Standardize query key patterns
5. **Error Handling**: Consistent API error handling patterns

#### Code Changes Required

```typescript
// Standardized query hook:
export const useCalendarData = (providerId: string, dateRange: DateRange) => {
  return useQuery({
    queryKey: ['calendar', providerId, dateRange],
    queryFn: () => fetchCalendarData(providerId, dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Memoized calculations:
const timeSlots = useMemo(
  () => calculateTimeSlots(dayStart, dayEnd, interval),
  [dayStart, dayEnd, interval]
);

// Cache invalidation:
const queryClient = useQueryClient();
queryClient.invalidateQueries(['calendar', providerId]);
```

#### Acceptance Criteria

- [ ] Consistent TanStack Query patterns
- [ ] Proper cache invalidation strategies
- [ ] Memoization for expensive calculations
- [ ] Standardized query key patterns
- [ ] Consistent API error handling

---

### Task 6: Accessibility and Documentation

**Priority:** Medium  
**Files:** All calendar components  
**Estimated Time:** 1.5-2 hours

#### Problem Description

Missing ARIA labels, keyboard navigation, screen reader support, and comprehensive JSDoc documentation.

#### Implementation Steps

1. **ARIA Labels**: Add comprehensive ARIA labels for screen readers
2. **Keyboard Navigation**: Implement proper keyboard navigation patterns
3. **Focus Management**: Ensure logical focus flow through calendar components
4. **JSDoc Documentation**: Add comprehensive component documentation
5. **Accessibility Testing**: Verify screen reader compatibility

#### Code Changes Required

```typescript
/**
 * ProviderCalendarView - Main calendar component for provider availability management
 *
 * @param providerId - The ID of the provider whose calendar to display
 * @param viewMode - The current calendar view mode (day, week, month, 3-day)
 * @param onEventClick - Callback fired when an event is clicked
 * @param onTimeSlotClick - Callback fired when a time slot is clicked
 *
 * @example
 * <ProviderCalendarView
 *   providerId="provider-123"
 *   viewMode="week"
 *   onEventClick={handleEventClick}
 *   onTimeSlotClick={handleTimeSlotClick}
 * />
 */

// ARIA labels:
<div
  role="grid"
  aria-label={`Calendar for ${providerName}`}
  tabIndex={0}
  onKeyDown={handleKeyboardNavigation}
>
  <div role="gridcell" aria-selected={isSelected}>
    {eventTitle}
  </div>
</div>
```

#### Acceptance Criteria

- [ ] Comprehensive ARIA labels for screen readers
- [ ] Proper keyboard navigation implemented
- [ ] Logical focus flow through components
- [ ] Complete JSDoc documentation
- [ ] Screen reader compatibility verified

## Root Cause Analysis

The calendar component technical debt stems from:

1. **Rapid Development**: Initial development prioritized features over code quality
2. **Lack of Code Reviews**: Insufficient review process allowed technical debt accumulation
3. **Missing Standards**: No established patterns for calendar component development
4. **Time Constraints**: Deadline pressure led to shortcuts and incomplete implementations
5. **Architectural Evolution**: Components grew organically without planned refactoring

## Dependencies

### Internal Dependencies

- Existing calendar functionality must remain working during refactoring
- TanStack Query patterns from other features should be followed
- UI component library (shadcn/ui) patterns should be maintained
- TypeScript configuration and linting rules

### External Dependencies

- Calendar view functionality for providers
- Availability creation and editing workflows
- Integration with booking system
- Mobile responsiveness requirements

## Testing Strategy

### Automated Testing

- **Unit Tests**: Test individual utility functions and component logic
- **Integration Tests**: Test component interactions and data flow
- **Type Checking**: Ensure TypeScript compilation without warnings
- **Lint Testing**: Verify ESLint and Prettier rules compliance

### Manual Testing Checklist

- [ ] Calendar navigation works smoothly across all view modes
- [ ] Event creation and editing flows function correctly
- [ ] Error states display appropriately and allow recovery
- [ ] Loading states appear during async operations
- [ ] Accessibility features work with keyboard navigation
- [ ] Screen reader announces calendar information correctly
- [ ] Performance remains acceptable with large datasets
- [ ] No console errors or warnings in browser developer tools

### Performance Testing

- [ ] Calendar renders efficiently with 100+ events
- [ ] View switching is responsive and smooth
- [ ] Memory usage remains stable during extended use
- [ ] No memory leaks during component mount/unmount cycles

## Risk Assessment

**Medium Risk** - While this is primarily refactoring work, the calendar is a core user-facing feature. Careful testing and incremental changes are recommended.

**Mitigation Strategies:**

- Implement changes incrementally with thorough testing at each step
- Maintain feature flags for rollback capability if needed
- Comprehensive regression testing after each major refactoring
- Code review by senior developers familiar with calendar functionality

## Success Criteria

### Code Quality

- ✅ Zero console.log statements in production code (except error logging)
- ✅ No TODO or FIXME comments in codebase
- ✅ All TypeScript types are strict (no 'any' types)
- ✅ Consistent error handling patterns across components
- ✅ Comprehensive JSDoc documentation

### Architecture

- ✅ Clean separation of concerns between components
- ✅ Reusable view components extracted and properly exported
- ✅ Shared utilities eliminate code duplication
- ✅ Consistent state management patterns
- ✅ Proper component interface definitions

### Performance & Accessibility

- ✅ Memoization implemented for expensive calculations
- ✅ TanStack Query patterns are consistent and optimized
- ✅ Full keyboard navigation support
- ✅ Comprehensive screen reader compatibility
- ✅ Proper ARIA labels and accessibility attributes

### Maintainability

- ✅ Components can serve as reference patterns for other implementations
- ✅ New developers can easily understand component architecture
- ✅ Easy to extend and modify without breaking existing functionality
- ✅ Consistent patterns reduce code review overhead

## Estimated Total Time: 8-10 hours

This aligns with the original estimate of 6-8 hours but accounts for the comprehensive nature of the cleanup including documentation, accessibility, and performance optimizations required to make these components true reference patterns for the codebase.
