# Sprint Task: Resolve 136 ESLint Type Safety Warnings

**Created:** 2025-10-09
**Status:** 📋 Planned (Not Started)
**Epic:** Type Safety Technical Debt Cleanup
**Story Points:** 13 (2-3 days)
**Priority:** Medium
**Type:** Technical Debt / Quality Improvement

---

## 📋 Task Overview

### Current State
- ✅ 0 ESLint errors (nothing blocking compilation)
- ⚠️ 136 ESLint warnings across 60+ files
- Pre-commit hook allows max 150 warnings (will fail at 151+)

### Goal
Reduce warnings from 136 → **<50** by addressing systemic root causes

### Why This Matters
- **Type Safety:** Prevent runtime errors from untyped data
- **Developer Experience:** Better IDE autocomplete and IntelliSense
- **Code Quality:** Align with TYPE-SAFETY.md standards
- **Future-Proofing:** Stay under pre-commit warning threshold as codebase grows

---

## 🎯 Success Criteria

- [ ] ESLint warnings reduced to <50 (63% improvement)
- [ ] All Prisma JSON fields have Zod schemas with type-safe helpers
- [ ] Form handlers use Zod-inferred types (no `Record<string, any>`)
- [ ] Complex interfaces (>5 properties) have JSDoc documentation
- [ ] Zero explicit `any` types outside of acceptable patterns
- [ ] Build passes with zero type errors
- [ ] All existing functionality preserved

---

## 📊 Warning Breakdown by Root Cause

| Root Cause | Count | Files | Risk | Phase |
|------------|-------|-------|------|-------|
| Prisma JSON fields (no Zod schema) | 60+ | 40+ | 🟠 MEDIUM | 1 |
| Form handlers using `any` | 20+ | 15+ | 🟡 LOW-MED | 1 |
| Missing JSDoc on complex types | 42 | 7 | 🟢 LOW | 3 |
| Dynamic form field access | 13+ | 10+ | 🟡 LOW-MED | 2 |
| Explicit `any` in utility functions | 3 | 2 | 🟠 MEDIUM | 1 |
| Prisma pattern violations | 2 | 1 | 🟢 LOW | 3 |

---

## 🔄 Implementation Plan (3 Phases)

### **PHASE 1: High-Risk Type Safety Issues** ⏱️ Day 1 (8 hours)

**Target:** Fix explicit `any` usage and create missing type infrastructure

**Warning Reduction Target:** -83 warnings (136 → 53)

---

#### Task 1.1: Create DocumentMetadata Zod Schema ⏱️ 2 hours
**Estimated Warning Reduction:** -60 warnings

**Files to create:**
- `src/types/prisma-json.ts` (add new schema)

**Implementation:**

