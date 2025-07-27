# tRPC API Infrastructure Migration - Product Requirements Document v2.0

## Introduction/Overview

This PRD outlines the complete migration of MedBookings' existing REST API infrastructure to tRPC (TypeScript Remote Procedure Call). The migration addresses critical issues with type safety, manual API route creation, and lack of runtime validation that are slowing down development velocity and introducing bugs in the medical booking platform.

Based on comprehensive codebase analysis, this migration will replace **60 existing API routes** with type-safe tRPC procedures, providing end-to-end type safety from database to frontend, automatic runtime validation, and significantly improved developer experience.

## Goals

1. **Eliminate Type Mismatches**: Achieve 100% type safety between API responses and frontend consumption
2. **Remove Manual API Route Creation**: Replace REST endpoints with auto-generated type-safe procedures
3. **Add Runtime Validation**: Implement automatic input/output validation using existing Zod schemas
4. **Improve Developer Velocity**: Reduce time spent on API-related debugging and maintenance by 70%
5. **Maintain System Performance**: Ensure no degradation in API response times
6. **Complete Migration**: Migrate all 60 endpoints within 14-20 days
7. **Preserve Business Logic**: Leverage existing server actions as tRPC procedure implementations

## User Stories

### Developer Experience Stories
- **As a developer**, I want automatic type checking between API and frontend so that I catch type errors at compile time
- **As a developer**, I want automatic input validation so that I don't have to write manual validation logic
- **As a developer**, I want IntelliSense for all API calls so that I can develop faster with confidence
- **As a developer**, I want to refactor types and get compile errors everywhere they're used so that changes are safe
- **As a developer**, I want to reuse existing server actions so that business logic remains unchanged

### Business Logic Stories
- **As a developer**, I want to maintain all existing business logic during migration so that no functionality is lost
- **As a developer**, I want consistent error handling across all procedures so that debugging is easier
- **As a developer**, I want to preserve all authentication and authorization patterns so that security is maintained
- **As a developer**, I want to maintain the feature-based architecture so that code organization stays consistent

## Functional Requirements

### Core Infrastructure Requirements

1. **tRPC Server Configuration**
   ```typescript
   // src/server/trpc.ts
   - Initialize tRPC with superjson transformer
   - Create context with getCurrentUser() and prisma
   - Set up error formatting with Zod integration
   - Configure request batching
   ```

2. **Authentication Middleware**
   ```typescript
   - publicProcedure: No auth required
   - protectedProcedure: User must be authenticated
   - adminProcedure: User must have ADMIN or SUPER_ADMIN role
   - Custom role-based procedures as needed
   ```

3. **Router Architecture**
   ```typescript
   // src/server/api/root.ts
   - Feature-based router organization
   - Sub-routers for complex domains
   - Type-safe router composition
   ```

4. **Next.js App Router Integration**
   ```typescript
   // src/app/api/trpc/[trpc]/route.ts
   - HTTP handler for tRPC requests
   - Proper context creation
   - Error handling
   ```

5. **Client Configuration**
   ```typescript
   // src/utils/api.ts
   - tRPC client with TanStack Query
   - Automatic request batching
   - Error retry logic
   - Authentication headers
   ```

6. **Development Tools**
   - tRPC panel for API debugging
   - Type generation scripts
   - Migration validation tools

### Migration Requirements by Phase

#### Phase 1: Infrastructure & Basic Routes (Days 1-3, 12 routes)
1. **Install dependencies**: @trpc/server, @trpc/client, @trpc/next, @trpc/react-query, superjson
2. **Set up base infrastructure**: trpc.ts, context, middleware, error handling
3. **Configure Next.js integration**: App Router handler
4. **Set up client**: TanStack Query integration
5. **Migrate simple GET endpoints**:
   - `/api/providers/provider-types` → `api.providers.getProviderTypes`
   - `/api/providers/requirement-types` → `api.providers.getRequirementTypes`
   - `/api/providers/services` → `api.providers.getServices`
   - `/api/calendar/availability/service-types` → `api.calendar.getServiceTypes`
   - `/api/profile` → `api.profile.get`
   - `/api/debug-session` → `api.debug.session`
   - `/api/invitations/[token]/validate` → `api.invitations.validate`

