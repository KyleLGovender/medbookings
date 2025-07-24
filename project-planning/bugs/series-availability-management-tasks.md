# Series vs Individual Availability Management - Executable Task List

**Generated From:** `series-availability-management-bug-spec.md`  
**Date:** January 24, 2025  
**Priority:** High (🟡)  
**Total Tasks:** 4 major tasks

## Overview

This document addresses incomplete series management implementation in the MedBookings calendar system. While basic SeriesActionDialog exists, critical components like edit form integration, organization calendar support, and visual indicators are missing or incomplete.

## Instructions for Claude Code

- Complete tasks in order of priority
- Mark tasks as completed when finished
- Run tests after each task completion
- Update this file with completion status

## Relevant Files

- `src/features/calendar/components/availability/availability-edit-form.tsx` - Edit form needs scope parameter support
- `src/features/calendar/components/organization-calendar-view.tsx` - Missing series management integration
- `src/features/calendar/components/provider-calendar-view.tsx` - Visual indicators for series events
- `src/app/api/calendar/availability/update/route.ts` - API endpoint scope validation
- `src/features/calendar/lib/actions.ts` - Series operations handling

## Tasks

- [x] 1.0 🟡 **HIGH**: Complete Edit Form Series Integration
  - [x] 1.1 Add `scope?: SeriesActionScope` prop to `AvailabilityEditFormProps` interface in `availability-edit-form.tsx`
  - [x] 1.2 Update form component to accept and store scope parameter from props
  - [x] 1.3 Modify form submission logic to include scope in API calls when editing recurring availability
  - [x] 1.4 Add scope-aware validation logic for different operation types ('single', 'future', 'all')
  - [x] 1.5 Update manage calendar page to pass scope from SeriesActionDialog to edit form
  - [x] 1.6 Add error handling for invalid scope values in form submission
  - [ ] 1.7 Test editing single occurrence of recurring availability maintains other instances
  - [ ] 1.8 Test editing entire series propagates changes to all instances correctly
  - [ ] 1.9 Test editing "this and future" affects only current and subsequent instances
  - [ ] 1.10 Verify correct API calls include scope parameter in request payload

- [ ] 2.0 🟡 **HIGH**: Add Organization Calendar Series Support
  - [ ] 2.1 Import `SeriesActionDialog` component in `organization-calendar-view.tsx`
  - [ ] 2.2 Add series action state management using useState for dialog visibility and selected action
  - [ ] 2.3 Add `isRecurring` and `seriesId` detection logic for availability events
  - [ ] 2.4 Update event click handlers to detect recurring availability and show series dialog
  - [ ] 2.5 Add series-aware context menu options for recurring events
  - [ ] 2.6 Integrate series dialog with existing edit/delete/cancel operations
  - [ ] 2.7 Test organization calendar properly detects recurring availability events
  - [ ] 2.8 Test series dialog appears and functions correctly for organization users
  - [ ] 2.9 Test all series scopes (single, future, all) work from organization calendar
  - [ ] 2.10 Verify organization members can manage provider series within their organization

- [ ] 3.0 🔵 **MEDIUM**: Enhance Context Menu Visual Indicators
  - [ ] 3.1 Add visual series indicator icons/badges to recurring events in `provider-calendar-view.tsx`
  - [ ] 3.2 Add visual series indicator icons/badges to recurring events in `organization-calendar-view.tsx`
  - [ ] 3.3 Update event styling to differentiate series vs individual availability with distinct colors/borders
  - [ ] 3.4 Add tooltips displaying "Part of recurring series" for recurring events
  - [ ] 3.5 Ensure series indicators work across all calendar view modes (day, 3-day, week, month)
  - [ ] 3.6 Test recurring events display visual indicators consistently across views
  - [ ] 3.7 Test indicators don't interfere with existing event click/hover interactions
  - [ ] 3.8 Verify clear visual differentiation between series and individual events
  - [ ] 3.9 Test tooltips provide helpful context without cluttering interface

- [ ] 4.0 🔵 **MEDIUM**: API Endpoint Scope Validation
  - [ ] 4.1 Verify `/api/calendar/availability/update/route.ts` accepts scope parameter correctly
  - [ ] 4.2 Add scope parameter validation in API endpoint with proper TypeScript types
  - [ ] 4.3 Update series delete operations in `actions.ts` to handle scope boundaries correctly
  - [ ] 4.4 Add proper error handling for invalid scope values in API responses
  - [ ] 4.5 Ensure database operations respect scope boundaries (single/future/all)
  - [ ] 4.6 Add logging for series operations to track scope-based changes
  - [ ] 4.7 Test API endpoints with all scope values ('single', 'future', 'all')
  - [ ] 4.8 Test series operations affect only the correct availability instances
  - [ ] 4.9 Test error handling returns proper HTTP status codes and messages
  - [ ] 4.10 Verify database consistency is maintained across all series operations

## Acceptance Criteria

### Task 1.0 Completion Criteria
- [ ] Edit form accepts and processes scope parameter correctly
- [ ] Single occurrence edits don't affect other instances in series
- [ ] Series edits propagate changes to all instances as expected
- [ ] Future edits affect current and subsequent instances only
- [ ] Proper error handling for scope-related validation failures

### Task 2.0 Completion Criteria
- [ ] Organization calendar detects and handles recurring availability
- [ ] SeriesActionDialog appears and functions for organization users
- [ ] All series scopes work correctly from organization calendar
- [ ] Organization members can manage provider availability series
- [ ] No regression in existing organization calendar functionality

### Task 3.0 Completion Criteria
- [ ] Recurring events display clear visual series indicators
- [ ] Indicators appear consistently across all calendar view modes
- [ ] Clear differentiation between series and individual events
- [ ] Tooltips provide helpful context without UI interference
- [ ] Visual indicators enhance rather than clutter the interface

### Task 4.0 Completion Criteria
- [ ] API endpoints accept and validate scope parameters correctly
- [ ] Series operations respect scope boundaries in database
- [ ] Proper error messages for invalid scope operations
- [ ] Database consistency maintained across all series operations
- [ ] Comprehensive logging for debugging series-related issues

## Success Metrics

- **Feature Completeness**: 100% of series management workflow implemented
- **User Experience**: Clear visual distinction between series and individual events
- **Data Integrity**: All series operations maintain database consistency
- **Error Handling**: Comprehensive validation and user-friendly error messages
- **Cross-Platform**: Consistent behavior across provider and organization calendars

## Dependencies

- **Existing Components**: SeriesActionDialog component (✅ available)
- **Type Definitions**: SeriesActionScope types (✅ available)
- **Provider Calendar**: Partial series detection (✅ available)
- **API Infrastructure**: Update endpoints (❓ needs scope validation)

## Risk Mitigation

- **Backward Compatibility**: All changes maintain existing single availability functionality
- **Performance**: Series indicators optimized to avoid calendar rendering performance impact
- **User Training**: Clear visual cues reduce need for user documentation
- **Testing**: Comprehensive testing prevents regression in existing calendar features

## Notes

**Root Cause**: Series management was partially implemented with dialog component but integration with edit forms and organization calendars was incomplete. This creates inconsistent user experience across different calendar views.

**Key Integration Points**: 
- Edit form scope parameter handling
- Organization calendar series detection
- Visual indicators for user clarity
- API endpoint scope validation

**Impact**: Completing this work will provide consistent series management across all calendar views and user roles, eliminating the current manual occurrence-by-occurrence editing workflow.

---

**Estimated Total Time**: 6-9 hours  
**Priority**: High - affects core calendar functionality  
**Dependencies**: None - can be implemented immediately using existing SeriesActionDialog foundation