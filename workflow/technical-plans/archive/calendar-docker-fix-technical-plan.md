# Technical Plan: Calendar Functionality Docker Environment Fix

## Problem Analysis

### Root Cause Identification (UPDATED)
After investigating the existing seed file and application behavior, the calendar functionality fails in Docker due to **architectural design issues**, not missing seed data:

1. **Hard-coded Provider Reference**: Calendar page uses `providerId="current"` which is NOT a valid provider ID
2. **No Provider Resolution Logic**: The string "current" is passed directly to tRPC queries expecting valid UUIDs
3. **Missing Error Boundaries**: Calendar components crash instead of handling missing provider gracefully
4. **Incomplete Seed File**: While seed file exists, it only creates `ProviderTypes`, `Services`, and `RequirementTypes` - **NO actual Provider records**

### Key Findings from Investigation

**Seed File Analysis** ✅:
- Comprehensive seed data for `ProviderType` (7 healthcare types)
- Complete `Service` definitions (10+ services)
- Detailed `RequirementType` configurations for compliance
- ❌ **ZERO actual Provider records** - only creates schema/lookup data

**Calendar System Behavior** 🔍:
- `useProviderByUserId()` hook has `retry: false` - expects provider to not exist
- `useCurrentUserProvider()` chain gracefully handles missing providers
- ❌ Calendar page bypasses this graceful handling with hard-coded "current"

**Production Behavior Without Providers** 🔍:
- Application has comprehensive unauthorized access handling
- `/unauthorized` page handles `provider_access` case specifically
- System expects new users to not have provider profiles initially

### Technical Investigation Summary

**Docker Configuration Issues:**
- ✅ Docker Compose setup is minimal but functional (PostgreSQL 16.4)
- ✅ Environment variables are properly configured (.env has correct structure)
- ❌ **Critical**: No database initialization or seeding in Docker workflow

**Database State Issues:**
- ✅ Prisma schema includes all calendar tables (7 models)
- ❌ **Critical**: No migrations run automatically in Docker
- ❌ **Critical**: No seed data for development environment
- ❌ **Critical**: Empty database = no providers = no calendar functionality

**Code Architecture Issues:**
- ✅ Calendar components are well-implemented and production-ready
- ✅ tRPC procedures are properly structured
- ❌ **Critical**: Hard-coded `providerId="current"` in `/availability/page.tsx`
- ❌ **Critical**: No fallback handling for missing provider data

## Technical Solution Architecture (REVISED)

### Phase 1: Fix Hard-coded Provider ID Resolution (CRITICAL)
**Goal**: Replace invalid "current" string with proper provider resolution logic

**Root Issue**: `/availability/page.tsx` passes `providerId="current"` which fails all tRPC queries

**Components to Fix:**
1. **Calendar Page Logic Enhancement**
   - Replace `<ProviderCalendarView providerId="current" />` with dynamic resolution
   - Use `useCurrentUserProvider()` hook to get actual provider ID
   - Add loading states while provider data resolves

2. **Provider Resolution Flow**
   - If user has provider → use provider.id
   - If user has no provider → redirect to provider setup or show onboarding
   - If guest user → redirect to login or show public calendar view

3. **Calendar Component Updates**
   - Update `ProviderCalendarView` to handle `undefined` providerId gracefully
   - Add proper error boundaries for missing provider scenarios
   - Add fallback UI for users without provider profiles

### Phase 2: Docker Environment Completion (HIGH PRIORITY)
**Goal**: Ensure Docker environment runs migrations and seeds properly

**Current State**: Docker only runs PostgreSQL, no migration/seeding automation

**Components to Add:**
1. **Docker Migration Strategy**
   - Add migration run to Docker startup (existing seed file is adequate)
   - Generate Prisma client automatically
   - Current seed provides sufficient schema/lookup data

2. **Development Provider Creation**
   - Add optional development seed for sample provider records
   - Include sample availability and bookings for testing
   - Keep existing schema-only seed as base

3. **Docker Compose Enhancement**
   - Add application service to docker-compose.yml
   - Configure proper service dependencies and health checks
   - Add development environment convenience scripts

### Phase 3: User Experience Enhancement (MEDIUM PRIORITY)
**Goal**: Improve experience for users without provider profiles

**Components to Add:**
1. **Provider Onboarding Flow**
   - Add "Create Provider Profile" flow for calendar access
   - Clear messaging about provider requirement for calendar features
   - Link to provider registration from calendar pages

2. **Public Calendar Views** (Future Enhancement)
   - Allow guest users to view provider availability (without "current" dependency)
   - Implement proper provider selection for public booking flow
   - Add search/filter capabilities for provider discovery

## Implementation Priority

