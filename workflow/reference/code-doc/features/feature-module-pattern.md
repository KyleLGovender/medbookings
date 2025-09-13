# 📦 Feature Module Pattern

This document explains how MedBookings organizes code into feature modules, providing a comprehensive guide for understanding, developing, and maintaining features in the codebase.

## 📖 What You'll Learn

- **Feature-Driven Architecture**: Why and how features are organized
- **Standard Module Structure**: Common patterns across all features
- **Component Organization**: How UI components are structured within features
- **Business Logic Separation**: Where and how business logic is implemented
- **Type Management**: Feature-specific type organization
- **Integration Patterns**: How features connect to each other

## 🎯 Feature-Driven Philosophy

### Traditional vs Feature-Driven Organization

**Traditional Approach** (by technical layer):
```
❌ Problems:
src/
├── components/
│   ├── ProviderForm.tsx          # Mixed concerns
│   ├── OrganizationCard.tsx      # Scattered related code
│   └── BookingCalendar.tsx       # Hard to find feature code
├── hooks/
│   ├── useProviders.ts           # Duplicate concerns
│   └── useOrganizations.ts       # No feature boundaries
└── utils/
    ├── providerUtils.ts          # Business logic scattered
    └── organizationUtils.ts      # Maintenance nightmares
```

**Feature-Driven Approach** (by business domain):
```
✅ Benefits:
src/features/
├── providers/                    # Everything provider-related
│   ├── components/              # Provider UI components
│   ├── hooks/                   # Provider data hooks
│   ├── lib/                     # Provider business logic
│   └── types/                   # Provider type definitions
├── organizations/               # Everything organization-related
│   ├── components/              # Organization UI components
│   ├── hooks/                   # Organization data hooks
│   ├── lib/                     # Organization business logic
│   └── types/                   # Organization type definitions
└── calendar/                    # Everything booking-related
    ├── components/              # Calendar UI components
    ├── hooks/                   # Calendar data hooks
    ├── lib/                     # Calendar business logic
    └── types/                   # Calendar type definitions
```

### Key Benefits

1. **Cohesion**: Related functionality stays together
2. **Team Ownership**: Clear boundaries for team responsibilities
3. **Maintainability**: Easy to find and modify feature-related code
4. **Testing**: Natural boundaries for unit and integration tests
5. **Scalability**: Easy to add new features without affecting others

## 🏗️ Standard Feature Module Structure

### Core Directory Pattern

Every feature follows this consistent structure:

```
features/[feature-name]/
├── 📁 components/              # Feature-specific UI components
│   ├── 📄 [feature]-list.tsx   # List views (e.g., provider-list.tsx)
│   ├── 📄 [feature]-form.tsx   # Form components
│   ├── 📄 [feature]-detail.tsx # Detail/view components
│   ├── 📁 subdirectories/      # Grouped related components
│   └── 📄 index.ts             # Component exports
├── 📁 hooks/                   # Feature-specific React hooks
│   ├── 📄 use-[feature].ts     # Data fetching hooks
│   ├── 📄 use-[feature]-form.ts # Form handling hooks
│   ├── 📄 use-[feature]-mutations.ts # Mutation hooks
│   └── 📄 index.ts             # Hook exports
├── 📁 lib/                     # Business logic and utilities
│   ├── 📄 actions.ts           # Server actions
│   ├── 📄 helper.ts            # Client-side utilities
│   ├── 📄 server-helper.ts     # Server-side utilities
│   └── 📄 queries.ts           # Database queries (if needed)
├── 📁 types/                   # Feature-specific type definitions
│   ├── 📄 types.ts             # Core interfaces and types
│   ├── 📄 schemas.ts           # Zod validation schemas
│   ├── 📄 guards.ts            # Type guards and validators
│   └── 📄 index.ts             # Type exports
└── 📄 index.ts                 # Main feature exports (public API)
```

### Component Organization Patterns

**Component Grouping Strategies**:

```typescript
// Method 1: Flat structure for simple features
components/
├── provider-list.tsx
├── provider-form.tsx
├── provider-detail.tsx
└── provider-card.tsx

// Method 2: Grouped by functionality for complex features
components/
├── profile/                    # Provider profile components
│   ├── provider-profile-view.tsx
│   ├── edit-basic-info.tsx
│   └── edit-services.tsx
├── onboarding/                 # Provider registration
│   ├── provider-onboarding-form.tsx
│   ├── basic-info-section.tsx
│   └── services-section.tsx
└── integrations/               # Provider integrations
    ├── google-calendar-setup.tsx
    └── meet-settings-form.tsx
```

### Hook Organization Patterns

```typescript
// hooks/index.ts - Feature hook exports
export { useProvider } from './use-provider';
export { useProviderForm } from './use-provider-form';
export { useProviderMutations } from './use-provider-mutations';
export { useCurrentUserProvider } from './use-current-user-provider';

// Example hook implementation
// hooks/use-provider.ts
import { api } from '@/utils/api';

export function useProvider(id: string) {
  return api.providers.getById.useQuery(
    { id },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}
```

### Business Logic Organization

```typescript
// lib/actions.ts - Server actions for form submissions and complex operations
export async function updateProviderProfile(
  providerId: string,
  data: UpdateProviderData
) {
  'use server';
  
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  
  // Business logic validation
  const provider = await prisma.provider.findUnique({
    where: { id: providerId }
  });
  
  if (provider?.userId !== user.id) {
    throw new Error('Not authorized to update this provider');
  }
  
  // Update operation
  return await prisma.provider.update({
    where: { id: providerId },
    data: validateProviderData(data)
  });
}

// lib/helper.ts - Client-side utilities
export function formatProviderStatus(status: ProviderStatus): string {
  const statusLabels: Record<ProviderStatus, string> = {
    PENDING_APPROVAL: 'Pending Review',
    APPROVED: 'Approved',
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    REJECTED: 'Rejected'
  };
  return statusLabels[status];
}

// lib/server-helper.ts - Server-side utilities
export async function getProviderWithPermissions(
  providerId: string,
  userId: string
) {
  return await prisma.provider.findFirst({
    where: {
      id: providerId,
      OR: [
        { userId }, // Provider themselves
        { user: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } } // Admin access
      ]
    },
    include: {
      user: true,
      services: true
    }
  });
}
```

## 🔗 Feature Integration Patterns

### Inter-Feature Communication

**Shared Types** (when features need to reference each other):
```typescript
// features/organizations/types/types.ts
import type { Provider } from '@/features/providers/types';

export interface OrganizationWithProviders {
  id: string;
  name: string;
  providers: Provider[]; // Reference to provider feature types
}
```

**Feature Hooks Integration**:
```typescript
// Using multiple features in a component
function OrganizationProvidersPage({ organizationId }: Props) {
  // Organization feature hook
  const { data: organization } = useOrganization(organizationId);
  
  // Providers feature hook
  const { data: providers } = useOrganizationProviders(organizationId);
  
  return (
    <div>
      <h1>{organization?.name} Providers</h1>
      <ProvidersList providers={providers} />
    </div>
  );
}
```

### Shared Components vs Feature Components

**Shared Components** (`src/components/`):
- Reusable UI primitives (Button, Input, Card)
- Layout components (Header, Sidebar)
- Generic utilities (Loading, EmptyState)

**Feature Components** (`src/features/[feature]/components/`):
- Business logic components
- Feature-specific UI
- Domain-specific forms and views

```typescript
// ✅ Good - Feature-specific component
// features/providers/components/provider-form.tsx
export function ProviderForm({ provider, onSubmit }: Props) {
  // Provider-specific form logic
  return (
    <Form> {/* Shared UI component */}
      <Input name="providerName" /> {/* Shared UI component */}
      <ServiceSelector /> {/* Feature-specific component */}
    </Form>
  );
}

// ❌ Avoid - Generic form in feature
// This should be in shared components if it's reusable
export function GenericForm() {
  // Generic form logic
}
```

