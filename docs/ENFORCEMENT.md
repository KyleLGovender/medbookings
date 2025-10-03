# CLAUDE.md Enforcement System

## Overview

This document describes the automated enforcement system that ensures code changes adhere to the rules, patterns, and guidelines specified in [CLAUDE.md](/CLAUDE.md).

**Purpose:** Prevent code violations BEFORE they reach production through multi-layered validation gates.

**Coverage:** ~85-95% of CLAUDE.md rules can be automatically enforced.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Enforcement Layers](#enforcement-layers)
3. [Validation Rules](#validation-rules)
4. [Setup & Installation](#setup--installation)
5. [Usage](#usage)
6. [Troubleshooting](#troubleshooting)
7. [Extending the System](#extending-the-system)

---

## Architecture

The enforcement system uses a **three-layer defense strategy**:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Real-Time IDE Feedback (ESLint)               │
│ ↓ Detects violations as you type                       │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Pre-Commit Hooks (Git Hooks)                  │
│ ↓ Validates changes before git commit                  │
├─────────────────────────────────────────────────────────┤
│ Layer 3: CI/CD Gates (GitHub Actions)                  │
│ ↓ Blocks PRs/pushes with violations                    │
└─────────────────────────────────────────────────────────┘
```

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Core Validator** | Pattern-based code analysis engine | `scripts/claude-code-validator.js` |
| **ESLint Rules** | Real-time IDE feedback | `eslint-rules/claude-compliance.js` |
| **Pre-Commit Hook** | Git commit validation | `.husky/pre-commit` |
| **CI/CD Workflow** | GitHub Actions validation | `.github/workflows/claude-compliance.yml` |
| **Validation Wrappers** | Claude Code agent interception | `scripts/claude-*-validator.sh` |

---

## Enforcement Layers

### Layer 1: Real-Time IDE Feedback (ESLint)

**When:** As you type in your IDE
**What:** 8 custom ESLint rules provide instant feedback
**How:** ESLint plugin with custom rules from `eslint-rules/claude-compliance.js`

**Configured Rules:**

| Rule | Severity | Description |
|------|----------|-------------|
| `no-new-date` | Error | Prevents `new Date()` and `Date.now()` usage |
| `restrict-as-any` | Error | Prevents `as any` type assertions |
| `sanitize-phi-logging` | Warning | Requires PHI sanitization in logger calls |
| `no-cross-feature-imports` | Error | Prevents cross-feature imports |
| `hooks-no-type-exports` | Error | Prevents type exports from hooks |
| `require-zod-validation` | Warning | Requires `.input()` validation in tRPC |
| `require-transaction-for-bookings` | Warning | Requires transactions for bookings |
| `require-take-for-findMany` | Error | Requires pagination for `findMany()` |

**Bypass:** Cannot bypass (design intentional)
**Configuration:** `.eslintrc.json`

---

### Layer 2: Pre-Commit Hooks (Git Hooks)

**When:** Before `git commit` executes
**What:** Validates all staged files against CLAUDE.md rules
**How:** Husky hook runs validator on changed files

**Validation Steps:**

1. **CLAUDE.md Validator** - Pattern-based code analysis
2. **ESLint Check** - Runs ESLint on staged files
3. **TypeScript Check** - Runs `tsc --noEmit`

**Bypass:**
```bash
# Use with caution - only for emergencies
git commit --no-verify
```

**Configuration:** `.husky/pre-commit`

**Example Output:**
```bash
🔍 Running CLAUDE.md compliance validation...

❌ CLAUDE.md Compliance Violations Detected
===========================================

1. [ERROR] TIMEZONE_VIOLATION
   File: src/lib/auth.ts:39
   Use timezone utilities from @/lib/timezone instead of new Date()
   Code: if (user.accountLockedUntil < new Date()) {
   Fix: Replace with nowUTC(), parseUTC(), or date-fns functions
   Reference: /docs/TIMEZONE-GUIDELINES.md

🚫 Commit blocked. Please fix the violations above.
💡 To bypass (not recommended): git commit --no-verify
```

---

### Layer 3: CI/CD Gates (GitHub Actions)

**When:** On push/PR to protected branches
**What:** Comprehensive validation suite runs in CI/CD
**How:** GitHub Actions workflow

**Validation Checks:**

1. **CLAUDE.md Rule Validation** - Validates changed files
2. **ESLint** - Full codebase linting
3. **TypeScript Type Check** - Full type checking
4. **Backup File Detection** - Checks for `*.backup`, `*.bak`, `*.old`
5. **Console Statement Detection** - Checks for `console.*` usage
6. **Timezone Violation Detection** - Checks for `new Date()` usage

**Bypass:** Cannot bypass (protects production)
**Configuration:** `.github/workflows/claude-compliance.yml`

**Triggered On:**
- Push to: `main`, `master`, `develop`, `kyle-dev-branch`
- Pull requests to: `main`, `master`, `develop`

---

## Validation Rules

### Critical Rules (ERROR severity - blocks commit)

#### 1. Timezone Compliance
**Rule:** `TIMEZONE_VIOLATION`
**Pattern:** Detects `new Date()` and `Date.now()`
**Fix:** Use timezone utilities from `@/lib/timezone`

**Allowed:**
```typescript
import { nowUTC, parseUTC, startOfDaySAST } from '@/lib/timezone';

const now = nowUTC();
const expires = addHours(nowUTC(), 24);
const dayStart = startOfDaySAST(new Date());
```

**Forbidden:**
```typescript
❌ const now = new Date();
❌ const timestamp = Date.now();
❌ const expires = new Date(Date.now() + 86400000);
```

**Reference:** [TIMEZONE-GUIDELINES.md](/docs/TIMEZONE-GUIDELINES.md)

---

#### 2. Type Safety
**Rule:** `TYPE_SAFETY_VIOLATION`
**Pattern:** Detects `as any` type assertions
**Fix:** Use proper type guards or type narrowing

**Allowed Files:** `src/lib/auth.ts`, `src/server/trpc.ts`, `src/types/guards.ts`

**Allowed:**
```typescript
// Type guard approach
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}

if (isUser(data)) {
  console.log(data.id); // TypeScript knows this is User
}
```

**Forbidden:**
```typescript
❌ const user = data as any;
❌ return response.data as any;
```

**Reference:** [TYPE-SAFETY.md](/docs/TYPE-SAFETY.md)

---

#### 3. Architecture - Cross-Feature Imports
**Rule:** `CROSS_FEATURE_IMPORT`
**Pattern:** Detects imports from other feature folders
**Fix:** Use shared types or refactor to feature-specific code

**Forbidden:**
```typescript
// In /src/features/admin/components/admin-panel.tsx
❌ import { ProviderCard } from '@/features/providers/components/provider-card';
```

**Allowed:**
```typescript
✅ import { ProviderCard } from '@/components/shared/provider-card'; // Shared component
✅ import type { Provider } from '@/features/providers/types/api-types'; // Type import OK
```

**Reference:** CLAUDE.md Section 3 - Architecture

---

#### 4. Architecture - Hooks Type Exports
**Rule:** `HOOKS_EXPORT_TYPES`
**Pattern:** Detects type exports from hook files
**Fix:** Move types to `/types/api-types.ts`

**Forbidden:**
```typescript
// In /src/features/admin/hooks/use-admin-provider.ts
❌ export type AdminProvider = RouterOutputs['admin']['getProviderById'];

export function useAdminProvider(id: string) {
  return api.admin.getProviderById.useQuery({ id });
}
```

**Allowed:**
```typescript
// In /src/features/admin/types/api-types.ts
✅ export type AdminProvider = RouterOutputs['admin']['getProviderById'];

// In /src/features/admin/hooks/use-admin-provider.ts
✅ export function useAdminProvider(id: string) {
  return api.admin.getProviderById.useQuery({ id });
}
```

**Reference:** CLAUDE.md Section 3 - Type System Architecture

---

#### 5. Database Queries Outside tRPC
**Rule:** `DB_QUERY_OUTSIDE_TRPC`
**Pattern:** Detects Prisma queries outside `/routers/`
**Fix:** Move query to appropriate tRPC router

**Forbidden:**
```typescript
// In /src/features/providers/lib/actions.ts
❌ export async function getProviders() {
  return prisma.provider.findMany();
}
```

**Allowed:**
```typescript
// In /src/server/api/routers/providers.ts
✅ export const providersRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.provider.findMany({ take: 50 });
  }),
});
```

**Reference:** CLAUDE.md Section 3 - Data Flow Architecture

---

#### 6. Unbounded Queries
**Rule:** `UNBOUNDED_QUERY`
**Pattern:** Detects `findMany()` without `take:` limit
**Fix:** Add pagination limit

**Forbidden:**
```typescript
❌ const providers = await ctx.prisma.provider.findMany();
❌ const bookings = await ctx.prisma.booking.findMany({
  where: { providerId }
});
```

**Allowed:**
```typescript
✅ const providers = await ctx.prisma.provider.findMany({
  take: input.take || 50,
  skip: input.skip || 0
});
```

**Reference:** CLAUDE.md Section 9 - Performance

---

### Warning Rules (WARNING severity - allows commit)

#### 7. PHI Sanitization in Logging
**Rule:** `POTENTIAL_PHI_LEAK`
**Pattern:** Detects potential unsanitized PHI in logger calls
**Fix:** Use sanitization helpers from `@/lib/logger`

**Allowed:**
```typescript
import { logger, sanitizeEmail, sanitizePhone, sanitizeName } from '@/lib/logger';

✅ logger.info('User registered', {
  email: sanitizeEmail(user.email),
  name: sanitizeName(user.name)
});

✅ logger.audit('Booking created', {
  patientName: sanitizeName(booking.guestName),
  patientPhone: sanitizePhone(booking.guestPhone)
});
```

**Forbidden:**
```typescript
❌ logger.info('User registered', { email: user.email }); // Raw email
❌ logger.error('Booking failed', { phone: user.phone }); // Raw phone
```

**Reference:** [LOGGING.md](/docs/LOGGING.md)

---

#### 8. Zod Validation in tRPC
**Rule:** `MISSING_ZOD_VALIDATION`
**Pattern:** Detects tRPC procedures without `.input()` validation
**Fix:** Add Zod schema validation

**Allowed:**
```typescript
✅ export const providersRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.provider.findUnique({ where: { id: input.id } });
    }),
});
```

**Forbidden:**
```typescript
❌ export const providersRouter = createTRPCRouter({
  getById: publicProcedure
    .query(async ({ ctx, input }) => { // Missing .input()
      return ctx.prisma.provider.findUnique({ where: { id: input.id } });
    }),
});
```

**Reference:** CLAUDE.md Section 3 - API Pattern

---

#### 9. Booking Transactions
**Rule:** `BOOKING_WITHOUT_TRANSACTION`
**Pattern:** Detects booking operations without transactions
**Fix:** Wrap in `prisma.$transaction()`

**Allowed:**
```typescript
✅ await ctx.prisma.$transaction(async (tx) => {
  const slot = await tx.slot.findUnique({ where: { id } });
  if (slot.status !== 'AVAILABLE') throw new Error('Slot unavailable');

  await tx.booking.create({ data: bookingData });
  await tx.slot.update({ where: { id }, data: { status: 'BOOKED' } });
});
```

**Forbidden:**
```typescript
❌ const slot = await ctx.prisma.slot.findUnique({ where: { id } });
if (slot.status !== 'AVAILABLE') throw new Error('Slot unavailable');
await ctx.prisma.booking.create({ data: bookingData });
```

**Reference:** CLAUDE.md Section 7 - Booking Integrity Pattern

---

## Setup & Installation

### One-Command Setup

```bash
npm run setup-enforcement
```

This runs `scripts/setup-enforcement.sh` which:
1. Installs dependencies (husky, eslint-plugin-rulesdir)
2. Initializes git hooks
3. Makes scripts executable
4. Validates configuration
5. Runs test validation

### Manual Setup

If you need to set up manually:

```bash
# 1. Install dependencies
npm install --save-dev husky eslint-plugin-rulesdir