### P0 (Critical - Blocks all calendar functionality)
1. **Provider Resolution Fix**: Fix hard-coded `providerId="current"` in calendar page
2. **Calendar Component Resilience**: Add proper null/undefined provider handling
3. **Docker Migration Setup**: Ensure migrations run on Docker startup

### P1 (High - User experience)
1. **Provider Onboarding Flow**: Guide users without providers to registration
2. **Error Boundaries**: Add calendar-specific error handling
3. **Docker Environment**: Complete application containerization

### P2 (Medium - Developer experience)
1. **Development Seed Data**: Add optional sample provider records for testing
2. **Development Scripts**: Add Docker convenience commands
3. **Documentation**: Complete Docker setup and troubleshooting guides

## Risk Assessment

### High Risk
- **Database State Corruption**: Improper migration could break existing data
  - *Mitigation*: Use `migrate deploy` for production-safe migrations
  - *Mitigation*: Test all changes in isolated Docker environment

### Medium Risk
- **Provider Data Requirements**: Calendar requires provider association
  - *Mitigation*: Add clear user onboarding flow
  - *Mitigation*: Support guest/public calendar views where appropriate

### Low Risk
- **Docker Performance**: Additional services may slow container startup
  - *Mitigation*: Optimize Docker layer caching
  - *Mitigation*: Use multi-stage builds for faster rebuilds

## Success Criteria

### Functional Requirements
1. ✅ Calendar pages load without errors in Docker environment
2. ✅ Provider availability configuration works end-to-end
3. ✅ Guest users can view provider availability
4. ✅ Provider availability editing/deletion functions properly

### Technical Requirements
1. ✅ Docker containers start successfully with complete database
2. ✅ All calendar tRPC procedures return valid data
3. ✅ Error handling prevents crashes for edge cases
4. ✅ Development workflow is streamlined and documented

### Performance Requirements
1. ✅ Docker startup time < 30 seconds including migrations
2. ✅ Calendar queries respond within 500ms
3. ✅ No memory leaks or connection issues in long-running containers

## Next Steps for Implementation

1. **Start with Database Migration Fix** - This unblocks all other functionality
2. **Fix Provider Resolution** - This enables basic calendar functionality
3. **Add Comprehensive Seed Data** - This enables full feature testing
4. **Enhance Error Handling** - This improves user experience
5. **Complete Docker Configuration** - This streamlines development workflow

## Investigation Results: Guest Calendar Viewing in Docker

### **Guest Viewing Analysis** 🔍

**Route Implementation**: `/calendar/[id]` → `ProviderCalendarSlotView`
- ✅ **Public Route Works**: Takes actual provider ID from URL params
- ✅ **Public tRPC Procedures**: `getProviderSlots` and `providers.getById` are `publicProcedure`
- ✅ **No "current" Dependency**: Uses real provider ID from URL

**Data Dependencies Chain**:
1. **Provider Record**: `api.providers.getById` needs actual `Provider` record
2. **Availability Records**: `api.calendar.getProviderSlots` queries `Availability` with `status: ACCEPTED`
3. **Calculated Slots**: Queries `CalculatedAvailabilitySlot` generated from availability
4. **Service Data**: Includes `Service` information for pricing/duration

**Critical Gap Found** ❌:
```typescript
// getProviderSlots queries:
availability: {
  status: AvailabilityStatus.ACCEPTED, // Only shows accepted availability
}
```

### **Docker Environment Impact**

**Current Seed Data**:
- ✅ Creates `ProviderType`, `Service`, `RequirementType`
- ❌ **NO Provider records**
- ❌ **NO Availability records**
- ❌ **NO CalculatedAvailabilitySlot records**

**Result**: Guest viewing will **fail in Docker** because:
1. No `Provider` records exist → `providers.getById` returns null
2. No `Availability` records exist → `getProviderSlots` returns empty array
3. Empty calendar view with no bookable slots

## Revised Conclusion

This technical plan now addresses **both major calendar functionality gaps**:

### **Issue 1: Provider Calendar Management** (Originally identified)
- **Problem**: `providerId="current"` in `/availability/page.tsx`
- **Impact**: Providers cannot manage their availability
- **Fix**: Replace with dynamic provider resolution

### **Issue 2: Guest Calendar Viewing** (Newly identified)
- **Problem**: No seed data for actual Provider/Availability/Slot records
- **Impact**: Guest users see empty calendars (no bookable slots)
- **Fix**: Add development seed data with sample providers and availability

**Priority Fixes**:
1. **P0**: Fix hard-coded "current" provider ID (enables provider management)
2. **P0**: Add seed data with sample providers and availability (enables guest viewing)
3. **P1**: Complete Docker migration automation
4. **P1**: Add provider onboarding flow