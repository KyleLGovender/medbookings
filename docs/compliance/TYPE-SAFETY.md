# Type Safety Guidelines

**Last Updated**: 2025-10-02 (Sprint 4)
**Status**: Production Standard
**Compliance**: TypeScript strict mode

---

## 🎯 Overview

This guide establishes **type safety best practices** for the MedBookings TypeScript codebase. Following these patterns prevents runtime errors, improves developer experience, and maintains code quality.

**Key Principle**: **Zero tolerance for `as any` in production code paths** (except where explicitly documented as acceptable).

---

## 📊 Type Safety Hierarchy

```
┌─────────────────────────────────────────┐
│ 1. Prisma Generated Types (Source)     │  ← Database schema
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 2. Zod Schemas (Validation)             │  ← Runtime safety
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 3. tRPC Types (API Contract)            │  ← Type-safe API
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 4. Component Props (UI Layer)           │  ← Type-safe UI
└─────────────────────────────────────────┘
```

**NEVER break this chain** - each layer validates and narrows types for the next.

---

## 🏗️ Prisma Json Field Handling

### The Problem

Prisma stores JSON data as `Prisma.JsonValue`, which is too loose for TypeScript:

```typescript
type JsonValue = string | number | boolean | JsonObject | JsonArray | null
```

This means you lose type safety when reading/writing JSON fields.

### The Solution

**Location**: `/src/types/prisma-json.ts`

**Pattern**: Define Zod schema → Infer TypeScript type → Create conversion helpers

---

### Example: RecurrencePattern

**Step 1: Define Zod Schema**

```typescript
import { z } from 'zod';

export const RecurrencePatternSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  interval: z.number().int().positive(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  endDate: z.string().datetime().optional(),
  count: z.number().int().positive().optional(),
});
```

**Step 2: Infer TypeScript Type**

```typescript
export type RecurrencePattern = z.infer<typeof RecurrencePatternSchema>;

// Resulting type:
// {
//   frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
//   interval: number;
//   daysOfWeek?: number[];
//   endDate?: string;
//   count?: number;
// }
```

**Step 3: Create Conversion Helpers**

```typescript
import { Prisma } from '@prisma/client';

/**
 * Convert RecurrencePattern to Prisma JsonValue for storage
 */
export function recurrencePatternToJson(
  pattern: RecurrencePattern | null | undefined
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  if (!pattern) return Prisma.JsonNull;

  // Validate before converting (throws if invalid)
  const validated = RecurrencePatternSchema.parse(pattern);

  return validated as Prisma.InputJsonValue;
}

/**
 * Parse Prisma JsonValue as RecurrencePattern for reading
 */
export function parseRecurrencePattern(
  json: Prisma.JsonValue | null
): RecurrencePattern | null {
  if (json === null) return null;

  const result = RecurrencePatternSchema.safeParse(json);
  return result.success ? result.data : null;
}

/**
 * Type guard for runtime checking
 */
export function isRecurrencePattern(value: unknown): value is RecurrencePattern {
  return RecurrencePatternSchema.safeParse(value).success;
}
```

---

### Usage in tRPC Procedures

**Writing to Database** ✅:

```typescript
import { recurrencePatternToJson, type RecurrencePattern } from '@/types/prisma-json';

// ✅ CORRECT - Type-safe conversion
await prisma.availability.create({
  data: {
    recurrencePattern: recurrencePatternToJson(input.recurrencePattern),
    // If input.recurrencePattern has wrong shape, .parse() throws
  },
});

// ❌ WRONG - Unsafe type assertion
await prisma.availability.create({
  data: {
    recurrencePattern: input.recurrencePattern as any, // NO!
  },
});
```

**Reading from Database** ✅:

```typescript
import { parseRecurrencePattern } from '@/types/prisma-json';

const availability = await prisma.availability.findUnique({
  where: { id: input.id },
});

// ✅ CORRECT - Validated parsing
const pattern = parseRecurrencePattern(availability.recurrencePattern);
if (pattern) {
  // TypeScript knows this is RecurrencePattern
  console.log(`Repeats ${pattern.frequency} every ${pattern.interval}`);
}

// ❌ WRONG - Direct cast
const pattern = availability.recurrencePattern as RecurrencePattern; // NO!
```

---

## 🎭 Type Guards (Acceptable `as any` Use)

Type guards are the **ONLY acceptable place** for `as any` because they check unknown types.

### Pattern: Type Guard Implementation