# 2. Initialize Husky
npx husky init

# 3. Make scripts executable
chmod +x scripts/claude-code-validator.js
chmod +x scripts/claude-pre-write-validator.sh
chmod +x scripts/claude-post-write-validator.sh
chmod +x .husky/pre-commit

# 4. Verify ESLint configuration
npx eslint --print-config src/lib/auth.ts | grep rulesdir

# 5. Run test validation
node scripts/claude-code-validator.js validate-file src/lib/auth.ts
```

---

## Usage

### For Developers

**Normal workflow - no changes required:**

```bash
# 1. Make code changes
vim src/features/providers/hooks/use-provider.ts

# 2. Stage changes
git add src/features/providers/hooks/use-provider.ts

# 3. Commit (pre-commit hook runs automatically)
git commit -m "feat: add provider hook"

# If violations detected:
# - Fix the violations
# - Stage fixes
# - Commit again
```

**ESLint integration:**

Your IDE (VS Code, etc.) will show violations in real-time if you have ESLint extension installed.

**Manual validation:**

```bash
# Validate a single file
node scripts/claude-code-validator.js validate-file src/lib/auth.ts

# Validate changes to a file
node scripts/claude-code-validator.js validate-change \
  src/lib/auth.ts \
  /path/to/old/version.ts \
  /path/to/new/version.ts
