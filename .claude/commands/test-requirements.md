# Test-First Development Requirements (Personal Workflow)

**Purpose**: Ensure all code has comprehensive test coverage with checkpoint tagging for rollback capability.

**When to Use**: During implementation of EVERY feature or issue (Steps 6-8 in tasks-process-enhanced.md)

**Note**: This is a personal workflow enhancement - prescriptive for Claude Code, not enforced at team level.

---

## 🎯 Test-First Development Approach

### Core Principle

**Write the test BEFORE writing the implementation code.**

This ensures:

- ✅ Clear understanding of what you're building
- ✅ Tests actually validate behavior (not just pass existing code)
- ✅ Better code design (testable code is better code)
- ✅ Confidence in implementation correctness
- ✅ Safety net for refactoring

**Exception**: Documentation-only changes, config updates, obvious typos (user can override)

---

## 📋 Test-First Implementation Process

### For EVERY Sub-Task Involving Code

Follow this exact sequence:

#### Step 1: Identify What Needs Testing

Before writing ANY implementation code, determine:

- What is the unit being tested? (function, component, API endpoint)
- What is the expected behavior?
- What are the happy path scenarios?
- What are the error/edge case scenarios?

#### Step 2: Determine Test Type

| Code Type                       | Test Type        | Tool         | Location                                                            |
| ------------------------------- | ---------------- | ------------ | ------------------------------------------------------------------- |
| Pure functions (utils, helpers) | Unit             | Vitest       | `/src/[path]/__tests__/[file].test.ts`                              |
| Business logic                  | Unit             | Vitest       | `/src/[path]/__tests__/[file].test.ts`                              |
| tRPC procedures                 | Unit/Integration | Vitest       | `/src/server/api/routers/__tests__/[router].test.ts`                |
| React components                | Unit             | Vitest + RTL | `/src/features/[feature]/components/__tests__/[component].test.tsx` |
| Complete user flows             | E2E              | Playwright   | `/e2e/tests/[feature]/[scenario].spec.ts`                           |

**RTL** = React Testing Library (if/when installed)

#### Step 3: Write the Test FIRST

**CRITICAL**: Test MUST be written before implementation.

**Test Structure**:

```typescript
import { describe, expect, it } from 'vitest';

describe('[Component/Function/Endpoint name]', () => {
  it('should [specific behavior] when [condition]', () => {
    // Arrange: Set up test data
    // Act: Execute the code being tested
    // Assert: Verify expected outcome
  });

  it('should handle [error case] when [condition]', () => {
    // Test error scenarios
  });

  it('should [edge case behavior]', () => {
    // Test edge cases
  });
});
```

**Example - tRPC Procedure Test**:

```typescript
// Location: /src/server/api/routers/__tests__/providers.test.ts
describe('providers.getById', () => {
  it('should return provider when valid ID provided', async () => {
    const result = await caller.providers.getById({ id: 'test-id' });
    expect(result).toBeDefined();
    expect(result.id).toBe('test-id');
  });

  it('should throw error when provider not found', async () => {
    await expect(caller.providers.getById({ id: 'invalid-id' })).rejects.toThrow(
      'Provider not found'
    );
  });
});
```

#### Step 4: Run Test (Should FAIL)

```bash
# For unit tests (if Vitest configured):
npm run test:unit

# For E2E tests:
npm test -- [test-file]
```

**Expected**: Test should FAIL because implementation doesn't exist yet.

**If test passes**: Something is wrong - either:

- Test is not actually testing the new code
- Implementation already exists
- Test is broken

**Fix the test before proceeding.**

#### Step 5: Implement Code to Pass Test

Now write the minimal implementation code needed to make the test pass.

**Red → Green → Refactor** cycle:

1. **Red**: Test fails (no implementation)
2. **Green**: Write code to make test pass
3. **Refactor**: Improve code while keeping tests green

#### Step 6: Run Test Again (Should PASS)

```bash
# Run the same test command
npm run test:unit  # or npm test
```

