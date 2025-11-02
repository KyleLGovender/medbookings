# [Issue Name] - Issue PRP Implementation Tasks

Generated from: `/workflow/prps/issues/[issue-name]-issue-prp.md`
Date: [YYYY-MM-DD]

## Overview

This task list breaks down the resolution of [issue name] into actionable tasks with investigation, fix, and validation phases.

## Task Tracking

- Total Tasks: [Count]
- Completed: 0
- In Progress: 0
- Remaining: [Count]

## Implementation Tasks

### Phase 1: Investigation & Root Cause Analysis

- [ ] 1.0 Issue Investigation
  - [ ] 1.1 Create issue branch `issue/[issue-name]`
  - [ ] 1.2 Reproduce the issue locally
    - **Steps**: Follow reproduction steps from Issue PRP
    - **Validation**: Confirm issue occurs consistently
    - **Documentation**: Screenshot or log the error
  - [ ] 1.3 Identify root cause
    - **Pattern**: Use debugging techniques from issue-prp-template.md
    - **Tools**: Browser DevTools, server logs, database queries
    - **Documentation**: Update Issue PRP with findings
  - [ ] 1.4 Analyze affected code areas
    - **Review**: Files mentioned in Issue PRP
    - **Check**: Related systems and dependencies
    - **Document**: All affected components

### Phase 2: Fix Implementation

- [ ] 2.0 Code Changes
  - [ ] 2.1 Implement the fix
    - **Location**: Files identified in root cause analysis
    - **Pattern**: Follow existing code patterns in the area
    - **Validation**: Ensure fix addresses root cause
  - [ ] 2.2 Update related code if needed
    - **Check**: Related functions/components
    - **Ensure**: No breaking changes introduced
    - **Validation**: Run existing tests
  - [ ] 2.3 Add error handling improvements
    - **Pattern**: Use error handling pattern from api-patterns.md
    - **Include**: Better error messages for debugging
    - **Validation**: Test error scenarios

### Phase 3: Testing & Validation (Test-First Approach)

**Note**: Follow test-first methodology - write reproduction tests BEFORE fixing the bug.

- [ ] 3.0 Write Reproduction Tests FIRST

  - [ ] 3.1 Write test that reproduces the issue

    - **Location**: `/e2e/tests/issues/[issue-name]-reproduction.spec.ts` OR `/src/[path]/__tests__/[file].test.ts`
    - **Test-First**: Write this BEFORE implementing fix
    - **Expected**: Test MUST FAIL (proving issue exists)
    - **Coverage**:
      - Exact reproduction steps from Issue PRP
      - Expected vs actual behavior documented
      - Test should fail consistently
    - **Validation**: Run test, confirm it fails
    - **Checkpoint**: Create checkpoint with failing test (proves issue exists)

  - [ ] 3.2 Write unit test for root cause
    - **Location**: `/src/[affected-path]/__tests__/[file].test.ts`
    - **Test-First**: Write BEFORE fixing code
    - **Expected**: Test FAILS before fix
    - **Coverage**:
      - Happy path (if missing)
      - Bug scenario (the specific failing case)
      - Edge cases (related scenarios)
    - **Validation**: Run test, confirm it fails at bug scenario
    - **Priority**: **Critical** (100% coverage for bug area)

- [ ] 3.3 Implement the Fix

  - [ ] 3.3.1 Implement minimal fix
    - **Location**: Files identified in Phase 1
    - **Approach**: Minimal code change to make tests pass
    - **Pattern**: Follow existing patterns
  - [ ] 3.3.2 Run reproduction test
    - **Command**: `npm test -- [test-file]` OR `npm run test:unit`
    - **Expected**: Test now PASSES (issue resolved)
    - **If still fails**: Fix not complete, continue debugging

- [ ] 3.4 Write Regression Prevention Tests

  - [ ] 3.4.1 Integration tests
    - **Location**: `/src/[path]/__tests__/integration.test.ts`
    - **Coverage**:
      - Related systems unaffected
      - Downstream dependencies work
      - Data flow intact
    - **Validation**: All tests pass
  - [ ] 3.4.2 E2E regression test
    - **Location**: `/e2e/tests/issues/[issue-name]-fixed.spec.ts`
    - **Flow**:
      1. Execute original reproduction steps
      2. Verify issue NO LONGER occurs
      3. Verify expected behavior
      4. Verify user can complete task
    - **Priority**: **Critical**
    - **Validation**: Test passes consistently

- [ ] 3.5 Run Full Test Suite
  - [ ] 3.5.1 Run all unit tests
    - **Command**: `npm run test:unit` (if configured)
    - **Expected**: ALL tests pass
    - **Fix**: Any broken tests
  - [ ] 3.5.2 Run all E2E tests
    - **Command**: `npm test`
    - **Expected**: ALL tests pass
    - **Fix**: Any broken tests
  - [ ] 3.5.3 Verify no regressions
    - Test related features
    - Test user workflows
    - Check performance not degraded

### Test Checkpoint Summary

**After Phase 1 (Investigation)**:

- Checkpoint 1: Issue reproduced, tests written (FAILING)
- Tag: `checkpoint/issue-[name]/1`

**After Phase 3 (Fix & Test)**:

- Checkpoint 2: Fix implemented, all tests PASSING
- Tag: `checkpoint/issue-[name]/2`
- Display checkpoint info with test counts

**Before Phase 4 (Integration)**:

- Verify ALL tests pass
- Build succeeds
- Ready for integration testing

### Phase 4: Integration & Rollout

- [ ] 4.0 Integration Testing
  - [ ] 4.1 Test in staging/dev environment
    - **Validate**: Fix works in production-like environment
    - **Check**: No performance degradation
    - **Monitor**: Logs and metrics
  - [ ] 4.2 Verify no side effects
    - **Test**: Related features still work
    - **Check**: User workflows not disrupted
    - **Validation**: Complete user journey testing
  - [ ] 4.3 Update documentation if needed
    - **Update**: Any affected user guides
    - **Document**: Changes in Issue PRP
    - **Note**: Prevention strategies for future

### Phase 5: Post-Fix Monitoring

- [ ] 5.0 Deploy & Monitor
  - [ ] 5.1 Plan deployment strategy
    - **Approach**: Feature flag or direct deploy
    - **Rollback**: Ensure rollback plan is ready
    - **Communication**: Notify stakeholders
  - [ ] 5.2 Monitor after deployment
    - **Metrics**: Watch relevant metrics
    - **Logs**: Check for errors
    - **User Reports**: Monitor support channels
  - [ ] 5.3 Capture anti-patterns
    - **Run**: `npm run antipatterns:from-issue [issue-name]`
    - **Document**: What went wrong and how to prevent
    - **Update**: Code review checklist if needed

## Validation Checklist

After each phase, verify:

- [ ] Build passes: `npm run build`
- [ ] Types valid: `npx tsc --noEmit`
- [ ] Linting clean: `npm run lint`
- [ ] Tests pass: `npm run test`
- [ ] Issue no longer reproducible
- [ ] No regression in related features
- [ ] Performance not degraded

## Success Criteria

- [ ] Issue is completely resolved
- [ ] Root cause is documented
- [ ] Regression test added
- [ ] All validation checks pass
- [ ] No new issues introduced
- [ ] Prevention strategy documented
