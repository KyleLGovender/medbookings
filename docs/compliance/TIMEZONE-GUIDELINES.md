# Timezone Handling Guidelines

**Last Updated**: 2025-10-02 (Sprint 4)
**Status**: Production Standard
**Compliance**: CRITICAL for booking data integrity

---

## 🎯 Overview

This guide establishes **mandatory timezone handling patterns** for the MedBookings application. All date/time operations MUST follow these guidelines to prevent booking errors and ensure data integrity.

**Location**: South Africa (Africa/Johannesburg)
**Timezone**: SAST (South African Standard Time) = **UTC+2**
**Daylight Saving**: None (offset is constant year-round)

---

## 🏗️ Architecture

### Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Client    │────────▶│    Server    │────────▶│   Database   │
│ (SAST/Local)│         │ (Conversion) │         │    (UTC)     │
└─────────────┘         └──────────────┘         └──────────────┘
      ▲                                                   │
      └───────────────────────────────────────────────────┘
                    Display (convert UTC → SAST)
```

### Storage Rules

1. **Database**: ALL dates stored in **UTC** (PostgreSQL `timestamptz`)
2. **Client Input**: Received in **local time** (SAST for South African users)
3. **Server Processing**: Convert to **UTC** before database operations
4. **Client Display**: Convert from **UTC** to **SAST**

---

## 📚 Available Utilities

**Location**: `/src/lib/timezone.ts`

### Core Functions

| Function                   | Purpose                      | Returns  | Use Case                             |
| -------------------------- | ---------------------------- | -------- | ------------------------------------ |
| `nowUTC()`                 | Current UTC time             | `Date`   | Server timestamps, "now" comparisons |
| `nowSAST()`                | Current SAST time            | `Date`   | Client-side "now" display            |
| `parseUTC(string)`         | Parse ISO string to UTC Date | `Date`   | Convert client ISO strings           |
| `startOfDaySAST(date)`     | Get start of SAST day in UTC | `Date`   | Date range query start               |
| `endOfDaySAST(date)`       | Get end of SAST day in UTC   | `Date`   | Date range query end                 |
| `formatSAST(date, format)` | Format date in SAST          | `string` | Display dates to users               |
| `toUTC(date)`              | Convert local Date to UTC    | `Date`   | Manual conversions                   |
| `fromUTC(date)`            | Convert UTC Date to SAST     | `Date`   | Manual conversions                   |

### Zod Schemas

**Location**: `/src/lib/timezone-schemas.ts`

| Schema                  | Purpose                             |
| ----------------------- | ----------------------------------- |
| `dateStringUTC`         | Auto-convert ISO string to UTC Date |
| `dateStringOptionalUTC` | Optional date with UTC conversion   |

---

## ✅ Correct Patterns

### Pattern 1: Current Time Comparisons

```typescript
import { nowUTC } from '@/lib/timezone';

// ✅ CORRECT - Server-side comparison
if (slot.startTime <= nowUTC()) {
  throw new Error('Cannot book past slot');
}

// ✅ CORRECT - Filter future items
where: {
  endTime: {
    gte: nowUTC();
  }
}

// ❌ WRONG - Direct Date constructor
if (slot.startTime <= new Date()) {
  // This might be 2 hours off due to timezone!
}
```

### Pattern 2: Date Range Queries

```typescript
import { endOfDaySAST, startOfDaySAST } from '@/lib/timezone';

// ✅ CORRECT - Query for all availabilities on a specific SAST day
const availabilities = await prisma.availability.findMany({
  where: {
    startTime: { gte: startOfDaySAST(date) },
    endTime: { lte: endOfDaySAST(date) },
  },
});

// ❌ WRONG - Using Date methods directly
const start = new Date(date);
start.setHours(0, 0, 0, 0); // This is in local time, not UTC!
```

### Pattern 3: Token/Invitation Expiry

```typescript
import { nowUTC } from '@/lib/timezone';
import { addHours } from 'date-fns';

// ✅ CORRECT - UTC-based expiry
const expires = addHours(nowUTC(), 24); // 24 hours from now (UTC)

await prisma.emailVerificationToken.create({
  data: { token, expires },
});

