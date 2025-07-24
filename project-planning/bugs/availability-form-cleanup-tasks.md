# Availability Creation Form Cleanup - Executable Task List

## Overview
This document addresses critical technical debt cleanup for the availability-creation-form.tsx component to establish it as a clean reference pattern for other calendar forms. The component has multiple code quality, performance, and architectural issues that need resolution before it can serve as a reliable template.

## Instructions for Claude Code
- Complete tasks in order of priority
- Mark tasks as completed when finished
- Run tests after each task completion
- Update this file with completion status

## Task 1: Fix Architecture Violations (Prisma Client Import)

**Priority:** Critical (🔴)
**File:** `src/features/calendar/components/availability/availability-creation-form.tsx:6`
**Estimated Time:** 30 minutes

### Problem Description

The component violates CLAUDE.md client/server separation rules by directly importing `Organization` from Prisma client. This creates a dangerous dependency that could break in browser environments.

**Current problematic code:**
```typescript
import { Organization } from '@prisma/client';
```

### Implementation Steps

1. **Remove Prisma import** and replace with proper feature types:
   ```typescript
   // Remove: import { Organization } from '@prisma/client';
   // Add: import type { OrganizationWithRelations } from '@/features/organizations/types/types';
   ```

2. **Update type usage** throughout the component:
   - Replace `Organization` type with `OrganizationWithRelations`
   - Update line 121 `organizationIds` computation to use proper typing

3. **Verify no other Prisma imports** exist in the component

### Testing Requirements

- TypeScript compilation succeeds without warnings
- Component renders correctly with organization data
- No runtime errors related to missing types
- All organization-related functionality works as expected

### Acceptance Criteria

- [ ] No Prisma client imports in component
- [ ] Uses proper feature-based types from `/src/features/organizations/types/types`
- [ ] TypeScript compilation clean
- [ ] All existing functionality preserved
- [ ] No runtime errors

### Notes

This is a critical architectural violation that must be fixed before any other refactoring work.

---

## Task 2: Consolidate Form Watchers for Performance

**Priority:** High (🟡)
**File:** `src/features/calendar/components/availability/availability-creation-form.tsx:164-167`
**Estimated Time:** 1 hour

### Problem Description

Multiple individual `form.watch()` calls create unnecessary subscriptions and cause excessive re-renders, impacting form performance.

**Current problematic code:**
```typescript
const watchIsRecurring = form.watch('isRecurring');
const watchSchedulingRule = form.watch('schedulingRule');
const watchIsOnlineAvailable = form.watch('isOnlineAvailable');
const watchLocationId = form.watch('locationId');
```

### Implementation Steps

1. **Replace multiple watchers** with single consolidated watcher:
   ```typescript
   const formValues = form.watch(['isRecurring', 'schedulingRule', 'isOnlineAvailable', 'locationId']);
   const [watchIsRecurring, watchSchedulingRule, watchIsOnlineAvailable, watchLocationId] = formValues;
   ```

2. **Update references** throughout the component to use the destructured values

3. **Remove individual watcher calls** and ensure all dependent logic still works

4. **Add performance monitoring** to verify reduced re-renders

### Testing Requirements

- Form behavior identical to before changes
- Watch functionality works for all dependent UI updates
- Performance improvement measurable (fewer re-renders)
- All conditional rendering based on watched values works correctly

### Acceptance Criteria

- [ ] Single `form.watch()` call replaces multiple individual calls
- [ ] All form field dependencies work correctly
- [ ] Conditional rendering based on watched values functions properly
- [ ] No performance regressions
- [ ] Measurable reduction in component re-renders

### Notes

This change should significantly improve form performance, especially for complex interactions.

---

## Task 3: Simplify and Consolidate State Management

**Priority:** High (🟡)
**File:** `src/features/calendar/components/availability/availability-creation-form.tsx:91-111`
**Estimated Time:** 1.5 hours

### Problem Description

Multiple related state variables create complex state management that's difficult to track and maintain. Recurrence state and profile selection state should be consolidated.

**Current problematic code:**
```typescript
const [currentRecurrenceOption, setCurrentRecurrenceOption] = useState<RecurrenceOption>(RecurrenceOption.NONE);
const [customRecurrenceData, setCustomRecurrenceData] = useState<CustomRecurrenceData | undefined>();
const [selectedCreatorType, setSelectedCreatorType] = useState<'provider' | 'organization'>('provider');
const [selectedProviderId, setSelectedProviderId] = useState<string>('');
```

### Implementation Steps

1. **Consolidate recurrence state** into single object:
   ```typescript
   const [recurrenceState, setRecurrenceState] = useState({
     option: RecurrenceOption.NONE,
     modalOpen: false,
     customData: undefined as CustomRecurrenceData | undefined
   });
   ```

2. **Consolidate profile selection state**:
   ```typescript
   const [profileSelection, setProfileSelection] = useState({
     creatorType: 'provider' as 'provider' | 'organization',
     providerId: currentUserProvider?.id || ''
   });
   ```

3. **Update all state setters** to use consolidated state objects

4. **Update all state references** throughout the component

5. **Simplify related useEffect hooks** to work with consolidated state

### Testing Requirements

- All state-dependent UI updates work correctly
- Profile selection functionality unchanged
- Recurrence modal and custom recurrence work as before
- Form submission includes all necessary state data

### Acceptance Criteria

- [ ] Recurrence state consolidated into single object
- [ ] Profile selection state consolidated into single object
- [ ] All UI state dependencies work correctly
- [ ] State updates are more predictable and easier to debug
- [ ] No functional regressions

### Notes

This will make the component state much easier to understand and maintain.

---

## Task 4: Extract Complex Sections into Reusable Components

