# Type Organization Standards - Option C Architecture

This document outlines the type organization standards and linting rules for the MedBookings codebase, updated for Option C architecture.

## Overview

The MedBookings codebase follows a strict **dual-source type safety pattern** with **Option C architecture** for optimal performance:

- **Manual Types**: Domain logic, form schemas, business rules (in `/features/*/types/`)
- **tRPC Types**: Server data, API responses, database entities (via `RouterOutputs` extraction)
- **Option C Pattern**: tRPC procedures handle ALL database queries, server actions handle ONLY business logic
- **Performance**: Single database query per endpoint, zero duplicate queries

All types are organized by feature using direct imports (no barrel exports).

## Directory Structure

```
src/
├── types/                        # Global types
│   ├── api.ts                    # API response types
│   ├── guards.ts                 # Runtime type validation
│   └── next-auth.d.ts           # NextAuth type extensions
├── features/
│   ├── [feature-name]/
│   │   ├── types/
│   │   │   ├── types.ts          # Main type definitions
│   │   │   ├── schemas.ts        # Zod validation schemas
│   │   │   └── guards.ts         # Runtime type guards
│   │   ├── components/
│   │   └── lib/
```

## File Organization Standards

### 1. Type Files Structure

Each `types.ts` file must follow this organization:

```typescript
// =============================================================================
// [FEATURE NAME] FEATURE TYPES
// =============================================================================
/**
 * @fileoverview Comprehensive type definitions for the [feature] feature.
 * [Brief description of the feature and its types]
 */

// =============================================================================
// IMPORTS
// =============================================================================
import { ... } from '@prisma/client';

// =============================================================================
// ENUMS
// =============================================================================
export enum ExampleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// =============================================================================
// BASE INTERFACES
// =============================================================================
export interface BaseExample {
  id: string;
  name: string;
}

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================
/**
 * Complex interface with comprehensive JSDoc
 */
export interface ComplexExample extends BaseExample {
  // Properties with individual documentation
}

// =============================================================================
// UTILITY TYPES
// =============================================================================
export type ExampleStatusType = keyof typeof ExampleStatus;

// =============================================================================
// PRISMA-DERIVED TYPES
// =============================================================================
export type ExampleDetailSelect = Prisma.ExampleGetPayload<{
  include: {
    // Comprehensive relations for detailed views
  };
}>;

export type ExampleListSelect = Prisma.ExampleGetPayload<{
  include: {
    // Minimal relations for list views
  };
}>;
```

### 2. Schema Files Structure

Each `schemas.ts` file contains Zod validation schemas:

```typescript
// =============================================================================
// [FEATURE NAME] FEATURE SCHEMAS
// =============================================================================
// Zod validation schemas for runtime validation

import { z } from 'zod';

// Base schemas
export const ExampleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

// Request/Response schemas
export const CreateExampleSchema = ExampleSchema.omit({ id: true });
export const UpdateExampleSchema = ExampleSchema.partial();
```

### 3. Guards Files Structure

Each `guards.ts` file contains runtime type validation:

```typescript
// =============================================================================
// [FEATURE NAME] FEATURE TYPE GUARDS
// =============================================================================
// Runtime type validation for [feature]-specific types

/**
 * Type guard with comprehensive JSDoc
 */
export function isValidExample(value: unknown): value is Example {
  return (
    typeof value === 'object' &&
    value !== null &&
    // Validation logic
  );
}
```

## Naming Conventions

### 1. File Names
- ✅ `types.ts` - Main type definitions
- ✅ `schemas.ts` - Zod validation schemas
- ✅ `guards.ts` - Runtime type guards
- ❌ `index.ts` - Barrel exports not allowed
- ❌ `interfaces.ts` - Use types.ts instead

### 2. Type Names

#### Enums
```typescript
export enum ExampleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
```

#### Interfaces
```typescript
export interface ExampleData {
  id: string;
  name: string;
}
```

#### Prisma-Derived Types
```typescript
// For detailed views with comprehensive relations
export type ExampleDetailSelect = Prisma.ExampleGetPayload<{...}>;

// For list views with minimal relations
export type ExampleListSelect = Prisma.ExampleGetPayload<{...}>;

// For basic selectors (dropdowns, etc.)
export type ExampleBasicSelect = Prisma.ExampleGetPayload<{...}>;
```

## Import Standards

### ✅ Correct Imports
```typescript
// Direct imports from specific type files
import { ExampleData } from '@/features/example/types/types';
import { ExampleSchema } from '@/features/example/types/schemas';
import { isValidExample } from '@/features/example/types/guards';

// Global types
import { ApiResponse } from '@/types/api';
import { isValidUUID } from '@/types/guards';
```