```typescript
// src/types/prisma-json.ts

import { z } from 'zod';
import { Prisma } from '@prisma/client';

// =============================================================================
// DOCUMENT METADATA SCHEMA
// =============================================================================

/**
 * Validation schema for Prisma documentMetadata Json field
 * Used in RequirementSubmission.documentMetadata
 *
 * This schema provides type safety for the flexible JSON field that stores
 * various types of requirement submission data including documents, form values,
 * and file metadata.
 *
 * @see RequirementSubmission model in prisma/schema.prisma
 */
export const DocumentMetadataSchema = z.object({
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.date(),
  ]).optional(),
  documentUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
  fileType: z.string().optional(),
  uploadedAt: z.string().datetime().optional(),
}).passthrough(); // Allow additional fields for extensibility

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

/**
 * Convert DocumentMetadata to Prisma JsonValue for storage
 *
 * @param metadata - The metadata object to store
 * @returns Prisma-compatible JSON value or JsonNull
 * @throws {ZodError} If metadata doesn't match schema
 *
 * @example
 * await prisma.requirementSubmission.create({
 *   data: {
 *     documentMetadata: documentMetadataToJson({
 *       value: 'License Number',
 *       documentUrl: 'https://...',
 *       uploadedAt: new Date().toISOString(),
 *     }),
 *   },
 * });
 */
export function documentMetadataToJson(
  metadata: DocumentMetadata | null | undefined
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  if (!metadata) return Prisma.JsonNull;

  // Validate before converting (throws if invalid)
  const validated = DocumentMetadataSchema.parse(metadata);

  return validated as Prisma.InputJsonValue;
}

/**
 * Parse Prisma JsonValue as DocumentMetadata for reading
 *
 * @param json - The JSON value from Prisma
 * @returns Parsed metadata or null if invalid/null
 *
 * @example
 * const submission = await prisma.requirementSubmission.findUnique({...});
 * const metadata = parseDocumentMetadata(submission.documentMetadata);
 * if (metadata?.documentUrl) {
 *   console.log('Document URL:', metadata.documentUrl);
 * }
 */
export function parseDocumentMetadata(
  json: Prisma.JsonValue | null
): DocumentMetadata | null {
  if (json === null) return null;

  const result = DocumentMetadataSchema.safeParse(json);
  return result.success ? result.data : null;
}

/**
 * Type guard for runtime checking
 *
 * @param value - Value to check
 * @returns True if value matches DocumentMetadata schema
 *
 * @example
 * if (isDocumentMetadata(unknownData)) {
 *   // TypeScript now knows unknownData is DocumentMetadata
 *   console.log(unknownData.documentUrl);
 * }
 */
export function isDocumentMetadata(value: unknown): value is DocumentMetadata {
  return DocumentMetadataSchema.safeParse(value).success;
}
```

**Files to update:** (Apply pattern systematically)
1. `src/features/providers/components/render-requirement-input.tsx`
2. `src/features/providers/components/profile/edit-regulatory-requirements.tsx`
3. `src/features/providers/components/provider-profile/provider-requirements-edit.tsx`
4. `src/features/providers/components/provider-profile/provider-requirements-section.tsx`
5. `src/features/providers/components/onboarding/regulatory-requirements-section.tsx`
6. All other files accessing `documentMetadata` (find with grep command below)

**Find all files needing updates:**
```bash
grep -r "documentMetadata" src/ --include="*.tsx" --include="*.ts" -l
```

**Find & Replace Pattern:**
```typescript
// ❌ BEFORE (unsafe - returns any)
const value = requirement.existingSubmission?.documentMetadata?.value;
const documentUrl = requirement.existingSubmission?.documentMetadata?.documentUrl;

// ✅ AFTER (type-safe)
import { parseDocumentMetadata } from '@/types/prisma-json';

const metadata = parseDocumentMetadata(requirement.existingSubmission?.documentMetadata);
const value = metadata?.value; // typed as string | number | boolean | date | undefined
const documentUrl = metadata?.documentUrl; // typed as string | undefined
```

**Verification Command:**
```bash
# Should find 0 results after fix
grep -r "documentMetadata\?.value" src/ --include="*.tsx" --include="*.ts"
grep -r "documentMetadata\?.documentUrl" src/ --include="*.tsx" --include="*.ts"
```

---

#### Task 1.2: Fix Explicit `any` in Utility Functions ⏱️ 1 hour
**Estimated Warning Reduction:** -3 warnings

**Files to update:**
1. `src/features/calendar/lib/api-error-handler.ts:271`
2. `src/features/calendar/lib/api-error-handler.ts:313`

**Changes:**
```typescript
// ❌ BEFORE
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  context: ErrorContext
): Promise<T> {
  // ...
}

export function logApiError(error: ApiError, context?: Record<string, any>): void {
  // ...
}

// ✅ AFTER
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {},
  context: ErrorContext
): Promise<T> {
  // ...
}

export function logApiError(error: ApiError, context?: Record<string, unknown>): void {
  // ...
}
```

