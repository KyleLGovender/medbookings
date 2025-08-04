# Migration Templates - Option C Architecture

**Purpose**: Copy-paste templates for efficient Option C migration patterns

## Architecture Principles (Option C)

- ✅ **Server actions handle ONLY business logic** (validation, notifications, workflows)
- ✅ **tRPC procedures handle ALL database queries directly** for automatic type inference
- ✅ **Single database query per endpoint** for optimal performance
- ✅ **Server actions return minimal metadata only** (IDs, success flags, error messages)

## Template 0: Server Action Migration (Option C)

```typescript
// ============= BEFORE (Old Pattern) =============
// Server action returns database results - WRONG
export async function createProvider(data: CreateProviderData) {
  const validatedData = validateProviderData(data)
  
  if (!validatedData.isValid) {
    return { success: false, error: validatedData.error }
  }

  // Database operation in server action - INEFFICIENT
  const provider = await prisma.provider.create({
    data: validatedData.data,
    include: {
      user: { select: { id: true, name: true, email: true } },
      services: true,
      typeAssignments: { include: { providerType: true } },
    }
  })
  
  return { success: true, data: provider } // Returns database results
}

// tRPC procedure calls server action - DUPLICATE QUERY
create: protectedProcedure
  .input(createProviderSchema)
  .mutation(async ({ ctx, input }) => {
    const result = await createProvider(input) // Server action queries DB
    
    if (!result.success) throw new Error(result.error)
    
    // SECOND database query for full relations - INEFFICIENT
    return ctx.prisma.provider.findUnique({
      where: { id: result.data.id },
      include: { /* full relations */ }
    })
  })

// ============= AFTER (Option C) =============
// Server action handles ONLY business logic - EFFICIENT
export async function createProvider(data: CreateProviderData) {
  // Validation, notifications, business workflows
  const validatedData = validateProviderData(data)
  
  if (!validatedData.isValid) {
    return { success: false, error: validatedData.error }
  }

  // Send notifications, trigger workflows, etc.
  await sendProviderRegistrationEmail(data.email)
  await notifyAdminsOfNewProvider(data)
  
  // Return minimal metadata only - NO DATABASE RESULTS
  return { 
    success: true, 
    providerId: data.userId, // Just the ID for tRPC to query
    requiresApproval: true,
    notificationsSent: true
  }
}

// tRPC procedure performs SINGLE database query - EFFICIENT
create: protectedProcedure
  .input(createProviderSchema)
  .mutation(async ({ ctx, input }) => {
    // Call server action for business logic
    const result = await createProvider(input)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    // SINGLE database query with full relations and automatic type inference
    return ctx.prisma.provider.findUnique({
      where: { id: result.providerId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        services: true,
        typeAssignments: { include: { providerType: true } },
        // Complete data with automatic type inference - NO MANUAL TYPES
      }
    })
  })
```

## Template 1: Basic Component Migration

```typescript
// ============= BEFORE =============
import { Provider, Service } from '@/features/providers/types/types';

interface ComponentProps {
  provider: Provider;
  services: Service[];
  onUpdate: (provider: Provider) => void;
}

export function MyComponent({ provider, services, onUpdate }: ComponentProps) {
  // Component logic
}

// ============= AFTER =============
import { type RouterOutputs } from '@/utils/api';
// Keep domain imports
import { ProviderStatus } from '@/features/providers/types/types';

// Extract types at component level
type Provider = RouterOutputs['providers']['getById'];
type Services = RouterOutputs['services']['getByProvider'];
type Service = Services[number];

interface ComponentProps {
  providerId: string; // Pass ID instead of full object
  onUpdate?: (providerId: string) => void;
}

export function MyComponent({ providerId, onUpdate }: ComponentProps) {
  // Fetch data in component
  const { data: provider } = api.providers.getById.useQuery({ id: providerId });
  const { data: services } = api.services.getByProvider.useQuery({ providerId });
  
  if (!provider || !services) return <Loading />;
  
  // Component logic with full type safety
}
```

