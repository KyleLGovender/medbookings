# Provider Authorization Failures - Executable Task List

**Generated From:** `provider-authorization-failures-id-comparisons.md`  
**Date:** July 23, 2025  
**Priority:** Critical (🔴)  
**Total Tasks:** 4 major tasks

## Overview

This document addresses critical authorization failures throughout the calendar system where User IDs are incorrectly compared with Provider IDs, preventing providers from accessing or managing their own availability records. The bug affects multiple CRUD operations and workflow processes across the calendar feature.

## Instructions for Claude Code

- Complete tasks in order of priority
- Mark tasks as completed when finished
- Run tests after each task completion
- Update this file with completion status

## Relevant Files

- `src/features/calendar/lib/actions.ts` - Primary calendar operations with authorization issues
- `src/features/calendar/lib/workflow-service.ts` - Availability workflow authorization
- `src/features/calendar/types/types.ts` - Type definitions verification
- `src/features/calendar/lib/actions.test.ts` - Test file for authorization coverage

## Tasks

- [x] 1.0 🔴 **CRITICAL**: Fix Authorization Pattern in Calendar Actions
  - [x] 1.1 Fix `createAvailability` authorization check at line 54 in `src/features/calendar/lib/actions.ts`
  - [x] 1.2 Add Provider lookup query: `await prisma.provider.findUnique({ where: { userId: currentUser.id } })`
  - [x] 1.3 Update authorization check to compare Provider IDs: `currentUserProvider?.id === validatedData.providerId`
  - [x] 1.4 Fix `getAvailabilityById` authorization check at line 310 in `src/features/calendar/lib/actions.ts`
  - [x] 1.5 Fix `updateAvailability` authorization check at line 479 in `src/features/calendar/lib/actions.ts`
  - [x] 1.6 Fix `deleteAvailability` authorization check at line 630 in `src/features/calendar/lib/actions.ts`
  - [x] 1.7 Fix `cancelAvailability` authorization check at line 727 in `src/features/calendar/lib/actions.ts`
  - [x] 1.8 Consolidate Provider lookups to avoid duplicate database queries across all functions
  - [x] 1.9 Add proper error handling when user doesn't have Provider record
  - [ ] 1.10 Test provider can create, view, update, delete, and cancel their own availability
  - [ ] 1.11 Test provider cannot access other providers' availability records
  - [ ] 1.12 Test organization admins can still manage provider availability within their organization

- [x] 2.0 🔴 **CRITICAL**: Fix Authorization Pattern in Workflow Service
  - [x] 2.1 Fix authorization check at line 54 in `src/features/calendar/lib/workflow-service.ts`
  - [x] 2.2 Fix authorization check at line 178 in `src/features/calendar/lib/workflow-service.ts`
  - [x] 2.3 Fix authorization check at line 280 in `src/features/calendar/lib/workflow-service.ts`
  - [x] 2.4 Fix authorization check at line 401 in `src/features/calendar/lib/workflow-service.ts`
  - [x] 2.5 Update all workflow functions to fetch Provider record before authorization checks
  - [x] 2.6 Ensure workflow functions use Provider ID comparisons: `currentUserProvider?.id === targetProviderId`
  - [x] 2.7 Add error handling for users without Provider records in workflow operations
  - [ ] 2.8 Test provider can accept availability proposals directed to them
  - [ ] 2.9 Test provider can reject availability proposals directed to them
  - [ ] 2.10 Test organization can create availability proposals for providers
  - [ ] 2.11 Test workflow authorization prevents cross-provider access

- [x] 3.0 🟡 **HIGH**: Fix Field Name Inconsistencies
  - [x] 3.1 Update `serviceProviderId` reference to `providerId` at line 360 in `src/features/calendar/lib/actions.ts`
  - [x] 3.2 Update `serviceProviderId` reference to `providerId` at line 422 in `src/features/calendar/lib/actions.ts`
  - [x] 3.3 Search codebase for any remaining `serviceProviderId` references in calendar feature
  - [x] 3.4 Update related type definitions in `src/features/calendar/types/types.ts` if needed
  - [ ] 3.5 Test search functionality returns correct results with updated field names
  - [ ] 3.6 Test provider-specific filtering works correctly
  - [ ] 3.7 Verify no regression in existing search capabilities

## Acceptance Criteria

### Task 1.0 Completion Criteria
- [ ] All calendar action functions use correct Provider ID comparisons
- [ ] Provider lookup queries are consolidated to avoid duplicates
- [ ] Providers can successfully manage their own availability records
- [ ] Cross-provider access is properly prevented
- [ ] Organization-level authorization continues to work correctly
- [ ] Proper error messages for users without Provider records

### Task 2.0 Completion Criteria
- [ ] All workflow service functions use correct Provider ID comparisons
- [ ] Providers can accept/reject availability proposals directed to them
- [ ] Organization workflow operations continue to function
- [ ] Cross-provider workflow access is prevented
- [ ] Error handling covers all edge cases

### Task 3.0 Completion Criteria
- [ ] All field name references use consistent `providerId` naming
- [ ] Search functionality works correctly with updated field names
- [ ] No regression in existing search capabilities
- [ ] Provider-specific filtering operates correctly

## Success Metrics

- **Authorization Success Rate**: 100% success rate for providers accessing their own records
- **Error Reduction**: Zero "permission denied" errors for valid provider operations
- **Performance Impact**: Provider lookup operations complete within 50ms
- **Test Coverage**: 100% code coverage for authorization logic
- **Regression Prevention**: All existing functionality continues to work

## Dependencies

- **Database Schema**: No changes required - current schema is correct
- **Authentication**: NextAuth session handling works correctly
- **Existing Business Logic**: Status assignment logic is already fixed
- **Organization Authorization**: Must maintain existing organization-level permissions

## Risk Mitigation

- **Backward Compatibility**: All changes maintain existing organization authorization patterns
- **Performance**: Optimize Provider lookups to prevent performance degradation
- **Error Handling**: Comprehensive error messages for debugging and user feedback
- **Testing**: Extensive test coverage prevents regression issues

## Notes

**Root Cause**: The authorization failures stem from the ServiceProvider → Provider model migration where authorization checks weren't updated to use the correct ID relationships.

**Key Pattern Fix**: Replace `currentUser.id === availability.providerId` with proper Provider lookup and ID comparison: `currentUserProvider?.id === availability.providerId`

**Impact**: This fix will restore provider self-management capabilities and eliminate "permission denied" errors when providers manage their own availability records.

---

**Estimated Total Time**: 12-16 hours  
**Priority**: Critical - affects core user functionality  
**Dependencies**: None - can be implemented immediately
