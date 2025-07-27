# tRPC Migration Implementation Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next superjson
```

### 2. Create Base Infrastructure

#### A. Create tRPC Context and Instance
```typescript
// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type Session } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type CreateContextOptions = {
  session: Session | null;
};

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get user using existing auth pattern
  const user = await getCurrentUser();

  return createInnerTRPCContext({
    session: user ? { user, expires: '' } : null,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

const enforceUserHasRole = (allowedRoles: string[]) => {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const user = ctx.session.user as any;
    if (!allowedRoles.includes(user.role)) {
      throw new TRPCError({ 
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action'
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
};

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserHasRole(['ADMIN', 'SUPER_ADMIN']));
export const superAdminProcedure = t.procedure.use(enforceUserHasRole(['SUPER_ADMIN']));
```

#### B. Create App Router Handler
```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { env } from '@/env';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/trpc';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
```

#### C. Create Root Router
```typescript
// src/server/api/root.ts
import { createTRPCRouter } from '@/server/trpc';

// Import sub-routers (we'll create these next)
import { adminRouter } from './routers/admin';
import { billingRouter } from './routers/billing';
import { calendarRouter } from './routers/calendar';
import { invitationsRouter } from './routers/invitations';
import { organizationsRouter } from './routers/organizations';
import { profileRouter } from './routers/profile';
import { providersRouter } from './routers/providers';

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  billing: billingRouter,
  calendar: calendarRouter,
  invitations: invitationsRouter,
  organizations: organizationsRouter,
  profile: profileRouter,
  providers: providersRouter,
});

export type AppRouter = typeof appRouter;
```

#### D. Create tRPC Client
```typescript
// src/utils/api.ts
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import superjson from 'superjson';

import { type AppRouter } from '@/server/api/root';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
  ssr: false,
});

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
```

#### E. Update Providers
```typescript
// src/components/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

import { api } from '@/utils/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      // tRPC client config
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </api.Provider>
  );
}
```

### 3. Migration Patterns

#### Pattern 1: Simple GET Endpoint
```typescript
// Before: /api/providers/provider-types/route.ts
export async function GET() {
  try {
    const providerTypes = await prisma.providerType.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(providerTypes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch provider types' }, { status: 500 });
  }
}

// After: /server/api/routers/providers.ts
export const providersRouter = createTRPCRouter({
  getProviderTypes: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.providerType.findMany({
      orderBy: { name: 'asc' },
    });
  }),
});

// Hook migration
// Before:
export function useProviderTypes() {
  return useQuery({
    queryKey: ['provider-types'],
    queryFn: () => fetch('/api/providers/provider-types').then(res => res.json()),
  });
}

// After:
export function useProviderTypes() {
  return api.providers.getProviderTypes.useQuery();
}
```

#### Pattern 2: Mutation with Validation
```typescript
// Before: /api/providers/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const data = await request.json();
  // Manual validation...
  
  const result = await registerProvider({}, formData);
  return NextResponse.json(result);
}

// After: /server/api/routers/providers.ts
import { providerFormSchema } from '@/features/providers/types/schemas';
import { registerProvider } from '@/features/providers/lib/actions/register-provider';

export const providersRouter = createTRPCRouter({
  register: protectedProcedure
    .input(providerFormSchema)
    .mutation(async ({ ctx, input }) => {
      // Convert input to FormData for existing action
      const formData = new FormData();
      formData.append('userId', ctx.session.user.id);
      formData.append('name', input.basicInfo.name);
      // ... map other fields
      
      const result = await registerProvider({}, formData);
      
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Failed to register provider',
        });
      }
      
      return result;
    }),
});
```

#### Pattern 3: Admin Endpoints with Complex Logic
```typescript
// /server/api/routers/admin.ts
export const adminRouter = createTRPCRouter({
  providers: createTRPCRouter({
    list: adminProcedure
      .input(z.object({
        status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const where = input.status ? { status: input.status } : {};
        
        const [providers, total] = await ctx.prisma.$transaction([
          ctx.prisma.provider.findMany({
            where,
            include: {
              user: { select: { id: true, email: true, name: true } },
              typeAssignments: {
                include: {
                  providerType: { select: { name: true } },
                },
              },
              requirementSubmissions: { select: { status: true } },
            },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
            orderBy: { createdAt: 'desc' },
          }),
          ctx.prisma.provider.count({ where }),
        ]);
        
        return {
          providers,
          pagination: {
            total,
            page: input.page,
            limit: input.limit,
            totalPages: Math.ceil(total / input.limit),
          },
        };
      }),
    
    approve: adminProcedure
      .input(z.object({
        providerId: z.string(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Import existing approval action
        const { approveProvider } = await import('@/features/admin/lib/approval-actions');
        
        const result = await approveProvider({
          providerId: input.providerId,
          adminUserId: ctx.session.user.id,
          adminNotes: input.adminNotes,
        });
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error || 'Failed to approve provider',
          });
        }
        
        return result;
      }),
  }),
});
```

#### Pattern 4: File Upload (Keep as REST)
```typescript
// Keep /api/upload/route.ts as is
// Add a helper procedure for generating upload URLs if needed
export const uploadRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Generate presigned URL or upload token
      return {
        uploadUrl: `/api/upload`,
        token: generateUploadToken(input),
      };
    }),
});
```

### 4. Hook Migration Examples

#### Query Hook
```typescript
// Before
export function useProvider(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      if (!providerId) throw new Error('Provider ID required');
      const response = await fetch(`/api/providers/${providerId}`);
      if (!response.ok) throw new Error('Failed to fetch provider');
      return response.json();
    },
    enabled: !!providerId,
  });
}

