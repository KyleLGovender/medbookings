# PRP: [Feature Name]

## Business Context

### Problem Statement

[What problem does this feature solve for users and the business?]

### Business Objectives

- **Primary Goal**: [Main business objective]
- **Secondary Goals**: [Supporting objectives]
- **Success Metrics**: [How we measure success - KPIs]

### User Stories

**As a [user type]**

- I want to [action]
- So that I can [benefit]

### Target Users

- **Primary**: [Main user group and size]
- **Secondary**: [Other affected users]

### Expected ROI

- **Impact**: [Number of users affected]
- **Value**: [Business value/revenue impact]
- **Timeline**: [When benefits will be realized]

## Implementation Context

### Codebase Patterns

- Authentication: [Reference to existing auth implementation]
- API Structure: [tRPC procedure patterns used]
- Component Architecture: [Current component patterns]
- State Management: [Existing state patterns]

### Existing Code to Reuse

```typescript
// Specific code blocks from existing features that should be reused
// Include actual code snippets, not just references
```

## Runbook Section

### Pre-Implementation Checks

```bash
npm run build            # Must pass
npm run lint             # Zero errors
npm run typecheck        # Full type safety
npm run test:[relevant]  # Related tests must pass
docker ps | grep postgres # Database must be running
```

#### Implementation Sequence

1. Backend ([estimated time])

- [Specific tasks with validation points]
- Test with curl/Postman commands

2. Frontend Integration ([estimated time])

- [Component creation order]
- [Navigation flow setup]

3. Testing ([estimated time])

- [Test creation sequence]

### Post-Task Validation

```bash
# After each component
npm run build
npm run validate:task [feature-name]

# After integration
npm run validate:integration [feature-name]
```

## Code Intelligence

### Import Patterns

```typescript
// Standard imports from your codebase
import { useCurrentUserProvider } from '~/features/auth/hooks';
import { api } from '~/trpc/react';

// [Add all common imports for this feature type]
```

### Error Handling Pattern

```typescript
// Standard error handling pattern
try {
  const result = await operation();
  toast.success("Success message");
  return result;
} catch (error) {
  const message = error instanceof Error ? error.message : "Operation failed";
  toast.error(message);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}
```

### Form Validation Pattern

```typescript
// Standard Zod schema pattern
const [featureName]Schema = z.object({
  // Define validation rules
});

// React Hook Form integration
const form = useForm({
  resolver: zodResolver([featureName]Schema),
});
```

### Validation Rules

- All dates use date-fns
- All forms use react-hook-form with zodResolver
- All API calls include error handling
- [Feature-specific validation rules]

## Domain-Specific Validations

### [Feature-Specific Checks]

```typescript
// Critical validation logic specific to this feature
// E.g., booking conflicts, data integrity checks
```

## Testing Requirements

### Unit Tests Required

```typescript
// Location: /src/[path]/__tests__/[feature].test.ts
describe('[Feature procedure/component]', () => {
  it('[specific behavior to test]');
  // List all required test cases
});
```

### E2E Test Scenarios

```typescript
// Location: /e2e/tests/[feature]/[test-name].spec.ts
test('[user journey description]', async ({ page }) => {
  // Step-by-step user flow
});
```

## Testing Checkpoints (Personal Workflow)

**Purpose**: Define test requirements for test-first development and checkpoint tagging.

### Test-First Development Plan

For each implementation phase, identify test requirements BEFORE writing code:

#### Phase 1: Backend/Database

**Unit Tests Required**:

- [ ] Test 1: [API endpoint/procedure name]

  - **Location**: `/src/server/api/routers/__tests__/[router].test.ts`
  - **Coverage**:
    - Happy path: [Describe normal operation]
    - Error scenario 1: [e.g., invalid input]
    - Error scenario 2: [e.g., not found]
    - Edge case 1: [e.g., boundary condition]
    - Edge case 2: [e.g., empty result]
  - **Priority**: **Critical** (100% coverage)

- [ ] Test 2: [Database operation/utility]
  - **Location**: `/src/lib/__tests__/[util].test.ts`
  - **Coverage**:
    - Happy path: [Describe operation]
    - Error scenario 1: [e.g., transaction failure]
    - Error scenario 2: [e.g., constraint violation]
    - Edge case 1: [e.g., concurrent updates]
    - Edge case 2: [e.g., null values]
  - **Priority**: **Critical** (100% coverage)

