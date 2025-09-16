# Technical Plan: Calendar Functionality Docker Environment Fix (v2)

## Executive Summary

This plan addresses critical calendar functionality failures in Docker environment through systematic resolution of **architectural design flaws** and **missing development infrastructure**. The plan prioritizes immediate blockers while establishing sustainable development workflows.

## Root Cause Analysis

### Primary Issues Identified

**1. Hard-coded Provider Reference Architecture Flaw** ❌
- **Location**: `/availability/page.tsx`
- **Issue**: `providerId="current"` passed to tRPC queries expecting valid UUIDs
- **Impact**: Complete failure of provider calendar management functionality
- **Severity**: CRITICAL - Blocks all provider calendar operations

**2. Missing Development Data Infrastructure** ❌
- **Issue**: Seed file creates only schema/lookup data, zero Provider/Availability records
- **Impact**: Guest calendar viewing returns empty results, no bookable slots
- **Severity**: CRITICAL - Blocks all guest calendar functionality

**3. Incomplete Docker Development Environment** ⚠️
- **Issue**: No automated migration/seeding in Docker startup workflow
- **Impact**: Fresh environments require manual setup steps
- **Severity**: HIGH - Degrades development experience

### Investigation Findings

**Seed Data Analysis**:
```
✅ ProviderType (7 healthcare types)
✅ Service (10+ services with proper configuration)
✅ RequirementType (compliance configurations)
❌ Provider records (ZERO - critical gap)
❌ Availability records (ZERO - blocks booking)
❌ CalculatedAvailabilitySlot (ZERO - no bookable slots)
```

**Code Architecture Review**:
```
✅ Calendar components are production-ready and well-architected
✅ tRPC procedures properly structured with comprehensive validation
✅ Error handling exists but bypassed by hard-coded values
❌ Provider resolution logic missing at page level
❌ Graceful degradation not implemented for missing providers
```

**Docker Environment Assessment**:
```
✅ PostgreSQL 16.4 configuration functional
✅ Environment variables properly structured
❌ Database initialization/migration automation missing
❌ Application service container not configured
❌ Development convenience tooling absent
```

## Technical Solution Architecture

### Phase 1: Critical Functionality Restoration (P0)

#### 1.1 Provider Resolution System Implementation
**Target**: Replace hard-coded `"current"` with dynamic provider resolution

**Implementation Strategy**:
```typescript
// BEFORE (Broken)
<ProviderCalendarView providerId="current" />

// AFTER (Fixed)
const ProviderAvailabilityPage = () => {
  const { data: currentProvider, isLoading, error } = useCurrentUserProvider();

  if (isLoading) return <CalendarSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  if (!currentProvider) return <ProviderOnboarding />;

  return <ProviderCalendarView providerId={currentProvider.id} />;
};
```

**Components to Modify**:
1. `/app/availability/page.tsx` - Replace hard-coded logic with provider resolution
2. `ProviderCalendarView` component - Add null provider handling
3. Add `ProviderOnboarding` component for users without provider profiles

#### 1.2 Development Seed Data Enhancement
**Target**: Create comprehensive seed data for full feature testing

**Seed Data Structure**:
```typescript
// Enhanced seed data requirements
interface DevSeedData {
  providers: {
    count: 3;
    types: ['General Practitioner', 'Specialist', 'Therapist'];
    availability: 'Generate 2 weeks future availability';
    services: 'Link to existing Service records';
  };
  availability: {
    patterns: ['Daily 9-17', 'MWF 8-16', 'Custom schedules'];
    status: 'Mix of ACCEPTED/PENDING for testing';
    recurrence: 'Include recurring patterns';
  };
  calculatedSlots: {
    generation: 'Auto-generate from availability + services';
    status: 'Include AVAILABLE/BOOKED/BLOCKED for testing';
  };
}
```

**Implementation Files**:
- Extend existing `prisma/seed.ts` with development provider data
- Add environment flag `NODE_ENV=development` conditional seeding
- Maintain production seed integrity (schema-only data)

### Phase 2: Docker Environment Completion (P1)

#### 2.1 Docker Migration Automation
**Target**: Ensure consistent database state in all Docker environments

