# Bug Detection Patterns

**Reference:** CLAUDE.md Section 10

## React Issues

### Memory Leak Pattern - DETECT & FIX

```typescript
// ❌ WRONG - Memory leak
useEffect(() => {
  const timer = setInterval(...);
  // MISSING: return () => clearInterval(timer);
}, []);

// ✅ CORRECT
useEffect(() => {
  const timer = setInterval(...);
  return () => clearInterval(timer); // Cleanup
}, []);
```

### Infinite Loop Pattern - PREVENT

```typescript
// ❌ WRONG - Infinite loop
useEffect(() => {
  setState(value);  // Causes re-render
}, [value]);  // Dependency causes loop

// ✅ CORRECT
useEffect(() => {
  // Only update if condition met
  if (shouldUpdate) {
    setState(value);
  }
}, [value, shouldUpdate]);
```

## Database Issues

### N+1 Problem - NEVER ALLOW

```typescript
// ❌ WRONG - N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({  // BAD
    where: { userId: user.id }
  });
}

// ✅ CORRECT - Single query with include
const users = await prisma.user.findMany({
  include: { posts: true }
});
```

### Race Condition - USE TRANSACTIONS

```typescript
// ❌ WRONG - Race condition
const slot = await prisma.slot.findUnique(...);
if (slot.available) {  // BAD: No locking
  await prisma.booking.create(...);
}

// ✅ CORRECT - Transaction with locking
await prisma.$transaction(async (tx) => {
  const slot = await tx.slot.findUnique({ where: { id } });
  if (slot.status !== 'AVAILABLE') throw new Error('Unavailable');
  await tx.booking.create(...);
  await tx.slot.update({ where: { id }, data: { status: 'BOOKED' } });
});
```

## Debugging Protocol

1. **REPRODUCE**: Follow exact user click path
2. **TRACE**: Follow complete data and navigation flow
3. **VERIFY**: Check if routes/APIs actually exist
4. **IDENTIFY**: Distinguish between mock and real data
5. **MONITOR**: Watch terminal for unusual patterns
6. **REPORT**: List all findings with specific file:line numbers

## Red Flags Priority

🔴 **CRITICAL**: Authentication bypass, SQL injection, exposed credentials, PHI in logs

🟠 **HIGH**: Race conditions, infinite loops, API calls firing continuously

🟡 **MEDIUM**: Missing validation, no error handling, hardcoded data