### ❌ Incorrect Imports
```typescript
// Barrel exports - NOT ALLOWED
import { ExampleData } from '@/features/example/types';
import * from '@/features/example/types';

// Undefined paths - NOT ALLOWED
import { ExampleData } from '@/features/example';
```

## Linting Rules

### 1. No Barrel Exports
- **Rule**: Prevent `export *` from type directories
- **Enforcement**: ESLint `no-restricted-syntax`
- **Message**: "Barrel exports are not allowed in type files. Use direct imports instead."

### 2. File Naming Conventions
- **Rule**: Type files must be named `types.ts`, `schemas.ts`, or `guards.ts`
- **Enforcement**: ESLint `check-file/filename-blocklist`
- **Message**: "Type barrel files (index.ts) are not allowed. Use direct file names instead."

### 3. JSDoc Requirements
- **Rule**: Complex types (5+ properties) must have JSDoc documentation
- **Level**: Warning
- **Requirements**:
  - `@interface` or `@type` tag
  - Description of purpose and usage
  - `@example` block for complex types

### 4. Prisma Type Patterns
- **Rule**: Use consistent naming for Prisma-derived types
- **Pattern**: `ModelNameDetailSelect`, `ModelNameListSelect`, `ModelNameBasicSelect`
- **Enforcement**: Pattern matching in ESLint rules

### 5. Import Path Validation
- **Rule**: Enforce direct imports from specific type files
- **Enforcement**: Custom ESLint rules
- **Error**: Suggest correct import path when barrel imports are detected

## Documentation Standards

### 1. File-Level Documentation
```typescript
/**
 * @fileoverview Comprehensive type definitions for the [feature] feature.
 * 
 * This module contains all type definitions related to [feature] including:
 * - [List of main type categories]
 * - [Integration points]
 * - [Special considerations]
 * 
 * @author MedBookings Development Team
 * @version 1.0.0
 */
```

### 2. Complex Type Documentation
```typescript
/**
 * Represents [description of the type's purpose].
 * [Additional context about usage and behavior]
 * 
 * @interface TypeName
 * 
 * @example
 * ```typescript
 * const example: TypeName = {
 *   // Example usage
 * };
 * ```
 */
export interface TypeName {
  /** Property documentation */
  property: string;
}
```

### 3. Enum Documentation
```typescript
/**
 * Enum representing [purpose] with [context].
 * 
 * @enum {string}
 */
export enum ExampleStatus {
  /** Description of ACTIVE state */
  ACTIVE = 'ACTIVE',
  /** Description of INACTIVE state */
  INACTIVE = 'INACTIVE',
}
```

## Best Practices

### 1. Type Organization
- Group related types together
- Use consistent section headers
- Order sections from simple to complex
- Keep Prisma-derived types at the end

### 2. Type Naming
- Use descriptive, self-documenting names
- Follow established patterns consistently
- Avoid abbreviations unless widely understood
- Use PascalCase for types and interfaces

### 3. Import Management
- Import only what you need
- Use direct imports for better tree-shaking
- Group imports by category (Prisma, local, external)
- Keep import statements organized

### 4. Documentation
- Document the "why" not just the "what"
- Provide examples for complex types
- Keep documentation up-to-date with changes
- Use consistent formatting and style

## Automated Enforcement

The following tools automatically enforce these standards:

1. **ESLint Rules**: Custom rules prevent barrel exports and enforce naming
2. **TypeScript Compiler**: Ensures type safety and import resolution
3. **Prettier**: Consistent code formatting
4. **Pre-commit Hooks**: Validation before commits

## Migration Guide

When updating existing code to follow these standards:

1. **Identify Barrel Exports**: Search for `export *` in type files
2. **Update Import Statements**: Replace barrel imports with direct imports
3. **Reorganize Type Files**: Follow the standard section structure
4. **Add Documentation**: Include JSDoc for complex types
5. **Rename Files**: Use standard naming conventions
6. **Test Build**: Ensure all imports resolve correctly

## Troubleshooting

### Common Issues

1. **Import Resolution Errors**
   - Check that the target file exists
   - Verify the import path is correct
   - Ensure no circular dependencies

2. **Linting Errors**
   - Run `npm run lint` to see specific errors
   - Use `npm run lint -- --fix` for auto-fixable issues
   - Check the linting rules documentation

3. **Build Failures**
   - Verify all imports resolve correctly
   - Check for circular dependencies
   - Ensure TypeScript configuration is correct

### Getting Help

1. Check this documentation first
2. Review existing type files for patterns
3. Run the linter for specific error messages
4. Consult the team for complex migration scenarios