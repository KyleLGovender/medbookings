# 🗂️ Project Structure Deep Dive

This document provides a detailed breakdown of how the MedBookings codebase is organized, explaining the reasoning behind every folder, file, and architectural decision.

## 📖 What You'll Learn

- **Folder Organization Philosophy**: Why each directory exists
- **Next.js App Router Structure**: How routing is implemented
- **Feature Module Organization**: How features are structured
- **File Naming Conventions**: Patterns used throughout the codebase
- **Import/Export Strategies**: How modules connect to each other

## 🏗️ Root Directory Structure

```
/medbookings/
├── 📁 .claude/                 # Claude Code workflow commands
├── 📁 .github/                 # GitHub Actions and templates
├── 📁 .next/                   # Next.js build output (generated)
├── 📁 .vscode/                 # VS Code configuration
├── 📁 e2e/                     # End-to-end Playwright tests
├── 📁 node_modules/            # Dependencies (generated)
├── 📁 playwright-report/       # Test reports (generated)
├── 📁 prisma/                  # Database schema and migrations
├── 📁 public/                  # Static assets
├── 📁 scripts/                 # Build and deployment scripts
├── 📁 src/                     # Main application source code
├── 📁 workflow/                # Development workflow documentation
├── 📄 package.json             # Dependencies and scripts
├── 📄 prisma.schema            # Database schema definition
├── 📄 tailwind.config.ts       # Tailwind CSS configuration
└── 📄 tsconfig.json            # TypeScript configuration
```

### Key Design Decisions

**Monorepo Structure**: Single repository containing frontend, backend, and database
- **Pros**: Shared types, unified development, simplified deployment
- **Cons**: Larger repository size
- **Why Chosen**: Team size and feature coupling justify monorepo benefits

**Prisma at Root**: Database schema at top level rather than in src/
- **Reasoning**: Prisma generates client code, needs to be accessible from build tools
- **Pattern**: Industry standard for Next.js + Prisma applications

## 📂 Source Code Structure (`src/`)

```
src/
├── 📁 app/                     # Next.js App Router (Pages & API)
├── 📁 assets/                  # Static assets (fonts, images)
├── 📁 components/              # Reusable UI components
├── 📁 config/                  # Application configuration
├── 📁 features/                # Feature modules (business logic)
├── 📁 hooks/                   # Global custom hooks
├── 📁 lib/                     # Shared utilities and libraries
├── 📁 middleware.ts            # Next.js middleware
├── 📁 server/                  # tRPC server configuration
├── 📁 types/                   # Global type definitions
└── 📁 utils/                   # Utility functions
```

### Architecture Philosophy: Feature-Driven Structure

**Traditional Approach** (by technical layer):
```
❌ Not used
src/
├── components/     # ALL components
├── pages/         # ALL pages  
├── api/           # ALL API routes
├── utils/         # ALL utilities
└── types/         # ALL types
```

**Our Approach** (by business domain):
```
✅ Used
src/
├── features/
│   ├── providers/     # Everything provider-related
│   ├── organizations/ # Everything organization-related
│   └── calendar/      # Everything booking-related
└── components/        # ONLY shared/reusable UI
```

**Why Feature-Driven?**
1. **Cohesion**: Related functionality stays together
2. **Team Ownership**: Teams can own entire features
3. **Maintainability**: Easy to find and modify related code
4. **Testing**: Natural test organization boundaries

## 🚀 Next.js App Router Structure (`src/app/`)

### Route Groups Organization