#### Phase 2: Frontend/Components

**Unit Tests Required**:

- [ ] Test 3: [Component name]

  - **Location**: `/src/features/[feature]/components/__tests__/[component].test.tsx`
  - **Coverage**:
    - Happy path: [Component renders correctly]
    - User interaction 1: [e.g., button click]
    - User interaction 2: [e.g., form submission]
    - Error state: [e.g., API error handling]
    - Edge case: [e.g., empty data]
  - **Priority**: High (80% coverage)

- [ ] Test 4: [Custom hook]
  - **Location**: `/src/features/[feature]/hooks/__tests__/[hook].test.ts`
  - **Coverage**:
    - Happy path: [Hook returns expected data]
    - Error scenario 1: [e.g., API error]
    - Error scenario 2: [e.g., network failure]
    - Edge case: [e.g., stale data]
  - **Priority**: High (80% coverage)

**E2E Tests Required**:

- [ ] Test 5: [Complete user journey]

  - **Location**: `/e2e/tests/[feature]/[journey].spec.ts`
  - **Flow**:
    1. [Step 1: User action]
    2. [Step 2: System response]
    3. [Step 3: User verification]
    4. [Step 4: Final outcome]
  - **Validation**:
    - User sees expected UI
    - Data persists correctly
    - Notifications appear
    - Navigation works
  - **Priority**: **Critical** (complete flow)

- [ ] Test 6: [Error scenario E2E]
  - **Location**: `/e2e/tests/[feature]/[error-scenario].spec.ts`
  - **Flow**:
    1. [Trigger error condition]
    2. [Verify error handling]
    3. [Verify recovery path]
  - **Priority**: High

### Checkpoint Plan

Define checkpoint expectations for rollback capability:

- **Checkpoint 1** (after Phase 1):

  - **Description**: Backend complete, API tests passing
  - **Tests**: [List test numbers: Test 1, Test 2]
  - **Tag**: `checkpoint/[feature-name]/1`
  - **Verified**:
    - All Phase 1 unit tests passing
    - API endpoints working
    - Database operations verified
    - Build passes

- **Checkpoint 2** (after Phase 2):

  - **Description**: Frontend complete, E2E tests passing
  - **Tests**: [List test numbers: Test 3, Test 4, Test 5, Test 6]
  - **Tag**: `checkpoint/[feature-name]/2`
  - **Verified**:
    - All unit tests passing (Phase 1 + Phase 2)
    - All E2E tests passing
    - Complete user journey validated
    - Build passes

- **Checkpoint 3** (final):
  - **Description**: Full integration, all tests passing, ready for PR
  - **Tests**: All tests (1-6)
  - **Tag**: `checkpoint/[feature-name]/3`
  - **Verified**:
    - All tests passing (unit + E2E)
    - All validations passed
    - Audit complete
    - Build passes
    - Ready for PR submission

### Test Coverage Targets

| Code Category       | Target  | Justification                                         |
| ------------------- | ------- | ----------------------------------------------------- |
| Business logic      | 100%    | **Critical** - Core functionality must be bulletproof |
| API endpoints       | 100%    | **Critical** - All endpoints must be tested           |
| Database operations | 100%    | **Critical** - Data integrity essential               |
| React components    | 80%     | High priority - UI must work correctly                |
| Custom hooks        | 80%     | High priority - State management critical             |
| UI interactions     | 70%     | Medium - Visual/interaction coverage                  |
| **Overall**         | **85%** | **Minimum acceptable**                                |

### Test Execution Strategy

**During Development**:

- Write test FIRST for each sub-task
- Run test (should fail)
- Implement code
- Run test (should pass)
- Mark sub-task complete

**After Each Parent Task**:

- Run ALL tests (unit + E2E)
- Verify ALL tests pass
- Create checkpoint commit
- Create checkpoint tag

**Before Final Completion**:

- Run complete test suite
- Verify coverage meets targets
- Run all validations
- Create final checkpoint

## Performance Constraints

- [Operation] must complete < [X] seconds
- API responses < [X]ms
- Page load < [X] seconds
- [Feature-specific metrics]

## Migration Requirements

- No breaking changes to [existing system]
- Maintain backward compatibility with [API/feature]
- Graceful fallback if [service] unavailable
- [Additional migration considerations]
