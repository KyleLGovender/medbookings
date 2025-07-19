# Data Model Relationships Refactor - Executable Task List

Generated: 2025-01-19
Source: `/project-planning/bugs/data-model-relationships-refactor-bugs.md`

## Overview

This task list contains detailed implementation steps for refactoring data model relationships in the medical booking platform. The primary focus is enabling multiple service provider types per provider and adding database constraints for subscription polymorphic relationships.

Total Tasks: 5 parent tasks with 35 sub-tasks
Estimated Total Time: 22-28 hours

## Relevant Files

- `prisma/schema.prisma` - Main database schema definition
- `src/features/providers/` - Provider registration and management features
- `src/features/organizations/` - Organization management features  
- `src/lib/prisma.ts` - Database client configuration
- `src/app/api/providers/` - Provider API endpoints
- `tests/` - Test files for integration and unit testing

## Tasks

- [x] 1.0 🔴 **CRITICAL**: Add Database Constraint for Subscription Polymorphic Relationship
  - [x] 1.1 Create migration file to add check constraint: `CHECK ((organizationId IS NOT NULL)::int + (locationId IS NOT NULL)::int + (serviceProviderId IS NOT NULL)::int = 1)` in `prisma/migrations/`
  - [x] 1.2 Add application-level validation in subscription creation API endpoints in `src/app/api/subscriptions/`
  - [x] 1.3 Add application-level validation in subscription update API endpoints
  - [x] 1.4 Create data integrity verification script to check existing subscriptions in `scripts/verify-subscription-integrity.ts`
  - [x] 1.5 Update subscription query helpers in `src/lib/subscription-utils.ts` to handle constraint properly
  - [x] 1.6 Write unit tests for subscription creation validation in `src/app/api/subscriptions/route.test.ts`
  - [x] 1.7 Write unit tests for subscription update validation
  - [x] 1.8 Test that subscription creation fails when multiple IDs are set
  - [x] 1.9 Test that subscription creation succeeds with exactly one ID set
  - [x] 1.10 Run data integrity verification script on existing database
  - [x] 1.11 Execute migration and verify all existing subscriptions pass constraint validation

- [x] 2.0 🔴 **CRITICAL**: Enable Multiple Service Provider Types per Provider
  - [x] 2.1 Create `ServiceProviderTypeAssignment` model in `prisma/schema.prisma` with id, serviceProviderId, serviceProviderTypeId, createdAt, updatedAt fields
  - [x] 2.2 Add unique constraint on (serviceProviderId, serviceProviderTypeId) in ServiceProviderTypeAssignment model
  - [x] 2.3 Add ServiceProviderTypeAssignment relation to ServiceProvider model
  - [x] 2.4 Add ServiceProviderTypeAssignment relation to ServiceProviderType model
  - [x] 2.5 Remove serviceProviderTypeId field from ServiceProvider model
  - [x] 2.6 Remove serviceProviderType relation from ServiceProvider model
  - [x] 2.7 Generate Prisma migration file for schema changes
  - [x] 2.8 Create data migration script in `scripts/migrate-provider-types.ts` to preserve existing single-type assignments
  - [x] 2.9 Update provider queries in `src/features/providers/lib/queries.ts` to use new n:n relationship
  - [x] 2.10 Update provider search API endpoint in `src/app/api/providers/search/route.ts` to handle multiple types
  - [x] 2.11 Update provider detail API endpoint in `src/app/api/providers/[id]/route.ts` to include all assigned types
  - [x] 2.12 Update approval workflow in `src/features/providers/lib/approval.ts` to validate requirements from ALL selected provider types
  - [x] 2.13 Update provider registration form in `src/features/providers/components/registration-form.tsx` to support multiple type selection
  - [x] 2.14 Update provider edit form in `src/features/providers/components/edit-form.tsx` to support multiple type selection
  - [x] 2.15 Test provider assignment to multiple types manually
  - [x] 2.16 Test provider-related queries work with new relationship structure
  - [x] 2.17 Test approval workflow: provider must satisfy requirements for ALL types to be approved
  - [x] 2.18 Test provider can remove problematic types and resubmit for approval
  - [x] 2.19 Verify services from all provider types are available to multi-type providers