## 🏥 Feature Examples

### Provider Feature Architecture

```typescript
// features/providers/index.ts - Public API
export { ProviderForm } from './components/provider-form';
export { ProviderDetail } from './components/provider-detail';
export { ProvidersList } from './components/providers-list';

export { useProvider } from './hooks/use-provider';
export { useProviderForm } from './hooks/use-provider-form';
export { useCurrentUserProvider } from './hooks/use-current-user-provider';

export { updateProviderProfile } from './lib/actions';
export { formatProviderStatus } from './lib/helper';

export type { Provider, ProviderFormData } from './types/types';
export { createProviderSchema } from './types/schemas';
```

**Component Structure**:
```typescript
// features/providers/components/provider-form.tsx
import { useProviderForm } from '../hooks/use-provider-form';
import { type ProviderFormData } from '../types/types';
import { createProviderSchema } from '../types/schemas';

export function ProviderForm({ provider, onSubmit }: Props) {
  const { form, isSubmitting } = useProviderForm({
    defaultValues: provider,
    schema: createProviderSchema,
    onSubmit
  });
  
  return (
    <Form {...form}>
      {/* Form implementation */}
    </Form>
  );
}
```

### Calendar Feature Architecture

```typescript
// features/calendar/index.ts
export { AvailabilityCalendar } from './components/availability-calendar';
export { BookingCalendar } from './components/booking-calendar';
export { AvailabilityForm } from './components/availability-form';

export { useAvailability } from './hooks/use-availability';
export { useCalendarData } from './hooks/use-calendar-data';
export { useCreateBooking } from './hooks/use-create-booking';

export { generateTimeSlots } from './lib/calendar-utils';
export { validateBookingTime } from './lib/scheduling-rules';

export type { Availability, Booking, TimeSlot } from './types/types';
export { createAvailabilitySchema } from './types/schemas';
```

**Complex Component Structure**:
```typescript
features/calendar/
├── components/
│   ├── availability/              # Availability management
│   │   ├── availability-calendar.tsx
│   │   ├── availability-form.tsx
│   │   └── availability-list.tsx
│   ├── booking/                   # Booking management
│   │   ├── booking-calendar.tsx
│   │   ├── booking-form.tsx
│   │   └── booking-confirmation.tsx
│   ├── views/                     # Different calendar views
│   │   ├── day-view.tsx
│   │   ├── week-view.tsx
│   │   └── month-view.tsx
│   └── index.ts                   # Component exports
```

## 🎯 Type Management in Features

### Type Organization Strategy

```typescript
// features/providers/types/types.ts - Core domain types
export interface Provider {
  id: string;
  name: string;
  bio?: string;
  status: ProviderStatus;
  user: User;
  services: Service[];
}

export interface ProviderFormData {
  name: string;
  bio?: string;
  languages: Languages[];
  website?: string;
}

// features/providers/types/schemas.ts - Validation schemas  
import { z } from 'zod';
import { Languages } from '@prisma/client';

export const createProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().max(1000, 'Bio must be under 1000 characters').optional(),
  languages: z.array(z.nativeEnum(Languages)),
  website: z.string().url('Must be a valid URL').optional()
});

export type CreateProviderData = z.infer<typeof createProviderSchema>;

// features/providers/types/guards.ts - Type guards
export function isProviderActive(provider: Provider): boolean {
  return provider.status === 'ACTIVE';
}

export function isProviderOwner(provider: Provider, userId: string): boolean {
  return provider.user.id === userId;
}
```

### Type Import Strategies