// ❌ WRONG - Direct Date arithmetic
const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
```

### Pattern 4: Client-Side Date Display

```typescript
// ✅ BEST - Use date-fns with timezone
import { format } from 'date-fns';

import { formatSAST } from '@/lib/timezone';

// ✅ CORRECT - Format UTC date for display
{
  formatSAST(availability.startTime, 'PPpp');
}
// Output: "Jan 1, 2025 at 2:00 PM" (SAST)

// ✅ ACCEPTABLE - Browser locale (may vary)
{
  new Date(availability.startTime).toLocaleDateString();
}

{
  format(new Date(availability.startTime), 'PPpp');
}
```

### Pattern 5: Client-Side Date Range Construction

```typescript
import { nowSAST, startOfDaySAST, endOfDaySAST } from '@/lib/timezone';
import { addDays } from 'date-fns';

// ✅ CORRECT - Client-side date range
const now = nowSAST();
const startDate = startOfDaySAST(addDays(now, -7)); // Past week
const endDate = endOfDaySAST(addDays(now, 7)); // Next week

// Query with these dates (they're already in UTC)
const { data } = useAvailabilities({
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
});

// ❌ WRONG - Direct Date manipulation
const now = new Date();
const startDate = new Date(now);
startDate.setHours(0, 0, 0, 0); // Wrong timezone!
```

### Pattern 6: Zod Schema with Timezone Conversion

```typescript
import { z } from 'zod';

import { dateStringUTC } from '@/lib/timezone-schemas';

// ✅ CORRECT - Auto-convert to UTC
const bookingSchema = z.object({
  startTime: dateStringUTC, // Converts "2025-10-01T14:00:00+02:00" to UTC Date
  endTime: dateStringUTC,
});

// ✅ CORRECT - Optional date
const searchSchema = z.object({
  startDate: dateStringUTC.optional(),
  endDate: dateStringUTC.optional(),
});
```

---

## ❌ Anti-Patterns (DO NOT USE)

### Anti-Pattern 1: Direct `new Date()` in Server Code

```typescript
// ❌ WRONG - Timezone may vary
const now = new Date();
if (booking.startTime < now) { ... }

// ✅ CORRECT
import { nowUTC } from '@/lib/timezone';
if (booking.startTime < nowUTC()) { ... }
```

### Anti-Pattern 2: Manual Date Arithmetic

```typescript
// ❌ WRONG - May be off by timezone offset
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

// ✅ CORRECT
import { nowUTC } from '@/lib/timezone';
import { addDays } from 'date-fns';
const tomorrow = addDays(nowUTC(), 1);
```

### Anti-Pattern 3: setHours() Without Timezone Context

```typescript
// ❌ WRONG - Sets hours in local time
const startOfDay = new Date(date);
startOfDay.setHours(0, 0, 0, 0);

// ✅ CORRECT
import { startOfDaySAST } from '@/lib/timezone';
const startOfDay = startOfDaySAST(date);
```

### Anti-Pattern 4: Mixing Timezones

```typescript
// ❌ WRONG - Comparing local time to UTC
const clientNow = new Date(); // Local time
if (slot.startTime > clientNow) { ... } // slot.startTime is UTC!

// ✅ CORRECT
import { nowUTC } from '@/lib/timezone';
if (slot.startTime > nowUTC()) { ... }
```

---

## 🧪 Testing Timezone Code

### Unit Test Example

```typescript
import { describe, expect, it } from 'vitest';

import { endOfDaySAST, startOfDaySAST } from '@/lib/timezone';

describe('startOfDaySAST', () => {
  it('should return start of day in UTC (22:00 previous day)', () => {
    // 2025-10-01 00:00 SAST = 2025-09-30 22:00 UTC
    const date = new Date('2025-10-01T10:00:00+02:00');
    const result = startOfDaySAST(date);

    expect(result.toISOString()).toBe('2025-09-30T22:00:00.000Z');
  });
});

