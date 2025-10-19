# Server-Side Library Audit Report

**Date**: 2025-08-02  
**Task**: 2.1 - Audit ALL files in `/src/features/*/lib/` directories for database interactions

## Summary

Audited 53 files in `/src/features/*/lib/` directories and found 22 files with direct database interactions using Prisma.

## Files with Database Interactions (22 files)

### Admin Feature (3 files)

1. **approval-actions.ts** - Provider and organization approval workflows
2. **override-actions.ts** - Admin override actions
3. **actions.ts** - General admin actions

### Auth Feature (1 file)

1. **session-helper.ts** - Session management with database

### Billing Feature (0 files with DB)

- No direct database interactions found in billing lib files

### Calendar Feature (11 files) ⚠️ **Most violations**

1. **actions.ts** - Availability CRUD operations
2. **availability-validation.ts** - Validation with DB queries
3. **booking-integration.ts** - Booking slot management
4. **conflict-management.ts** - Conflict detection with DB
5. **location-search-service.ts** - Location-based searches
6. **search-performance-service.ts** - Optimized search queries
7. **service-filter-service.ts** - Service filtering with DB
8. **slot-cleanup-service.ts** - Slot maintenance operations
9. **slot-generation.ts** - Slot generation from availability
10. **time-search-service.ts** - Time-based slot searches
11. **workflow-service.ts** - Complex workflows with DB

### Communications Feature (1 file)

1. **actions.ts** - Communication/notification actions

### Organizations Feature (3 files)

1. **actions.ts** - Organization CRUD operations
2. **member-management.ts** - Membership operations
3. **server-actions.ts** - Server-side organization actions

### Profile Feature (1 file)

1. **actions.ts** - Profile update operations

### Providers Feature (3 files)

1. **provider-types.ts** - Provider type management
2. **queries.ts** - Provider query functions
3. **search.ts** - Provider search functionality

### Reviews Feature (0 files with DB)

- No direct database interactions found in reviews lib files

## Categories of Database Operations Found

### 1. **Direct CRUD Operations**

- Files ending in `actions.ts` typically contain create, update, delete operations
- These should be straightforward to migrate to tRPC procedures

### 2. **Complex Query Functions**

- Files like `queries.ts`, `search.ts` contain complex database queries
- May include aggregations, joins, and performance optimizations

### 3. **Service Layer Functions**

- Calendar feature has many service files with business logic + DB operations
- These may need to be split: business logic stays, DB operations move to tRPC

### 4. **Validation Functions**

- Files like `availability-validation.ts` that check database state
- Should be exposed as tRPC queries

### 5. **Workflow Operations**

- Complex multi-step operations like `workflow-service.ts`
- May need to be refactored into multiple tRPC procedures

## Files WITHOUT Database Interactions (31 files)

These files contain only:

- Helper functions
- Utility functions
- Business logic without DB access
- Type definitions
- Constants

Examples:

- `calendar-utils.ts` - Date/time utilities
- `scheduling-rules.ts` - Business rule calculations
- `recurrence-utils.ts` - Recurrence pattern logic
- `virtualization-helpers.ts` - UI helpers
- `api-error-handler.ts` - Error handling utilities

## Critical Findings

### 1. **Calendar Feature Has Most Violations**

- 11 out of 22 files with DB access are in calendar feature
- Complex service layer with tight DB coupling
- Will require significant refactoring

### 2. **Orphaned Database Functions**

Potential orphaned functions not exposed through tRPC:

- `getAvailabilityById` (mentioned in PRD)
- Location search services
- Time-based search functions
- Conflict detection queries

### 3. **Service Layer Pattern**

Many files follow a service pattern that mixes:

- Business logic (should stay in lib)
- Database operations (should move to tRPC)
- Will need careful separation

### 4. **Include Configurations**

Need to check for manual include configurations like:

- `includeAvailabilityRelations`
- Custom Prisma select/include objects

## Next Steps

1. **Task 2.2**: Identify specific orphaned functions in these 22 files
2. **Task 2.3-2.11**: Migrate each feature's database operations to tRPC
3. **Task 2.12-2.13**: Remove manual configurations and type interfaces
4. **Task 2.14**: Preserve non-database utilities in lib directories

## Migration Priority

Based on complexity and impact:

1. **High Priority**:

   - Calendar feature (most complex, 11 files)
   - Providers feature (core functionality)
   - Organizations feature (interconnected)

2. **Medium Priority**:

   - Admin feature (approval workflows)
   - Profile feature (simpler operations)
   - Communications feature

3. **Low Priority**:
   - Auth feature (session management)
   - Billing feature (already clean)
   - Reviews feature (already clean)
