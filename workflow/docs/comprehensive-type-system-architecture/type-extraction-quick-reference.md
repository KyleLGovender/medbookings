# tRPC Type Extraction Quick Reference - Option C

## 🏗️ Option C Architecture
- ✅ **tRPC procedures = ALL database queries** (automatic type inference)
- ✅ **Server actions = ONLY business logic** (validation, notifications)
- ✅ **Single query per endpoint** (optimal performance)
- ✅ **Zero type drift** (Prisma → tRPC → Client)

## 🚀 Essential Imports

```typescript
import { type RouterOutputs } from '@/utils/api';
import { api } from '@/utils/api';
```

## 📋 Common Patterns

### Basic Extraction
```typescript
type Output = RouterOutputs['router']['procedure'];
```

### Array Item
```typescript
type Items = RouterOutputs['router']['getAll'];
type Item = Items[number];
```

### Nested Field
```typescript
type Nested = NonNullable<Output>['field'];
```

### Optional Field
```typescript
type Maybe = NonNullable<Output>['optional'];
```

## 🎯 Real Examples

### Admin Provider
```typescript
type Provider = RouterOutputs['admin']['getProvider'];
type Requirements = NonNullable<Provider>['requirementSubmissions'];
type Requirement = Requirements[number];
```

### Organization with Relations
```typescript
type Org = RouterOutputs['organizations']['getDetail'];
type Locations = NonNullable<Org>['locations'];
type Location = Locations[number];
```

### Billing Subscription
```typescript
type Sub = RouterOutputs['billing']['getSubscription'];
type Plan = NonNullable<Sub>['plan'];
type Usage = NonNullable<Sub>['usageRecords'];
```

## ⚡ Quick Conversions

| From | To |
|------|-----|
| `Provider[]` | `RouterOutputs['providers']['getAll']` |
| `Provider` | `RouterOutputs['providers']['getById']` |
| `Provider & { relations }` | `RouterOutputs['providers']['getWithRelations']` |
| `Decimal` | `number` (automatic in tRPC) |

## 🔧 Component Pattern

```typescript
// Don't pass full objects
❌ <Component provider={provider} />

// Pass IDs instead  
✅ <Component providerId={provider.id} />

// Fetch in component
function Component({ providerId }: { providerId: string }) {
  const { data } = api.providers.getById.useQuery({ id: providerId });
  // Full type safety!
}
```

## 📁 File Locations

- **Domain Types**: `/features/*/types/types.ts`
- **Schemas**: `/features/*/types/schemas.ts`
- **Guards**: `/features/*/types/guards.ts`
- **RouterOutputs**: `@/utils/api`

## ⚠️ Common Mistakes

```typescript
// ❌ Exporting types from hooks
export type Provider = RouterOutputs['providers']['get'];

// ✅ Extract in component
type Provider = RouterOutputs['providers']['get'];

// ❌ Creating manual interfaces
interface ProviderWithRelations extends Provider { }

// ✅ Use tRPC output directly
type ProviderDetail = RouterOutputs['providers']['getDetail'];

// ❌ Any types
const provider: any = data;

// ✅ Proper typing
const provider = data; // TypeScript infers!
```

## 🎭 Dual Source Rules

| Type | Source | Import |
|------|--------|---------|
| Server data | tRPC | `RouterOutputs['...']['...']` |
| Domain enums | Manual | `@/features/*/types/types` |
| Form schemas | Manual | `@/features/*/types/schemas` |
| Type guards | Manual | `@/features/*/types/guards` |

## 🛠️ VS Code Snippets

Add to `.vscode/snippets.code-snippets`:

```json
{
  "tRPC Type Extract": {
    "prefix": "trpc",
    "body": [
      "type ${1:TypeName} = RouterOutputs['${2:router}']['${3:procedure}'];"
    ]
  },
  "tRPC Array Type": {
    "prefix": "trpcarray",
    "body": [
      "type ${1:Items} = RouterOutputs['${2:router}']['${3:getAll}'];",
      "type ${4:Item} = ${1}[number];"
    ]
  },
  "tRPC Nested Type": {
    "prefix": "trpcnested",
    "body": [
      "type ${1:Nested} = NonNullable<${2:Parent}>['${3:field}'];"
    ]
  }
}
```

---

**Print this page and keep it handy during migration!** 🖨️