**Rationale:**
- `unknown` is safer than `any` - forces type checking before use
- Follows TYPE-SAFETY.md guidance (line 321-335)
- No functionality change - only type improvement

---

#### Task 1.3: Fix Form Handlers Using `Record<string, any>` ⏱️ 3 hours
**Estimated Warning Reduction:** -20 warnings

**Files to update:**
1. `src/features/providers/components/profile/edit-basic-info.tsx:143`
2. `src/features/providers/components/profile/provider-profile-view.tsx:314`
3. All other form submission handlers (find with grep command below)

**Find all violations:**
```bash
grep -r "Record<string, any>" src/ --include="*.tsx" --include="*.ts" -n
```

**Pattern to apply:**
```typescript
// ❌ BEFORE
const onSubmit = async (data: Record<string, any>) => {
  formData.append('name', data.name); // unsafe - could be undefined
  formData.append('email', data.email); // unsafe
  formData.append('languages', data.languages); // unsafe
  // ...
}

// ✅ AFTER
import { basicInfoSchema } from '@/features/providers/types/schemas';
import { z } from 'zod';

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

const onSubmit = async (data: BasicInfoFormData) => {
  formData.append('name', data.name); // type-safe - guaranteed string
  formData.append('email', data.email); // type-safe - guaranteed string
  data.languages.forEach(lang => formData.append('languages', lang)); // type-safe array
  // ...
}
```

**For forms without existing schemas:**
```typescript
// Create schema first, then infer type
const myFormSchema = z.object({
  field1: z.string(),
  field2: z.number(),
  // ...
});

type MyFormData = z.infer<typeof myFormSchema>;

const onSubmit = async (data: MyFormData) => {
  // type-safe access
}
```

---

#### Task 1.4: Update Types File Exports ⏱️ 1 hour

**File to update:**
- `src/features/providers/types/types.ts:180`

**Change:**
```typescript
// ❌ BEFORE
export type RequirementType = {
  id: string;
  name: string;
  description?: string | null;
  validationType: RequirementValidationType;
  isRequired: boolean;
  validationConfig?: ValidationConfig;
  displayPriority?: number;
  index: number;
  existingSubmission?: {
    documentUrl: string | null;
    documentMetadata: Record<string, unknown> | null; // Too loose
    value?: string | boolean | number | null;
  };
};

// ✅ AFTER
import { DocumentMetadata } from '@/types/prisma-json';

export type RequirementType = {
  id: string;
  name: string;
  description?: string | null;
  validationType: RequirementValidationType;
  isRequired: boolean;
  validationConfig?: ValidationConfig;
  displayPriority?: number;
  index: number;
  existingSubmission?: {
    documentUrl: string | null;
    documentMetadata: DocumentMetadata | null; // Properly typed
    value?: string | boolean | number | null;
  };
};

/**
 * Represents a provider's submission for a regulatory or business requirement.
 * Supports various submission types including documents, forms, and boolean validations.
 */
export type RequirementSubmission = {
  /** Unique identifier for the submission (generated on save) */
  id?: string;
  /** Reference to the requirement type being fulfilled */
  requirementTypeId: string;
  /** Provider making the submission */
  providerId?: string;
  /** Current validation status of the submission */
  status?: RequirementsValidationStatus;
  /** Metadata for document submissions including URLs and file info */
  documentMetadata?: DocumentMetadata | null; // Updated type
  /** Expiration date for time-sensitive requirements (e.g., licenses) */
  expiresAt?: Date | null;
  /** Additional notes or comments about the submission */
  notes?: string | null;
  /** Timestamp when the submission was validated */
  validatedAt?: Date | null;
  /** ID of the admin user who validated the submission */
  validatedById?: string | null;
  /** Form value for non-document submissions (text, boolean, number) */
  value?: string | boolean | number | null;
  /** Additional value for "other" option in predefined lists */
  otherValue?: string;
};
```

---

#### Task 1.5: Update tRPC Routers Using DocumentMetadata ⏱️ 1 hour

