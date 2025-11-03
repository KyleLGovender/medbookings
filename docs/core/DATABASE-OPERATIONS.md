# Database Operations Guide

This guide covers database operations best practices, patterns, and common operations for the MedBookings application.

**Stack**: PostgreSQL + Prisma ORM + tRPC
**Last Updated**: 2025-11-02

---

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Query Patterns](#query-patterns)
3. [Transactions](#transactions)
4. [Performance Optimization](#performance-optimization)
5. [Common Operations](#common-operations)
6. [Troubleshooting](#troubleshooting)

---

## Database Architecture

### Connection

**Database**: PostgreSQL (Neon, Supabase, or local Docker)
**ORM**: Prisma
**Connection Pooling**: Prisma handles automatically

```typescript
// Connection configured in src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

### Schema Location

- **Source of Truth**: `/prisma/schema.prisma`
- **Migrations**: `/prisma/migrations/`
- **Seed Data**: `/prisma/seed.mts`

---

## Query Patterns

### REQUIRED: Always Use `take` for findMany

❌ **FORBIDDEN** (N+1 Risk):
```typescript
// DON'T DO THIS - unbounded query
const providers = await prisma.provider.findMany();
```

✅ **CORRECT** (Pagination):
```typescript
// Minimum 20 items, maximum depends on use case
const providers = await prisma.provider.findMany({
  take: 20, // REQUIRED - prevents loading entire table
  skip: page * 20, // For pagination
  orderBy: { createdAt: 'desc' },
});
```

**From CLAUDE.md**:
> ALWAYS use `take:` for ALL `prisma.*.findMany()` queries (min 20 items)

### Relations and Includes

**Include Related Data**:
```typescript
const provider = await prisma.provider.findUnique({
  where: { id: providerId },
  include: {
    user: true, // Join with User table
    services: {
      // Nested relations
      include: {
        service: true,
      },
    },
    availability: {
      where: {
        status: 'ACCEPTED',
      },
      take: 50, // ALWAYS add take to nested relations too
    },
  },
});
```

**Select Specific Fields** (Performance):
```typescript
// Only fetch what you need
const provider = await prisma.provider.findMany({
  take: 20,
  select: {
    id: true,
    firstName: true,
    lastName: true,
    user: {
      select: {
        email: true,
      },
    },
  },
});
```

---

## Transactions

### When to Use Transactions

Use `prisma.$transaction()` for:
- Multi-table operations that must succeed or fail together
- Operations with race conditions (e.g., booking slots)
- Atomic state changes across multiple records

### Transaction Pattern

```typescript
// CORRECT: Use transaction for multi-table updates
await prisma.$transaction(async (tx) => {
  // 1. Check availability
  const slot = await tx.slot.findUnique({
    where: { id: slotId },
  });

  if (!slot || slot.status !== 'AVAILABLE') {
    throw new Error('Slot not available');
  }

  // 2. Create booking
  const booking = await tx.booking.create({
    data: {
      slotId,
      userId,
      status: 'CONFIRMED',
    },
  });

  // 3. Update slot
  await tx.slot.update({
    where: { id: slotId },
    data: { status: 'BOOKED' },
  });

  return booking;
}, {
  maxWait: 10000, // 10s max wait to acquire transaction
  timeout: 20000, // 20s max execution time
});
```

### Preventing Race Conditions

```typescript
// CORRECT: Lock with transaction
await prisma.$transaction(async (tx) => {
  // Read-then-write in same transaction prevents race conditions
  const resource = await tx.resource.findUnique({ where: { id } });

  if (resource.count > 0) {
    await tx.resource.update({
      where: { id },
      data: { count: resource.count - 1 },
    });
  }
});
```

**From CLAUDE.md**:
> Use `prisma.$transaction()` for multi-table operations

---

## Performance Optimization

### 1. Prevent N+1 Queries

❌ **BAD** (N+1 Problem):
```typescript
const users = await prisma.user.findMany({ take: 100 });

// This runs 100 separate queries!
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { userId: user.id },
  });
}
```

✅ **GOOD** (Single Query):
```typescript
const users = await prisma.user.findMany({
  take: 100,
  include: {
    posts: {
      take: 10, // Limit nested results
    },
  },
});
```

### 2. Use Indexes

**Check Schema** (`prisma/schema.prisma`):
```prisma
model Provider {
  id String @id @default(cuid())
  email String @unique // Automatically indexed
  firstName String
  lastName String

  @@index([lastName, firstName]) // Composite index for search
  @@index([createdAt]) // Index for sorting
}
```

**Add Index** (if needed):
```bash
# Create migration
npx prisma migrate dev --name add_provider_name_index
```

### 3. Connection Pooling

Prisma automatically pools connections. Configure in `DATABASE_URL`:

```bash
# Recommended for serverless (Vercel)
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=60"
```

### 4. Query Optimization

**Use `where` Filters**:
```typescript
// Filter at database level, not in code
const activeProviders = await prisma.provider.findMany({
  where: {
    status: 'APPROVED',
    user: {
      role: 'PROVIDER',
    },
  },
  take: 20,
});
```

**Avoid Loading Large Fields**:
```typescript
// Don't load large text/JSON fields unless needed
const providers = await prisma.provider.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    // DON'T include large fields like 'bio', 'documents' unless needed
  },
  take: 20,
});
```

---

## Common Operations

### Create Record

```typescript
const provider = await prisma.provider.create({
  data: {
    firstName: 'John',
    lastName: 'Doe',
    user: {
      connect: { id: userId }, // Link to existing user
    },
    services: {
      create: [
        // Create nested records
        {
          service: { connect: { id: serviceId } },
          price: 500,
        },
      ],
    },
  },
});
```

### Update Record

```typescript
const provider = await prisma.provider.update({
  where: { id: providerId },
  data: {
    status: 'APPROVED',
    approvedAt: nowUTC(), // From @/lib/timezone
  },
});
```

### Delete Record (Soft Delete Recommended)

```typescript
// Soft delete (recommended for audit trail)
await prisma.provider.update({
  where: { id: providerId },
  data: {
    deletedAt: nowUTC(),
    status: 'DELETED',
  },
});

