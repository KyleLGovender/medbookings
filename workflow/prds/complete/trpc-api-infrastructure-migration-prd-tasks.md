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

- [x] 1.0 Set up tRPC Infrastructure and Core Configuration
  - [x] 1.1 Install tRPC dependencies (@trpc/server, @trpc/client, @trpc/react-query, @trpc/next, superjson)
  - [x] 1.2 Create src/server/trpc.ts with context, middleware, and authentication procedures
  - [x] 1.3 Implement getCurrentUser() integration in tRPC context
  - [x] 1.4 Set up role-based middleware (publicProcedure, protectedProcedure, adminProcedure)
  - [x] 1.5 Create src/app/api/trpc/[trpc]/route.ts for Next.js App Router integration
  - [x] 1.6 Configure src/utils/api.ts with tRPC client and TanStack Query
  - [x] 1.7 Update src/components/providers.tsx to include tRPC provider
  - [x] 1.8 Create src/server/api/root.ts with empty router structure
  - [x] 1.9 Set up error formatting with Zod integration
  - [x] 1.10 Configure development error logging and tRPC panel

- [x] 2.0 Migrate Basic Routes and Simple GET Endpoints
  - [x] 2.1 Create providers router with getProviderTypes procedure
  - [x] 2.2 Migrate /api/providers/requirement-types to api.providers.getRequirementTypes
  - [x] 2.3 Migrate /api/providers/services to api.providers.getServices
  - [x] 2.4 Create calendar router with getServiceTypes procedure
  - [x] 2.5 Create profile router and migrate GET /api/profile
  - [x] 2.6 Create debug router for /api/debug-session endpoint
  - [x] 2.7 Create invitations router for token validation
  - [x] 2.8 Update all corresponding hooks to use tRPC queries
  - [x] 2.9 Test each migrated endpoint for type safety
  - [ ] 2.10 Remove old REST API route files for migrated endpoints (INCOMPLETE: Many legacy routes still exist)

