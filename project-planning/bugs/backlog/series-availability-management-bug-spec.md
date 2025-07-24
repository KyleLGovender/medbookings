# Series vs Individual Availability Management Workflow - Bug Specification

## Task Status: 🔴 **UNRESOLVED - Partial Implementation**

## Overview
The MedBookings calendar system has **partial series management** implementation but lacks complete integration and organization calendar support. While the basic dialog exists, several critical components are incomplete or missing.

## Problem Description

### Current State Analysis
✅ **Implemented**:
- `SeriesActionDialog` component exists and is functional
- Provider calendar (`manage-calendar/page.tsx`) has basic series detection
- State management for series actions is set up
- Series-related types and interfaces are defined

❌ **Missing/Incomplete**:
- Edit form does not accept or handle scope parameters
- Organization calendar views lack series management
- API endpoints may not fully support series operations with scope
- Delete/Cancel operations bypass series dialog in some cases
- Context menus don't indicate series vs individual availability

### Specific Issues Identified

1. **Edit Form Scope Handling** - `src/features/calendar/components/availability/availability-edit-form.tsx`
   - TODO comment indicates edit form needs scope parameter support
   - No interface for passing series action scope to edit operations

2. **Organization Calendar Gap** - `src/features/calendar/components/organization-calendar-view.tsx`  
   - No SeriesActionDialog import or usage
   - Organization users cannot manage recurring availability properly

3. **API Endpoint Scope Support**
   - Update/delete endpoints may not handle `scope` parameter correctly
   - Series operations might not propagate changes appropriately

4. **Context Menu Indicators**
   - No visual indication when availability is part of a series
   - Users can't distinguish between individual and recurring events

## Implementation Requirements

### Task 1: Complete Edit Form Integration
**Priority:** High  
**File:** `src/features/calendar/components/availability/availability-edit-form.tsx`  
**Estimated Time:** 2-3 hours

#### Problem Description
The availability edit form needs to accept and handle series action scope parameters to properly edit recurring availability instances.

#### Implementation Steps
1. Add `scope?: SeriesActionScope` prop to `AvailabilityEditFormProps` interface
2. Update form submission logic to include scope in API calls
3. Handle different scope types ('single', 'future', 'all') in form validation
4. Update the manage calendar page to pass scope from SeriesActionDialog

#### Testing Requirements
- Test editing single occurrence of recurring availability
- Test editing entire series
- Test editing "this and future" occurrences
- Verify correct API calls with scope parameter

#### Acceptance Criteria
- [ ] Edit form accepts scope parameter
- [ ] Single occurrence edits don't affect other instances
- [ ] Series edits propagate to all instances
- [ ] Future edits affect current and subsequent instances

---

### Task 2: Add Organization Calendar Series Support
**Priority:** High  
**File:** `src/features/calendar/components/organization-calendar-view.tsx`  
**Estimated Time:** 1-2 hours

#### Problem Description
Organization calendar views lack series management capabilities, forcing organization admins to edit recurring availability manually occurrence by occurrence.

#### Implementation Steps
1. Import and integrate `SeriesActionDialog` component
2. Add series action state management (similar to provider calendar)
3. Update event handlers to detect recurring availability
4. Add series-aware context menu options

#### Testing Requirements
- Test organization calendar with recurring availability
- Verify series dialog appears for recurring events
- Test all series actions (edit, delete, cancel) from organization view

#### Acceptance Criteria
- [ ] Organization calendar detects recurring availability
- [ ] SeriesActionDialog appears for series operations
- [ ] All series scopes work correctly
- [ ] Organization members can manage provider series

---

### Task 3: Enhance Context Menu Indicators
**Priority:** Medium  
**File:** `src/features/calendar/components/provider-calendar-view.tsx`, `organization-calendar-view.tsx`  
**Estimated Time:** 1-2 hours

#### Problem Description
Users cannot visually identify which calendar events are part of a recurring series, making it unclear when series management options are available.

#### Implementation Steps
1. Add visual indicators (icons/badges) for recurring events
2. Update event styling to differentiate series vs individual events
3. Add tooltips or labels indicating "Part of recurring series"
4. Ensure indicators work across all calendar view modes (day, 3-day, week, month)

#### Testing Requirements
- Verify recurring events show visual indicators
- Test indicators across all calendar views
- Confirm indicators don't interfere with existing event styling

#### Acceptance Criteria
- [ ] Recurring events display visual series indicator
- [ ] Indicators appear in all calendar view modes
- [ ] Clear differentiation between series and individual events
- [ ] Tooltips provide additional context

---

### Task 4: API Endpoint Scope Validation
**Priority:** Medium  
**File:** `src/app/api/calendar/availability/update/route.ts`, `src/features/calendar/lib/actions.ts`  
**Estimated Time:** 2 hours

#### Problem Description
API endpoints need validation to ensure scope parameters are properly handled and series operations execute correctly.

#### Implementation Steps
1. Verify `/api/calendar/availability/update` handles scope parameter
2. Test series delete operations with different scopes
3. Add proper error handling for invalid scope values
4. Ensure database operations respect scope boundaries

#### Testing Requirements
- Test API endpoints with all scope values
- Verify series operations affect correct availability instances
- Test error handling for invalid scope parameters

#### Acceptance Criteria
- [ ] Update API accepts and processes scope parameter
- [ ] Delete operations respect scope boundaries
- [ ] Proper error messages for invalid operations
- [ ] Database consistency maintained across series operations

---

## Root Cause Analysis

The series management system was **partially implemented** with the dialog component and basic detection logic, but integration was incomplete. Key gaps include:

1. **Incomplete Feature Integration**: Dialog exists but edit form integration was left as TODO
2. **Inconsistent Implementation**: Provider calendar has partial support, organization calendar has none
3. **UI/UX Gaps**: No visual indicators for series vs individual events

## Dependencies

- Existing `SeriesActionDialog` component (✅ complete)
- Series-related types and interfaces (✅ complete)  
- Provider calendar series detection (✅ partial)
- API endpoint scope handling (❓ needs validation)

## Testing Strategy

### Manual Testing
1. Create recurring availability series
2. Test edit/delete/cancel for each scope option
3. Verify changes affect correct occurrences only
4. Test from both provider and organization views

### Automated Testing
1. Unit tests for scope parameter handling
2. Integration tests for API endpoints with scope
3. Component tests for series dialog integration

## Risk Assessment

**Low Risk** - The foundation is solid with existing dialog and types. Missing pieces are straightforward additions that follow established patterns.

## Success Criteria

- ✅ Users can distinguish between series and individual availability events
- ✅ Edit operations properly handle series scope in both provider and organization calendars  
- ✅ Delete/cancel operations respect user-selected scope
- ✅ API endpoints correctly process series operations
- ✅ No regression in existing single availability management

## Estimated Total Time: 6-9 hours

This matches the original estimate of 4-6 hours but accounts for the additional organization calendar work and testing requirements discovered during analysis.