// Hard delete (use sparingly)
await prisma.provider.delete({
  where: { id: providerId },
});
```

### Batch Operations

```typescript
// Update multiple records
await prisma.provider.updateMany({
  where: {
    status: 'PENDING_APPROVAL',
    createdAt: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  },
  data: {
    status: 'EXPIRED',
  },
});
```

### Count Records

```typescript
const count = await prisma.provider.count({
  where: {
    status: 'APPROVED',
  },
});
```

### Search Pattern

```typescript
const results = await prisma.provider.findMany({
  where: {
    OR: [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { user: { email: { contains: query, mode: 'insensitive' } } },
    ],
  },
  take: 20,
});
```

---

## Troubleshooting

### Issue: "Too many connections"

**Cause**: Connection pool exhausted
**Solution**:
```bash
# Reduce connection limit
DATABASE_URL="postgresql://...?connection_limit=5"

# Or increase on database side (Neon/Supabase settings)
```

### Issue: Slow Queries

**Debug**:
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Fix**:
- Add indexes to frequently queried columns
- Use `select` to fetch only needed fields
- Check for N+1 queries
- Use database query analyzer (Neon Insights, pgAdmin)

### Issue: Transaction Timeout

**Error**: `Transaction already closed`
**Cause**: Transaction exceeded 20s timeout
**Fix**:
```typescript
await prisma.$transaction(async (tx) => {
  // Optimize queries inside transaction
}, {
  timeout: 30000, // Increase if genuinely needed
});
```

### Issue: Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`
**Fix**:
```bash
npx prisma generate
```

---

## Best Practices Summary

1. ✅ **Always use `take`** for `findMany()` (min 20 items)
2. ✅ **Use transactions** for multi-table operations
3. ✅ **Prevent N+1 queries** with `include` or `select`
4. ✅ **Use indexes** for frequently queried fields
5. ✅ **Filter at database level** with `where`, not in code
6. ✅ **Use UTC timezone** (see `/docs/compliance/TIMEZONE-GUIDELINES.md`)
7. ✅ **Sanitize PHI** in logs (see `/docs/compliance/LOGGING.md`)
8. ✅ **Validate inputs** with Zod before database operations
9. ✅ **Use soft deletes** for audit trail
10. ✅ **Test with production-like data** volume

---

## Related Documentation

- `/prisma/schema.prisma` - Database schema (source of truth)
- `/docs/guides/DEVELOPER-PRINCIPLES.md` - Section 6: Database Operations
- `/docs/compliance/TIMEZONE-GUIDELINES.md` - Timezone handling
- `/docs/compliance/LOGGING.md` - PHI sanitization
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**Questions?** Check [CLAUDE.md](/CLAUDE.md) Section 12 or ask in team chat.