```
app/
├── 📁 (dashboard)/            # Route Group - Authenticated Users
│   ├── layout.tsx            # Dashboard-specific layout
│   ├── 📁 admin/             # Admin-only pages (/admin/*)
│   ├── 📁 availability/      # Availability management (/availability/*)
│   ├── 📁 organizations/     # Organization pages (/organizations/*)
│   ├── 📁 profile/           # User profile (/profile/*)
│   └── 📁 providers/         # Provider pages (/providers/*)
│
├── 📁 (general)/             # Route Group - Public Pages
│   ├── layout.tsx            # Public layout  
│   ├── 📁 (auth)/            # Auth pages (nested group)
│   ├── 📁 (compliance)/      # Legal pages (nested group)
│   ├── 📁 calendar/          # Public booking (/calendar/*)
│   ├── 📁 invitation/        # Invitation handling (/invitation/*)
│   └── page.tsx              # Homepage (/)
│
├── 📁 api/                   # API Routes
│   ├── 📁 auth/              # Authentication endpoints
│   ├── 📁 trpc/              # tRPC API handler
│   ├── 📁 upload/            # File upload endpoints
│   └── 📁 whatsapp-callback/ # Webhook handlers
│
├── favicon.ico
├── globals.css               # Global styles
├── layout.tsx                # Root layout (applies to all pages)
├── loading.tsx               # Global loading UI
└── not-found.tsx             # 404 page
```

### Route Groups Explained

**Route Groups**: `(name)` - Folders that don't affect URL structure
- **Purpose**: Organization and shared layouts
- **Example**: `(dashboard)/providers/page.tsx` → `/providers` (not `/dashboard/providers`)

**Why Two Route Groups?**
1. **Different Layouts**: Public vs authenticated layouts
2. **Different Middleware**: Auth checks vs public access  
3. **Different Navigation**: Different navigation patterns
4. **Code Organization**: Clear separation of concerns

### Page Component Patterns

**Server Component Page (Default)**:
```typescript
// app/(dashboard)/providers/page.tsx
export default async function ProvidersPage() {
  // Data fetching on server
  const providers = await getProviders();
  
  return (
    <div>
      <h1>Providers</h1>
      <ProviderList providers={providers} />
    </div>
  );
}

// Automatic static metadata
export const metadata: Metadata = {
  title: 'Providers | MedBookings',
  description: 'Manage healthcare providers'
};
```

**Dynamic Page with Loading**:
```typescript
// app/(dashboard)/providers/[id]/page.tsx
export default async function ProviderDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const provider = await getProvider(params.id);
  
  if (!provider) {
    notFound(); // Triggers not-found.tsx
  }
  
  return <ProviderDetail provider={provider} />;
}

// Parallel loading UI
// app/(dashboard)/providers/[id]/loading.tsx
export default function LoadingProviderDetail() {
  return <ProviderSkeleton />;
}
```

**Layout Composition**:
```typescript
// app/(dashboard)/layout.tsx - Dashboard Layout
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

// app/layout.tsx - Root Layout (applied to all pages)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
```

## 🎯 Feature Module Structure (`src/features/`)

### Standard Feature Organization

Each feature follows this consistent pattern:

```
features/[feature-name]/
├── 📁 components/              # Feature-specific UI components
│   ├── 📄 feature-list.tsx     # List views
│   ├── 📄 feature-form.tsx     # Form components
│   ├── 📄 feature-detail.tsx   # Detail views
│   └── 📁 subdirectory/        # Grouped related components
├── 📁 hooks/                   # Feature-specific React hooks
│   ├── 📄 use-feature-data.ts  # Data fetching hooks
│   ├── 📄 use-feature-mutations.ts # Mutation hooks
│   └── 📄 use-feature-form.ts  # Form handling hooks
├── 📁 lib/                     # Business logic and utilities
│   ├── 📄 actions.ts           # Server actions
│   ├── 📄 helper.ts            # Client-side utilities
│   └── 📄 server-helper.ts     # Server-side utilities
├── 📁 types/                   # Feature-specific types
│   ├── 📄 types.ts             # Core types and interfaces
│   ├── 📄 schemas.ts           # Zod validation schemas
│   └── 📄 guards.ts            # Type guards and validators
└── 📄 index.ts                 # Public API exports
```

### Feature Module Examples

