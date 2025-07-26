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

- [ ] 1.0 Investigate and Document Current Registration Flow
  - [ ] 1.1 Analyze current provider registration form to understand how service price/duration data is collected
  - [ ] 1.2 Examine the FormData structure passed to registerProvider server action
  - [ ] 1.3 Document what fields are expected vs what is actually processed for service configurations
  - [ ] 1.4 Verify the Provider-Service relationship creation in current registration flow
  - [ ] 1.5 Identify where service price/duration data is lost in the current flow

- [ ] 2.0 Implement ServiceAvailabilityConfig Creation in Registration
  - [ ] 2.1 Update registerProvider server action to extract service configuration data from FormData
  - [ ] 2.2 Add logic to create ServiceAvailabilityConfig records after Provider creation
  - [ ] 2.3 Handle online/in-person availability flags in service configurations
  - [ ] 2.4 Implement proper error handling for ServiceAvailabilityConfig creation
  - [ ] 2.5 Test registration flow with database verification of created records

- [ ] 3.0 Update Provider Display Logic to Use ServiceAvailabilityConfig
  - [ ] 3.1 Modify provider detail queries to include ServiceAvailabilityConfig data
  - [ ] 3.2 Update useProvider hook to fetch and return service configurations
  - [ ] 3.3 Implement fallback logic: ServiceAvailabilityConfig → Service defaults
  - [ ] 3.4 Update provider profile display components to use custom pricing/duration
  - [ ] 3.5 Modify API endpoints to return ServiceAvailabilityConfig data with proper fallbacks

- [ ] 4.0 Fix Edit Services Page to Handle Missing Configurations
  - [ ] 4.1 Update useProviderTypeServices hook to handle missing ServiceAvailabilityConfig records
  - [ ] 4.2 Implement logic to create default ServiceAvailabilityConfig records when they don't exist
  - [ ] 4.3 Fix form initialization in edit-services.tsx to work with both existing and missing configs
  - [ ] 4.4 Update useUpdateProviderServices hook to create/update ServiceAvailabilityConfig records
  - [ ] 4.5 Ensure proper error handling and loading states for the edit services page

- [ ] 5.0 Create Data Migration for Existing Providers
  - [ ] 5.1 Write SQL script to identify providers missing ServiceAvailabilityConfig records
  - [ ] 5.2 Create migration script to generate default configs for existing providers
  - [ ] 5.3 Use Service.defaultPrice and Service.defaultDuration as initial values
  - [ ] 5.4 Test migration script on development database
  - [ ] 5.5 Document migration process and coordinate production deployment
