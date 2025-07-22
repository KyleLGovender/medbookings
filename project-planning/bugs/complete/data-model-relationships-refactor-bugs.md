# Data Model Relationships Refactor - Bug Fix & Improvement Task List

## High Priority Tasks

### 🔴 Critical Issues (Fix Immediately)


- [ ] **Technical Debt**: Add Database Constraint for Subscription Polymorphic Relationship - `prisma/schema.prisma:491-500`
  - **Issue**: Subscription model has polymorphic relationship (organizationId, locationId, serviceProviderId) but no database constraint ensures only one is set
  - **Impact**: Data integrity risk - subscriptions could be assigned to multiple entities simultaneously, breaking billing logic
  - **Implementation**:
    1. Add database check constraint: `CHECK ((organizationId IS NOT NULL)::int + (locationId IS NOT NULL)::int + (serviceProviderId IS NOT NULL)::int = 1)`
    2. Add application-level validation in subscription creation/update
    3. Add migration script to verify existing data integrity
    4. Update subscription queries to handle constraint properly
  - **Testing**:
    - Verify subscription creation fails when multiple IDs are set
    - Test subscription creation succeeds with exactly one ID set
    - Ensure existing subscriptions pass constraint validation
  - **Estimated Time**: 3-4 hours

### 🔴 Critical Issues (Fix Immediately)

- [ ] **Technical Debt**: Enable Multiple Service Provider Types per Provider - `prisma/schema.prisma:80-86`
  - **Issue**: ServiceProvider → ServiceProviderType relationship is currently 1:n (one type per provider), preventing providers from having multiple specialties (e.g., both Doctor and Therapist)
  - **Impact**: Business constraint that prevents real-world use cases where providers have multiple qualifications/specialties
  - **Implementation**: 
    1. Create join table `ServiceProviderTypeAssignment` to enable n:n relationship
    2. Remove `serviceProviderTypeId` field from ServiceProvider model
    3. Update all related queries and API endpoints to handle multiple types
    4. Create migration script to preserve existing single-type assignments
    5. Update approval workflow to validate requirements from ALL selected provider types (all-or-nothing approval)
    6. Update registration/edit forms to support multiple type selection
  - **Testing**: 
    - Verify providers can be assigned multiple types
    - Test all provider-related queries work with new relationship
    - Ensure UI handles multiple types display
    - Test approval workflow: provider must satisfy requirements for ALL types to be approved
    - Test provider can remove problematic types and resubmit for approval
    - Verify services from all provider types are available to multi-type providers
  - **Estimated Time**: 8-10 hours


## Medium Priority Tasks

### 🔵 Medium Priority (Upcoming)

- [ ] **Performance**: Optimize Service Provider Type Queries - `Multiple Files`
  - **Issue**: After implementing n:n relationship, queries for provider types will need optimization
  - **Impact**: Potential performance degradation on provider search and filtering
  - **Implementation**:
    1. Add appropriate database indexes for new join table
    2. Optimize provider search queries to efficiently join through assignment table
    3. Update any provider type filtering logic in API endpoints
    4. Consider caching frequently accessed provider type combinations
  - **Testing**:
    - Performance test provider search with multiple type filters
    - Verify query execution plans are optimal
    - Load test with realistic data volumes
  - **Estimated Time**: 3-4 hours

- [ ] **Technical Debt**: Update Provider Registration Flow - `src/features/providers/`
  - **Issue**: Provider registration currently assumes single service provider type selection
  - **Impact**: Registration UI and flow needs updating to support multiple type selection
  - **Implementation**:
    1. Update provider registration form to allow multiple type selection
    2. Modify registration API endpoint to handle array of type IDs
    3. Update validation logic for multiple type assignments
    4. Ensure proper error handling for invalid type combinations
  - **Testing**:
    - Test registration with single and multiple types
    - Verify error handling for edge cases
    - Test approval workflow with multiple types
  - **Estimated Time**: 4-5 hours


## Low Priority Tasks

### 🟢 Low Priority (Backlog)

- [ ] **Documentation**: Update API Documentation - `docs/api/`
  - **Issue**: API documentation needs updating to reflect new n:n relationships
  - **Impact**: Developer experience and integration documentation becomes outdated
  - **Implementation**:
    1. Update OpenAPI/Swagger specifications for affected endpoints
    2. Update code examples to show multiple type assignments
    3. Document new query parameters for multi-type filtering
    4. Update error response documentation
  - **Testing**:
    - Verify documentation examples work correctly
    - Test all documented endpoints match implementation
  - **Estimated Time**: 2-3 hours

- [ ] **Testing**: Add Comprehensive Integration Tests - `tests/`
  - **Issue**: Need test coverage for new n:n relationship scenarios
  - **Impact**: Risk of regression bugs without proper test coverage
  - **Implementation**:
    1. Add tests for multi-type provider scenarios
    2. Test edge cases like removing last type
    3. Add performance tests for complex queries
  - **Testing**:
    - All new integration tests pass
    - Test coverage metrics show adequate coverage
    - Performance tests meet established benchmarks
  - **Estimated Time**: 4-5 hours

## Completed Tasks

### ✅ Recently Completed
(This section will be populated as tasks are completed)

## Database Migration Planning

### Migration Script Requirements

1. **ServiceProviderType Assignment Migration**:
   ```sql
   -- Create new join table
   CREATE TABLE "ServiceProviderTypeAssignment" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "serviceProviderId" TEXT NOT NULL,
     "serviceProviderTypeId" TEXT NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL
   );

   -- Migrate existing data
   INSERT INTO "ServiceProviderTypeAssignment" ("id", "serviceProviderId", "serviceProviderTypeId")
   SELECT gen_random_uuid(), "id", "serviceProviderTypeId" 
   FROM "ServiceProvider" 
   WHERE "serviceProviderTypeId" IS NOT NULL;

   -- Add foreign key constraints
   ALTER TABLE "ServiceProviderTypeAssignment" 
   ADD CONSTRAINT "FK_ServiceProvider" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id");
   
   ALTER TABLE "ServiceProviderTypeAssignment" 
   ADD CONSTRAINT "FK_ServiceProviderType" FOREIGN KEY ("serviceProviderTypeId") REFERENCES "ServiceProviderType"("id");

   -- Create unique constraint to prevent duplicates
   ALTER TABLE "ServiceProviderTypeAssignment" 
   ADD CONSTRAINT "UQ_ProviderType" UNIQUE ("serviceProviderId", "serviceProviderTypeId");
   ```


## Task Management Guidelines

### Implementation Order
1. Complete ServiceProviderType relationship changes first (highest impact)
2. Update UI and API endpoints second
3. Add performance optimizations and tests last

### Rollback Strategy
- Keep migration scripts reversible
- Test rollback procedures in staging environment
- Document all schema changes for easy reversal
- Maintain data backup before migration execution

### Dependencies
- ServiceProviderType changes must be completed before updating registration flow
- All schema changes should be completed before performance optimization

## Notes for Implementation

- **Data Integrity**: Ensure no orphaned records during migration
- **Performance**: Monitor query performance after relationship changes
- **Backwards Compatibility**: API endpoints should handle both old and new data formats during transition
- **User Experience**: Provide clear messaging during any system downtime for migrations
- **Testing**: Use production data snapshots for migration testing in staging environment