**Files to check and update:**
- `src/server/api/routers/providers.ts`
- `src/server/api/routers/admin.ts`

**Pattern when writing to database:**
```typescript
import { documentMetadataToJson } from '@/types/prisma-json';

// Creating new submission
await prisma.requirementSubmission.create({
  data: {
    requirementTypeId: input.requirementTypeId,
    providerId: input.providerId,
    documentMetadata: documentMetadataToJson({
      value: input.value,
      documentUrl: input.documentUrl,
      fileName: input.fileName,
      uploadedAt: new Date().toISOString(),
    }),
  },
});

// Updating existing submission
await prisma.requirementSubmission.update({
  where: { id: input.id },
  data: {
    documentMetadata: input.documentMetadata
      ? documentMetadataToJson(input.documentMetadata)
      : Prisma.JsonNull,
  },
});
```

**Pattern when reading from database:**
```typescript
import { parseDocumentMetadata } from '@/types/prisma-json';

// In tRPC procedure return
const submission = await prisma.requirementSubmission.findUnique({
  where: { id: input.id },
});

// Parse metadata for type safety (optional in tRPC since it returns as-is)
// But useful if you need to validate or transform
const metadata = parseDocumentMetadata(submission.documentMetadata);
```

---

### **PHASE 2: Medium-Priority Form Type Safety** ⏱️ Day 2 (4 hours)

**Target:** Fix dynamic form field access patterns

**Warning Reduction Target:** -13 warnings (53 → 40)

---

#### Task 2.1: Create Typed Form Field Name Constants ⏱️ 2 hours
**Estimated Warning Reduction:** -10 warnings

**File to create:**
- `src/features/providers/types/form-fields.ts`

**Implementation:**
```typescript
// src/features/providers/types/form-fields.ts

/**
 * Type-safe form field path builders for React Hook Form
 *
 * These helpers eliminate 'any' types from dynamic field access while
 * maintaining flexibility for array-based form structures.
 *
 * @example
 * const paths = requirementFieldPath(0);
 * const value = form.watch(paths.value);
 * form.setValue(paths.requirementTypeId, 'abc-123');
 */

export const requirementFieldPath = (index: number) => {
  const base = `regulatoryRequirements.requirements.${index}` as const;

  return {
    requirementTypeId: `${base}.requirementTypeId` as const,
    value: `${base}.value` as const,
    documentMetadata: `${base}.documentMetadata` as const,
    otherValue: `${base}.otherValue` as const,
  };
};

/**
 * Helper for availability service config field paths
 */
export const serviceConfigFieldPath = (serviceId: string) => {
  return {
    duration: `serviceConfigs.${serviceId}.duration` as const,
    price: `serviceConfigs.${serviceId}.price` as const,
    isOnlineAvailable: `serviceConfigs.${serviceId}.isOnlineAvailable` as const,
    isInPerson: `serviceConfigs.${serviceId}.isInPerson` as const,
  };
};
```

**Files to update:**
- `src/features/providers/components/render-requirement-input.tsx`
- `src/features/providers/components/onboarding/regulatory-requirements-section.tsx`
- All files with dynamic form paths (find with command below)

**Find files:**
```bash
grep -r "form.watch(\`" src/ --include="*.tsx" -l
grep -r "form.setValue(\`" src/ --include="*.tsx" -l
```

**Usage in components:**
```typescript
// ❌ BEFORE
const value = form.watch(`regulatoryRequirements.requirements.${requirement.index}.value`);
form.setValue(`regulatoryRequirements.requirements.${requirement.index}.requirementTypeId`, requirement.id);

// ✅ AFTER
import { requirementFieldPath } from '@/features/providers/types/form-fields';

const paths = requirementFieldPath(requirement.index);
const value = form.watch(paths.value); // Still returns any, but path is type-safe
form.setValue(paths.requirementTypeId, requirement.id);
```