- [ ] 3.0 Migrate Provider Domain CRUD Operations and Hooks
  - [x] 3.1 Implement providers.list query with search and filtering
  - [x] 3.2 Create providers.create mutation using registerProvider action
  - [x] 3.3 Implement providers.get query with relations
  - [x] 3.4 Create providers.update mutation with form data conversion
  - [x] 3.5 Implement providers.delete mutation
  - [ ] 3.6 Migrate updateBasicInfo procedure with validation (LEGACY: /api/providers/[id]/basic-info still exists)
  - [x] 3.7 Implement services management procedures (get/update)
  - [x] 3.8 Create requirements submission procedures
  - [x] 3.9 Migrate all provider hooks (useProviders, useProvider, etc.)
  - [x] 3.10 Implement optimistic updates for provider mutations
  - [ ] 3.11 Add provider connections sub-router (LEGACY: /api/providers/connections/* still exists)
  - [x] 3.12 Test provider domain end-to-end flows
  - [ ] 3.13 Migrate provider onboarding endpoint (LEGACY: /api/providers/onboarding still exists)
  - [ ] 3.14 Migrate provider invitations endpoints (LEGACY: /api/providers/invitations/* still exists)
  - [ ] 3.15 Migrate getByUserId endpoint (LEGACY: /api/providers/user/[userId] still exists)

- [ ] 4.0 Migrate Organization Domain CRUD Operations and Hooks
  - [x] 4.1 Implement organizations.list with filtering
  - [x] 4.2 Create organizations.create mutation with validation
  - [x] 4.3 Implement organizations.get with includes
  - [x] 4.4 Create organizations.update mutation
  - [x] 4.5 Implement organizations.delete mutation
  - [x] 4.6 Create locations sub-router (get/add/update/delete)
  - [ ] 4.7 Implement billing sub-router procedures (LEGACY: /api/organizations/[id]/billing still exists)
  - [x] 4.8 Create provider connections management procedures (LIST/CREATE only - UPDATE/DELETE still legacy)
  - [x] 4.9 Implement provider invitations procedures (LIST/CREATE only - UPDATE/DELETE still legacy)
  - [x] 4.10 Migrate all organization hooks to tRPC
  - [x] 4.11 Add getByUserId procedures for user lookups
  - [x] 4.12 Test organization workflows with authorization
  - [ ] 4.13 Migrate provider connection update/delete endpoints (LEGACY: /api/organizations/[id]/provider-connections/[connectionId] still exists)
  - [ ] 4.14 Migrate provider invitation update/delete/resend endpoints (LEGACY: /api/organizations/[id]/provider-invitations/[invitationId]/* still exists)

- [ ] 5.0 Migrate Calendar Domain Complex Operations and Search
  - [x] 5.1 Create calendar.createAvailability with complex validation
  - [x] 5.2 Implement updateAvailability with business rules
  - [x] 5.3 Create deleteAvailability with cascade handling
  - [x] 5.4 Implement accept/reject/cancel availability procedures
  - [x] 5.5 Create getAvailability and listAvailabilities queries
  - [x] 5.6 Implement searchSlots with performance optimization
  - [x] 5.7 Create searchProviders with filtering logic
  - [x] 5.8 Implement searchServices procedure
  - [ ] 5.9 Add geocode procedure for location services (LEGACY: /api/calendar/availability/geocode still exists)
  - [ ] 5.10 Create performance recommendations query (LEGACY: /api/calendar/availability/performance/recommendations still exists)
  - [x] 5.11 Migrate all calendar hooks with caching strategies
  - [x] 5.12 Test complex calendar workflows and search

- [x] 6.0 Migrate Admin Domain Operations with Authorization
  - [x] 6.1 Create admin router with nested provider/organization routers
  - [x] 6.2 Implement admin.providers.list with pagination
  - [x] 6.3 Create admin.providers.get with full details
  - [x] 6.4 Implement approve/reject provider procedures
  - [x] 6.5 Create admin.organizations.list with filters
  - [x] 6.6 Implement organization approval procedures
  - [x] 6.7 Create requirements approval sub-router
  - [x] 6.8 Implement admin override procedure with audit logging
  - [x] 6.9 Add proper authorization checks for all admin procedures
  - [x] 6.10 Migrate admin hooks with error handling
  - [x] 6.11 Test admin workflows with different roles
  - [x] 6.12 Verify audit trail functionality

- [ ] 7.0 Complete Migration Cleanup and Documentation
  - [ ] 7.1 Create billing router for subscription management (MISSING: No billing router exists, /api/subscriptions/* still exists)
  - [ ] 7.2 Implement profile update and delete procedures (INCOMPLETE: Only profile.get exists, missing update/delete)
  - [x] 7.3 Add feature flags for gradual rollout
  - [ ] 7.4 Remove all migrated REST API route files (INCOMPLETE: Many legacy routes still exist)
  - [x] 7.5 Update CLAUDE.md with tRPC patterns and examples
  - [x] 7.6 Create migration guide for team reference
  - [x] 7.7 Set up performance monitoring for tRPC endpoints
  - [x] 7.8 Run full E2E test suite with Playwright
  - [x] 7.9 Perform security audit on new endpoints
  - [x] 7.10 Create rollback plan documentation
  - [x] 7.11 Update TypeScript configurations if needed
  - [x] 7.12 Final code review and optimization

## 📊 Migration Status Summary

### ✅ Fully Migrated Domains
- **Admin** - All admin operations migrated to tRPC (11 procedures)
- **Invitations** - Token validation migrated
- **Debug** - Session endpoint migrated

### 🟡 Partially Migrated Domains  
- **Providers** - Core CRUD migrated, but missing: basic-info updates, onboarding, connections, invitations, getByUserId
- **Organizations** - Core CRUD migrated, but missing: billing, connection/invitation management endpoints
- **Calendar** - Core availability migrated, but missing: geocode, performance recommendations
- **Profile** - Only GET migrated, missing: update, delete

### ❌ Not Started
- **Billing** - No billing router exists, subscription endpoints still in REST

### 🔍 Remaining Legacy API Routes (19 endpoints)
**Provider Domain (7 routes):**
- `/api/providers/onboarding` 
- `/api/providers/[id]/basic-info`
- `/api/providers/user/[userId]`
- `/api/providers/invitations/*`
- `/api/providers/connections/*`

**Organization Domain (4 routes):**
- `/api/organizations/[id]/billing`
- `/api/organizations/[id]/provider-connections/[connectionId]`
- `/api/organizations/[id]/provider-invitations/[invitationId]/*`

**Calendar Domain (2 routes):**
- `/api/calendar/availability/geocode`
- `/api/calendar/availability/performance/recommendations`

**Billing Domain (2 routes):**
- `/api/subscriptions/*`

**Auth/Upload/Webhooks (4 routes - intentionally kept as REST):**
- `/api/auth/*`
- `/api/upload`
- `/api/whatsapp-callback`

### 🎯 Next Priority Actions
1. Create missing billing router with subscription procedures
2. Complete profile router with update/delete procedures
3. Migrate remaining provider domain endpoints
4. Migrate remaining organization billing/management endpoints
5. Migrate remaining calendar utility endpoints
6. Remove legacy route files after tRPC migration confirmed working
