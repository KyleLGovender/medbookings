# Verification Protocols

**Reference:** CLAUDE.md Section 6

## Route & Navigation Validation

```bash
# Find all valid routes
find app -type f -name "page.tsx" | sed 's/page.tsx//' | sort

# Verify ALL href targets exist
grep -r "href=\|navigate\|push(" --include="*.tsx" | grep -v "^//" | sort -u

# Verify middleware coverage
cat src/middleware.ts | grep "matcher:"
```

## Data Source Verification

```bash
# Find mock/hardcoded data
grep -r "Mock\|TODO\|hardcoded\|placeholder" --include="*.tsx"

# Security scan
grep -r "console\.(log|error|warn)" --include="*.ts*" | grep -v "// eslint-ignore"

# Find type safety issues
grep -r "any\|as any" --include="*.ts*"
```

## Performance & API Monitoring

```bash
# Find N+1 queries
grep -r "findMany.*include" --include="*.ts" -A 5

# Check for missing pagination
grep -r "findMany" --include="*.ts" | grep -v "take:"

# Find polling patterns
grep -r "useQuery.*{" -A 5 | grep -E "(refetch|poll|interval)"
```

## Build Error Resolution Protocol

1. Run npm run build to see full error output
2. Provide a detailed analysis of what the error output is and generate a plan to address it
3. Fix identified errors systematically (not trial-and-error)
4. Re-run build after each fix and code edit
5. Continue until build passes completely
6. Never proceed with failing or timed-out build
7. Never proceed with errors still present

Build verification is mandatory before:
- User creates PRs
- Marking tasks complete
- Moving to next implementation phase