**Note:** This doesn't eliminate the `any` return type from `form.watch()` (that's a React Hook Form limitation), but it makes the field paths type-safe and reduces warnings.

---

#### Task 2.2: Add Type Assertions After Form Validation ⏱️ 2 hours
**Estimated Warning Reduction:** -3 warnings

**Pattern for components:**
```typescript
// ❌ BEFORE
const currentValue = form.watch(`field.${index}.value`); // any
if (currentValue) {
  doSomething(currentValue); // unsafe
}

// ✅ AFTER (with validation)
const rawValue = form.watch(`field.${index}.value`);

// Type guard for string values
const currentValue = typeof rawValue === 'string' ? rawValue : '';

// Type guard for boolean values
const isChecked = typeof rawValue === 'boolean' ? rawValue : false;

// Type guard for number values
const numberValue = typeof rawValue === 'number' ? rawValue : 0;
```

**Apply to files:**
- `src/features/calendar/components/availability/availability-creation-form.tsx`
- `src/features/calendar/components/availability/availability-edit-form.tsx`
- `src/features/calendar/components/availability/availability-proposal-form.tsx`
- Other files with form field access

---

### **PHASE 3: Low-Priority Documentation** ⏱️ Day 3 (4 hours)

**Target:** Add JSDoc to complex interfaces

**Warning Reduction Target:** -37 warnings (40 → <3)

---

#### Task 3.1: Document Calendar Types ⏱️ 1.5 hours
**Estimated Warning Reduction:** -43 warnings

**File:** `src/features/calendar/types/types.ts`

**JSDoc Template to apply:**
```typescript
/**
 * [Brief one-line description]
 *
 * [Detailed description of purpose and usage context]
 *
 * **Related Types:**
 * - {@link RelatedType1} - Relationship description
 * - {@link RelatedType2} - Relationship description
 *
 * **Usage Context:**
 * - Used in [component/feature name]
 * - Created by [action/function]
 * - Transformed to [other type] via [function]
 *
 * **Example:**
 * ```typescript
 * const availability: AvailabilityWithRelations = {
 *   id: 'abc-123',
 *   providerId: 'provider-123',
 *   startTime: new Date('2025-10-10T09:00:00Z'),
 *   endTime: new Date('2025-10-10T17:00:00Z'),
 *   // ...
 * };
 * ```
 *
 * @see [Related docs or functions]
 */
export interface TypeName {
  // ...
}
```

**Process:**
1. Read entire file to understand type relationships (988 lines)
2. Identify all interfaces with >5 properties (~43 interfaces)
3. Add JSDoc to each, including:
   - Purpose and usage
   - Related types with cross-references
   - Example usage where helpful
   - See also references

**Interfaces to document (partial list):**
- `AvailabilityWithRelations`
- `AvailabilityBasic`
- `AvailabilityCreate`
- `ServiceAvailabilityConfig`
- `RecurrencePattern`
- `BookingWithRelations`
- `SlotWithRelations`
- ... (40 more)

---

#### Task 3.2: Document Remaining Type Files ⏱️ 2.5 hours

**Files to document:**

1. **`src/features/invitations/types/types.ts`** (8 interfaces) - 30 minutes
   - `ProviderInvitationWithRelations`
   - `OrganizationInvitationWithRelations`
   - ... (6 more)

2. **`src/features/billing/types/types.ts`** (8 interfaces) - 30 minutes
   - `SubscriptionWithRelations`
   - `PaymentWithRelations`
   - `UsageRecordWithRelations`
   - ... (5 more)

3. **`src/features/organizations/types/types.ts`** (5 interfaces) - 20 minutes
   - `OrganizationWithRelations`
   - `OrganizationLocationWithRelations`
   - ... (3 more)

4. **`src/features/providers/types/types.ts`** (2 interfaces) - 15 minutes
   - `CreateProviderData`
   - `RequirementSubmission`