**Provider Feature Structure**:
```typescript
features/providers/
├── components/
│   ├── onboarding/                    # Provider registration
│   │   ├── provider-onboarding-form.tsx
│   │   ├── basic-info-section.tsx
│   │   ├── services-section.tsx
│   │   └── regulatory-requirements-section.tsx
│   ├── profile/                       # Provider profile management
│   │   ├── provider-profile-view.tsx
│   │   ├── edit-basic-info.tsx
│   │   └── edit-services.tsx
│   └── provider-calendar.tsx          # Provider's calendar view
├── hooks/
│   ├── use-provider.ts                # Get single provider
│   ├── use-provider-updates.ts       # Update provider
│   ├── use-current-user-provider.ts  # Current user's provider
│   └── use-admin-providers.ts        # Admin provider management
├── lib/
│   └── actions.ts                     # Server actions for provider operations
└── types/
    ├── types.ts                       # Provider-related types
    ├── schemas.ts                     # Validation schemas
    └── guards.ts                      # Type guards
```

**Calendar Feature Structure**:
```typescript
features/calendar/
├── components/
│   ├── availability/                   # Availability management
│   │   ├── availability-creation-form.tsx
│   │   ├── availability-edit-form.tsx
│   │   └── availability-proposals-list.tsx
│   ├── views/                         # Calendar views
│   │   ├── availability-day-view.tsx
│   │   ├── availability-week-view.tsx
│   │   └── slot-day-view.tsx
│   └── provider-calendar-view.tsx     # Main calendar component
├── hooks/
│   ├── use-availability.ts            # Availability data
│   ├── use-calendar-data.ts          # Calendar state
│   └── use-provider-slots.ts         # Provider slots
├── lib/
│   ├── calendar-utils.ts              # Calendar calculations
│   ├── slot-generation.ts            # Slot generation logic
│   └── scheduling-rules.ts           # Business rules
└── types/
    ├── types.ts                       # Calendar types
    └── schemas.ts                     # Calendar validation
```

### Feature Module Benefits

1. **Encapsulation**: Each feature is self-contained
2. **Discoverability**: Easy to find feature-related code
3. **Testing**: Natural test boundaries
4. **Team Ownership**: Clear ownership boundaries
5. **Refactoring**: Easy to move or modify features

## 🧩 Component Structure (`src/components/`)

### Global Components Organization

```
components/
├── 📁 auth/                    # Authentication components
│   ├── permission-form.tsx     # Permission request forms
│   ├── permission-gate.tsx     # Authorization gates  
│   └── permission-navigation.tsx # Auth-aware navigation
├── 📁 layout/                  # Layout components
│   ├── dashboard-layout.tsx    # Dashboard layout
│   └── general-layout.tsx      # Public layout
├── 📁 providers/               # React context providers
│   └── query-provider.tsx      # TanStack Query provider
├── 📁 skeletons/               # Loading state components
│   ├── provider-profile-skeleton.tsx
│   └── organization-profile-skeleton.tsx
├── 📁 ui/                      # Base UI components (shadcn/ui)
│   ├── button.tsx              # Button component
│   ├── input.tsx               # Input component
│   ├── form.tsx                # Form components
│   └── ...                     # Other UI primitives
├── app-sidebar.tsx             # Main navigation sidebar
├── back-button.tsx             # Navigation back button
├── document-uploader.tsx       # File upload component
├── empty-state.tsx             # Empty state component
├── query-loader.tsx            # Query loading wrapper
└── status-badge.tsx            # Status indicator component
```

### Component Categories

**Base UI Components** (`ui/`):
- **Purpose**: Reusable design system components
- **Source**: shadcn/ui components with customizations
- **Usage**: Used throughout the application
- **Examples**: Button, Input, Dialog, Table

**Layout Components** (`layout/`):
- **Purpose**: Page and section layout
- **Scope**: Application-wide layouts
- **Examples**: Dashboard layout, public layout, sidebar

**Domain Components** (feature directories):
- **Purpose**: Business logic components
- **Scope**: Feature-specific
- **Examples**: ProviderForm, OrganizationDetail, BookingCalendar

### Component Patterns

