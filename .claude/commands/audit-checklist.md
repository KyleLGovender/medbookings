# Implementation Audit Checklist (Personal Workflow)

**Purpose**: Systematically verify that implementation matches technical plan and PRD requirements before marking complete.

**When to Use**: After all tasks complete, before final validation (Step 10 in tasks-process-enhanced.md)

**Note**: This is a personal workflow enhancement - prescriptive for Claude Code, ensuring thorough verification.

---

## 🎯 Audit Process Overview

### When to Conduct Audit

After ALL implementation tasks complete and user says "satisfied with overall implementation":

1. **Ask user**: "Run implementation audit checklist? (yes/recommended / no)"
2. If yes: Guide through systematic audit (all sections below)
3. If no: Warn about potential gaps, proceed with user confirmation

### Audit Output

Create audit notes document: `/workflow/prps/[features|issues]/[name]-AUDIT-NOTES.md`

This documents compliance and identifies any gaps before validation.

---

## 📋 Section 1: Technical Plan Compliance

**Purpose**: Verify implementation matches technical plan specifications.

### 1.1 Files Modified/Created

**Review technical plan "Files to Modify" and "Files to Create" sections**:

**Questions to answer**:

- ✅ Did I modify ALL files listed in "Files to Modify"?

  - List each file from plan
  - Confirm each was actually modified
  - If skipped: Document why

- ✅ Did I create ALL files listed in "Files to Create"?

  - List each file from plan
  - Confirm each exists at specified location
  - If skipped: Document why

- ⚠️ Did I modify any files NOT in the plan?
  - List additional files modified
  - Document justification for each
  - Update technical plan if appropriate

**Verification Method**:

```bash
# List all modified files
git diff main --name-only

# Compare against technical plan
# Mark each file as ✅ planned or ⚠️ unplanned
```

### 1.2 Database Changes

**If technical plan includes "Database Changes"**:

**Questions to answer**:

- ✅ Do schema changes match technical plan exactly?

  - Verify models added/modified
  - Verify fields match specifications
  - Verify relationships correct

- ✅ Were migrations created and run?

  - Check `prisma/migrations/` for new migrations
  - Verify migration was applied
  - Command: `npx prisma migrate status`

- ✅ Is database integrity maintained?
  - No orphaned records possible
  - Constraints properly defined
  - Indexes on frequently queried fields

**Verification Method**:

```bash
# Check migration status
npx prisma migrate status

# Review schema changes
git diff main -- prisma/schema.prisma
```

### 1.3 API Endpoints

**If technical plan includes "API Endpoints"**:

**Questions to answer**:

- ✅ Do tRPC procedures match specifications?

  - Verify procedure names match plan
  - Verify input schemas match plan
  - Verify output types match plan

- ✅ Are all planned endpoints implemented?

  - List each endpoint from plan
  - Confirm implementation exists
  - If missing: Document why

- ✅ Is error handling complete?
  - All procedures have try-catch
  - Appropriate TRPCError codes used
  - User-friendly error messages

**Verification Method**:

```bash
# Find all procedures in router
grep -n "\.query\|\.mutation" src/server/api/routers/[feature].ts
```

### 1.4 Implementation Sequence

**Review technical plan "Implementation Sequence"**:

**Questions to answer**:

- ✅ Were phases implemented in planned order?

  - Phase 1 → Phase 2 → Phase 3 (as specified)
  - Deviations documented with justification

- ✅ Were checkpoints created as planned?
  - Review git tags: `git tag -l checkpoint/*`
  - Verify tags exist for major milestones

---

## 📋 Section 2: PRD Business Requirements

**Purpose**: Verify implementation solves the business problem and meets user needs.

### 2.1 Problem Statement Verification

**Review PRP "Problem Statement"**:

**Questions to answer**:

- ✅ Does implementation solve the stated problem?

  - Describe how implementation addresses problem
  - Can you demonstrate the solution working?
  - User can now accomplish what they couldn't before?

