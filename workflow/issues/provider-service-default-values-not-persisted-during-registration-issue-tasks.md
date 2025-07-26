# Provider Service Default Values Not Persisted During Registration - Task List

## Relevant Files

- `/src/features/providers/lib/actions/register-provider.ts` - Server action that handles provider registration (needs to create ServiceAvailabilityConfig records)
- `/src/features/providers/components/profile/edit-services.tsx` - Edit services page component (needs to handle missing configs)
- `/src/features/providers/hooks/use-provider.ts` - Hook for fetching provider data (needs to include ServiceAvailabilityConfig)
- `/src/features/providers/hooks/use-provider-type-services.ts` - Hook for fetching provider services (needs to prioritize configs)
- `/src/features/providers/hooks/use-provider-updates.ts` - Hook for updating provider services (needs ServiceAvailabilityConfig logic)
- `/src/app/api/providers/[id]/route.ts` - API endpoint for provider details (may need updates)
- `/src/features/providers/lib/actions/` - Server actions for provider service operations
- Provider profile display components - Any components showing service pricing/duration

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase
- Database operations use Prisma ORM with PostgreSQL
- Form data structure for service configs needs to match registration expectations

## Tasks

- [x] 1.0 Investigate and Document Current Registration Flow
  - [x] 1.1 Analyze current provider registration form to understand how service price/duration data is collected
  - [x] 1.2 Examine the FormData structure passed to registerProvider server action
  - [x] 1.3 Document what fields are expected vs what is actually processed for service configurations
  - [x] 1.4 Verify the Provider-Service relationship creation in current registration flow
  - [x] 1.5 Identify where service price/duration data is lost in the current flow

- [x] 2.0 Implement ServiceAvailabilityConfig Creation in Registration
  - [x] 2.1 Update registerProvider server action to extract service configuration data from FormData
  - [x] 2.2 Add logic to create ServiceAvailabilityConfig records after Provider creation
  - [x] 2.3 Handle online/in-person availability flags in service configurations
  - [x] 2.4 Implement proper error handling for ServiceAvailabilityConfig creation
  - [x] 2.5 Test registration flow with database verification of created records

- [x] 3.0 Update Provider Display Logic to Use ServiceAvailabilityConfig
  - [x] 3.1 Modify provider detail queries to include ServiceAvailabilityConfig data
  - [x] 3.2 Update useProvider hook to fetch and return service configurations
  - [x] 3.3 Implement fallback logic: ServiceAvailabilityConfig → Service defaults
  - [x] 3.4 Update provider profile display components to use custom pricing/duration
  - [x] 3.5 Modify API endpoints to return ServiceAvailabilityConfig data with proper fallbacks

- [x] 4.0 Fix Edit Services Page to Handle Missing Configurations
  - [x] 4.1 Update useProviderTypeServices hook to handle missing ServiceAvailabilityConfig records
  - [x] 4.2 Implement logic to create default ServiceAvailabilityConfig records when they don't exist
  - [x] 4.3 Fix form initialization in edit-services.tsx to work with both existing and missing configs
  - [x] 4.4 Update useUpdateProviderServices hook to create/update ServiceAvailabilityConfig records
  - [x] 4.5 Ensure proper error handling and loading states for the edit services page

- [ ] 5.0 Create Data Migration for Existing Providers
  - [ ] 5.1 Write SQL script to identify providers missing ServiceAvailabilityConfig records
  - [ ] 5.2 Create migration script to generate default configs for existing providers
  - [ ] 5.3 Use Service.defaultPrice and Service.defaultDuration as initial values
  - [ ] 5.4 Test migration script on development database
  - [ ] 5.5 Document migration process and coordinate production deployment