```typescript
// ✅ CORRECT - Type guard with as any
export function isGooglePlace(value: unknown): value is GooglePlace {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).place_id === 'string' &&
    typeof (value as any).formatted_address === 'string' &&
    typeof (value as any).geometry === 'object' &&
    (value as any).geometry !== null &&
    'location' in (value as any).geometry
  );
}

// Usage - now type-safe!
if (isGooglePlace(unknownData)) {
  // TypeScript knows unknownData is GooglePlace
  console.log(unknownData.place_id);
}
```

**Why `as any` is okay here**:
1. Input is `unknown` - we don't know its type
2. We're checking each property explicitly
3. Return type narrows to specific type if checks pass
4. This is the idiomatic TypeScript pattern

**Alternative** (more verbose, same result):

```typescript
// ✅ ALSO CORRECT - Explicit type narrowing
export function isGooglePlace(value: unknown): value is GooglePlace {
  if (typeof value !== 'object' || value === null) return false;
  if (!('place_id' in value)) return false;
  if (typeof value.place_id !== 'string') return false;
  // ... continue checking
  return true;
}
```

---

## 🔒 Prisma Enum Types

### Pattern: Using Generated Enums

```typescript
import { UserRole, ProviderStatus } from '@prisma/client';

// ✅ CORRECT - Import Prisma enum
const role: UserRole = 'ADMIN';

// ✅ CORRECT - Zod enum from Prisma
const roleSchema = z.nativeEnum(UserRole);

// ✅ CORRECT - Type guard for enum
function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

// ❌ WRONG - String type
const role: string = 'ADMIN'; // Loses type safety

// ❌ WRONG - Manual enum definition
const UserRole = { ADMIN: 'ADMIN', USER: 'USER' }; // Duplicates Prisma!
```

### Pattern: Validating Enum from User Input

```typescript
import { OrganizationRole } from '@prisma/client';

// ✅ CORRECT - Validate before use
const validRoles = Object.values(OrganizationRole);
if (!validRoles.includes(input.role as OrganizationRole)) {
  throw new Error('Invalid role');
}
const role: OrganizationRole = input.role as OrganizationRole; // Safe now

// ✅ BETTER - Use Zod schema
const roleSchema = z.nativeEnum(OrganizationRole);
const role = roleSchema.parse(input.role); // Throws if invalid
```

---

## 🔄 tRPC Type Exports

### Pattern: Extracting Types from tRPC Procedures

**File**: `/src/features/[feature]/types/api-types.ts`

```typescript
import { type RouterOutputs, type RouterInputs } from '@/utils/api';

// ✅ CORRECT - Extract output types
export type AdminProvider = RouterOutputs['admin']['getProviderById'];
export type AdminProviders = RouterOutputs['admin']['getProviders'];

// ✅ CORRECT - Extract input types
export type CreateProviderInput = RouterInputs['admin']['createProvider'];
export type UpdateProviderInput = RouterInputs['admin']['updateProvider'];

// ❌ WRONG - Duplicate type definitions
export type AdminProvider = {
  id: string;
  name: string;
  // ... manually defining what tRPC already knows!
};
```

### Pattern: Using API Types in Components

```typescript
// ✅ CORRECT - Import from api-types
import type { AdminProvider } from '@/features/admin/types/api-types';
import { useAdminProvider } from '@/features/admin/hooks/use-admin-provider';

function ProviderCard({ providerId }: { providerId: string }) {
  const { data } = useAdminProvider(providerId);
  const provider: AdminProvider | undefined = data; // Type-safe!

  if (!provider) return <Loading />;

  return <div>{provider.name}</div>;
}

// ❌ WRONG - Import types from hooks
import type { AdminProvider } from '@/features/admin/hooks/use-admin-provider'; // NO!

// ❌ WRONG - Extract inline (for one-off use is okay, but prefer api-types)
import { type RouterOutputs } from '@/utils/api';
type Provider = RouterOutputs['admin']['getProviderById']; // Okay but prefer api-types
```

---

## 🚫 Forbidden Type Patterns

### Anti-Pattern 1: `as any` Without Validation

```typescript
// ❌ WRONG - Bypasses all type safety
const user = await fetch('/api/user').then(res => res.json()) as any;
console.log(user.name); // Runtime error if shape is wrong!

// ✅ CORRECT - Validate with Zod
const UserSchema = z.object({ name: z.string(), email: z.string() });
const raw = await fetch('/api/user').then(res => res.json());
const user = UserSchema.parse(raw); // Throws if invalid
console.log(user.name); // Type-safe!
```

### Anti-Pattern 2: Type Assertion Without Narrowing

