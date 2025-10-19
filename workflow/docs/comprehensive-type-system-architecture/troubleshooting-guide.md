# Type Safety Troubleshooting Guide - MedBookings

**Purpose**: Solutions for common TypeScript and tRPC type safety issues encountered during development

## Table of Contents

1. [TypeScript Compilation Errors](#typescript-compilation-errors)
2. [tRPC Type Issues](#trpc-type-issues)
3. [Import and Export Problems](#import-and-export-problems)
4. [Type Extraction Issues](#type-extraction-issues)
5. [Date and Time Type Problems](#date-and-time-type-problems)
6. [Prisma Type Issues](#prisma-type-issues)
7. [Hook and Component Type Problems](#hook-and-component-type-problems)
8. [Performance and Build Issues](#performance-and-build-issues)

## TypeScript Compilation Errors

### Error: "Property 'X' does not exist on type 'Y'"

**Common Scenario**: Accessing a property that TypeScript thinks doesn't exist.

```typescript
// ❌ ERROR: Property 'user' does not exist on type 'Provider'
const { data: provider } = useProvider(providerId);
return <div>{provider?.user?.name}</div>; // Error here
```

**Root Cause**: The tRPC procedure doesn't include the required relation.

**Solution**: Check the tRPC procedure and add the missing `include`:

```typescript
// ✅ SOLUTION: Add missing include in tRPC procedure
// /server/api/routers/providers.ts
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    return ctx.prisma.provider.findUnique({
      where: { id: input.id },
      include: {
        user: true, // ← Add this include
        services: true,
        typeAssignments: { include: { providerType: true } },
      },
    });
  }),
```

**Prevention**: Always check what relations your component needs and ensure they're included in the tRPC procedure.

### Error: "Type 'undefined' is not assignable to type 'X'"

**Common Scenario**: Passing potentially undefined values to components that expect defined types.

```typescript
// ❌ ERROR: Type 'Provider | undefined' is not assignable to type 'Provider'
const { data: provider } = useProvider(providerId);
return <ProviderCard provider={provider} />; // Error - provider might be undefined
```

**Solution**: Add proper null checking:

```typescript
// ✅ SOLUTION: Handle undefined case
const { data: provider, isLoading, error } = useProvider(providerId);

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!provider) return <div>Provider not found</div>;

return <ProviderCard provider={provider} />; // Now provider is guaranteed to be defined
```

### Error: "Cannot find module '@/utils/api'"

**Solution**: Ensure the import path is correct and the file exists:

```typescript
// ✅ CORRECT import
import { api, type RouterOutputs } from '@/utils/api';

// ❌ WRONG - common typos
import { api } from '@/utils/apis'; // Missing 's'
import { api } from '@utils/api';   // Missing '@/'
```

**If the file is missing**, check that `@/utils/api.ts` exists and exports the correct types.

## tRPC Type Issues

### Error: "Type 'any' instead of proper tRPC types"

**Common Scenario**: tRPC hooks return `any` instead of properly typed data.

**Root Cause**: Usually a problem with the tRPC procedure setup.

**Solution Checklist**:

1. **Check tRPC procedure has return statement**:

   ```typescript
   // ❌ WRONG - no return statement
   getProviders: protectedProcedure.query(async ({ ctx }) => {
     ctx.prisma.provider.findMany(); // Missing return!
   });

   // ✅ CORRECT - explicit return
   getProviders: protectedProcedure.query(async ({ ctx }) => {
     return ctx.prisma.provider.findMany(); // Has return
   });
   ```

2. **Check procedure name matches hook call**:

   ```typescript
   // ❌ WRONG - mismatched names
   // Procedure: 'getAllProviders'
   // Hook call: api.providers.getProviders.useQuery()

   // ✅ CORRECT - names match
   // Procedure: 'getProviders'
   // Hook call: api.providers.getProviders.useQuery()
   ```

3. **Check router export**:
   ```typescript
   // Make sure the router is properly exported in /server/api/root.ts
   export const appRouter = createTRPCRouter({
     providers: providersRouter, // ← Make sure this is here
     // ... other routers
   });
   ```

### Error: "Procedure not found" or 404 errors

**Solution**: Verify the complete tRPC route chain:

1. **Router file exists**: `/server/api/routers/[feature].ts`
2. **Procedure exported**: Check the procedure is in the router
3. **Router imported**: Check `/server/api/root.ts` imports the router
4. **Hook calls correct path**: `api.[router].[procedure].useQuery()`

Example debugging:

```typescript
// 1. Check procedure exists in router
export const providersRouter = createTRPCRouter({
  getById: protectedProcedure.query(/* ... */), // ← Exists?
});

// 2. Check router imported in root.ts
export const appRouter = createTRPCRouter({
  providers: providersRouter, // ← Imported?
});

// 3. Check hook calls correct path
const { data } = api.providers.getById.useQuery({ id }); // ← Correct path?
```

## Import and Export Problems

### Error: "Module has no exported member 'X'"

**Common with manual type imports**:

```typescript
// ❌ ERROR: Module has no exported member 'ProviderType'
import { ProviderType } from '@/features/providers/types/types';
```

**Solution**: Check what's actually exported:

```typescript
// Check /features/providers/types/types.ts
// If ProviderType is not exported, either:

// 1. Export it:
export interface ProviderType {
  id: string;
  name: string;
}

// 2. Or use Prisma enum instead:
import { ProviderType } from '@prisma/client';

// 3. Or extract from tRPC if it's server data:
import { type RouterOutputs } from '@/utils/api';
type ProviderType = RouterOutputs['providers']['getTypes'][number];
```

### Error: Circular import dependencies

**Common Scenario**: Files importing each other creates a circular dependency.

**Solution**: Restructure imports to avoid circles:

```typescript
// ❌ PROBLEM: Circular imports
// File A imports B, B imports A

// ✅ SOLUTION: Extract shared types to separate file
// /features/shared/types.ts - Common types
// /features/providers/types.ts - Provider-specific types
// /features/providers/components.tsx - Uses types but doesn't export them
```

## Type Extraction Issues

### Error: "Type 'X[number]' is not assignable to type 'Y'"

**Common Scenario**: Trying to use array item type incorrectly.

```typescript
// ❌ ERROR: Wrong array item extraction
type Providers = RouterOutputs['providers']['getAll'];
type Provider = Providers[0]; // WRONG - uses first item specifically

// ✅ CORRECT: Extract array item type
type Provider = Providers[number]; // Correct - any item from array
```

### Error: "Cannot access property of undefined"

**Common with deeply nested type extraction**:

```typescript
// ❌ PROBLEM: Nested access without null checking
type BookingSlot = BookingWithDetails['slot']['service']['name']; // Error if any level is null

// ✅ SOLUTION: Use NonNullable for each level
type BookingWithDetails = RouterOutputs['calendar']['getBookingWithDetails'];
type BookingSlot = NonNullable<BookingWithDetails>['slot'];
type SlotService = NonNullable<BookingSlot>['service'];
type ServiceName = NonNullable<SlotService>['name'];
```

### Error: "Index signature is missing"

**Common when trying to access dynamic properties**:

```typescript
// ❌ ERROR: No index signature
const requirements = onboardingData.requirements;
const providerTypeReqs = requirements[selectedTypeId]; // Error

// ✅ SOLUTION: Add type assertion or use proper typing
const requirements = onboardingData.requirements as Record<string, RequirementType[]>;
const providerTypeReqs = requirements[selectedTypeId]; // OK

// ✅ BETTER: Extract proper type from tRPC
type OnboardingData = RouterOutputs['providers']['getOnboardingData'];
type Requirements = OnboardingData['requirements'];
// Use the properly typed Requirements
```

## Date and Time Type Problems

### Error: "Type 'string' is not assignable to type 'Date'"

**Common with form inputs and tRPC procedures**:

```typescript
// ❌ PROBLEM: Form returns string, tRPC expects Date
const onSubmit = (data: FormData) => {
  createMutation.mutateAsync({
    startTime: data.startTime, // string from form input
    endTime: data.endTime,     // string from form input
  }); // Error - tRPC expects Date
};

// ✅ SOLUTION: Convert strings to Date objects
const onSubmit = (data: FormData) => {
  const submitData: CreateAvailabilityInput = {
    ...data,
    startTime: data.startTime instanceof Date
      ? data.startTime
      : new Date(data.startTime),
    endTime: data.endTime instanceof Date
      ? data.endTime
      : new Date(data.endTime),
  };
  createMutation.mutateAsync(submitData);
};
```

### Error: "Invalid Date" runtime errors

**Solution**: Add date validation:

```typescript
// ✅ SOLUTION: Validate dates before conversion
const convertToDate = (dateInput: string | Date): Date => {
  if (dateInput instanceof Date) return dateInput;

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateInput}`);
  }

  return date;
};

const submitData = {
  startTime: convertToDate(data.startTime),
  endTime: convertToDate(data.endTime),
};
```

## Prisma Type Issues

### Error: "Cannot find module '@prisma/client'"

**Solution**: Make sure Prisma is generated:

```bash
npx prisma generate
```

If still not working, check:

1. `package.json` has `@prisma/client` dependency
2. `prisma/schema.prisma` file exists
3. Run `npm install` to ensure dependencies are installed

### Error: "Enum 'X' does not exist"

**Common when importing Prisma enums**:

```typescript
// ❌ ERROR: ImportError - enum doesn't exist
import { ProviderType } from '@prisma/client';
// Error
// ✅ SOLUTION: Check the actual enum name in schema.prisma
// Look for: enum ProviderStatus, enum OrganizationRole, etc.
import { ProviderStatus } from '@prisma/client';

// Correct name
```

**Check your `schema.prisma` file** for the exact enum names.

### Error: "Type mismatch with Prisma enum"

**Solution**: Use the correct Prisma enum:

```typescript
// ❌ WRONG: Using string literals
const status = 'PENDING_APPROVAL'; // String literal

// ✅ CORRECT: Use Prisma enum
import { ProviderStatus } from '@prisma/client';
const status = ProviderStatus.PENDING_APPROVAL; // Typed enum value
```

## Hook and Component Type Problems

### Error: "Hook returns 'any' type"

**Common Scenario**: Custom hooks return `any` instead of proper types.

**Root Cause**: Hook doesn't properly forward tRPC types.

**Solution**: Let tRPC handle typing:

```typescript
// ❌ WRONG: Manual typing that returns any
export const useProviders = (): Provider[] => {
  const { data } = api.providers.getAll.useQuery();
  return data as Provider[]; // Forces any type
};

// ✅ CORRECT: Let tRPC handle typing
export function useProviders() {
  return api.providers.getAll.useQuery(); // Automatic typing
}

// Usage gets proper types automatically:
const { data: providers } = useProviders(); // providers is properly typed
```

### Error: "React Hook Rule violations"

**Common with conditional tRPC calls**:

```typescript
// ❌ WRONG: Conditional hook calls
if (providerId) {
  const { data } = useProvider(providerId); // Hook rule violation
}

// ✅ CORRECT: Use enabled option
const { data } = useProvider(providerId, {
  enabled: !!providerId, // Hook always called, but query disabled when no ID
});
```

### Error: "Component prop type mismatch"

**Solution**: Extract proper type at component level:

```typescript
// ✅ CORRECT: Extract correct type
import { type RouterOutputs } from '@/utils/api';

// ❌ WRONG: Using wrong type for prop
interface ProviderCardProps {
  provider: any; // Wrong type
}

type Provider = RouterOutputs['providers']['getById'];

interface ProviderCardProps {
  provider: Provider; // Correct type
}
```

## Performance and Build Issues

### Error: "Build fails with type errors in production"

**Common Scenario**: Development works but production build fails.

**Solution Checklist**:

1. **Run TypeScript check locally**:

   ```bash
   npx tsc --noEmit
   ```

2. **Check for any types**:
   Search codebase for `: any` and replace with proper types.

3. **Verify tRPC procedures return types**:
   Make sure all procedures have explicit return statements.

4. **Check import paths**:
   Ensure all `@/` paths are correctly configured in `tsconfig.json`.

### Error: "Memory issues during build"

**Solution**: Optimize TypeScript compilation:

```json
// tsconfig.json optimizations
{
  "compilerOptions": {
    "incremental": true,
    "skipLibCheck": true,
    "skipDefaultLibCheck": true
  }
}
```

### Error: "Slow TypeScript checking"

**For large codebases with many tRPC types**:

1. **Use project references** if applicable
2. **Enable incremental compilation**
3. **Skip library type checking** with `skipLibCheck: true`

## Quick Debugging Checklist

When encountering any type issue:

### 1. ✅ Verify tRPC Setup

- [ ] Procedure exists in router file
- [ ] Router imported in root.ts
- [ ] Procedure has return statement
- [ ] Hook calls correct path

### 2. ✅ Check Type Extraction

- [ ] Using `RouterOutputs` for server data
- [ ] Using `RouterInputs` for form inputs
- [ ] Using `[number]` for array items
- [ ] Using `NonNullable<>` for optional relations

### 3. ✅ Verify Imports

- [ ] Correct import paths (`@/utils/api`)
- [ ] No circular dependencies
- [ ] Prisma types from `@prisma/client`
- [ ] Manual types from feature directories

### 4. ✅ Check Runtime Data

- [ ] Database includes required relations
- [ ] Form data matches expected types
- [ ] Dates properly converted
- [ ] Null checking in place

### 5. ✅ Validate Build

- [ ] TypeScript compilation passes
- [ ] No `any` types used
- [ ] All imports resolve
- [ ] Production build succeeds

## Common Error Patterns and Solutions

| Error Pattern                 | Likely Cause                       | Quick Fix                     |
| ----------------------------- | ---------------------------------- | ----------------------------- |
| `Property 'X' does not exist` | Missing relation in tRPC procedure | Add `include` to Prisma query |
| `Type 'any'` returned         | No return statement in procedure   | Add explicit `return`         |
| `Cannot find module`          | Wrong import path                  | Check path and file existence |
| `Type 'undefined'` error      | Missing null checking              | Add loading/error/null states |
| `Date type mismatch`          | Form string vs tRPC Date           | Convert string to Date        |
| `Hook rule violation`         | Conditional hook usage             | Use `enabled` option instead  |
| `Build fails in prod`         | TypeScript strict mode             | Run `tsc --noEmit` locally    |

## Getting Help

If you're still stuck after trying these solutions:

1. **Check the procedure output** in the tRPC panel/devtools
2. **Log the actual data** to see what's being returned
3. **Use TypeScript hover** to see what TypeScript thinks the type is
4. **Check recent changes** that might have broken the type chain
5. **Refer to implementation examples** in the codebase

The MedBookings codebase has working examples of every pattern, so you can always refer to existing implementations for guidance.
