# Issue Specification: availability-creation-form-cleanup

## Issue Summary

The `availability-creation-form.tsx` component requires comprehensive technical debt cleanup to serve as a clean reference pattern for provider self-scheduling. The component will be simplified to focus solely on provider self-scheduling (online-only), with organization-created availability workflows moved to the `availability-proposal-form.tsx`. This separation will eliminate workflow confusion and several related bugs while establishing a clean reference pattern.

## Problem Description

The availability creation form is a critical component in the calendar feature that manages provider availability scheduling. While it appears to function for basic operations, it contains several issues that compromise code quality and maintainability:

1. **Functional Bugs**:

   - Location selection should not exist for provider self-scheduling (providers can only create online availability, locations are organization-only)
   - Custom recurrence pattern details are not displayed after selection
   - Mixed workflow confusion: form currently tries to handle both provider self-scheduling AND organization-created scheduling (should be separated)

2. **Code Quality Issues**:

   - Complex state management that may not follow CLAUDE.md patterns
   - Potential legacy code and development artifacts
   - Inconsistent type safety patterns
   - Missing proper error handling and loading states

3. **Architecture Concerns**:
   - Not fully utilizing tRPC's type safety features
   - May not follow the dual-source type safety approach (tRPC for server data, manual types for domain logic)
   - Unclear separation between business logic and UI concerns

## Expected vs Actual Behavior

### Expected Behavior

- **Single Purpose**: Form should handle ONLY provider self-scheduling
- **Clear Context Header**: Display informational text at top: "Creating online availability for [Provider Name]"
- **No Location Selection**: Remove location UI entirely - provider availability is automatically online-only
- **Organization Workflow**: Organization-created availability should use `availability-proposal-form.tsx` (separate workflow)
- **Custom Recurrence**: Display selected recurrence pattern details after configuration
- **Type Safety**: Full utilization of tRPC's automatic type inference
- **Code Quality**: Clean, maintainable code following CLAUDE.md patterns

### Actual Behavior

- **Mixed Purpose**: Form attempts to handle both provider and organization workflows
- **Location Selection**: Incorrectly shows location selection UI (locations are organization-only)
- **Organization Role**: "Creating as" selector causes confusion and errors
- **Custom Recurrence**: Selected pattern details are not visible to users
- **Type Safety**: May not be fully utilizing tRPC type extraction patterns
- **Code Quality**: Contains complex state management and potential legacy patterns

## Reproduction Steps

1. Navigate to the availability creation form as a provider
2. Observe that location selection UI is present (incorrect - should not exist for providers)
3. Observe that "Creating as" selector is present (should be removed)
4. Select a custom recurrence pattern
5. Note that selected recurrence details are not displayed in the UI
6. Review code for type safety patterns and CLAUDE.md compliance

## Affected Users/Scope

- **All providers** attempting to create availability
- **Organization administrators** managing provider schedules
- **Developers** using this component as a reference pattern for:
  - `availability-edit-form.tsx`
  - `availability-proposal-form.tsx`
  - Other calendar-related forms

## Impact Assessment

- **Severity**: High - Core functionality with data integrity implications
- **Frequency**: Every availability creation operation
- **Business Impact**:
  - Incorrect availability settings could lead to booking conflicts
  - Poor user experience during critical onboarding/setup flows
  - Technical debt propagation to related components
  - Increased maintenance burden and bug likelihood

## Error Details

1. **Workflow Confusion** (Lines 230-287):

   - "Creating as" selector and organization role logic should be removed entirely
   - This complexity is causing unnecessary state management and conditional logic

2. **Type Safety Concerns**:

   - Component may not be using `RouterOutputs` for type extraction
   - Potential mixing of manual types where tRPC types should be used

3. **State Management Complexity**:
   - Multiple `useState` hooks that could be consolidated
   - Complex form watching logic that may cause unnecessary re-renders
   - Unnecessary organization-related state that should be removed

## Environment Information

- **Component**: `/src/features/calendar/components/availability/availability-creation-form.tsx`
- **Dependencies**:
  - tRPC for API calls
  - React Hook Form for form management
  - Zod for validation
  - TanStack Query for data fetching
- **Related Components**:
  - `availability-edit-form.tsx`
  - `availability-proposal-form.tsx`
  - `custom-recurrence-modal.tsx`
  - `service-selection-section.tsx`