## Template 2: List Component Migration

```typescript
// ============= BEFORE =============
import { AdminProviderListItem } from '@/features/admin/types/types';

interface ListProps {
  providers: AdminProviderListItem[];
  onSelect: (provider: AdminProviderListItem) => void;
}

export function ProviderList({ providers, onSelect }: ListProps) {
  return (
    <div>
      {providers.map(provider => (
        <div key={provider.id} onClick={() => onSelect(provider)}>
          {provider.name}
        </div>
      ))}
    </div>
  );
}

// ============= AFTER =============
import { type RouterOutputs } from '@/utils/api';
import { AdminApprovalStatus } from '@/features/admin/types/types';

// Extract types
type Providers = RouterOutputs['admin']['getProviders'];
type Provider = Providers[number];

interface ListProps {
  status?: AdminApprovalStatus; // Filter by domain enum
  onSelect?: (provider: Provider) => void;
}

export function ProviderList({ status, onSelect }: ListProps) {
  // Fetch data in component
  const { data: providers, isLoading } = api.admin.getProviders.useQuery({ status });
  
  if (isLoading) return <LoadingSkeleton />;
  if (!providers?.length) return <EmptyState />;
  
  return (
    <div>
      {providers.map((provider: Provider) => (
        <div key={provider.id} onClick={() => onSelect?.(provider)}>
          {provider.name}
        </div>
      ))}
    </div>
  );
}
```

## Template 3: Form Component Migration

```typescript
// ============= BEFORE =============
import { UpdateProviderData } from '@/features/providers/types/types';

interface FormProps {
  provider: Provider;
  onSubmit: (data: UpdateProviderData) => void;
}

// ============= AFTER =============
import { type RouterOutputs } from '@/utils/api';
import { updateProviderSchema } from '@/features/providers/types/schemas';
import type { z } from 'zod';

// Server data type
type Provider = RouterOutputs['providers']['getById'];
// Form data type from schema
type UpdateProviderInput = z.infer<typeof updateProviderSchema>;

interface FormProps {
  providerId: string;
  onSuccess?: () => void;
}

export function UpdateProviderForm({ providerId, onSuccess }: FormProps) {
  const { data: provider } = api.providers.getById.useQuery({ id: providerId });
  const updateMutation = api.providers.update.useMutation({
    onSuccess: () => {
      onSuccess?.();
    },
  });
  
  const form = useForm<UpdateProviderInput>({
    resolver: zodResolver(updateProviderSchema),
    defaultValues: provider ? {
      name: provider.name,
      email: provider.email,
      // Map server data to form schema
    } : undefined,
  });
  
  const onSubmit = (data: UpdateProviderInput) => {
    updateMutation.mutate({ id: providerId, ...data });
  };
  
  // Form JSX
}
```

## Template 4: Hook Migration

```typescript
// ============= BEFORE =============
// In hooks/use-providers.ts
import { Provider } from '@/features/providers/types/types';

export interface UseProvidersResult {
  providers: Provider[];
  isLoading: boolean;
  error: Error | null;
}

export function useProviders(): UseProvidersResult {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await fetch('/api/providers');
      return res.json();
    },
  });
}

// ============= AFTER =============
// In hooks/use-providers.ts
import { api } from '@/utils/api';

// No type exports! Just a thin wrapper
export function useProviders(status?: string) {
  return api.providers.getAll.useQuery({ status });
}

// Types extracted in components that use the hook
```

## Template 5: Complex Nested Types