```

---

### For Claude Code Agent

The enforcement system automatically intercepts Claude Code's file modifications.

**Workflow:**

1. Claude Code attempts to edit/write a file
2. Pre-write validator runs BEFORE disk write
3. If violations detected: write is blocked, Claude sees error
4. If valid: write proceeds
5. Post-write validator runs (additional safety check)

**Claude Code will see:**

```
❌ CLAUDE.md COMPLIANCE VIOLATION DETECTED
===========================================

1. [ERROR] TIMEZONE_VIOLATION
   File: src/lib/auth.ts:39
   Use timezone utilities from @/lib/timezone instead of new Date()
   ...

🚫 File write BLOCKED by pre-write validator
💡 Please fix the violations above before proceeding
```

---

## Troubleshooting

### "Pre-commit hook not running"

**Cause:** Git hooks not installed or not executable

**Fix:**
```bash
npx husky init
chmod +x .husky/pre-commit
```

---

### "ESLint rules not found"

**Cause:** `eslint-plugin-rulesdir` not installed or misconfigured

**Fix:**
```bash
npm install --save-dev eslint-plugin-rulesdir

# Verify configuration
npx eslint --print-config src/lib/auth.ts | grep rulesdir
```

---

### "False positive - rule incorrectly flagging code"

**Cause:** Validation pattern too broad

**Fix:**
1. Check if file should be whitelisted (e.g., `auth.ts` for `as any`)
2. Update validator whitelist in `scripts/claude-code-validator.js`
3. Update ESLint rule in `eslint-rules/claude-compliance.js`

**Example:**
```javascript
// In scripts/claude-code-validator.js
validateTypeSafety(addedLines, filePath) {
  const whitelist = [
    'src/lib/auth.ts',
    'src/server/trpc.ts',
    'src/types/guards.ts',
    'src/your/new/file.ts' // Add here
  ];
  // ...
}
```

---

### "Bypass pre-commit hook for emergency"

**When:** Critical hotfix needed, violations will be fixed in follow-up PR

**How:**
```bash
git commit --no-verify -m "hotfix: critical production issue"
```

**⚠️ WARNING:** CI/CD will still block if violations exist. Use sparingly.

---

### "CI/CD workflow failing"

**Cause:** Changed files have violations

**Fix:**
1. Run locally to see exact violations:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```
2. Fix violations
3. Commit fixes
4. Push again