```typescript
// ✅ Good - Import from feature public API
import type { Provider, ProviderFormData } from '@/features/providers';
import { createProviderSchema } from '@/features/providers';

// ✅ Good - Import database types directly  
import { ProviderStatus, Languages } from '@prisma/client';

// ✅ Good - Import tRPC types
import type { RouterOutputs } from '@/utils/api';
type ApiProvider = RouterOutputs['providers']['getById'];

// ❌ Avoid - Import from internal feature files
import type { Provider } from '@/features/providers/types/types';
```

## 🧪 Testing Strategy for Features

### Feature-Level Testing

```typescript
// features/providers/__tests__/provider-form.test.tsx
import { render, screen, userEvent } from '@testing-library/react';
import { ProviderForm } from '../components/provider-form';
import { createProviderSchema } from '../types/schemas';

describe('ProviderForm', () => {
  it('validates required fields', async () => {
    const onSubmit = vi.fn();
    render(<ProviderForm onSubmit={onSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
  
  it('submits valid data', async () => {
    const onSubmit = vi.fn();
    const validData = {
      name: 'Dr. Smith',
      bio: 'Experienced physician',
      languages: ['English'],
    };
    
    render(<ProviderForm defaultValues={validData} onSubmit={onSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalledWith(validData);
  });
});
```

### Business Logic Testing

```typescript
// features/providers/__tests__/helper.test.ts
import { formatProviderStatus } from '../lib/helper';
import { ProviderStatus } from '@prisma/client';

describe('formatProviderStatus', () => {
  it('formats status labels correctly', () => {
    expect(formatProviderStatus(ProviderStatus.PENDING_APPROVAL)).toBe('Pending Review');
    expect(formatProviderStatus(ProviderStatus.ACTIVE)).toBe('Active');
    expect(formatProviderStatus(ProviderStatus.SUSPENDED)).toBe('Suspended');
  });
});
```

## 📋 Feature Development Checklist

### When Creating a New Feature

- [ ] Create feature directory structure
- [ ] Set up component organization (flat vs grouped)
- [ ] Define core types and interfaces
- [ ] Create validation schemas
- [ ] Implement data fetching hooks
- [ ] Add tRPC router procedures
- [ ] Create server actions for mutations
- [ ] Implement UI components
- [ ] Add unit tests for business logic
- [ ] Add integration tests for components
- [ ] Create feature exports (index.ts)
- [ ] Update main app navigation
- [ ] Add feature documentation

### When Modifying Existing Features

- [ ] Check component dependencies
- [ ] Update type definitions if needed
- [ ] Modify validation schemas
- [ ] Update hooks and mutations
- [ ] Test existing functionality
- [ ] Update exports if public API changed
- [ ] Update feature documentation

## 🎯 Best Practices Summary

### Organization
1. **Consistent Structure**: Follow the standard feature pattern
2. **Clear Boundaries**: Keep feature concerns separate
3. **Public APIs**: Use index.ts files for clean exports
4. **Component Grouping**: Group related components in subdirectories

### Code Quality
1. **Type Safety**: Use TypeScript throughout
2. **Validation**: Zod schemas for all inputs
3. **Testing**: Unit and integration tests
4. **Documentation**: Clear component and function documentation

### Integration
1. **Shared Components**: Use for generic UI components
2. **Feature Components**: Use for business logic components
3. **Type Imports**: Import from public APIs when possible
4. **Hook Composition**: Combine multiple feature hooks cleanly

### Performance
1. **Code Splitting**: Features are automatically split by route
2. **Lazy Loading**: Dynamic imports for heavy components
3. **Caching**: Proper tRPC query caching
4. **Memoization**: React.memo for expensive components

## 🔗 Related Documentation

- [Core Architecture Overview](../core/architecture-overview.md) - System design patterns
- [Project Structure Deep Dive](../core/project-structure-explained.md) - Overall code organization
- [Component Patterns](../components/component-patterns.md) - UI component architecture
- [tRPC Architecture](../api/trpc-architecture.md) - API integration patterns

---

*This feature module pattern provides a scalable, maintainable approach to organizing complex business logic while keeping related code together and maintaining clear boundaries between different areas of the application.*