#### Phase 2: CRUD Operations (Days 4-7, 20 routes)
6. **Provider CRUD**:
   - GET/POST `/api/providers` → `api.providers.list`, `api.providers.create`
   - GET/PATCH/DELETE `/api/providers/[id]` → `api.providers.get`, `api.providers.update`, `api.providers.delete`
   - PATCH `/api/providers/[id]/basic-info` → `api.providers.updateBasicInfo`
   - GET/POST `/api/providers/[id]/services` → `api.providers.getServices`, `api.providers.updateServices`
   - GET/POST `/api/providers/[id]/requirements` → `api.providers.getRequirements`, `api.providers.submitRequirements`

7. **Organization CRUD**:
   - GET/POST `/api/organizations` → `api.organizations.list`, `api.organizations.create`
   - GET/PATCH/DELETE `/api/organizations/[id]` → `api.organizations.get`, `api.organizations.update`, `api.organizations.delete`
   - GET/POST `/api/organizations/[id]/locations` → `api.organizations.getLocations`, `api.organizations.addLocation`
   - GET/PATCH `/api/organizations/[id]/billing` → `api.organizations.getBilling`, `api.organizations.updateBilling`

8. **Profile Management**:
   - PATCH/DELETE `/api/profile` → `api.profile.update`, `api.profile.delete`
   - GET `/api/providers/user/[userId]` → `api.providers.getByUserId`
   - GET `/api/organizations/user/[userId]` → `api.organizations.getByUserId`

#### Phase 3: Complex Business Logic (Days 8-12, 20 routes)
9. **Calendar Operations**:
   - POST `/api/calendar/availability/create` → `api.calendar.createAvailability`
   - PATCH `/api/calendar/availability/update` → `api.calendar.updateAvailability`
   - DELETE `/api/calendar/availability/delete` → `api.calendar.deleteAvailability`
   - POST `/api/calendar/availability/accept` → `api.calendar.acceptAvailability`
   - POST `/api/calendar/availability/reject` → `api.calendar.rejectAvailability`
   - POST `/api/calendar/availability/cancel` → `api.calendar.cancelAvailability`
   - GET `/api/calendar/availability/[id]` → `api.calendar.getAvailability`
   - GET `/api/calendar/availability` → `api.calendar.listAvailabilities`

10. **Search Endpoints**:
    - GET `/api/calendar/availability/search/slots` → `api.calendar.searchSlots`
    - GET `/api/calendar/availability/search/providers` → `api.calendar.searchProviders`
    - GET `/api/calendar/availability/search/services` → `api.calendar.searchServices`

11. **Connection Management**:
    - GET/POST `/api/providers/connections` → `api.providers.connections.list`, `api.providers.connections.create`
    - PATCH/DELETE `/api/providers/connections/[connectionId]` → `api.providers.connections.update`, `api.providers.connections.delete`
    - GET/POST `/api/organizations/[id]/provider-connections` → `api.organizations.providerConnections.list`, `api.organizations.providerConnections.create`

#### Phase 4: Admin Operations (Days 13-16, 8 routes)
12. **Admin Provider Management**:
    - GET `/api/admin/providers` → `api.admin.providers.list`
    - GET `/api/admin/providers/[id]` → `api.admin.providers.get`
    - POST `/api/admin/providers/[id]/approve` → `api.admin.providers.approve`
    - POST `/api/admin/providers/[id]/reject` → `api.admin.providers.reject`

13. **Admin Organization Management**:
    - GET `/api/admin/organizations` → `api.admin.organizations.list`
    - GET `/api/admin/organizations/[id]` → `api.admin.organizations.get`
    - POST `/api/admin/organizations/[id]/approve` → `api.admin.organizations.approve`
    - POST `/api/admin/organizations/[id]/reject` → `api.admin.organizations.reject`