describe('endOfDaySAST', () => {
  it('should return end of day in UTC (21:59:59.999 same day)', () => {
    // 2025-10-01 23:59:59.999 SAST = 2025-10-01 21:59:59.999 UTC
    const date = new Date('2025-10-01T10:00:00+02:00');
    const result = endOfDaySAST(date);

    expect(result.toISOString()).toBe('2025-10-01T21:59:59.999Z');
  });
});
```

### E2E Test Scenarios

1. **Midnight Bookings**: Create availability at 23:30 SAST, verify it doesn't appear in previous day
2. **Cross-Day Queries**: Query for "today" in SAST, verify only SAST day items returned
3. **Future Filtering**: Create availability in past (UTC), verify it's filtered correctly for SAST

---

## 📋 Checklist for New Features

When adding date/time functionality, verify:

- [ ] All database date fields use `timestamptz` type
- [ ] Server comparisons use `nowUTC()`, never `new Date()`
- [ ] Date range queries use `startOfDaySAST()` and `endOfDaySAST()`
- [ ] Token/expiry dates use `nowUTC()` + date-fns helpers
- [ ] Client displays use `formatSAST()` or `.toLocaleDateString()`
- [ ] Zod schemas use `dateStringUTC` for automatic conversion
- [ ] No manual timezone offsets (e.g., `+2 hours`)
- [ ] No `.setHours()` without timezone utilities

---

## 🚨 Critical Areas

### Booking System (HIGHEST RISK)

**Files**: `/src/server/api/routers/calendar.ts`, `/src/features/calendar/`

**Why Critical**: Timezone bugs here cause double-bookings or missed appointments

**Rules**:

- ALL slot time comparisons MUST use `nowUTC()`
- ALL date range filters MUST use `startOfDaySAST()` / `endOfDaySAST()`
- ALL booking creation MUST store UTC timestamps

### Availability Management

**Files**: `/src/features/calendar/hooks/`, `/src/features/calendar/lib/`

**Why Critical**: Wrong timezone = availability shown on wrong days

**Rules**:

- Client date pickers MUST convert to UTC before API calls
- Recurring patterns MUST use UTC for calculations
- Display MUST convert UTC back to SAST

### Token Expiry

**Files**: `/src/app/api/auth/`, `/src/lib/auth.ts`

**Why Critical**: Tokens may expire early/late by 2 hours

**Rules**:

- ALL token expiry MUST use `nowUTC()` + date-fns
- ALL expiry checks MUST compare UTC to UTC

---

## 🔍 Debugging Timezone Issues

### Symptoms of Timezone Bugs

1. **Availabilities appearing on wrong days**

   - Check: Are date range queries using `startOfDaySAST()`?

2. **Bookings rejected as "past slot" when they're future**

   - Check: Is slot comparison using `nowUTC()` not `new Date()`?

3. **Tokens expiring 2 hours early/late**

   - Check: Is token creation using `nowUTC()`?

4. **Calendar events off by 2 hours**
   - Check: Is display converting UTC to SAST?

### Debug Tools

```typescript
// Add this to problematic code
import { nowSAST, nowUTC } from '@/lib/timezone';

console.log('UTC now:', nowUTC().toISOString());
console.log('SAST now:', nowSAST().toISOString());
console.log('Offset:', (nowSAST().getTime() - nowUTC().getTime()) / (1000 * 60 * 60), 'hours');

// Should show:
// UTC now: 2025-10-01T12:00:00.000Z
// SAST now: 2025-10-01T14:00:00.000Z (same instant, different representation)
// Offset: 0 hours (both are UTC internally, fromUTC just shifts display)
```

---

## 📚 External Resources

- [PostgreSQL timestamptz documentation](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [date-fns documentation](https://date-fns.org/)
- [Zod documentation](https://zod.dev/)
- [South Africa timezone info](https://en.wikipedia.org/wiki/South_African_Standard_Time)

---

## 🎯 Summary

**GOLDEN RULE**: When in doubt, use the timezone utilities!

1. **Server logic**: Always use `nowUTC()` for current time
2. **Date queries**: Always use `startOfDaySAST()` / `endOfDaySAST()`
3. **Token expiry**: Always use `nowUTC()` + date-fns helpers
4. **Client display**: Always use `formatSAST()` or `.toLocaleDateString()`
5. **Never**: Use `new Date()` for comparisons or arithmetic

**Remember**: Every timezone bug is a potential **booking disaster**. Follow these guidelines religiously.

---

**Sprint 4 Compliance**: All critical timezone violations from Sprint 4 audit have been fixed according to these guidelines.
