# Orphaned Database Functions Report

**Date**: 2025-08-02  
**Task**: 2.2 - Identify orphaned database functions not exposed through tRPC procedures

## Summary

Analyzed database functions in lib directories and compared them with tRPC router procedures to identify orphaned functions that perform database operations but are not exposed through tRPC.

## Orphaned Functions by Feature

### Calendar Feature (Critical - Most Orphaned Functions)

#### 1. **Slot Generation & Management**
- `generateSlotsForAvailability()` - Creates slots from availability
- `cleanupDeletedAvailability()` - Removes slots for deleted availability
- `cleanupDeletedRecurringSeries()` - Cleans up recurring series
- `cleanupOrphanedSlots()` - Removes orphaned slots
- `cleanupModifiedAvailability()` - Updates slots after availability changes

**Impact**: Core slot management not exposed through tRPC

#### 2. **Advanced Search Functions**
- `searchSlotsByTime()` - Time-based slot search
- `findOptimalTimeSlots()` - AI-powered optimal slot finder
- `getAvailabilityHeatmap()` - Availability density visualization
- `searchProvidersByLocation()` - Location-based provider search
- `getNearbyLocations()` - Geographic proximity search
- `filterServices()` - Advanced service filtering
- `getAvailableServiceTypes()` - Service type enumeration
- `searchServices()` - Service search with filters

**Impact**: Advanced search capabilities not accessible via tRPC

#### 3. **Validation & Conflict Detection**
- `validateAvailability()` - Pre-creation validation
- `validateRecurringAvailability()` - Recurring pattern validation
- `validateAvailabilityUpdate()` - Update validation
- `canUpdateAvailability()` - Permission checking
- `detectSlotConflicts()` - Conflict detection
- `analyzeTimeSlotConflicts()` - Detailed conflict analysis

**Impact**: Validation logic trapped in lib layer

#### 4. **Booking Integration**
- `findAvailableSlots()` - Available slot finder
- `createValidatedBooking()` - Booking creation with validation

**Impact**: Booking workflow incomplete without these

#### 5. **Notification Services**
- `sendAvailabilityStatusNotifications()` - Status change notifications
- `notifyAvailabilityProposed()` - Proposal notifications
- `notifyAvailabilityAccepted()` - Acceptance notifications
- `notifyAvailabilityRejected()` - Rejection notifications
- `notifyAvailabilityCancelled()` - Cancellation notifications

**Impact**: Notification system not integrated with tRPC

#### 6. **Performance & Optimization**
- `optimizedProviderSearch()` - Optimized search queries
- `optimizedSlotSearch()` - Performance-tuned slot search

**Impact**: Performance optimizations not exposed

### Providers Feature

#### Orphaned Functions:
1. `getProviderByUserId()` - Get provider by user ID
2. `getProviderByProviderId()` - Get provider by provider ID
3. `getProvidersByType()` - Get providers by type

**Impact**: Basic provider queries not in tRPC

### Organizations Feature

#### Potentially Orphaned:
- Member management functions in `member-management.ts`
- Server actions in `server-actions.ts`

**Note**: Need to check organizations router for these

### Profile Feature

#### Orphaned Functions:
1. `updateProfile()` - Profile update operation
2. `deleteUser()` - User deletion

**Impact**: Profile management incomplete in tRPC

### Admin Feature

#### Potentially Orphaned:
- Override actions in `override-actions.ts`
- Some approval workflows

**Note**: Need to verify admin router coverage

### Communications Feature

#### Potentially Orphaned:
- Communication actions in `actions.ts`

**Note**: No communications router found - entire feature may be orphaned

## Critical Findings

### 1. **Calendar Feature Has ~25+ Orphaned Functions**
This represents a significant gap in tRPC coverage:
- Core slot management system
- Advanced search capabilities
- Validation and conflict detection
- Booking integration
- Notification system

### 2. **Missing Routers**
- **Communications**: No tRPC router found
- **Reviews**: No tRPC router found
- **Auth**: Session management functions orphaned

### 3. **Service Layer Pattern Issues**
Many orphaned functions follow a service pattern that should be split:
- Business logic (keep in lib)
- Database operations (expose via tRPC)

### 4. **Cross-Feature Dependencies**
Some orphaned functions are called by other features:
- Calendar validation used by booking flow
- Provider queries used by multiple features

## Migration Priority

### Critical (Blocking Core Functionality):
1. **Slot Generation**: `generateSlotsForAvailability()`
2. **Slot Cleanup**: All cleanup functions
3. **Provider Queries**: Basic provider lookups
4. **Booking Integration**: `findAvailableSlots()`, `createValidatedBooking()`

### High (Feature Completeness):
1. **Advanced Search**: All search functions
2. **Validation**: All validation functions
3. **Notifications**: All notification functions
4. **Profile Management**: Update and delete operations

### Medium (Enhancement):
1. **Performance Functions**: Optimized searches
2. **Heatmap Generation**: Analytics functions
3. **Service Filtering**: Advanced filters

## Recommendations

### 1. **Create Missing Routers**
- Add `communicationsRouter` for notification system
- Add `reviewsRouter` if review features exist
- Consider `bookingRouter` for booking-specific operations

### 2. **Expand Existing Routers**
- **calendarRouter**: Add ~25 missing procedures
- **providersRouter**: Add basic query procedures
- **profileRouter**: Add update/delete procedures

### 3. **Refactor Service Layer**
- Extract database operations to tRPC procedures
- Keep business logic in lib files
- Create clear separation of concerns

### 4. **Consider Grouped Procedures**
Instead of individual procedures, consider:
- `calendar.slots.*` - All slot operations
- `calendar.search.*` - All search operations
- `calendar.validation.*` - All validation operations

## Next Steps

1. **Task 2.3-2.11**: Migrate each feature's orphaned functions
2. **Priority**: Start with calendar feature (most critical)
3. **Pattern**: Create tRPC procedures that call existing lib functions
4. **Testing**: Ensure all consumers updated to use tRPC

## Example Migration Pattern

```typescript
// In calendar router
slots: {
  generate: protectedProcedure
    .input(z.object({ availabilityId: z.string() }))
    .mutation(async ({ input }) => {
      return await generateSlotsForAvailability(input.availabilityId);
    }),
    
  cleanup: protectedProcedure
    .input(z.object({ availabilityId: z.string() }))
    .mutation(async ({ input }) => {
      return await cleanupDeletedAvailability(input.availabilityId);
    }),
},
```

This ensures type safety while reusing existing, tested logic.