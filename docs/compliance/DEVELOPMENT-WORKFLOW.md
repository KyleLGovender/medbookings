# Development Workflow

**Reference:** CLAUDE.md Section 12

## Task Execution Flow

### 1. UNDERSTAND (95% confidence required)

- Analyze architecture
- Ask questions if unclear
- Break down large tasks

### 2. PLAN (get approval)

- Architectural considerations
- Edge cases identification
- File modification list

### 3. IMPLEMENT (complete, no placeholders)

- Verify library syntax first
- Follow existing patterns
- Prefer editing over creating

### 4. VERIFY (automatic)

- Build, lint, type check
- Fix all errors
- Check for console.logs

### 5. CONFIRM (user satisfaction)

- Feature works as requested
- No console errors
- Performance acceptable

## Development Standards

### Forms

- React Hook Form + Zod
- `z.nativeEnum(PrismaEnum)` for enums
- `z.record()` for nested data

### Optimistic Updates

```typescript
onMutate: async (variables) => {
  await queryClient.cancelQueries(['key']);
  const previous = queryClient.getQueryData(['key']);
  queryClient.setQueryData(['key'], optimisticData);
  return { previous };
};
```

### File Conventions

- kebab-case naming
- Direct imports (no barrels)
- Single quotes, semicolons, arrow functions
- 2 spaces, 100 char max lines

## Command Execution Policy

### NEVER execute directly

- `npm run dev`, `npm run test` (interactive/long-running)
- Any interactive or server processes

### ALWAYS execute (for verification)

- `npm run build` (to verify compilation)
- `npm run lint` (to check code quality)
- `npx tsc --noEmit` (to verify types)

### Safe to execute

- Simple file operations
- `grep`, `rg` (ripgrep)

## Database Commands (Reference Only)

```bash
npx prisma generate        # Generate Prisma client
npx prisma db push        # Push schema (development)
npx prisma studio         # Open database GUI
docker compose up         # Start PostgreSQL locally

# NEVER RUN: npx prisma migrate dev (interactive)
```