5. **`src/features/settings/types/types.ts`** (3 interfaces) - 15 minutes
   - `NotificationPreferences`
   - `SecuritySettings`
   - `PrivacySettings`

6. **`src/features/admin/types/types.ts`** (2 interfaces) - 10 minutes
   - `AdminProviderDetails`
   - `AdminOrganizationDetails`

**Effort breakdown:**
- Read file and understand relationships: 5 min per file
- Document each interface: 5-7 min per interface
- Total: ~2.5 hours

---

#### Task 3.3: Fix Prisma Pattern Violations ⏱️ 30 minutes
**Estimated Warning Reduction:** -2 warnings

**File:** `src/components/ui/phone-input.tsx:57`

**Current violation:**
```typescript
// ❌ BEFORE - Manual type definition
type PhoneData = {
  id: string;
  phone: string;
  // ...
};
```

**Required pattern:**
```typescript
// ✅ AFTER - Prisma-derived type
import { Prisma } from '@prisma/client';

// Use Prisma.ModelGetPayload pattern
type UserPhoneDetailSelect = Prisma.UserGetPayload<{
  select: {
    id: true;
    phone: true;
    whatsapp: true;
  };
}>;

// Or if this is for display only, extract from tRPC
import { type RouterOutputs } from '@/utils/api';
type UserPhone = RouterOutputs['user']['getPhone'];
```

**Rationale:**
- Follows project's Prisma type pattern standards
- Ensures zero type drift from database schema
- Matches eslint rule: `enforce-prisma-derived-patterns`

---

## 🧪 Testing Strategy

### Phase 1 Testing (Critical - Must Pass)

```bash
# 1. Type check (should have 0 errors)
npx tsc --noEmit

# 2. Build verification (should succeed)
npm run build

# 3. ESLint check (verify warning count decreased)
NODE_OPTIONS="--max-old-space-size=8192" npx eslint src --ext .ts,.tsx 2>&1 | tail -20

# 4. Verify documentMetadata pattern replaced
grep -r "documentMetadata?.value" src/ --include="*.tsx"  # Should be 0 results
grep -r "documentMetadata?.documentUrl" src/ --include="*.tsx"  # Should be 0 results

# 5. Verify explicit any removed
grep -r "Record<string, any>" src/features/calendar/lib/ --include="*.ts"  # Should be 0
```

**Manual Testing Required:**
1. **Provider Onboarding Flow**
   - Navigate to provider registration
   - Fill out all requirement types:
     - Boolean (Yes/No)
     - Document upload
     - Text input
     - Date selection
     - Predefined list with "Other"
     - Number input
   - Submit and verify data saved correctly
   - Check database that `documentMetadata` JSON is valid

2. **Provider Requirements Edit**
   - Edit existing provider requirements
   - Change document uploads
   - Verify old documentMetadata still displays correctly
   - Submit changes and verify save

3. **Admin Provider Management**
   - View provider requirements in admin panel
   - Approve/reject requirement submissions
   - Verify metadata displays correctly

---

### Phase 2 Testing

```bash
# Verify form field paths work correctly
# Run after updating components with field path helpers
npm run build
```

**Manual Testing:**
- Test all forms with dynamic fields
- Verify form validation still works
- Check that error messages display correctly
- Test "Other" option in predefined lists

---

### Phase 3 Testing

```bash
# Verify JSDoc generates correctly (if using TypeDoc)
npx typedoc --out docs/api src/

# Check JSDoc in IDE
# Hover over any documented interface in VSCode
# Should see formatted documentation popup
```

**Manual Testing:**
- Open files in IDE
- Hover over documented types
- Verify JSDoc tooltips appear
- Check cross-references work (@link, @see)

---

## 📈 Progress Tracking

### Warning Count Targets