**Compound Component Pattern**:
```typescript
// ui/form.tsx - Compound component
const Form = FormRoot;
const FormField = FormFieldComponent;
const FormItem = FormItemComponent;
const FormLabel = FormLabelComponent;
const FormControl = FormControlComponent;
const FormMessage = FormMessageComponent;

export {
  Form,
  FormField, 
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
};

// Usage
<Form {...form}>
  <FormField
    control={form.control}
    name="name"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Name</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

**Container/Presenter Pattern**:
```typescript
// Container (hooks and logic)
function ProviderFormContainer({ providerId }: Props) {
  const { data: provider } = api.providers.getById.useQuery({ id: providerId });
  const updateProvider = api.providers.update.useMutation();
  
  return (
    <ProviderForm
      provider={provider}
      onSubmit={updateProvider.mutate}
      isSubmitting={updateProvider.isLoading}
    />
  );
}

// Presenter (pure UI)
function ProviderForm({ provider, onSubmit, isSubmitting }: Props) {
  const form = useForm({ defaultValues: provider });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form UI */}
    </form>
  );
}
```

## 🛠️ Server Configuration (`src/server/`)

### tRPC Server Structure

```
server/
├── 📁 api/
│   ├── 📄 root.ts              # Main tRPC router
│   └── 📁 routers/             # Feature-specific routers
│       ├── admin.ts            # Admin operations
│       ├── billing.ts          # Billing operations  
│       ├── calendar.ts         # Calendar operations
│       ├── communications.ts   # Communications
│       ├── organizations.ts    # Organization operations
│       ├── profile.ts          # Profile operations
│       └── providers.ts        # Provider operations
└── 📄 trpc.ts                  # tRPC configuration and context
```

**Router Organization Philosophy**:
- **One router per business domain**: Clear separation of concerns
- **Procedure naming**: Consistent patterns (get, getAll, create, update, delete)
- **Authorization**: Consistent use of procedure types (public, protected, admin)

**Example Router Structure**:
```typescript
// server/api/routers/providers.ts
export const providerRouter = createTRPCRouter({
  // Queries (read operations)
  getAll: publicProcedure.query(async ({ ctx }) => { /* ... */ }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => { /* ... */ }),
    
  // Mutations (write operations)  
  create: protectedProcedure
    .input(createProviderSchema)
    .mutation(async ({ input, ctx }) => { /* ... */ }),
  update: protectedProcedure
    .input(updateProviderSchema)  
    .mutation(async ({ input, ctx }) => { /* ... */ }),
    
  // Admin operations
  approve: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => { /* ... */ }),
});
```

## 📚 Shared Libraries (`src/lib/`)

### Library Organization

```
lib/
├── 📁 auth/                    # Authentication utilities
│   ├── permissions.ts          # Permission checking
│   └── roles.ts                # Role definitions
├── 📁 communications/          # Communication utilities  
│   └── email.ts                # Email sending
├── 📁 permissions/             # Permission system
│   └── README.md               # Permission documentation
├── 📁 utils/                   # General utilities
│   ├── document-utils.ts       # Document handling
│   ├── responsive.ts           # Responsive utilities
│   └── utils-upload-to-blob.ts # File upload utilities
├── auth.ts                     # NextAuth configuration
├── cache.ts                    # Caching utilities
├── constants.ts                # Application constants
├── helper.ts                   # General helper functions
├── prisma.ts                   # Prisma client configuration
├── queries.ts                  # Shared database queries
├── server-helper.ts            # Server-side utilities
├── subscription-utils.ts       # Subscription utilities
├── timezone-helper.ts          # Timezone handling
└── utils.ts                    # General utilities (includes cn)
```

### Key Library Functions

**Authentication (`auth.ts`)**:
```typescript
// NextAuth configuration
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      // Enrich session with user data
      return session;
    },
  },
};

