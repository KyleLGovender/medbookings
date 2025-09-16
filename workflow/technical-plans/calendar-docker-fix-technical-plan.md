# Technical Plan: Calendar Functionality Docker Environment Fix (v3)

## Root Cause Analysis

### Critical Issues

**1. Hard-coded Provider Reference** ❌
- **Location**: `/availability/page.tsx`
- **Issue**: `providerId="current"` passed to tRPC queries expecting UUIDs
- **Impact**: Complete provider calendar management failure

**2. Missing Development Data** ❌
- **Issue**: Seed file creates only schema data, zero Provider/Availability records
- **Impact**: Guest calendar viewing returns empty results

**3. Docker Environment Gaps** ⚠️
- **Issue**: No automated migration/seeding in Docker startup
- **Impact**: Fresh environments require manual setup

### Current State
```
✅ ProviderType, Service, RequirementType (schema data)
❌ Provider records (ZERO - critical gap)
❌ Availability records (ZERO - blocks booking)
❌ CalculatedAvailabilitySlot (ZERO - no bookable slots)
```

## Solution Architecture

### Phase 1: Critical Fixes (P0)

#### 1.1 Provider Resolution Fix
Replace hard-coded `"current"` with dynamic provider resolution:

```typescript
// BEFORE (Broken)
<ProviderCalendarView providerId="current" />

// AFTER (Fixed)
const ProviderAvailabilityPage = () => {
  const { data: provider, isLoading, error } = useCurrentUserProvider();

  if (isLoading) return <CalendarSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  if (!provider) return <ProviderOnboarding />;

  return <ProviderCalendarView providerId={provider.id} />;
};
```

**Files to Modify**:
- `/app/availability/page.tsx` - Replace hard-coded logic
- `ProviderCalendarView` component - Add null provider handling
- Add `ProviderOnboarding` component

#### 1.2 Development Seed Data
Extend `prisma/seed.ts` with development provider data:

```typescript
export async function seedDevelopmentData() {
  if (process.env.NODE_ENV !== 'development') return;

  // Create 3 sample providers with different types
  const providers = await createSampleProviders();

  // Generate 2 weeks of availability (M-F, 9-17)
  const availability = await generateSampleAvailability(providers);

  // Auto-generate calculated slots from availability
  await generateCalculatedSlots(availability);
}
```

### Phase 2: Docker Environment (P1)

#### 2.1 Docker Migration Automation
Add to `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    command: |
      sh -c "
        npx prisma migrate deploy &&
        npx prisma generate &&
        npx prisma db seed &&
        npm run dev
      "
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16.4
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
```

#### 2.2 Development Scripts
Add to `package.json`:

```json
{
  "scripts": {
    "docker:dev": "docker-compose up",
    "docker:fresh": "docker-compose down -v && docker-compose up --build",
    "docker:seed": "docker-compose exec app npx prisma db seed"
  }
}
```

## Implementation Plan

### Sprint 1 (Week 1) - Critical Fixes
**Days 1-2**: Provider Resolution
- [ ] Replace `"current"` in `/availability/page.tsx`
- [ ] Add provider resolution logic with loading states

**Days 3-4**: Development Seed Data
- [ ] Add sample provider records to seed file
- [ ] Generate sample availability and slots

**Day 5**: Docker Setup
- [ ] Add migration automation to Docker startup
- [ ] Test complete environment initialization

### Sprint 2 (Week 2) - UX Enhancement
**Days 1-3**: Provider Onboarding
- [ ] Create `ProviderOnboarding` component
- [ ] Integration with provider registration flow

**Days 4-5**: Docker Polish
- [ ] Complete docker-compose configuration
- [ ] Add development convenience scripts

## Success Criteria

**Functional**:
- ✅ Provider calendar management works in Docker
- ✅ Guest users can view provider availability/slots
- ✅ Calendar pages load without errors

**Performance**:
- ✅ Docker startup < 30 seconds (including migrations)
- ✅ Calendar queries respond < 500ms

## Risk Mitigation

**Database Migration Safety** (HIGH)
- Use `prisma migrate deploy` (production-safe)
- Test in isolated environments first

**Provider Dependencies** (MEDIUM)
- Add comprehensive onboarding flow
- Provide guest calendar view as fallback

## Key Implementation Details

### Provider Resolution Hook
```typescript
export function useCurrentUserProvider() {
  const { data: session } = useSession();

  return api.providers.getByUserId.useQuery(
    { userId: session?.user?.id ?? '' },
    {
      enabled: !!session?.user?.id,
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  );
}
```

### Sample Availability Generation
```typescript
async function generateSampleAvailability(providers: Provider[]) {
  const availabilityData = [];

  for (const provider of providers) {
    // Generate weekday availability (M-F, 9 AM - 5 PM)
    for (let date = new Date(); date <= addDays(new Date(), 14); date = addDays(date, 1)) {
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        availabilityData.push({
          providerId: provider.id,
          startTime: setHours(date, 9),
          endTime: setHours(date, 17),
          status: AvailabilityStatus.ACCEPTED,
          schedulingRule: SchedulingRule.ON_THE_HALF_HOUR,
          isOnlineAvailable: true,
          billingEntity: BillingEntity.PROVIDER,
          createdById: provider.userId,
        });
      }
    }
  }

  return await prisma.availability.createMany({ data: availabilityData });
}
```

## Next Actions

**Immediate**:
1. Fix Provider Resolution in `/availability/page.tsx`
2. Add development seed data with providers/availability
3. Automate Docker migration/seeding

**Short Term**:
1. Create Provider Onboarding component
2. Complete Docker environment setup
3. Add error boundaries for calendar components