| Milestone | Target | Delta | Status |
|-----------|--------|-------|--------|
| **Start** | 136 warnings | - | ⏸️ Baseline |
| **After Phase 1** | ~53 warnings | -83 | ⬜ Not Started |
| **After Phase 2** | ~40 warnings | -13 | ⬜ Not Started |
| **After Phase 3** | <3 warnings | -37 | ⬜ Not Started |
| **Final Goal** | <50 warnings | -86+ | ⬜ Not Started |

### Progress Verification Command

Run after each phase to track progress:

```bash
# Get current warning count
NODE_OPTIONS="--max-old-space-size=8192" npx eslint src --ext .ts,.tsx 2>&1 | grep "✖" | tail -1

# Get breakdown by rule
NODE_OPTIONS="--max-old-space-size=8192" npx eslint src --ext .ts,.tsx --format compact 2>&1 | grep "warning" | awk '{print $NF}' | sort | uniq -c | sort -rn
```

### Git Commits Strategy

**Commit after each task:**
```bash
# Phase 1
git commit -m "feat(types): add DocumentMetadata Zod schema"
git commit -m "fix(types): replace explicit any with unknown in api-error-handler"
git commit -m "fix(types): add Zod-inferred types to form handlers"
git commit -m "fix(types): update RequirementType with DocumentMetadata type"
git commit -m "fix(types): update tRPC routers to use documentMetadataToJson"

# Phase 2
git commit -m "feat(types): add typed form field path helpers"
git commit -m "fix(types): add type assertions after form validation"

# Phase 3
git commit -m "docs(types): add JSDoc to calendar type interfaces"
git commit -m "docs(types): add JSDoc to remaining feature type files"
git commit -m "fix(types): apply Prisma-derived pattern to phone-input"
```

---

## ⚠️ Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing forms | Medium | High | Comprehensive manual testing after Phase 1 |
| Type drift in metadata | Low | Medium | Add integration test for JSON schema parsing |
| Developer confusion on new patterns | Medium | Low | Update TYPE-SAFETY.md with examples |
| Regression in requirements system | Low | High | Test all requirement validation types |
| Performance impact from Zod parsing | Low | Low | Zod parsing is fast, minimal overhead |
| Merge conflicts (92 files already staged) | High | Medium | Complete current commit first, then start this work |

---

## 📚 Documentation Updates

### Files to update:

1. **`docs/compliance/TYPE-SAFETY.md`**
   - Add DocumentMetadata schema example (after RecurrencePattern example)
   - Add form handler typing pattern
   - Add dynamic form field best practices

2. **`docs/compliance/DEVELOPMENT-WORKFLOW.md`**
   - Add guidance on when to create Prisma JSON schemas
   - Document form typing patterns
   - Add examples of typed form field paths

3. **Inline Code Comments**
   - Add comments in complex transformations
   - Document why certain patterns are used
   - Explain type guards and assertions

### Example Documentation Addition

Add to TYPE-SAFETY.md after line 129:

```markdown
### Example: DocumentMetadata

**Step 1: Define Zod Schema**

\`\`\`typescript
export const DocumentMetadataSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.date()]).optional(),
  documentUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
  uploadedAt: z.string().datetime().optional(),
}).passthrough();
\`\`\`

**Step 2: Create Conversion Helpers**

See `/src/types/prisma-json.ts` for full implementation.

**Step 3: Use in Components**

\`\`\`typescript
import { parseDocumentMetadata } from '@/types/prisma-json';

const metadata = parseDocumentMetadata(submission.documentMetadata);
const documentUrl = metadata?.documentUrl; // Type-safe!
\`\`\`
```

---

## 🎯 Definition of Done

### Phase 1 Complete When:
- [ ] `src/types/prisma-json.ts` created with DocumentMetadata schema
- [ ] All 40+ files using `documentMetadata` updated to use parser
- [ ] `api-error-handler.ts` no longer uses explicit `any`
- [ ] All form handlers use Zod-inferred types
- [ ] `RequirementType` and related types updated
- [ ] tRPC routers use `documentMetadataToJson` helper
- [ ] Warning count reduced from 136 to ~53
- [ ] Build passes: `npm run build` succeeds
- [ ] Type check passes: `npx tsc --noEmit` succeeds
- [ ] Manual testing passed for all forms
- [ ] Commits pushed to feature branch