---

## Extending the System

### Adding New Validation Rules

**1. Add validator in `scripts/claude-code-validator.js`:**

```javascript
validateMyNewRule(addedLines, filePath) {
  addedLines.forEach((line, idx) => {
    if (/forbidden-pattern/.test(line)) {
      this.violations.push({
        severity: 'ERROR',
        rule: 'MY_NEW_RULE',
        file: filePath,
        line: idx + 1,
        content: line.trim(),
        message: 'Description of violation',
        fix: 'How to fix it',
        reference: '/docs/REFERENCE.md',
      });
    }
  });
}
```

**2. Add ESLint rule in `eslint-rules/claude-compliance.js`:**

```javascript
module.exports = {
  'my-new-rule': {
    meta: {
      type: 'error',
      docs: {
        description: 'Rule description',
        category: 'CLAUDE.md Compliance',
        recommended: true,
      },
      messages: {
        violation: 'Error message',
      },
    },
    create(context) {
      return {
        // AST visitor pattern
        Identifier(node) {
          if (node.name === 'forbiddenThing') {
            context.report({ node, messageId: 'violation' });
          }
        },
      };
    },
  },
};
```

**3. Enable rule in `.eslintrc.json`:**

```json
{
  "rules": {
    "rulesdir/my-new-rule": "error"
  }
}
```