14. **Admin Requirements**:
    - POST `/api/admin/providers/[id]/requirements/[requirementId]/approve` → `api.admin.requirements.approve`
    - POST `/api/admin/providers/[id]/requirements/[requirementId]/reject` → `api.admin.requirements.reject`

15. **Admin Override**:
    - POST `/api/admin/override` → `api.admin.override`

#### Phase 5: Special Cases & Cleanup (Days 17-20)
16. **Keep as REST APIs** (not migrated):
    - `/api/auth/[...nextauth]` - NextAuth handlers
    - `/api/upload` - File upload with multipart
    - `/api/whatsapp-callback` - Webhook with signature validation
    - `/api/auth/google/*` - OAuth callbacks

17. **Additional Endpoints**:
    - GET `/api/calendar/availability/geocode` → `api.calendar.geocode`
    - GET `/api/calendar/availability/performance/recommendations` → `api.calendar.getPerformanceRecommendations`
    - GET/POST `/api/subscriptions` → `api.billing.subscriptions.list`, `api.billing.subscriptions.create`
    - GET/PATCH `/api/subscriptions/[id]` → `api.billing.subscriptions.get`, `api.billing.subscriptions.update`

### Frontend Integration Requirements

1. **Hook Migration Pattern**:
   ```typescript
   // Before
   const { data } = useQuery({
     queryKey: ['providers'],
     queryFn: () => fetch('/api/providers').then(res => res.json())
   });

   // After
   const { data } = api.providers.list.useQuery();
   ```

2. **Mutation Pattern**:
   ```typescript
   const createProvider = api.providers.create.useMutation({
     onSuccess: () => {
       utils.providers.list.invalidate();
       toast.success('Provider created');
     },
     onError: (error) => {
       toast.error(error.message);
     }
   });
   ```

3. **Optimistic Updates**:
   ```typescript
   const utils = api.useContext();
   const updateProvider = api.providers.update.useMutation({
     onMutate: async (newData) => {
       await utils.providers.get.cancel();
       const previous = utils.providers.get.getData();
       utils.providers.get.setData(undefined, newData);
       return { previous };
     },
     onError: (err, newData, context) => {
       utils.providers.get.setData(undefined, context?.previous);
     },
     onSettled: () => {
       utils.providers.get.invalidate();
     }
   });
   ```

### Type System Compliance

1. **No Barrel Exports**: Direct imports only
   ```typescript
   // ❌ Wrong
   import { ProviderType } from '@/features/providers/types';
   
   // ✅ Correct
   import { ProviderType } from '@/features/providers/types/types';
   ```

2. **Leverage Existing Schemas**:
   ```typescript
   import { providerFormSchema } from '@/features/providers/types/schemas';
   
   export const providersRouter = createTRPCRouter({
     create: protectedProcedure
       .input(providerFormSchema)
       .mutation(async ({ ctx, input }) => {
         // Reuse existing server action
       })
   });
   ```

3. **Type Guards Integration**:
   ```typescript
   import { isValidProvider } from '@/features/providers/types/guards';
   
   .query(async ({ ctx }) => {
     const provider = await getProvider();
     if (!isValidProvider(provider)) {
       throw new TRPCError({ code: 'BAD_REQUEST' });
     }
     return provider;
   })
   ```

## Non-Goals (Out of Scope)

1. **Authentication endpoints migration** - NextAuth OAuth handlers remain as API routes
2. **File upload via tRPC** - Multipart handling stays as REST
3. **Webhook endpoints** - Raw body access required for signature validation
4. **Testing infrastructure rewrite** - Update tests incrementally
5. **Database schema changes** - Only API layer changes
6. **Performance optimization** - Maintain current performance
7. **API versioning** - Complete cutover approach
8. **Backward compatibility** - Frontend updated simultaneously

## Technical Considerations

### Architecture Decisions