**Priority:** Medium (🔵)
**File:** `src/features/calendar/components/availability/availability-creation-form.tsx:218-278, 482-556`
**Estimated Time:** 2-3 hours

### Problem Description

The main form component is too large and complex. Key sections like profile selection and location selection should be extracted into separate, reusable components.

### Implementation Steps

1. **Create ProfileSelectionSection component**:
   - Extract lines 218-278 into `profile-selection-section.tsx`
   - Pass necessary props (providers, organizations, selection state)
   - Handle selection changes via callback props

2. **Create LocationSelectionSection component**:
   - Extract lines 482-556 into `location-selection-section.tsx`
   - Include loading states and error handling
   - Make reusable for other availability forms

3. **Create TimeSettingsSection component**:
   - Extract lines 282-352 into `time-settings-section.tsx`
   - Include recurrence modal logic
   - Handle time validation and recurrence patterns

4. **Update main form component** to use extracted sections:
   ```typescript
   <ProfileSelectionSection
     currentProvider={currentUserProvider}
     organizations={userOrganizations}
     selection={profileSelection}
     onSelectionChange={setProfileSelection}
   />
   ```

5. **Ensure proper prop passing** and callback handling

### Testing Requirements

- All extracted components render correctly
- Profile selection functionality preserved
- Location selection with loading states works
- Time settings and recurrence modal function properly
- Main form becomes more readable and maintainable

### Acceptance Criteria

- [ ] ProfileSelectionSection component created and integrated
- [ ] LocationSelectionSection component created and integrated
- [ ] TimeSettingsSection component created and integrated
- [ ] Main form component significantly simplified
- [ ] All functionality preserved
- [ ] Components are reusable for other forms

### Notes

This extraction will make the codebase more modular and the main form much more readable.

---

## Task 5: Add Proper Type Safety and Remove Type Assertions

**Priority:** Medium (🔵)
**File:** `src/features/calendar/components/availability/availability-creation-form.tsx:528, 530, 226`
**Estimated Time:** 1 hour

### Problem Description

The component uses dangerous type assertions and non-null assertion operators instead of proper type guards, creating potential runtime errors.

**Current problematic code:**
```typescript
location.id! // Dangerous non-null assertion
(value: 'provider' | 'organization') // Type assertion without validation
```

### Implementation Steps

1. **Create proper type guards**:
   ```typescript
   const isValidLocationId = (id: string | undefined): id is string => {
     return Boolean(id && availableLocations.some(loc => loc.id === id));
   };
   
   const isValidCreatorType = (value: string): value is 'provider' | 'organization' => {
     return value === 'provider' || value === 'organization';
   };
   ```

2. **Replace dangerous assertions** with proper validation:
   ```typescript
   // Replace: location.id!
   // With: location.id && isValidLocationId(location.id) ? location.id : null
   ```

3. **Add runtime validation** for critical type assumptions

4. **Remove all non-null assertion operators** (`!`) from the component

### Testing Requirements

- TypeScript compilation without warnings
- No runtime type errors
- Proper error handling when type assumptions fail
- All existing functionality preserved

### Acceptance Criteria

- [ ] All non-null assertion operators removed
- [ ] Proper type guards implemented
- [ ] Runtime type validation added where necessary
- [ ] No TypeScript warnings or errors
- [ ] Better error handling for type mismatches

### Notes

This improves the overall reliability and safety of the component.

---

## Task 6: Memoize Expensive Computations

**Priority:** Low (🟢)
**File:** `src/features/calendar/components/availability/availability-creation-form.tsx:121, 172`
**Estimated Time:** 30 minutes

### Problem Description

Several expensive computations happen on every render, causing unnecessary performance overhead.

### Implementation Steps

1. **Memoize organizationIds computation**:
   ```typescript
   const organizationIds = useMemo(() => 
     userOrganizations.map(org => org.id), 
     [userOrganizations]
   );
   ```

2. **Memoize selectedLocation lookup**:
   ```typescript
   const selectedLocation = useMemo(() => 
     availableLocations.find(loc => loc.id === watchLocationId),
     [availableLocations, watchLocationId]
   );
   ```

3. **Memoize recurrence options**:
   ```typescript
   const recurrenceOptions = useMemo(() =>
     getRecurrenceOptions(form.watch('startTime')),
     [form.watch('startTime')]
   );
   ```

### Testing Requirements

- Performance improvement measurable
- All memoized values update correctly when dependencies change
- No functional regressions

### Acceptance Criteria

- [ ] Expensive computations are memoized
- [ ] Performance improvements measurable
- [ ] Dependencies correctly specified
- [ ] No functional changes to component behavior

### Notes

These optimizations will improve the overall performance of the form, especially with large datasets.

---

## Task 7: Remove Development Artifacts and Clean Up Code

**Priority:** Low (🟢)
**File:** `src/features/calendar/components/availability/availability-creation-form.tsx:268-272`
**Estimated Time:** 30 minutes

### Problem Description

The component contains development artifacts and placeholder code that should be removed for production readiness.

### Implementation Steps

1. **Remove hardcoded placeholder** for organization providers:
   ```typescript
   // Remove entire block at lines 268-272:
   <SelectItem value={selectedProviderId || ''} disabled>
     Organization providers not yet implemented
   </SelectItem>
   ```

2. **Clean up any remaining development comments** that aren't useful documentation

3. **Ensure all error messages are user-friendly** and not developer-focused

4. **Remove any console.log statements** or debugging code

### Testing Requirements

- No functional changes to component
- Cleaner, more professional codebase
- All placeholder content removed

### Acceptance Criteria

- [ ] All development artifacts removed
- [ ] No placeholder or "not yet implemented" content
- [ ] Clean, production-ready code
- [ ] Professional error messages and user feedback

### Notes

This final cleanup ensures the component is truly production-ready and suitable as a reference pattern.