**Docker Compose Enhancement**:
```yaml
# Enhanced docker-compose.yml structure
services:
  app:
    build: .
    ports: ["3000:3000"]
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - NODE_ENV=development
    command: |
      sh -c "
        npx prisma migrate deploy &&
        npx prisma generate &&
        npx prisma db seed &&
        npm run dev
      "

  postgres:
    image: postgres:16.4
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

**Migration Safety**:
- Use `prisma migrate deploy` for production-safe migration application
- Add database backup before migrations in production environments
- Implement migration rollback procedures

#### 2.2 Development Tooling Integration
**Target**: Streamline development workflow with Docker

**Convenience Scripts**:
```bash
# package.json scripts addition
{
  "scripts": {
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:fresh": "docker-compose down -v && docker-compose up --build",
    "docker:seed": "docker-compose exec app npx prisma db seed",
    "docker:reset": "docker-compose exec app npx prisma migrate reset --skip-generate"
  }
}
```

### Phase 3: User Experience Enhancement (P1-P2)

#### 3.1 Provider Onboarding Flow
**Target**: Guide users without provider profiles through proper setup

**Component Implementation**:
```typescript
// ProviderOnboarding component structure
interface ProviderOnboardingProps {
  onboardingType: 'individual' | 'organization' | 'guest';
  redirectAfterSetup?: string;
}

