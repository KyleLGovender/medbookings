# Context Loading Protocol

**Reference:** CLAUDE.md Section 2

## Initial Context Loading (ALWAYS READ)

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