// After
export function useProvider(providerId: string | undefined) {
  return api.providers.get.useQuery(
    { id: providerId! },
    { enabled: !!providerId }
  );
}
```

#### Mutation Hook
```typescript
// Before
export function useUpdateProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update provider');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider'] });
    },
  });
}

// After
export function useUpdateProvider() {
  const utils = api.useContext();
  
  return api.providers.update.useMutation({
    onSuccess: () => {
      utils.providers.get.invalidate();
      utils.providers.list.invalidate();
    },
  });
}
```

### 5. Testing Patterns

#### Unit Testing Procedures
```typescript
// src/server/api/routers/__tests__/providers.test.ts
import { createInnerTRPCContext } from '@/server/trpc';
import { appRouter } from '@/server/api/root';

describe('providers router', () => {
  it('should list provider types', async () => {
    const ctx = createInnerTRPCContext({
      session: null,
    });
    
    const caller = appRouter.createCaller(ctx);
    const result = await caller.providers.getProviderTypes();
    
    expect(Array.isArray(result)).toBe(true);
  });
  
  it('should require auth for registration', async () => {
    const ctx = createInnerTRPCContext({
      session: null,
    });
    
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.providers.register({
        // ... input
      })
    ).rejects.toThrow('UNAUTHORIZED');
  });
});
```

### 6. Common Gotchas and Solutions

#### A. FormData Conversion
```typescript
// Helper function for converting tRPC input to FormData
function inputToFormData(input: any): FormData {
  const formData = new FormData();
  
  function appendToFormData(obj: any, prefix = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      
      if (value === null || value === undefined) return;
      
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(fullKey, item));
      } else if (typeof value === 'object' && !(value instanceof File)) {
        appendToFormData(value, fullKey);
      } else {
        formData.append(fullKey, String(value));
      }
    });
  }
  
  appendToFormData(input);
  return formData;
}
```

#### B. Error Handling
```typescript
// Consistent error handling wrapper
async function handleServerAction<T>(
  action: () => Promise<{ success: boolean; error?: string; data?: T }>
): Promise<T> {
  try {
    const result = await action();
    
    if (!result.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: result.error || 'Operation failed',
      });
    }
    
    if (!result.data) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No data returned',
      });
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    
    console.error('Unexpected error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}
```

### 7. Monitoring and Debugging

#### Enable tRPC Panel in Development
```typescript
// src/app/layout.tsx
import { TRPCPanel } from '@trpc/panel';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <TRPCPanel
            router={appRouter}
            url="/api/trpc"
          />
        )}
      </body>
    </html>
  );
}
```

### 8. Performance Optimization

#### Query Options
```typescript
// Optimize query performance
const { data } = api.providers.list.useQuery(
  { status: 'APPROVED' },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  }
);
```

#### Selective Invalidation
```typescript
// Invalidate specific queries instead of all
const utils = api.useContext();

// Instead of: utils.invalidate()
// Do: 
utils.providers.get.invalidate({ id: providerId });
utils.providers.list.invalidate({ status: 'APPROVED' });
```

### 9. Migration Checklist

For each endpoint:
- [ ] Create tRPC procedure in appropriate router
- [ ] Add proper input validation using existing Zod schemas
- [ ] Implement error handling with TRPCError
- [ ] Update corresponding hook to use tRPC
- [ ] Test the migrated endpoint
- [ ] Update any components using the hook
- [ ] Remove the old API route file
- [ ] Update documentation

### 10. Rollback Strategy

If issues arise:
1. Keep old API routes until migration is validated
2. Use feature flags to switch between old/new:
   ```typescript
   export function useProviders() {
     if (process.env.NEXT_PUBLIC_USE_TRPC === 'true') {
       return api.providers.list.useQuery();
     }
     // Old implementation
     return useQuery({
       queryKey: ['providers'],
       queryFn: () => fetch('/api/providers').then(res => res.json()),
     });
   }
   ```

This guide should help you implement the tRPC migration efficiently while maintaining all existing functionality and patterns in the MedBookings codebase.