- [ ] 3.0 🔵 **MEDIUM**: Optimize Service Provider Type Queries  
  - [ ] 3.1 Add database index on serviceProviderId in ServiceProviderTypeAssignment table
  - [ ] 3.2 Add database index on serviceProviderTypeId in ServiceProviderTypeAssignment table
  - [ ] 3.3 Add composite index on (serviceProviderId, serviceProviderTypeId) in ServiceProviderTypeAssignment table
  - [ ] 3.4 Optimize provider search queries in `src/features/providers/lib/search.ts` to efficiently join through assignment table
  - [ ] 3.5 Update provider type filtering logic in API endpoints to use optimized queries
  - [ ] 3.6 Implement caching for frequently accessed provider type combinations in `src/lib/cache.ts`
  - [ ] 3.7 Performance test provider search with multiple type filters using realistic data volumes
  - [ ] 3.8 Verify query execution plans are optimal using EXPLAIN ANALYZE
  - [ ] 3.9 Load test provider endpoints with concurrent requests and measure response times

- [ ] 4.0 🔵 **MEDIUM**: Update Provider Registration Flow
  - [ ] 4.1 Update provider registration API endpoint in `src/app/api/providers/register/route.ts` to handle array of type IDs
  - [ ] 4.2 Update validation schema in `src/features/providers/lib/validation.ts` for multiple type assignments
  - [ ] 4.3 Add error handling for invalid type combinations in registration endpoint
  - [ ] 4.4 Update provider registration form component to display multiple type selection UI
  - [ ] 4.5 Add client-side validation for type selection in registration form
  - [ ] 4.6 Update approval workflow integration to handle multiple types
  - [ ] 4.7 Test registration flow with single provider type selection
  - [ ] 4.8 Test registration flow with multiple provider type selection
  - [ ] 4.9 Test error handling for edge cases (empty selection, invalid type IDs)
  - [ ] 4.10 Test approval workflow integration with multiple provider types

- [ ] 5.0 🟢 **LOW**: Update Documentation and Add Integration Tests
  - [ ] 5.1 Update OpenAPI/Swagger specifications in `docs/api/` for affected provider endpoints
  - [ ] 5.2 Update code examples in documentation to show multiple type assignments
  - [ ] 5.3 Document new query parameters for multi-type filtering in API documentation
  - [ ] 5.4 Update error response documentation for validation failures
  - [ ] 5.5 Add integration tests for multi-type provider scenarios in `tests/integration/providers.test.ts`
  - [ ] 5.6 Add integration tests for provider type assignment and removal
  - [ ] 5.7 Add integration tests for approval workflow with multiple types
  - [ ] 5.8 Test edge cases like removing last provider type
  - [ ] 5.9 Add performance tests for complex multi-type queries
  - [ ] 5.10 Verify all documentation examples work correctly with updated implementation

## Completion Tracking

- **Critical Tasks**: 2/2 completed ✅
- **Medium Tasks**: 0/2 completed  
- **Low Tasks**: 0/1 completed
- **Total Progress**: 2/5 parent tasks completed (40%)

## Implementation Notes

### Task Dependencies
- Task 2.0 must be completed before Task 4.0 (provider registration updates depend on schema changes)
- Task 2.0 should be completed before Task 3.0 (performance optimization requires new schema)
- Task 1.0 can be completed independently
- Task 5.0 should be completed after all implementation tasks

### Testing Strategy
- Run full test suite after each critical task completion
- Use database snapshots for migration testing
- Performance test with realistic data volumes (1000+ providers, 10+ types)
- Test rollback procedures for all database changes

### Rollback Plan
- Keep migration scripts reversible
- Maintain database backups before schema changes
- Document all API changes for version compatibility
- Test rollback procedures in staging environment

## Post-Implementation Checklist

- [ ] All database migrations executed successfully
- [ ] No broken queries or API endpoints
- [ ] Performance benchmarks meet requirements
- [ ] Documentation updated and verified
- [ ] Test coverage maintained above 80%
- [ ] No regressions in existing functionality