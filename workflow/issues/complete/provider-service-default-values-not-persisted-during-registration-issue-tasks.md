# Provider Service Default Values Not Persisted During Registration - Task List

## Relevant Files

### ✅ Modified Files

- `/src/features/providers/lib/actions/register-provider.ts` - Updated to extract serviceConfigs and create ServiceAvailabilityConfig records
- `/src/features/providers/components/profile/edit-services.tsx` - Fixed form initialization to use current effective pricing
- `/src/features/providers/components/profile/provider-profile-view.tsx` - Updated to display custom rates with fallback logic
- `/src/features/providers/hooks/use-provider-type-services.ts` - No changes needed (uses enhanced API)
- `/src/features/providers/hooks/use-provider-updates.ts` - No changes needed (uses existing server action)
- `/src/features/providers/lib/actions/update-provider.ts` - Fixed to create/update ServiceAvailabilityConfig instead of modifying Service defaults
- `/src/app/api/providers/[id]/route.ts` - Updated to include availabilityConfigs in provider queries
- `/src/app/api/providers/services/route.ts` - Enhanced to include ServiceAvailabilityConfig data with fallbacks
- `/src/features/providers/lib/helper.ts` - Updated serializer to handle availabilityConfigs and convert Decimal prices
- `/src/features/providers/types/types.ts` - Added serviceConfigs to SerializedProvider and enhanced SerializedService types
- `/e2e/utils/database.ts` - Fixed schema references for e2e cleanup functions

### ✅ Created Files

- `/scripts/migrate-service-configs.sql` - SQL script to identify and migrate missing ServiceAvailabilityConfig records
- `/scripts/migrate-service-configs.ts` - TypeScript migration script with detailed logging and error handling
- `/scripts/MIGRATION-README.md` - Comprehensive migration guide and production deployment instructions

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

- [x] 5.0 Create Data Migration for Existing Providers
  - [x] 5.1 Write SQL script to identify providers missing ServiceAvailabilityConfig records
  - [x] 5.2 Create migration script to generate default configs for existing providers
  - [x] 5.3 Use Service.defaultPrice and Service.defaultDuration as initial values
  - [x] 5.4 Test migration script on development database
  - [x] 5.5 Document migration process and coordinate production deployment