```typescript
// ============= BEFORE =============
interface OrganizationWithEverything {
  id: string;
  name: string;
  locations: Location[];
  memberships: Array<{
    id: string;
    user: User;
    role: MembershipRole;
  }>;
  subscription: {
    id: string;
    status: string;
    plan: SubscriptionPlan;
  };
}

// ============= AFTER =============
import { type RouterOutputs } from '@/utils/api';

// Break down complex extractions
type OrgDetail = RouterOutputs['organizations']['getDetail'];
type Locations = NonNullable<OrgDetail>['locations'];
type Location = Locations[number];
type Memberships = NonNullable<OrgDetail>['memberships'];
type Membership = Memberships[number];
type Subscription = NonNullable<OrgDetail>['subscription'];
type Plan = NonNullable<Subscription>['plan'];

// Use in component
function OrganizationDetail({ orgId }: { orgId: string }) {
  const { data: org } = api.organizations.getDetail.useQuery({ id: orgId });
  
  // Access with full type safety
  const activeMembers = org?.memberships?.filter(m => m.isActive);
  const planName = org?.subscription?.plan?.name;
}
```

## Template 6: Mixed Domain and Server Types

```typescript
// ============= AFTER (Correct Pattern) =============
import { type RouterOutputs } from '@/utils/api';
// Import domain types separately
import { 
  AdminApprovalStatus, 
  RequirementValidationType 
} from '@/features/admin/types/types';
import { providerApprovalSchema } from '@/features/admin/types/schemas';

// Server data types
type Provider = RouterOutputs['admin']['getProvider'];
type Requirements = NonNullable<Provider>['requirementSubmissions'];
type Requirement = Requirements[number];

// Component mixing both
function ProviderApproval({ providerId }: { providerId: string }) {
  const { data: provider } = api.admin.getProvider.useQuery({ id: providerId });
  
  // Use domain enum for business logic
  const isPending = provider?.status === AdminApprovalStatus.PENDING_APPROVAL;
  
  // Use domain schema for validation
  const form = useForm({
    resolver: zodResolver(providerApprovalSchema),
  });
  
  // Server data for display
  const requirements = provider?.requirementSubmissions ?? [];
}
```

## Template 7: Page Component Migration

```typescript
// ============= BEFORE =============
// In app/(dashboard)/admin/providers/page.tsx
import { getProviders } from '@/features/admin/lib/actions';
import { AdminProviderListItem } from '@/features/admin/types/types';

export default async function ProvidersPage() {
  const providers = await getProviders();
  
  return <ProviderList providers={providers} />;
}

// ============= AFTER =============
// In app/(dashboard)/admin/providers/page.tsx
'use client';

import { api } from '@/utils/api';
import { AdminApprovalStatus } from '@/features/admin/types/types';

export default function ProvidersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  // Let component handle data fetching
  return (
    <ProviderList 
      status={searchParams.status as AdminApprovalStatus}
    />
  );
}
```

## Quick Conversion Patterns

### Arrays
```typescript
// Manual type
providers: Provider[]

// tRPC type
type Providers = RouterOutputs['providers']['getAll'];
providers: Providers
```

### Single Items
```typescript
// Manual type
provider: Provider

// tRPC type  
type Provider = RouterOutputs['providers']['getById'];
provider: Provider | undefined
```

### Nested Relations
```typescript
// Manual type
provider.organization.name

// tRPC type
type Organization = NonNullable<Provider>['organization'];
const orgName = provider?.organization?.name;
```

### Optional Fields
```typescript
// Manual type
subscription?: Subscription

// tRPC type
type Subscription = NonNullable<Provider>['subscription'];
const subscription = provider?.subscription;
```

## Migration Checklist

For each file you migrate:

- [ ] Remove manual server data imports
- [ ] Add `import { type RouterOutputs } from '@/utils/api'`
- [ ] Extract types at component level
- [ ] Keep domain type imports (enums, schemas, guards)
- [ ] Update props to use extracted types
- [ ] Replace prop drilling with direct queries
- [ ] Test TypeScript compilation
- [ ] Verify runtime behavior

---

**Remember**: These are templates. Adapt them to your specific use case!