**Expected**: Test should PASS.

**If still failing**: Debug and fix implementation until test passes.

#### Step 7: Mark Sub-Task Complete

Only mark sub-task complete `[x]` after:

- ✅ Test written
- ✅ Implementation complete
- ✅ Test passing

---

## 🎯 Test Coverage Requirements

### Minimum Coverage Targets

| Code Category                        | Coverage Target | Priority     |
| ------------------------------------ | --------------- | ------------ |
| Business logic (utils, calculations) | 100%            | **Critical** |
| API endpoints (tRPC procedures)      | 100%            | **Critical** |
| Database operations                  | 100%            | **Critical** |
| React components                     | 80%             | High         |
| UI interactions                      | 70%             | Medium       |
| Overall codebase                     | 85%             | Target       |

### Coverage for Each Scenario Type

**Happy Path** (REQUIRED):

- ✅ Normal operation with valid inputs
- ✅ Expected outputs produced
- ✅ State changes occur correctly

**Error Scenarios** (REQUIRED):

- ✅ Invalid inputs handled gracefully
- ✅ Error messages are user-friendly
- ✅ No crashes or unhandled exceptions
- ✅ Appropriate error codes/types returned

**Edge Cases** (2-3 minimum):

- ✅ Boundary conditions (empty arrays, null values, etc.)
- ✅ Extreme values (very large numbers, long strings)
- ✅ Race conditions (for async code)
- ✅ Concurrent operations (where applicable)

**Example Coverage**:

```typescript
describe('calculateSlotAvailability', () => {
  // Happy path
  it('returns available slots for valid date range');

  // Error scenarios
  it('throws error when end date before start date');
  it('throws error when date range exceeds 90 days');

  // Edge cases
  it('handles timezone boundaries correctly');
  it('returns empty array when no slots available');
  it('handles single-day date range');
});
```

---

## 🏷️ Checkpoint Tagging Process

### When to Create Checkpoints

Create a **git checkpoint tag** after EACH parent task completion when user confirms satisfaction.

**Purpose**:

- 🔄 Easy rollback to known working state
- 📊 Track progress incrementally
- ✅ Verify all tests passing at each milestone
- 🛡️ Safety net if next phase breaks things

### Checkpoint Creation Steps

After parent task validation passes and user says "satisfied":

#### Step 1: Verify All Tests Pass

```bash
# Run unit tests (if configured)
npm run test:unit

# Run E2E tests
npm test

# Both should pass before checkpoint
```

**If any test fails**: Fix before proceeding. Do NOT create checkpoint with failing tests.

#### Step 2: Create Checkpoint Commit

```bash
git add .
git commit -m "feat: Complete [parent task name] - Checkpoint [N]"
```

**For issues**, use `fix:` instead of `feat:`:

```bash
git commit -m "fix: Complete [parent task name] - Checkpoint [N]"
```

**Commit Message Format**:

- Feature: `feat: Complete [task] - Checkpoint [N]`
- Issue: `fix: Complete [task] - Checkpoint [N]`
- Include checkpoint number (1, 2, 3, etc.)
- Be specific about what was completed

**Example**:

```bash
git commit -m "feat: Complete API endpoints for provider availability - Checkpoint 1"
```

#### Step 3: Create Checkpoint Tag

```bash
git tag -a checkpoint/[feature-name]/[N] -m "Working state: [description]"
```

**Tag Naming Convention**:

- Format: `checkpoint/[feature-name]/[N]`
- Use feature/issue name from PRP (kebab-case)
- N = sequential number (1, 2, 3, ...)
- Description = what's working at this checkpoint

**Example**:

```bash
git tag -a checkpoint/user-profile/1 -m "Working state: API endpoints complete, all unit tests passing"
```

#### Step 4: Display Checkpoint Info to User

After creating tag, display:

```
═══════════════════════════════════════════════
✅ Checkpoint [N] Created Successfully
═══════════════════════════════════════════════

📊 Tests Status:
   - Unit tests: [X] passing
   - E2E tests: [Y] passing
   - Total: [X+Y] tests passing

🏷️  Checkpoint Tag: checkpoint/[feature-name]/[N]
📝 Description: [what's working]

🔄 To revert to this checkpoint:
   git checkout checkpoint/[feature-name]/[N]

🔄 To compare current vs checkpoint:
   git diff checkpoint/[feature-name]/[N]

═══════════════════════════════════════════════
```

**Example Output**:

```
═══════════════════════════════════════════════
✅ Checkpoint 1 Created Successfully
═══════════════════════════════════════════════

📊 Tests Status:
   - Unit tests: 12 passing
   - E2E tests: 3 passing
   - Total: 15 tests passing

🏷️  Checkpoint Tag: checkpoint/user-profile/1
📝 Description: API endpoints complete, all unit tests passing

🔄 To revert to this checkpoint:
   git checkout checkpoint/user-profile/1

🔄 To compare current vs checkpoint:
   git diff checkpoint/user-profile/1

═══════════════════════════════════════════════
```

---

## 📁 Test File Organization

### Unit Test Structure

```
src/
├── features/
│   └── [feature]/
│       ├── components/
│       │   ├── MyComponent.tsx
│       │   └── __tests__/
│       │       └── MyComponent.test.tsx
│       ├── hooks/
│       │   ├── useMyHook.ts
│       │   └── __tests__/
│       │       └── useMyHook.test.ts
│       └── lib/
│           ├── utils.ts
│           └── __tests__/
│               └── utils.test.ts
├── server/
│   └── api/
│       └── routers/
│           ├── myRouter.ts
│           └── __tests__/
│               └── myRouter.test.ts
└── lib/
    ├── myUtil.ts
    └── __tests__/
        └── myUtil.test.ts
```

### E2E Test Structure

```
e2e/
└── tests/
    └── [feature]/
        ├── happy-path.spec.ts
        ├── error-scenarios.spec.ts
        └── edge-cases.spec.ts
```

---

## 🚫 When to Skip Testing (Exceptions)

Testing can be skipped ONLY for:

1. **Documentation-only changes**

   - README updates
   - Comment additions
   - Documentation files

2. **Configuration file updates**

   - package.json dependency bumps
   - .eslintrc changes
   - tsconfig.json adjustments

3. **Obvious typo fixes**

   - Fixing spelling errors
   - Correcting variable names
   - Fixing import paths

4. **User explicitly requests skip**
   - User says: "skip tests for this"
   - User says: "just quick fix, no tests needed"
   - User acknowledges: "I'll write tests later"

**For everything else: ALWAYS write tests before implementation.**

---

## 💡 Testing Best Practices

### 1. Test One Thing at a Time

❌ **Bad** - Tests multiple behaviors:

```typescript
it('should create user and send email and log action', () => {
  // Too many responsibilities
});
```

✅ **Good** - Tests single behavior:

```typescript
it('should create user with valid data');
it('should send welcome email after user creation');
it('should log user creation action');
```

### 2. Use Descriptive Test Names

Test names should answer: "What should happen when [condition]?"

✅ **Good test names**:

```typescript
it('should return 404 when provider not found');
it('should calculate correct slot duration for 30-minute appointments');
it('should disable submit button when form is invalid');
```

❌ **Bad test names**:

```typescript
it('works');
it('test1');
it('provider test');
```

### 3. Arrange-Act-Assert Pattern

Always structure tests with three clear sections:

```typescript
it('should calculate total price correctly', () => {
  // Arrange - Set up test data
  const items = [{ price: 10 }, { price: 20 }];
  const tax = 0.1;

  // Act - Execute the function
  const total = calculateTotal(items, tax);

  // Assert - Verify outcome
  expect(total).toBe(33); // 30 + 10% tax
});
```

### 4. Test Behavior, Not Implementation

✅ **Good** - Tests what code does:

```typescript
it('should display error message when email is invalid', () => {
  render(<LoginForm />);
  fireEvent.change(emailInput, { target: { value: 'invalid' } });
  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

❌ **Bad** - Tests how code does it:

```typescript
it('should call validateEmail function', () => {
  // Don't test internal implementation details
});
```

### 5. Keep Tests Independent

Each test should:

- Run independently of other tests
- Not depend on test execution order
- Clean up after itself
- Not share state with other tests

### 6. Use Test Fixtures and Factories

For complex test data, create reusable factories:

```typescript
// test-utils/factories.ts
function createMockProvider(overrides = {}) {
  return {
    id: 'test-id',
    name: 'Test Provider',
    email: 'test@example.com',
    status: 'ACTIVE',
    ...overrides,
  };
}

// In tests:
const provider = createMockProvider({ status: 'PENDING' });
```

---

## 🛠️ Test Utilities and Helpers

### Check Test Coverage

User can run (optional):

```bash
node workflow/scripts/personal/test-coverage-check.js
```

This will:

- Report current coverage percentage
- Identify files missing tests
- Suggest which tests to add

### Run Specific Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.spec.ts

# Run tests matching pattern
npm test -- --grep "provider"

# Run unit tests only (if configured)
npm run test:unit
```

### Debug Failing Tests

```bash
# Run in headed mode (see browser)
npm run test:headed

# Run in debug mode
npm run test:debug

# Run in UI mode (Playwright UI)
npm run test:ui
```

---

## 🔄 Test Maintenance

### When Tests Need Updating

Update tests when:

- ✅ Requirements change (update test first, then code)
- ✅ Bugs are found (add test to reproduce, then fix)
- ✅ Refactoring (tests should still pass)

### When to Delete Tests

Delete tests only when:

- Feature is completely removed
- Test is redundant (duplicate coverage)
- User explicitly approves deletion

**Never delete failing tests** - fix them instead.

---

## ✅ Test Checklist (Per Sub-Task)

Before marking sub-task complete, verify:

- [ ] I identified what needs testing
- [ ] I determined appropriate test type (unit/E2E)
- [ ] I wrote the test FIRST (before implementation)
- [ ] I ran the test and it FAILED initially
- [ ] I implemented code to make test pass
- [ ] I ran the test again and it PASSES
- [ ] Test covers happy path
- [ ] Test covers at least 2 error scenarios
- [ ] Test covers at least 2 edge cases
- [ ] Test is independent and can run alone
- [ ] Test name is descriptive
- [ ] Test follows AAA pattern (Arrange-Act-Assert)

Only mark sub-task complete when ALL checkboxes are checked.

---

## ✅ Checkpoint Checklist (Per Parent Task)

Before creating checkpoint, verify:

- [ ] All sub-tasks in parent task are complete
- [ ] All tests written for this parent task
- [ ] All tests are passing (unit + E2E)
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] User confirmed satisfaction
- [ ] Created checkpoint commit with proper message
- [ ] Created checkpoint tag with descriptive message
- [ ] Displayed checkpoint info to user

Only create checkpoint when ALL checkboxes are checked.

---

## 🆘 Troubleshooting

**Problem**: "I don't know how to test this"
**Solution**:

1. Break down what the code should do
2. Start with happy path test (normal operation)
3. Ask user: "Should I test [specific behavior]?"
4. Reference existing tests in `/e2e/tests/` for patterns

**Problem**: "Test is too hard to write"
**Solution**:

- Code might be too complex (consider refactoring)
- Consider breaking into smaller functions
- Ask user for guidance on test approach

**Problem**: "Tests are failing after implementation"
**Solution**:

1. Check if test expectations are correct
2. Debug implementation step-by-step
3. Verify test data setup is correct
4. Check for async/timing issues

**Problem**: "Don't know whether to write unit or E2E test"
**Solution**:

- Unit test: For logic, functions, individual components
- E2E test: For complete user journeys, critical paths
- When in doubt: Ask user which type they prefer

---

**Remember**: Tests are not overhead - they are confidence.

Write tests first, implement second, commit with checkpoints.
