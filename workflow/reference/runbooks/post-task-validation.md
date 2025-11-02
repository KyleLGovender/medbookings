# Post-Task Validation Runbook

## Purpose

Validate that each completed task meets quality standards before marking complete.

## Per-Task Validation

### After Code Implementation Tasks

#### 1. Code Quality Checks

```bash
# Lint the modified files
npx eslint [modified-files]
# Expected: No errors, only warnings acceptable

# Type check specific feature
npx tsc --noEmit --project tsconfig.json
# Expected: No type errors

# Format check
npx prettier --check [modified-files]
# Expected: All files formatted
```

#### 2. Functionality Verification

[ ] Feature works as specified in task description
[ ] All acceptance criteria met
[ ] No console errors in browser
[ ] No unhandled promise rejections
[ ] Loading states display correctly
[ ] Error states handle gracefully

#### 3. Test Coverage

```bash
# Run tests for modified code
npm run test -- [test-file-pattern]
# Expected: All tests pass

# Check if new tests needed
git diff --name-only | grep -E '\.(ts|tsx)$' | grep -v test
# Action: Each new file should have corresponding test
```

#### 4. Performance Impact

```bash
# Build size check
npm run build
# Compare: Bundle size shouldn't increase >5% without justification

# Check for performance anti-patterns
grep -r "useEffect.*\[\]" [modified-files]
# Review: Ensure no missing dependencies
```

### After API/Database Tasks

#### 1. API Validation

```bash
# Test new endpoints manually
curl -X POST http://localhost:3000/api/trpc/[procedure] \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Expected: Successful response

# Check error handling
# Send invalid data and verify graceful error response
```

#### 2. Database Integrity

```bash
# Verify migrations if schema changed
npx prisma migrate dev --name [task-description]
# Expected: Migration created and applied

# Check for N+1 queries
# Review database query logs during feature use
```

### After UI Component Tasks

#### 1. Visual Validation

[ ] Component renders correctly at all breakpoints
[ ] Dark mode compatibility (if applicable)
[ ] Accessibility: keyboard navigation works
[ ] Accessibility: screen reader compatible
[ ] No layout shifts during loading

#### 2. Browser Testing

```bash
# Cross-browser check
# Test in: Chrome, Firefox, Safari, Edge
# Mobile: iOS Safari, Chrome Android
```

### Completion Criteria

#### Must Pass (Blocking):

- ✅ Build compiles without errors
- ✅ No TypeScript errors
- ✅ All tests pass
- ✅ Core functionality works

#### Should Pass (Non-blocking but flag):

- ⚠️ No new ESLint warnings
- ⚠️ Code coverage maintained or improved
- ⚠️ Bundle size within limits
- ⚠️ Performance benchmarks met

### Rollback Procedure

If validation fails after marking complete:

```bash
# Revert to last known good state
git reset --hard HEAD~1

# Or create a fix commit
git commit -m "fix: Resolve validation failures in [task]"
```

### Documentation Check

[ ] Inline comments added where needed
[ ] Complex logic documented
[ ] API changes documented
[ ] README updated if user-facing change

### MedBookings Domain Checks

#### Provider Management

- [ ] No overlapping availability windows for same provider
- [ ] All availability records have valid start/end times
- [ ] Provider status changes don't orphan bookings

#### Booking Integrity

- [ ] No double bookings on same slot
- [ ] All bookings linked to valid slots
- [ ] Guest bookings have required contact information
- [ ] Booking status transitions are valid

#### Calendar Consistency

- [ ] Calculated slots match availability rules
- [ ] Slot durations consistent per provider
- [ ] Past slots marked as unavailable
- [ ] Future slot generation working

#### Notification Pipeline

- [ ] Booking confirmations queued
- [ ] Provider notifications sent
- [ ] Failed notifications logged
- [ ] Retry mechanism functioning
