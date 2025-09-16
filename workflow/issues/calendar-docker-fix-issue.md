# Issue Specification: Calendar Docker Fix

**Issue ID**: calendar-docker-fix
**Created**: 2025-09-15
**Priority**: P0 Critical
**Category**: Bug Fix
**Severity**: High - Core functionality completely broken

## Issue Summary

Calendar functionality is completely broken when running the MedBookings application in Docker on localhost:3000. Both provider availability management and guest calendar viewing are non-functional.

## Problem Description

### Current State
When running the application in Docker environment:
1. **Providers cannot configure their availability** - interface fails to load/save availability settings
2. **Guests cannot view provider availability** - calendar displays empty with no available slots
3. **Edit/delete provider availability doesn't work** - modification operations fail

### Environment Context
- **Affected Environment**: Docker development environment (localhost:3000)
- **Working Environment**: Production AWS deployment (with existing provider data)
- **Root Cause**: Combination of hard-coded values and missing seed data

## Technical Analysis

Based on comprehensive codebase analysis in `/workflow/technical-plans/calendar-docker-fix-technical-plan.md`:

### Root Cause Analysis

**Issue #1: Provider Management Failure**
- **Location**: `/src/app/(dashboard)/availability/page.tsx:9`
- **Problem**: Hard-coded `providerId="current"` breaks tRPC queries
- **Impact**: All provider availability management operations fail
- **Technical Detail**: tRPC procedures expect valid UUID, receive literal string "current"

**Issue #2: Guest Viewing Failure**
- **Location**: Docker seed data gaps
- **Problem**: `/prisma/seed.mts` only creates schema data, no actual Provider/Availability records
- **Impact**: Guest calendar viewing shows empty state
- **Technical Detail**: Public calendar queries return no results due to missing data

### Dependencies
- Next.js 14 App Router architecture
- tRPC type-safe API procedures
- PostgreSQL with Prisma ORM
- Docker containerization
- Database seeding pipeline

## Success Criteria

### Primary Objectives
1. **Provider Availability Management**: Providers can successfully configure, edit, and delete their availability schedules in Docker environment
2. **Guest Calendar Viewing**: Non-authenticated users can view provider availability and available time slots
3. **Docker Environment Parity**: Calendar functionality works identically in Docker as in production

### Acceptance Tests
- [ ] Provider can access availability configuration page without errors
- [ ] Provider can create new availability slots and see them persist
- [ ] Provider can edit existing availability slots
- [ ] Provider can delete availability slots
- [ ] Guest users can navigate to provider calendar URLs
- [ ] Guest users see populated calendar with available time slots
- [ ] Guest users can view different providers' calendars
- [ ] All calendar operations work in fresh Docker container

## Technical Requirements

### Code Changes Required
1. **Dynamic Provider Resolution** (`/src/app/(dashboard)/availability/page.tsx`)
   - Replace hard-coded `providerId="current"`
   - Implement proper provider lookup from authentication context
   - Add error handling for users without provider profiles

2. **Enhanced Database Seeding** (`/prisma/seed.mts`)
   - Add sample Provider records with valid User relationships
   - Include Availability records with realistic schedules
   - Generate CalculatedAvailabilitySlot records for testing
   - Ensure seed data covers multiple provider scenarios

3. **Provider Onboarding Flow**
   - Handle users who don't have provider profiles
   - Redirect to appropriate setup/onboarding experience
   - Provide clear messaging for incomplete setups

### Data Requirements
- Minimum 2-3 test Provider records in seed data
- Each Provider must have associated User record
- Availability records covering different scheduling patterns
- CalculatedAvailabilitySlot records for guest viewing
- Realistic time slots for various provider types

## Risk Assessment

**High Risk Areas:**
- Authentication context in provider resolution
- Database relationship integrity in seed data
- tRPC type safety with dynamic provider IDs

**Mitigation Strategies:**
- Comprehensive testing of provider lookup logic
- Validation of all database relationships in seed data
- Type safety verification for all calendar procedures

## Testing Strategy

### Manual Testing
1. Fresh Docker container startup with `docker compose up`
2. Provider login → availability configuration workflow
3. Guest navigation → calendar viewing workflow
4. Cross-provider calendar viewing
5. Data persistence verification

### Automated Testing
- E2E tests using Playwright MCP tools
- Provider availability management flow
- Guest calendar viewing flow
- Error handling scenarios

## Implementation Priority

**P0 Critical (Must Fix):**
- Hard-coded provider ID replacement
- Basic seed data for Provider/Availability records

**P1 Important:**
- Enhanced seed data with multiple scenarios
- Provider onboarding flow

**P2 Nice-to-Have:**
- Additional test coverage
- Performance optimization

## Success Metrics

- **Provider Success Rate**: 100% of authenticated users with provider profiles can manage availability
- **Guest Success Rate**: 100% of guest users can view populated calendars
- **Error Reduction**: Zero calendar-related errors in Docker logs
- **Feature Parity**: Docker environment matches production calendar functionality

## References

- **Technical Plan**: `/workflow/technical-plans/calendar-docker-fix-technical-plan.md`
- **Core Architecture**: `/src/app/layout.tsx`, `/prisma/schema.prisma`
- **Calendar Feature**: `/src/features/calendar/`
- **API Layer**: `/src/server/api/routers/calendar.ts`

## Implementation Notes

This issue requires careful coordination between frontend provider resolution and backend data seeding. The fix must maintain type safety while providing realistic development data for testing all calendar scenarios.