- ✅ Can I verify this with a working demo?
  - Step through actual user flow
  - Show problem is solved
  - Document demo steps

**Verification Method**:

- Manual testing of complete user journey
- E2E test proves solution works

### 2.2 Business Objectives Achievement

**Review PRP "Business Objectives" section**:

**Questions to answer**:

- ✅ Primary goal achieved?

  - State primary goal
  - Describe how implementation achieves it
  - Evidence/metrics available?

- ✅ Secondary goals addressed?

  - List each secondary goal
  - Confirm implementation supports each
  - Note any not addressed (with justification)

- ✅ Success metrics measurable?
  - How will we know feature is successful?
  - Are metrics instrumented/trackable?
  - Can we measure the stated KPIs?

**Verification Method**:

- Review implementation against each stated objective
- Ensure logging/metrics capture success criteria

### 2.3 User Stories Validation

**Review PRP "User Stories"**:

**Questions to answer**:

- ✅ Can target user perform the "I want to" action?

  - Test from user's perspective
  - Verify complete flow works
  - No blockers or confusion?

- ✅ Does user achieve the stated benefit?

  - Verify "so that I can" part is satisfied
  - User actually benefits from feature
  - Benefits are measurable

- ✅ E2E test validates user story?
  - E2E test covers complete user journey
  - Test proves user can achieve goal
  - Test would fail if benefit not delivered

**Verification Method**:

- Review E2E tests: `/e2e/tests/[feature]/`
- Manually execute user story steps
- Verify benefit is realized

### 2.4 Expected ROI Validation

**Review PRP "Expected ROI" section**:

**Questions to answer**:

- ✅ Are expected impacts realistic given implementation?

  - Review stated user impact
  - Implementation actually delivers this?
  - Not over-promised?

- ✅ Did implementation scope match planned timeline?
  - Compare estimated vs actual time
  - Scope creep identified and documented?
  - Trade-offs documented?

**Verification Method**:

- Compare initial estimates to actual
- Document variances with justification

---

## 📋 Section 3: Code Quality Verification

**Purpose**: Verify implementation follows architectural standards and CLAUDE.md compliance.

### 3.1 Architectural Compliance

**Review CLAUDE.md architectural rules**:

**FORBIDDEN Patterns** - Must verify NONE exist:

```bash
# Check for cross-feature imports
grep -r "from '@/features/" src/features/[current-feature]/ --include="*.ts" --include="*.tsx"
# Expected: NO imports from OTHER features

# Check for Prisma in client code
grep -r "from '@/lib/prisma'" src/app/ src/features/ --include="*.tsx"
# Expected: ZERO matches (Prisma only in server code)

# Check for type exports from hooks
grep -r "export type" src/features/[feature]/hooks/ --include="*.ts"
# Expected: ZERO type exports from hooks

# Check for 'any' types
grep -r ": any\|as any" src/features/[feature]/ --include="*.ts" --include="*.tsx"
# Expected: ZERO or documented exceptions only
```

**Questions to answer**:

- ✅ No cross-feature imports?
- ✅ No Prisma in client code?
- ✅ Types extracted from RouterOutputs (not exported from hooks)?
- ✅ No `any` types (or documented exceptions only)?

### 3.2 CLAUDE.md Compliance

**Critical compliance checks**:

**Questions to answer**:

- ✅ Used `nowUTC()` for all dates (NEVER `new Date()`)?

  ```bash
  # Check for violations
  grep -r "new Date()" src/features/[feature]/ --include="*.ts"
  grep -r "Date.now()" src/features/[feature]/ --include="*.ts"
  # Expected: ZERO matches
  ```

- ✅ Used `logger` with PHI sanitization (NO console.log)?

  ```bash
  # Check for console.log violations
  grep -r "console\.log\|console\.error" src/features/[feature]/ --include="*.ts"
  # Expected: ZERO matches
  ```