const ProviderOnboarding: React.FC<ProviderOnboardingProps> = ({
  onboardingType,
  redirectAfterSetup = '/availability'
}) => {
  // Implementation for guiding users through provider setup
  // Links to existing provider registration flows
  // Clear explanation of calendar functionality requirements
};
```

#### 3.2 Error Boundary Enhancement
**Target**: Prevent cascade failures and provide recovery options

**Error Handling Strategy**:
```typescript
// Calendar-specific error boundary
class CalendarErrorBoundary extends ErrorBoundary {
  static getDerivedStateFromError(error: Error) {
    // Handle specific calendar errors
    if (error.message.includes('Provider not found')) {
      return {
        errorType: 'MISSING_PROVIDER',
        recovery: 'provider-onboarding'
      };
    }

    if (error.message.includes('Calendar data')) {
      return {
        errorType: 'DATA_LOAD_ERROR',
        recovery: 'retry-with-fallback'
      };
    }

    return { errorType: 'UNKNOWN', recovery: 'full-reload' };
  }
}
```

## Implementation Roadmap

### Sprint 1: Critical Fixes (Week 1)
**P0 - Unblock all calendar functionality**

**Day 1-2**: Provider Resolution System
- [ ] Replace hard-coded `"current"` in `/availability/page.tsx`
- [ ] Add proper provider resolution logic with loading states
- [ ] Implement graceful handling for missing providers

**Day 3-4**: Development Seed Data
- [ ] Extend seed file with sample provider records
- [ ] Generate sample availability spanning 2 weeks
- [ ] Create calculated slots for booking simulation

**Day 5**: Docker Migration Setup
- [ ] Add automated migration to Docker startup
- [ ] Test complete Docker environment initialization
- [ ] Validate both provider and guest calendar functionality

### Sprint 2: User Experience (Week 2)
**P1 - Improve user experience and development workflow**

**Day 1-3**: Provider Onboarding
- [ ] Create `ProviderOnboarding` component
- [ ] Integrate with existing provider registration flows
- [ ] Add clear messaging about calendar functionality requirements

**Day 4-5**: Docker Environment Completion
- [ ] Add application service to docker-compose.yml
- [ ] Implement convenience scripts for development
- [ ] Add comprehensive Docker documentation

### Sprint 3: Polish & Documentation (Week 3)
**P2 - Developer experience and long-term maintainability**

**Day 1-2**: Error Handling Enhancement
- [ ] Implement calendar-specific error boundaries
- [ ] Add recovery mechanisms for common failure scenarios
- [ ] Improve error messaging and user guidance

**Day 3-5**: Documentation & Testing
- [ ] Complete Docker setup documentation
- [ ] Create troubleshooting guide for common issues
- [ ] Add integration tests for calendar functionality in Docker

## Risk Assessment & Mitigation

### Critical Risks

**Database Migration Safety** (HIGH)
- **Risk**: Migration errors could corrupt existing data
- **Mitigation**: Use `migrate deploy` (production-safe), test in isolated environments
- **Rollback Plan**: Maintain database backups before migrations

**Provider Data Dependencies** (MEDIUM)
- **Risk**: Calendar functionality inherently requires provider association
- **Mitigation**: Comprehensive onboarding flow, clear user messaging
- **Fallback**: Guest calendar view for discovery (no provider required)

### Development Risks

**Docker Performance** (LOW)
- **Risk**: Additional services may slow container startup
- **Mitigation**: Multi-stage builds, optimized layer caching
- **Target**: < 30 second startup including migrations

**Seed Data Complexity** (LOW)
- **Risk**: Complex seed data may cause maintenance issues
- **Mitigation**: Environment-conditional seeding, clear data separation
- **Monitoring**: Regular validation of seed data integrity

## Success Metrics

### Functional Validation
```
✅ Provider calendar management works end-to-end in Docker
✅ Guest users can view provider availability and bookable slots
✅ Calendar pages load without errors in fresh Docker environment
✅ All tRPC procedures return valid data for both scenarios
```

### Performance Benchmarks
```
✅ Docker startup time < 30 seconds (including migrations)
✅ Calendar queries respond < 500ms
✅ No memory leaks in long-running containers
✅ Database connection pool remains stable
```

### Developer Experience
```
✅ One-command Docker environment setup
✅ Clear error messages guide users through common issues
✅ Comprehensive documentation for troubleshooting
✅ Streamlined development workflow with hot reloading
```

## Technical Implementation Details

### Provider Resolution Implementation
```typescript
// Enhanced provider resolution hook
export function useCurrentUserProvider() {
  const { data: session } = useSession();

  return api.providers.getByUserId.useQuery(
    { userId: session?.user?.id ?? '' },
    {
      enabled: !!session?.user?.id,
      retry: false, // Don't retry if provider doesn't exist
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );
}

// Calendar page implementation
export default function ProviderAvailabilityPage() {
  const { data: provider, isLoading, error } = useCurrentUserProvider();
  const { data: session } = useSession();

  // Handle loading state
  if (isLoading) {
    return <CalendarSkeleton />;
  }

  // Handle authentication
  if (!session) {
    return <AuthenticationRequired />;
  }

  // Handle no provider profile
  if (!provider && !error) {
    return <ProviderOnboarding redirectAfterSetup="/availability" />;
  }

  // Handle errors
  if (error) {
    return <CalendarErrorBoundary error={error} />;
  }

  // Success case - provider exists
  return (
    <CalendarErrorBoundary>
      <ProviderCalendarView
        providerId={provider.id}
        onCreateAvailability={() => {/* existing logic */}}
        // ... other props
      />
    </CalendarErrorBoundary>
  );
}
```

### Enhanced Seed Data Structure
```typescript
// Extended seed.ts implementation
export async function seedDevelopmentData() {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('🌱 Seeding development data...');

  // Create sample users
  const users = await createSampleUsers();

  // Create sample providers with different types
  const providers = await createSampleProviders(users);

  // Generate availability for next 2 weeks
  const availability = await generateSampleAvailability(providers);

  // Generate calculated slots from availability
  await generateCalculatedSlots(availability);

  console.log('✅ Development seed complete');
}

async function generateSampleAvailability(providers: Provider[]) {
  const startDate = new Date();
  const endDate = addDays(startDate, 14);

  const availabilityData = [];

  for (const provider of providers) {
    // Generate weekday availability (9 AM - 5 PM)
    for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
      if (date.getDay() >= 1 && date.getDay() <= 5) { // Monday-Friday
        availabilityData.push({
          providerId: provider.id,
          startTime: setHours(date, 9),
          endTime: setHours(date, 17),
          status: AvailabilityStatus.ACCEPTED,
          isRecurring: false,
          schedulingRule: SchedulingRule.ON_THE_HALF_HOUR,
          isOnlineAvailable: true,
          requiresConfirmation: false,
          billingEntity: BillingEntity.PROVIDER,
          createdById: provider.userId,
          isProviderCreated: true,
        });
      }
    }
  }

  return await prisma.availability.createMany({
    data: availabilityData,
  });
}
```

## Next Actions

### Immediate (This Sprint)
1. **Fix Provider Resolution** - Update `/availability/page.tsx` to use dynamic provider resolution
2. **Enhance Seed Data** - Add development provider/availability records to seed file
3. **Docker Migration** - Automate migration/seeding in Docker startup

### Short Term (Next Sprint)
1. **Provider Onboarding** - Create user-friendly flow for provider profile creation
2. **Error Boundaries** - Add robust error handling for calendar components
3. **Docker Polish** - Complete application containerization with convenience scripts

### Long Term (Future Sprints)
1. **Advanced Calendar Features** - Public provider discovery, advanced search/filtering
2. **Performance Optimization** - Calendar query optimization, caching strategies
3. **Integration Testing** - Comprehensive Docker environment testing suite

---

This technical plan builds upon excellent investigation work and provides a comprehensive roadmap for resolving calendar functionality in Docker environments while establishing sustainable development practices.