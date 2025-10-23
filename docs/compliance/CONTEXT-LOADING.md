# Context Loading Protocol

**Reference:** CLAUDE.md Section 2

## Efficient Context Loading (NEW - 98% Token Reduction)

**For comprehensive codebase analysis**, use the optimized workflow:

### Step 1: Read Context Document
```
/docs/claude-agent-context/CLAUDE-AGENT-CONTEXT.md (~2K tokens)
```
This file contains:
- Quick statistics and overview
- Critical files index (15 files)
- Architecture summary
- Database schema overview (30+ models)
- Feature modules index (12 features)
- API routers overview (10 routers)
- UI components catalog (47+ components)
- Compliance system patterns
- Recent changes log

### Step 2: Batch-Read Critical Files
Use `mcp__filesystem-server__read_multiple_files` (~10K tokens):
```typescript
[
  'prisma/schema.prisma',
  'src/lib/auth.ts',
  'src/server/trpc.ts',
  'src/server/api/root.ts',
  'src/utils/api.ts',
  'src/middleware.ts',
  'CLAUDE.md'
]
```

### Step 3: Pattern Verification via Grep (~2K tokens)
```bash
Grep: 'createTRPCRouter'          # Count API routers
Grep: 'enum.*Status'              # Find status enums
Grep: 'export const.*Procedure'   # Find tRPC procedures
```

### Step 4: On-Demand Reading (~1K tokens)
Read specific files only when needed for the current task.

**Total: ~15K tokens (vs 82K with old approach)**

### Maintenance
- **After changes**: Update relevant sections in `/docs/claude-agent-context/CLAUDE-AGENT-CONTEXT.md`
- **Periodic refresh**: Run full re-scan every ~20 conversations
- **User command**: "refresh the codebase context" triggers full update

---

## Initial Context Loading (Traditional Approach)

### Architecture Foundation
- `/src/app/layout.tsx` - App structure and providers
- `/prisma/schema.prisma` - Database schema (source of truth)
- `/src/server/api/root.ts` - API routes overview
- `/package.json` - Dependencies and scripts
- `/src/lib/auth.ts` - Authentication configuration

### Type System Overview
- `/src/utils/api.ts` - tRPC client setup and type exports
- `/src/server/trpc.ts` - tRPC context and middleware

## Feature-Specific Context Loading

When working on a specific feature, read ALL of:

```
/src/features/[feature]/
├── components/*    # All UI components
├── hooks/*        # Custom hooks and API calls
├── lib/*          # Server actions and utilities
└── types/*        # Type definitions, schemas, guards

/src/server/api/routers/[feature].ts  # tRPC procedures
```

## Task-Type Specific Context

| Task Type        | Read First                                   | Then Read                                           |
|------------------|----------------------------------------------|-----------------------------------------------------|
| Database changes | `/prisma/schema.prisma`                      | Previous migrations, affected tRPC routers          |
| New API endpoint | `/src/server/api/root.ts`, `/src/server/trpc.ts` | Similar existing routers for patterns       |
| UI components    | `/src/components/ui/` directory listing      | Parent components, related feature components       |
| Authentication   | `/src/lib/auth.ts`, `/src/middleware.ts`     | Auth-related procedures in routers                  |
| Forms            | Existing form patterns in feature            | Related schemas in `/src/features/*/types/schemas.ts` |
| Error handling   | tRPC error patterns in `/src/server/trpc.ts` | Error boundaries, tRPC error handling               |
| Type errors      | Type definitions in feature folder           | `/src/utils/api.ts` for tRPC types                  |
| Testing          | `/e2e/tests/` for existing patterns          | Related feature test files                          |
| Styling          | `/src/app/globals.css`, `tailwind.config.ts` | Component-specific styles                           |
| Performance      | Current implementation files                 | `/src/lib/utils.ts` for optimization utilities      |

## Integration Points

- Calendar utilities → `/src/features/calendar/lib/`
- Email/SMS → `/src/lib/communications/`
- File uploads → `/src/app/api/upload/`
- Payments → `/src/features/billing/`

## Context Management Rules

### Historical Context
```bash
git log -3 --oneline -- [file-path]
```

### Cross-Feature Dependencies
1. Import analysis: What does this feature import?
2. Export analysis: What exports are used elsewhere?
3. Database relations: What related entities exist?
4. Shared hooks: What shared utilities are used?

### Smart Context Patterns
- Pattern match similar functionality first
- Follow dependency trees through imports
- Review database impact (schema, indexes, queries)
- Trace type flow: Prisma → tRPC → API export → Component

### Context Efficiency

**DO NOT READ** (skip these entirely):
- Files and folders specified in `.claudeignore`
- Test files (unless writing/fixing tests)
- Built/generated files (`.next/`, `node_modules/`)

**ALWAYS READ ENTIRE FILES:**
- Files you're modifying
- Files importing your modifications
- Files exporting what you're using
- Type definitions for handled data