- ✅ Used `take:` for all findMany queries?

  ```bash
  # Check for unbounded queries
  grep -r "\.findMany\s*(" src/server/api/routers/[feature].ts | grep -v "take:"
  # Expected: ZERO matches
  ```

- ✅ Used `prisma.$transaction()` for multi-table operations?

  ```bash
  # Look for multi-table operations
  grep -A 10 "prisma\." src/server/api/routers/[feature].ts
  # Manually verify transactions used where needed
  ```

- ✅ Zod validation on all tRPC inputs?

  ```bash
  # Check all procedures have .input()
  grep -B 2 "\.query\|\.mutation" src/server/api/routers/[feature].ts
  # Verify each has .input(z.object(...))
  ```

- ✅ Feature isolation maintained?
  - All components in feature folder
  - No business logic in shared components
  - Clean separation of concerns

### 3.3 Error Handling

**Questions to answer**:

- ✅ All tRPC procedures have try-catch blocks?
- ✅ Error messages are user-friendly?
- ✅ Errors logged with sufficient context?
- ✅ Appropriate error codes used (TRPCError)?

**Verification Method**:

```bash
# Review error handling
grep -A 5 "catch" src/server/api/routers/[feature].ts
```

---

## 📋 Section 4: Test Coverage Verification

**Purpose**: Ensure adequate test coverage exists and all tests pass.

### 4.1 Test Completeness

**Questions to answer**:

- ✅ Every business logic function has unit test?

  - List critical functions
  - Confirm each has `__tests__/[file].test.ts`
  - Review test coverage

- ✅ Every API endpoint has test?

  - List all tRPC procedures
  - Confirm each has test coverage
  - Happy path + error scenarios tested

- ✅ Critical user journeys have E2E tests?

  - List critical paths
  - Confirm E2E tests exist
  - Tests cover complete flows

- ✅ ALL tests passing?

  ```bash
  # Run complete test suite
  npm run test:unit  # Unit tests (if configured)
  npm test           # E2E tests

  # Expected: ALL PASS
  ```

### 4.2 Test Quality

**Questions to answer**:

- ✅ Tests cover happy path?
- ✅ Tests cover error scenarios (at least 2 per function)?
- ✅ Tests cover edge cases (at least 2 per function)?
- ✅ Tests are independent (can run alone)?
- ✅ Test names are descriptive?

### 4.3 Test Coverage Metrics

**Questions to answer**:

- ✅ Coverage meets targets?
  - Business logic: 100%
  - API endpoints: 100%
  - UI components: 80%
  - Overall: 85% minimum

**Verification Method**:

```bash
# Check coverage (if available)
node workflow/scripts/personal/test-coverage-check.js
```

---

## 📋 Section 5: Gaps & Deviations

**Purpose**: Document any deviations from plan and assess impact.

### 5.1 Identify Gaps

**Questions to answer**:

- ⚠️ Are there planned features NOT implemented?

  - List each gap
  - Document justification
  - Create follow-up tasks if needed

- ⚠️ Are there requirements NOT met?

  - List unmet requirements
  - Document why
  - Assess impact

- ⚠️ Are there tests NOT written?
  - List missing tests
  - Document why
  - Plan to add before PR?

### 5.2 Assess Deviations

**Questions to answer**:

- ⚠️ Did implementation deviate from plan?

  - List deviations
  - Justify each deviation
  - Update technical plan if significant

- ⚠️ Are deviations documented?
  - In technical plan?
  - In PRP?
  - In audit notes?

---

## 📄 Audit Notes Template

Create: `/workflow/prps/[features|issues]/[name]-AUDIT-NOTES.md`