// Helper functions
export const getServerAuthSession = () => getServerSession(authOptions);
export async function getCurrentUser() {
  const session = await getServerAuthSession();
  if (!session?.user?.email) return null;
  // Get full user from database
  return await prisma.user.findUnique({
    where: { email: session.user.email },
  });
}
```

**Database Client (`prisma.ts`)**:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Utilities (`utils.ts`)**:
```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Other shared utilities
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
};
```

## 🏗️ File Naming Conventions

### Component Naming
- **React Components**: PascalCase (`ProviderForm.tsx`)
- **Page Components**: `page.tsx` (Next.js App Router convention)
- **Layout Components**: `layout.tsx` (Next.js App Router convention)
- **Loading Components**: `loading.tsx` (Next.js App Router convention)

### Hook Naming
- **Custom Hooks**: `use-[purpose].ts` (`use-provider-data.ts`)
- **Feature Hooks**: `use-[feature]-[purpose].ts` (`use-provider-form.ts`)

### Utility Naming
- **Utility Files**: kebab-case (`server-helper.ts`)
- **Type Files**: kebab-case (`api-types.ts`)
- **Schema Files**: kebab-case (`validation-schemas.ts`)

### Directory Naming
- **Feature Directories**: kebab-case (`providers/`, `organizations/`)
- **Component Directories**: kebab-case (`ui/`, `layout/`)
- **Route Directories**: kebab-case (`(dashboard)/`, `api/`)

## 🔗 Import/Export Strategies

### Barrel Exports (index.ts files)

**Feature Module Exports**:
```typescript
// features/providers/index.ts
export { ProviderForm } from './components/provider-form';
export { ProviderDetail } from './components/provider-detail';
export { useProviderData } from './hooks/use-provider-data';
export { useProviderForm } from './hooks/use-provider-form';
export type { Provider, ProviderFormData } from './types/types';
export { createProviderSchema } from './types/schemas';
```

**UI Component Exports**:
```typescript
// components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Form, FormField, FormItem } from './form';
// ... other exports
```

### Import Patterns

**Recommended Import Order**:
```typescript
// 1. External library imports
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 2. Internal UI imports
import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';

// 3. Feature imports  
import { useProviderData } from '@/features/providers';

// 4. Utility imports
import { cn } from '@/lib/utils';

// 5. Type imports (with type keyword)
import type { Provider } from '@/features/providers/types';
```

**Path Mapping Configuration**:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

## 🎯 Key Benefits of This Structure

### 1. **Discoverability**
- Feature-related code is grouped together
- Consistent naming conventions
- Clear import/export patterns

### 2. **Maintainability**  
- Changes to a feature are contained within its module
- Clear separation between shared and feature-specific code
- Easy to refactor or move features

### 3. **Team Scalability**
- Teams can own entire feature modules
- Minimal conflicts between team changes
- Clear boundaries of responsibility

### 4. **Type Safety**
- Consistent type organization  
- Clear type import patterns
- Feature-specific types stay with features

### 5. **Testing Organization**
- Tests can be organized by feature
- Clear boundaries for unit vs integration tests
- Easy to maintain test coverage per feature

## 🔍 Common Patterns to Follow

### When Adding New Features
1. Create feature directory in `src/features/`
2. Follow standard feature structure
3. Create barrel exports in `index.ts`
4. Add tRPC router in `src/server/api/routers/`
5. Update root router in `src/server/api/root.ts`

### When Adding New Pages
1. Determine route group (`(dashboard)` vs `(general)`)
2. Create page component (`page.tsx`)
3. Add loading component if needed (`loading.tsx`)
4. Update navigation if needed

### When Adding New Components
1. Determine if it's shared or feature-specific
2. Place in appropriate directory
3. Follow naming conventions
4. Export from appropriate barrel file

## 🔗 Related Documentation

- [Core Architecture Overview](./architecture-overview.md) - High-level system design
- [Data Flow Patterns](./data-flow-patterns.md) - How data moves through the system
- [Feature Module Pattern](../features/feature-module-pattern.md) - Feature development guide
- [Development Workflow](../workflow/development-process.md) - How to develop features

---

*This project structure has evolved to support the specific needs of the MedBookings platform while maintaining flexibility for future growth and team scaling.*