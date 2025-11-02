# Issue PRP: [Issue Name]

## Business Impact

### User Impact

- **Affected Users**: [Number/percentage of users affected]
- **Severity**: Critical/High/Medium/Low
- **Workaround Available**: Yes/No
- **Customer Complaints**: [Number of reports]

### Business Impact

- **Revenue Impact**: [Lost revenue or risk]
- **Reputation Impact**: [Brand/trust implications]
- **Operational Impact**: [Support tickets, manual work]
- **Compliance Risk**: [Regulatory implications]

## Issue Context

### Problem Description

[Clear description of the unexpected behavior]

### Expected Behavior

[What should happen instead]

### Reproduction Steps

1. [Exact steps to reproduce]
2. [Include data/conditions]
3. [Expected vs actual result]

### Environment & Frequency

- **Frequency**: Always/Sometimes/Rarely
- **Browser/Environment**: [Details]
- **User Impact**: [How many users affected]
- **First Appeared**: [When issue started]

## Root Cause Analysis

[From technical plan investigation]

### Affected Code Areas

```typescript
// Specific code blocks that cause the issue
// Include file paths and line numbers
```

### Related Systems

- [Database tables affected]
- [API endpoints involved]
- [UI components impacted]

## Fix Implementation

### Code Changes Required

```typescript
// Before (problematic code)
// File: /src/[path]

// After (fixed code)
// File: /src/[path]
```

### Validation Approach

```typescript
// How to verify the fix works
// Test cases to prevent regression
```

## Impact Assessment

### Risk Analysis

- **User Impact**: Critical/High/Medium/Low
- **Business Impact**: [Revenue, reputation, operations]
- **Technical Impact**: [Performance, security, data integrity]

### Migration Requirements

- No breaking changes to [existing system]
- Backward compatibility maintained
- Data migration: [Required/Not required]

## Testing Requirements

### Unit Tests Required

```typescript
// Location: /src/[path]/__tests__/[issue-fix].test.ts
describe('[Issue fix validation]', () => {
  it('should [specific behavior to verify]');
  it('should not [regression to prevent]');
});
```

### Integration Tests

```typescript
// Verify fix doesn't break related systems
test('[integration scenario]', async () => {
  // Test implementation
});
```

### E2E Regression Test

```typescript
// Location: /e2e/tests/issues/[issue-name].spec.ts
test('[issue no longer occurs]', async ({ page }) => {
  // Reproduction steps that now work correctly
});
```

## Testing Checkpoints (Personal Workflow)

**Purpose**: Define test requirements for test-first development and checkpoint tagging during issue resolution.

### Test-First Development Plan for Issue Resolution

#### Phase 1: Reproduce & Test

**Regression Tests Required**:

- [ ] Test 1: Reproduce the issue

  - **Location**: `/e2e/tests/issues/[issue-name]-reproduction.spec.ts` OR unit test location
  - **Coverage**:
    - **MUST** reproduce exact issue from reproduction steps
    - Test MUST fail before fix (proving issue exists)
    - Document expected vs actual behavior
  - **Priority**: **Critical** - Cannot fix without reproducing
  - **Test-First**: Write this test BEFORE implementing fix

- [ ] Test 2: Unit test for root cause
  - **Location**: `/src/[affected-path]/__tests__/[file].test.ts`
  - **Coverage**:
    - Happy path: Normal operation (may be missing)
    - **Bug scenario**: The specific case that fails
    - Edge cases: Related scenarios that might also fail
  - **Priority**: **Critical** (100% coverage for bug area)
  - **Test-First**: Write BEFORE fixing code

#### Phase 2: Fix & Verify

**Unit Tests for Fix**:

- [ ] Test 3: Verify fix resolves issue
  - **Location**: Same as Test 2
  - **Coverage**:
    - Bug scenario now PASSES
    - Related scenarios still work
    - No new bugs introduced
  - **Test-First**: Test already exists from Phase 1, now should pass

**Integration Tests**:

- [ ] Test 4: Related systems unaffected
  - **Location**: `/src/[path]/__tests__/integration.test.ts`
  - **Coverage**:
    - Downstream dependencies work
    - Upstream callers work
    - Data flow intact
  - **Priority**: High

**E2E Regression Test**:

- [ ] Test 5: Complete user journey fixed
  - **Location**: `/e2e/tests/issues/[issue-name]-fixed.spec.ts`
  - **Flow**:
    1. Execute original reproduction steps
    2. Verify issue NO LONGER occurs
    3. Verify expected behavior happens
    4. Verify user can complete task
  - **Priority**: **Critical** - Proves fix works end-to-end

### Checkpoint Plan for Issue Resolution

- **Checkpoint 1** (after Phase 1):

  - **Description**: Issue reproduced, failing tests written
  - **Tests**: Test 1, Test 2 (both FAILING - proving issue exists)
  - **Tag**: `checkpoint/issue-[name]/1`
  - **Verified**:
    - Issue successfully reproduced
    - Tests fail as expected
    - Root cause identified
    - Ready to implement fix

- **Checkpoint 2** (after Phase 2):

  - **Description**: Fix implemented, all tests passing
  - **Tests**: Test 1-5 (all PASSING)
  - **Tag**: `checkpoint/issue-[name]/2`
  - **Verified**:
    - Original issue resolved
    - All regression tests pass
    - No new issues introduced
    - Integration tests pass
    - Build passes

- **Checkpoint 3** (final):
  - **Description**: Fix validated, ready for PR
  - **Tests**: All tests passing
  - **Tag**: `checkpoint/issue-[name]/3`
  - **Verified**:
    - All tests passing
    - Anti-patterns documented
    - Fix validated in production-like environment
    - Ready for PR

### Test Coverage Targets for Issues

| Test Category         | Target | Justification                             |
| --------------------- | ------ | ----------------------------------------- |
| Bug reproduction      | 100%   | **Critical** - Must prove issue exists    |
| Bug fix code          | 100%   | **Critical** - Fixed code must be tested  |
| Regression prevention | 100%   | **Critical** - Ensure issue doesn't recur |
| Related code paths    | 80%    | High - Verify no side effects             |
| Integration points    | 70%    | Medium - Verify system stability          |

### Test Execution Strategy

**Phase 1: Before Fixing**:

1. Write reproduction test (E2E or unit)
2. Run test - MUST FAIL (proves issue exists)
3. If test passes: Issue not reproduced correctly, revise test
4. Document failing test as proof of issue
5. Create Checkpoint 1

**Phase 2: During Fix**:

1. Implement minimal fix
2. Run reproduction test - should now PASS
3. Write/run regression tests - all should PASS
4. Write/run integration tests - all should PASS
5. If any test fails: Fix not complete, continue work

**Phase 3: After Fix**:

1. Run ALL tests (unit + E2E)
2. Verify ALL tests PASS
3. Run build - must succeed
4. Create Checkpoint 2
5. Run anti-pattern extraction
6. Document prevention strategy
7. Create Checkpoint 3

### Anti-Pattern Documentation

After fixing issue, document what went wrong:

**Anti-Pattern Extraction**:

```bash
# Run after fix complete:
npm run antipatterns:from-issue -- [issue-name]
```

This captures:

- ❌ What code pattern caused the issue (BEFORE)
- ✅ What code pattern fixes it (AFTER)
- 📝 Why the fix works
- 🛡️ How to prevent similar issues

## Performance Constraints

- Fix must not degrade performance
- [Operation] must remain < [X] seconds
- Memory usage must not increase

## Rollback Plan

- How to revert if fix causes problems
- Feature flags: [Required/Not required]
- Database rollback: [Required/Not required]

## Post-Fix Monitoring

- Metrics to watch after deployment
- Alert thresholds to set
- Success criteria for fix validation

## Prevention Strategy

- How to prevent similar issues
- Code patterns to avoid
- Review checklist updates needed