**4. Test the rule:**

```bash
# Create test file with violation
echo "const forbiddenThing = 1;" > test-violation.ts

# Run validator
node scripts/claude-code-validator.js validate-file test-violation.ts

# Run ESLint
npx eslint test-violation.ts

# Clean up
rm test-violation.ts
```

---

### Adding Whitelisted Files

**For validator:**

Edit `scripts/claude-code-validator.js`:

```javascript
validateTimezone(addedLines, filePath) {
  if (filePath.includes('timezone.ts') ||
      filePath.includes('env/server.ts') ||
      filePath.includes('.test.') ||
      filePath.includes('your-new-file.ts')) { // Add here
    return;
  }
  // ... rest of validation
}
```

**For ESLint:**

Edit `eslint-rules/claude-compliance.js`:

```javascript
'no-new-date': {
  create(context) {
    const filename = context.getFilename();
    const allowedFiles = [
      'timezone.ts',
      'env/server.ts',
      '.test.',
      'your-new-file.ts' // Add here
    ];
    // ... rest of rule
  }
}
```

---

## Coverage Summary

### Automated Enforcement (~85%)

✅ **Fully Automated:**
- Timezone compliance (`new Date()`, `Date.now()`)
- Type safety (`as any`, `@ts-ignore`)
- Console usage (all `console.*`)
- PHI sanitization in logs
- Cross-feature imports
- Hooks type exports
- Database queries outside tRPC
- Unbounded queries (`findMany` without `take`)
- Backup file detection
- Code formatting (ESLint/Prettier)
- TypeScript strict mode
- File/folder naming conventions

### Manual Review Required (~10%)

⚠️ **Guided (warnings, reminders):**
- Zod validation completeness
- Transaction usage for bookings
- PHI exposure in API responses
- Security context (authorization checks)
- Business logic correctness
- Error handling patterns

### Cannot Automate (~5%)

❌ **Requires Human Judgment:**
- Architecture decisions
- Feature decomposition
- UX/UI patterns
- Performance optimization strategies
- Test coverage strategy

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review false positives
- Update whitelists if needed
- Check CI/CD workflow success rate

**Monthly:**
- Review new CLAUDE.md rules
- Add validators for new patterns
- Update documentation

**Per Sprint:**
- Validate enforcement coverage for new features
- Add feature-specific rules if needed

---

## Related Documentation

- [CLAUDE.md](/CLAUDE.md) - Complete coding guidelines
- [TIMEZONE-GUIDELINES.md](/docs/TIMEZONE-GUIDELINES.md) - Timezone handling
- [TYPE-SAFETY.md](/docs/TYPE-SAFETY.md) - Type system patterns
- [LOGGING.md](/docs/LOGGING.md) - Logging and PHI protection

---

## Support

**Issues:** File bug reports at GitHub Issues
**Questions:** Ask in team chat or code reviews
**Improvements:** Submit PRs for new rules or enhancements
