## Relevant Files

- `src/server/trpc.ts` - Core tRPC configuration with context, middleware, and procedure definitions
- `src/server/api/root.ts` - Root router that combines all feature routers
- `src/app/api/trpc/[trpc]/route.ts` - Next.js App Router handler for tRPC
- `src/utils/api.ts` - tRPC client configuration with TanStack Query
- `src/components/providers.tsx` - React providers component that needs tRPC provider integration
- `src/server/api/routers/providers.ts` - Provider domain router implementation
- `src/server/api/routers/organizations.ts` - Organization domain router implementation
- `src/server/api/routers/calendar.ts` - Calendar domain router implementation
- `src/server/api/routers/admin.ts` - Admin domain router implementation
- `src/server/api/routers/billing.ts` - Billing domain router implementation
- `src/features/*/hooks/*.ts` - All feature hooks that need migration to tRPC
- `src/features/*/lib/actions/*.ts` - Existing server actions to be wrapped by tRPC procedures
- `src/features/*/types/schemas.ts` - Existing Zod schemas to be used for validation
- `package.json` - Dependencies configuration for tRPC packages
- `CLAUDE.md` - Documentation that needs updating with tRPC patterns

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase
- Authentication uses custom `getCurrentUser()` pattern, not standard `getServerSession()`
- No barrel exports allowed - use direct imports from specific files
- Existing server actions should be wrapped, not rewritten
- Keep REST endpoints for auth, file upload, and webhooks

## Tasks

- [ ] 1.0 Set up tRPC Infrastructure and Core Configuration
  - [ ] 1.1 Install tRPC dependencies (@trpc/server, @trpc/client, @trpc/react-query, @trpc/next, superjson)
  - [ ] 1.2 Create src/server/trpc.ts with context, middleware, and authentication procedures
  - [ ] 1.3 Implement getCurrentUser() integration in tRPC context
  - [ ] 1.4 Set up role-based middleware (publicProcedure, protectedProcedure, adminProcedure)
  - [ ] 1.5 Create src/app/api/trpc/[trpc]/route.ts for Next.js App Router integration
  - [ ] 1.6 Configure src/utils/api.ts with tRPC client and TanStack Query
  - [ ] 1.7 Update src/components/providers.tsx to include tRPC provider
  - [ ] 1.8 Create src/server/api/root.ts with empty router structure
  - [ ] 1.9 Set up error formatting with Zod integration
  - [ ] 1.10 Configure development error logging and tRPC panel

- [ ] 2.0 Migrate Basic Routes and Simple GET Endpoints
  - [ ] 2.1 Create providers router with getProviderTypes procedure
  - [ ] 2.2 Migrate /api/providers/requirement-types to api.providers.getRequirementTypes
  - [ ] 2.3 Migrate /api/providers/services to api.providers.getServices
  - [ ] 2.4 Create calendar router with getServiceTypes procedure
  - [ ] 2.5 Create profile router and migrate GET /api/profile
  - [ ] 2.6 Create debug router for /api/debug-session endpoint
  - [ ] 2.7 Create invitations router for token validation
  - [ ] 2.8 Update all corresponding hooks to use tRPC queries
  - [ ] 2.9 Test each migrated endpoint for type safety
  - [ ] 2.10 Remove old REST API route files for migrated endpoints

- [ ] 3.0 Migrate Provider Domain CRUD Operations and Hooks
  - [ ] 3.1 Implement providers.list query with search and filtering
  - [ ] 3.2 Create providers.create mutation using registerProvider action
  - [ ] 3.3 Implement providers.get query with relations
  - [ ] 3.4 Create providers.update mutation with form data conversion
  - [ ] 3.5 Implement providers.delete mutation
  - [ ] 3.6 Migrate updateBasicInfo procedure with validation
  - [ ] 3.7 Implement services management procedures (get/update)
  - [ ] 3.8 Create requirements submission procedures
  - [ ] 3.9 Migrate all provider hooks (useProviders, useProvider, etc.)
  - [ ] 3.10 Implement optimistic updates for provider mutations
  - [ ] 3.11 Add provider connections sub-router
  - [ ] 3.12 Test provider domain end-to-end flows

- [ ] 4.0 Migrate Organization Domain CRUD Operations and Hooks
  - [ ] 4.1 Implement organizations.list with filtering
  - [ ] 4.2 Create organizations.create mutation with validation
  - [ ] 4.3 Implement organizations.get with includes
  - [ ] 4.4 Create organizations.update mutation
  - [ ] 4.5 Implement organizations.delete mutation
  - [ ] 4.6 Create locations sub-router (get/add/update/delete)
  - [ ] 4.7 Implement billing sub-router procedures
  - [ ] 4.8 Create provider connections management procedures
  - [ ] 4.9 Implement provider invitations procedures
  - [ ] 4.10 Migrate all organization hooks to tRPC
  - [ ] 4.11 Add getByUserId procedures for user lookups
  - [ ] 4.12 Test organization workflows with authorization

- [ ] 5.0 Migrate Calendar Domain Complex Operations and Search
  - [ ] 5.1 Create calendar.createAvailability with complex validation
  - [ ] 5.2 Implement updateAvailability with business rules
  - [ ] 5.3 Create deleteAvailability with cascade handling
  - [ ] 5.4 Implement accept/reject/cancel availability procedures
  - [ ] 5.5 Create getAvailability and listAvailabilities queries
  - [ ] 5.6 Implement searchSlots with performance optimization
  - [ ] 5.7 Create searchProviders with filtering logic
  - [ ] 5.8 Implement searchServices procedure
  - [ ] 5.9 Add geocode procedure for location services
  - [ ] 5.10 Create performance recommendations query
  - [ ] 5.11 Migrate all calendar hooks with caching strategies
  - [ ] 5.12 Test complex calendar workflows and search

- [ ] 6.0 Migrate Admin Domain Operations with Authorization
  - [ ] 6.1 Create admin router with nested provider/organization routers
  - [ ] 6.2 Implement admin.providers.list with pagination
  - [ ] 6.3 Create admin.providers.get with full details
  - [ ] 6.4 Implement approve/reject provider procedures
  - [ ] 6.5 Create admin.organizations.list with filters
  - [ ] 6.6 Implement organization approval procedures
  - [ ] 6.7 Create requirements approval sub-router
  - [ ] 6.8 Implement admin override procedure with audit logging
  - [ ] 6.9 Add proper authorization checks for all admin procedures
  - [ ] 6.10 Migrate admin hooks with error handling
  - [ ] 6.11 Test admin workflows with different roles
  - [ ] 6.12 Verify audit trail functionality

- [ ] 7.0 Complete Migration Cleanup and Documentation
  - [ ] 7.1 Create billing router for subscription management
  - [ ] 7.2 Implement profile update and delete procedures
  - [ ] 7.3 Add feature flags for gradual rollout
  - [ ] 7.4 Remove all migrated REST API route files
  - [ ] 7.5 Update CLAUDE.md with tRPC patterns and examples
  - [ ] 7.6 Create migration guide for team reference
  - [ ] 7.7 Set up performance monitoring for tRPC endpoints
  - [ ] 7.8 Run full E2E test suite with Playwright
  - [ ] 7.9 Perform security audit on new endpoints
  - [ ] 7.10 Create rollback plan documentation
  - [ ] 7.11 Update TypeScript configurations if needed
  - [ ] 7.12 Final code review and optimization