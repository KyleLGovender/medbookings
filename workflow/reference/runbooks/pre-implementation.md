# Pre-Implementation Runbook

## Purpose

Verify environment and codebase readiness before starting any feature or issue implementation.
See: `/workflow/scripts/pre-implementation-check.sh`

## Checklist

### 1. Git Status Verification

```bash
# Ensure clean working directory
git status
# Expected: "nothing to commit, working tree clean"

# Verify on correct base branch
git branch --show-current
# Expected: "main" or "develop"

# Pull latest changes
git pull origin main
```

### 2. Build Health Check

```bash
# Full build must pass
npm run build
# Expected: "Build completed successfully"

# Type checking must pass
npm run typecheck
# Expected: "No errors found"

# Linting must pass
npm run lint
# Expected: "No ESLint errors"
```

3. Test Suite Status

```bash
# Run unit tests
npm run test
# Expected: All tests pass

# Check test coverage if applicable
npm run test:coverage
# Expected: Coverage meets threshold (>80%)
```

4. Database Status

```bash
# Verify database is running
docker ps | grep postgres
# Expected: postgres container running

# Check migrations are current
npx prisma migrate status
# Expected: "Database schema is up to date"
```

5. Dependencies Check

```bash
# Verify all dependencies installed
npm list --depth=0
# Expected: No missing dependencies

# Check for security vulnerabilities
npm audit
# Expected: 0 vulnerabilities (or only dev dependencies)
```

6. Environment Variables

```bash
# Verify all required env vars are set
node -e "console.log(Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_') || k.includes('DATABASE')))"
# Expected: All required vars present
```

### Decision Points

- ❌ If build fails → Fix build issues first
- ❌ If tests fail → Investigate and fix failing tests
- ❌ If database out of sync → Run migrations
- ⚠️ If vulnerabilities found → Assess severity, update if critical
- ✅ All checks pass → Proceed with implementation