```typescript
// ❌ WRONG - Assumes type without checking
const provider = data as Provider;
console.log(provider.id); // May fail at runtime

// ✅ CORRECT - Check before asserting
if (data && typeof data === 'object' && 'id' in data) {
  const provider = data as Provider; // Safe assertion
  console.log(provider.id);
}

// ✅ BETTER - Use type guard
if (isProvider(data)) {
  console.log(data.id); // Type narrowed automatically
}
```

### Anti-Pattern 3: Ignoring TypeScript Errors

```typescript
// ❌ WRONG - Suppressing errors
// @ts-ignore
const value = data.propertyThatDoesntExist;

// ✅ CORRECT - Fix the underlying issue
if ('propertyName' in data) {
  const value = data.propertyName;
}
```

### Anti-Pattern 4: Manual Type Definitions for Generated Types

```typescript
// ❌ WRONG - Duplicating Prisma types
type User = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
};

// ✅ CORRECT - Use Prisma types
import { User } from '@prisma/client';
// Or for API types:
import type { UserProfile } from '@/features/profile/types/api-types';
```

---

## 🧪 Testing Type Safety

### Compile-Time Type Tests

```typescript
import { expectType, expectError } from 'tsd';
import { RecurrencePattern } from '@/types/prisma-json';

// Test: Type has required fields
expectType<RecurrencePattern>({
  frequency: 'DAILY',
  interval: 1,
});

// Test: Invalid type rejected
expectError<RecurrencePattern>({
  frequency: 'INVALID', // Should error
  interval: 1,
});
```

### Runtime Validation Tests

```typescript
import { describe, it, expect } from 'vitest';
import { RecurrencePatternSchema } from '@/types/prisma-json';

describe('RecurrencePatternSchema', () => {
  it('should validate correct pattern', () => {
    const result = RecurrencePatternSchema.safeParse({
      frequency: 'DAILY',
      interval: 1,
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid frequency', () => {
    const result = RecurrencePatternSchema.safeParse({
      frequency: 'INVALID',
      interval: 1,
    });

    expect(result.success).toBe(false);
  });
});
```

---

## 📋 Type Safety Checklist

When adding new features with custom types:

- [ ] Prisma models have Zod validation schemas
- [ ] Prisma Json fields have Zod schemas in `/src/types/prisma-json.ts`
- [ ] API types extracted to `/src/features/[feature]/types/api-types.ts`
- [ ] No `as any` outside of type guards
- [ ] No `@ts-ignore` or `@ts-expect-error` (document exceptions)
- [ ] Enums imported from `@prisma/client`, not manually defined
- [ ] Unknown data validated with Zod before use
- [ ] Type guards return `value is Type` for narrowing

---

## 🔍 Debugging Type Errors

### Common Type Errors & Solutions

**Error**: `Type 'any' is not assignable to type 'X'`
```typescript
// Problem: Using 'any' where specific type expected
const value: MyType = getSomething() as any; // ❌

// Solution: Use proper typing
const value: MyType = MyTypeSchema.parse(getSomething()); // ✅
```

**Error**: `Property 'X' does not exist on type 'Y'`
```typescript
// Problem: Accessing property without checking
console.log(data.propertyName); // ❌

// Solution: Check existence first
if ('propertyName' in data) {
  console.log(data.propertyName); // ✅
}
```

**Error**: `Argument of type 'X' is not assignable to parameter of type 'Y'`
```typescript
// Problem: Wrong type being passed
myFunction(stringValue); // expects number ❌

// Solution: Convert or validate
myFunction(Number(stringValue)); // ✅
// Or use Zod to validate input shape
```

---

## 🎯 Summary

### Golden Rules

1. **Never `as any` in production code** (except type guards)
2. **Always validate unknown data** with Zod schemas
3. **Import Prisma enums** - don't redefine them
4. **Extract API types** to api-types.ts files
5. **Json fields need Zod schemas** in prisma-json.ts

### When to Use Each Tool

| Situation | Tool | Example |
|-----------|------|---------|
| Validating user input | Zod schema | `registerSchema.parse(input)` |
| Prisma Json field | Custom schema + helpers | `recurrencePatternToJson()` |
| Unknown API data | Zod + type guard | `if (isValidResponse(data))` |
| tRPC types | RouterOutputs/RouterInputs | `type User = RouterOutputs[...]` |
| Enum validation | Prisma enum + Zod | `z.nativeEnum(UserRole)` |

**Remember**: Type safety is not just compile-time - validate at runtime too!

---

**Sprint 4 Compliance**: All critical type assertions from Sprint 4 audit have been replaced with type-safe patterns according to these guidelines.