1. **Reuse Server Actions**: All existing actions in `/features/*/lib/actions.ts` will be wrapped by tRPC procedures
2. **Maintain Feature Organization**: Router structure mirrors existing feature folders
3. **Authentication Pattern**: Continue using `getCurrentUser()` not `getServerSession()`
4. **Error Handling**: Wrap existing action errors in TRPCError
5. **Type Safety**: Leverage existing Zod schemas for validation

### Migration Patterns

1. **Simple Query Pattern**:
   ```typescript
   getProviderTypes: publicProcedure.query(async ({ ctx }) => {
     return ctx.prisma.providerType.findMany({
       orderBy: { name: 'asc' }
     });
   })
   ```

2. **Mutation with Server Action**:
   ```typescript
   register: protectedProcedure
     .input(providerFormSchema)
     .mutation(async ({ ctx, input }) => {
       const formData = convertToFormData(input);
       const result = await registerProvider({}, formData);
       if (!result.success) {
         throw new TRPCError({ 
           code: 'BAD_REQUEST', 
           message: result.error 
         });
       }
       return result;
     })
   ```

3. **Admin Pattern**:
   ```typescript
   approve: adminProcedure
     .input(z.object({ 
       providerId: z.string(),
       adminNotes: z.string().optional()
     }))
     .mutation(async ({ ctx, input }) => {
       return approveProvider({
         ...input,
         adminUserId: ctx.user.id
       });
     })
   ```

### Performance Considerations

1. **Request Batching**: Enabled by default for multiple queries
2. **Query Deduplication**: Automatic on client side
3. **Response Caching**: Use staleTime and cacheTime appropriately
4. **Selective Includes**: Only fetch required relations
5. **Pagination**: Implement cursor-based pagination for lists

## Success Metrics

### Technical Metrics
1. **100% type coverage** - No `any` types in API layer
2. **Zero runtime type errors** - All validation handled by Zod
3. **60 API routes migrated** successfully
4. **Performance parity** - API response times within 5% of current
5. **Bundle size impact** - Less than 50KB increase

### Developer Experience Metrics
1. **70% reduction** in API-related bug reports
2. **50% faster** feature development involving API changes
3. **95% satisfaction** in developer surveys
4. **Zero manual type synchronization** between frontend and backend

### Business Metrics
1. **No functionality regression** - All features work identically
2. **No security vulnerabilities** - Auth patterns preserved
3. **99.9% uptime** during migration
4. **Zero data loss** incidents

## Risk Mitigation

1. **Feature Flags**: Gradual rollout with ability to switch between old/new APIs
2. **Parallel Running**: Keep old routes active during migration
3. **Comprehensive Testing**: Unit, integration, and E2E tests for each migrated endpoint
4. **Rollback Plan**: Git tags at each phase completion for quick rollback
5. **Monitoring**: Real-time alerts for API errors and performance degradation

## Implementation Timeline

### Week 1 (Days 1-7)
- Infrastructure setup and basic routes
- Simple CRUD operations
- Update corresponding frontend hooks

### Week 2 (Days 8-14)
- Complex business logic migration
- Admin operations
- Search and filtering endpoints

### Week 3 (Days 15-20)
- Special cases and edge scenarios
- Cleanup and optimization
- Documentation and training

## Documentation Requirements

1. **Migration Guide**: Step-by-step instructions for developers
2. **API Reference**: Auto-generated from tRPC routers
3. **Best Practices**: Common patterns and anti-patterns
4. **Troubleshooting**: Common issues and solutions
5. **Performance Guide**: Optimization techniques

## Testing Strategy

1. **Unit Tests**: Each procedure tested in isolation
2. **Integration Tests**: Complete user flows
3. **Type Tests**: Compile-time type checking
4. **Performance Tests**: Response time benchmarks
5. **E2E Tests**: Critical user journeys

## Post-Migration Checklist

- [ ] All 60 routes migrated successfully
- [ ] Frontend hooks updated to use tRPC
- [ ] Old API routes removed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] CLAUDE.md updated with new patterns

This comprehensive PRD addresses all findings from the codebase analysis and provides a clear, actionable plan for migrating MedBookings to tRPC while maintaining all existing functionality and patterns.