```markdown
# Implementation Audit: [Feature/Issue Name]

**Date**: [YYYY-MM-DD]
**Audited By**: [Your Name]
**Type**: Feature / Issue

---

## 1. Technical Plan Compliance

### Files Modified/Created

- ✅ All planned files modified: [YES/NO]
  - [List files]
- ✅ All planned files created: [YES/NO]
  - [List files]
- ⚠️ Additional files modified: [List if any]
  - Justification: [Why]

### Database Changes

- ✅ Schema changes match plan: [YES/NO]
- ✅ Migrations created and applied: [YES/NO]
- ✅ Database integrity maintained: [YES/NO]

### API Endpoints

- ✅ All planned endpoints implemented: [YES/NO]
  - [List endpoints]
- ✅ Input/output types match plan: [YES/NO]
- ✅ Error handling complete: [YES/NO]

---

## 2. PRD Business Requirements

### Problem Statement

- ✅ Problem solved: [YES/NO]
  - Evidence: [Describe how verified]
- ✅ Demo available: [YES/NO]
  - Demo steps: [Describe]

### Business Objectives

- ✅ Primary objective achieved: [YES/NO]
  - [Describe achievement]
- ✅ Secondary objectives addressed: [YES/NO]
  - [List status of each]
- ✅ Success metrics measurable: [YES/NO]
  - [List metrics]

### User Stories

- ✅ User can perform action: [YES/NO]
- ✅ User achieves benefit: [YES/NO]
- ✅ E2E test validates: [YES/NO]

---

## 3. Code Quality

### Architectural Compliance

- ✅ No cross-feature imports: [YES/NO]
- ✅ No Prisma in client: [YES/NO]
- ✅ Types from RouterOutputs: [YES/NO]
- ✅ No `any` types: [YES/NO - If NO, document exceptions]

### CLAUDE.md Compliance

- ✅ Used `nowUTC()`: [YES/NO]
- ✅ Used `logger` (no console.log): [YES/NO]
- ✅ Used `take:` for findMany: [YES/NO]
- ✅ Used transactions: [YES/NO - If applicable]
- ✅ Zod validation on inputs: [YES/NO]
- ✅ Feature isolation: [YES/NO]

### Error Handling

- ✅ All procedures have try-catch: [YES/NO]
- ✅ User-friendly errors: [YES/NO]
- ✅ Errors logged with context: [YES/NO]

---

## 4. Test Coverage

### Test Completeness

- ✅ Business logic tests: [X/Y functions tested]
- ✅ API endpoint tests: [X/Y endpoints tested]
- ✅ E2E tests: [X critical paths tested]
- ✅ All tests passing: [YES/NO]

### Coverage Metrics

- Business logic: [X]%
- API endpoints: [X]%
- Components: [X]%
- Overall: [X]%
- ✅ Meets targets (85%+): [YES/NO]

---

## 5. Gaps Identified

### Implementation Gaps

[None] OR

- Gap 1: [Description]
  - Impact: [Low/Medium/High]
  - Action: [Create follow-up task / Address now / Accept]

### Test Gaps

[None] OR

- Gap 1: [Missing test description]
  - Action: [Add before PR / Create follow-up]

### Deviations from Plan

[None] OR

- Deviation 1: [Description]
  - Justification: [Why deviated]
  - Documentation: [Updated technical plan: YES/NO]

---

## 6. Final Assessment

**Ready for Validation**: YES / NO

**If NO, items to address**:

1. [Item 1]
2. [Item 2]

**If YES, proceed to**:

- ✅ Run `npm run validate:integration` or `validate:issue`
- ✅ Run `npm run validate:all`
- ✅ Archive completed work
- ✅ Ready for PR submission

---

**Audit Complete**: [YYYY-MM-DD HH:MM]
**Next Steps**: [Validation / Address gaps]
```

---

## ✅ Audit Completion Checklist

Before concluding audit, verify:

- [ ] All 5 sections reviewed systematically
- [ ] All questions answered (not skipped)
- [ ] Audit notes document created
- [ ] Gaps documented with action items
- [ ] User informed of audit results
- [ ] Decision made: Proceed to validation OR address gaps

Only proceed to validation after audit complete and user approves.

---

**Remember**: Audit is not about perfection - it's about systematic verification and conscious trade-offs.

Document gaps, make informed decisions, proceed with confidence.