### Phase 2 Complete When:
- [ ] `src/features/providers/types/form-fields.ts` created
- [ ] All dynamic form paths use typed helpers
- [ ] Type assertions added after form validation
- [ ] Warning count reduced from ~53 to ~40
- [ ] All forms tested and working
- [ ] Commits pushed

### Phase 3 Complete When:
- [ ] All 71 interfaces documented with JSDoc
- [ ] Prisma pattern violations fixed
- [ ] Warning count reduced from ~40 to <3
- [ ] JSDoc appears correctly in IDE tooltips
- [ ] Documentation files updated
- [ ] Commits pushed

### Overall Task Complete When:
- [ ] All 3 phases completed
- [ ] Final warning count <50 (target <3)
- [ ] Pre-commit hook passes
- [ ] All manual testing passed
- [ ] Documentation updated
- [ ] PR created and reviewed
- [ ] Changes merged to main branch
- [ ] Post-merge verification (build/deploy succeeds)

---

## 📝 Implementation Notes

### Order of Operations (Critical Path)

1. ✅ **Create `DocumentMetadataSchema`** (foundation - blocks all other work)
2. ✅ Update types files to use new schema
3. ✅ Fix tRPC routers (database layer)
4. ✅ Update components (UI layer) - can be done in parallel after step 2
5. ✅ Fix form handlers - can be done in parallel after step 2
6. ✅ Add documentation - can be done anytime, but best last

### Git Strategy

**Branch naming:**
```bash
git checkout -b type-safety/resolve-eslint-warnings
```

**Commit granularity:**
- One commit per completed task (not per file)
- Descriptive commit messages following conventional commits
- Push after each phase for backup

**PR Strategy:**
- Create draft PR after Phase 1 (allows early review of critical changes)
- Move to "Ready for Review" after Phase 2
- Can deploy Phase 1 independently if needed (backward compatible)

### Breaking Changes

**None** - All changes are backward compatible:
- New helper functions are additive
- Existing code continues to work
- Type improvements don't change runtime behavior
- Prisma JSON fields can still store any valid JSON (validation is on read/write, not schema)

### Performance Considerations

- Zod parsing is fast (~microseconds per operation)
- `parseDocumentMetadata` is called on read, not in hot loops
- Type guards add minimal overhead
- No impact on production bundle size (types removed at build)

### Rollback Plan

If issues discovered after Phase 1 deployment:

```bash
# Revert the commit
git revert <commit-hash>

# Or reset to before changes
git reset --hard <commit-before-changes>

# Deploy previous version
```

Phases are independent - can rollback individual phases without affecting others.

---

## 📞 Questions/Blockers

### Open Questions
- [ ] Should we add integration tests for DocumentMetadata parsing?
- [ ] Do we want TypeDoc generation enabled for JSDoc?
- [ ] Should warning threshold be reduced from 150 to 50 after this work?

### Potential Blockers
- None currently identified
- Feature branch should be created from latest `main` to avoid conflicts
- Coordinate with team to avoid working on same files

---

## 📅 Timeline

**Estimated Duration:** 2-3 days (16-24 hours)

**Suggested Schedule:**
- **Day 1:** Phase 1 (Morning: Schema creation, Afternoon: Component updates)
- **Day 2:** Phase 1 completion + Phase 2 (Testing in afternoon)
- **Day 3:** Phase 3 (Documentation can be done anytime, low priority)

**Can be split into smaller chunks:**
- Week 1: Phase 1 only (highest value)
- Week 2: Phase 2
- Week 3: Phase 3 (ongoing during other work)

---

**Last Updated:** 2025-10-09
**Next Review:** After Phase 1 completion