## Root Cause Analysis (if known)

1. **Business Logic Confusion**: The component tries to handle both provider self-scheduling and organization-created scheduling in one form, leading to complex conditional logic

2. **Incomplete Migration**: The component may have been partially migrated to new patterns but not fully completed

3. **Type System Migration**: Recent comprehensive type system migration may not have been fully applied to this component

4. **Missing Validation**: Business rules about location availability are not properly enforced in the UI

## Potential Solutions

### 1. **Simplify to Single Purpose**

- Remove ALL organization-related logic and UI elements
- Remove the "Creating as" selector entirely
- Add clear informational header: "Creating online availability for [Provider Name]"
- Focus this form ONLY on provider self-scheduling
- Ensure organization workflows use `availability-proposal-form.tsx` exclusively

### 2. **Remove All Location UI for Providers**

- Remove ALL location-related UI elements (both online toggle and location selection)
- Automatically set `isOnlineAvailable` to true in the backend submission
- Locations are exclusively for organization-managed availability
- Provider self-scheduling is ALWAYS online-only without needing UI selection

### 3. **Remove Organization Code**

- Remove all organization-related imports and hooks
- Remove organization-related state variables
- Simplify component props to remove organizationId
- Clean up any conditional logic based on creator type

### 4. **Implement Type Safety Patterns**

```typescript
// Use domain types from manual files
import { RecurrenceOption } from '@/features/calendar/types/types';

// Extract types from RouterOutputs
type AvailabilityData = RouterOutputs['calendar']['getAvailability'];
type LocationData = RouterOutputs['organizations']['getLocations'];
```

### 5. **Display Custom Recurrence Details**

- Add UI component to show selected recurrence pattern
- Update form state to track and display pattern details

### 6. **Simplify State Management**

- Consolidate related state into single objects
- Use form.watch more efficiently
- Implement proper memoization

### 7. **Add Proper Error Handling**

- Implement comprehensive error boundaries
- Add loading states for all async operations
- Provide clear user feedback for all actions

## Workarounds

1. **For Providers**: Only use online availability option until location bug is fixed
2. **For Organizations**: Use the availability proposal workflow directly instead of this form
3. **For Custom Recurrence**: Document the selected pattern externally until UI is fixed
4. **For Developers**: Reference CLAUDE.md patterns directly rather than this component

## Definition of Done

- [ ] **Single Purpose Form**: All organization-related code removed, form handles ONLY provider self-scheduling
- [ ] **Clear Context Header**: Informational text displays "Creating online availability for [Provider Name]"
- [ ] **No Location UI**: All location selection UI removed, availability automatically set as online-only
- [ ] **"Creating as" Selector Removed**: No workflow confusion, no Select errors
- [ ] **Custom Recurrence Display**: Selected pattern details are visible in the UI
- [ ] **Type Safety Implemented**: Full tRPC type extraction patterns applied per CLAUDE.md
- [ ] **State Management Simplified**: Consolidated state, efficient form watching, proper memoization
- [ ] **Error Handling Added**: Comprehensive error boundaries and loading states
- [ ] **Code Quality**: No ESLint warnings, no unused variables, no commented code
- [ ] **Performance Optimized**: Minimal re-renders, efficient data fetching
- [ ] **CLAUDE.md Compliant**: All patterns follow documented standards
- [ ] **Ready as Reference**: Clean enough to serve as template for edit and proposal forms
- [ ] **Testing**: Manual testing confirms all bugs are fixed
- [ ] **Documentation**: Complex logic has appropriate JSDoc comments

## Additional Notes

- **Clear Separation of Concerns**: This form is for provider self-scheduling ONLY
- **Locations are organization-only**: Providers cannot specify locations - their availability is always online
- **Organization workflows** should use `availability-proposal-form.tsx` where locations can be specified
- This cleanup is critical before using this component as a reference for standardizing other forms
- Consider splitting into smaller, more focused components during cleanup
- Ensure backward compatibility is not a concern (v0 - breaking changes allowed)
- Focus on making this a exemplary implementation of CLAUDE.md patterns
- After cleanup, this simpler form will serve as the reference pattern for `availability-edit-form.tsx`

---

Is this Issue Specification correct and complete? Are there any additional details or clarifications needed?

**Respond with 'Complete Issue Specification' to finalize this document.**
