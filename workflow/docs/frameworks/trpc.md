# tRPC Documentation

## Overview

tRPC is a TypeScript library that enables building fully typesafe APIs without code generation or schemas. It provides end-to-end type safety between your TypeScript backend and frontend.

### Key Features

- **End-to-end type safety**: Automatic type inference from backend to frontend
- **No code generation**: Types are inferred directly from your router definitions
- **Framework agnostic**: Works with any JavaScript framework
- **RPC-like client API**: Call backend functions as if they were local
- **Built-in error handling**: Type-safe error handling out of the box

## Installation

```bash
npm install @trpc/server @trpc/client
# or
yarn add @trpc/server @trpc/client
# or
pnpm add @trpc/server @trpc/client
```

## Basic Setup

### 1. Initialize tRPC

```typescript
// server/trpc.ts
import { initTRPC } from '@trpc/server';

// Initialize tRPC - this is typically done once per app
const t = initTRPC.create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
```

### 2. Create Router

```typescript
// server/appRouter.ts
import { z } from 'zod';
import { router, publicProcedure } from './trpc';

export const appRouter = router({
  // Query procedure
  greeting: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello ${input.name}!`;
    }),
  
  // Mutation procedure
  createUser: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      // Create user in database
      return { id: 1, ...input };
    }),
});

// Export type for client
export type AppRouter = typeof appRouter;
```

### 3. HTTP Server Setup

```typescript
// server/index.ts
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './appRouter';

const server = createHTTPServer({
  router: appRouter,
  createContext() {
    return {};
  },
});

server.listen(3000);
```

### 4. Client Setup

```typescript
// client/index.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/appRouter';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000',
    }),
  ],
});

// Type-safe API calls
const greeting = await trpc.greeting.query({ name: 'World' });
const user = await trpc.createUser.mutate({
  name: 'John',
  email: 'john@example.com',
});
```

## Core Concepts

### Procedures

tRPC has three types of procedures:

1. **Query**: For fetching data
2. **Mutation**: For modifying data
3. **Subscription**: For real-time data (WebSocket)

```typescript
const appRouter = router({
  // Query - GET-like operations
  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return db.user.findById(input.id);
    }),
  
  // Mutation - POST/PUT/DELETE-like operations
  updateUser: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
    }))
    .mutation(({ input }) => {
      return db.user.update(input);
    }),
  
  // Subscription - real-time updates
  onUserUpdate: publicProcedure
    .subscription(() => {
      return observable<User>((emit) => {
        // Emit updates
      });
    }),
});
```

### Context

Context is shared between all procedures and is created for each request:

```typescript
// Create context type
type Context = {
  user?: { id: string; name: string };
};

// Initialize tRPC with context
const t = initTRPC.context<Context>().create();

// Create context for each request
const createContext = ({ req, res }: CreateHTTPContextOptions): Context => {
  const user = getUserFromHeader(req.headers.authorization);
  return { user };
};

// Use context in procedures
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.user, // user is non-nullable now
    },
  });
});
```

### Middleware

Middleware allows you to run code before procedures:

```typescript
// Logging middleware
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  console.log(`${type} ${path} took ${duration}ms`);
  return result;
});

// Apply middleware
const loggedProcedure = publicProcedure.use(loggerMiddleware);
```

### Input Validation

tRPC uses Zod for runtime validation:

```typescript
const appRouter = router({
  createPost: publicProcedure
    .input(z.object({
      title: z.string().min(1).max(100),
      content: z.string().min(10),
      published: z.boolean().default(false),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(({ input }) => {
      // input is fully typed and validated
      return db.post.create(input);
    }),
});
```

### Error Handling

```typescript
import { TRPCError } from '@trpc/server';

const appRouter = router({
  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findById(input.id);
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      return user;
    }),
});
```

## Framework Integrations

### Next.js App Router

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/appRouter';
import { createContext } from '@/server/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
  });

export { handler as GET, handler as POST };
```

### Express

```typescript
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';

const app = express();

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.listen(4000);
```

### Fastify

```typescript
import fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';

const server = fastify();

server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
});

server.listen({ port: 3000 });
```

## Advanced Features

### Batching

tRPC automatically batches requests for better performance:

```typescript
// Client automatically batches these calls
const [user, posts] = await Promise.all([
  trpc.user.byId.query({ id: '1' }),
  trpc.post.list.query(),
]);
```

### Output Validation

```typescript
const appRouter = router({
  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
    }))
    .query(({ input }) => {
      // Return value must match output schema
      return db.user.findById(input.id);
    }),
});
```

### Transformers

Transform data between server and client:

```typescript
// Server
export const appRouter = router({
  getDate: publicProcedure.query(() => {
    return { date: new Date() };
  }),
});

// Client with superjson transformer
import superjson from 'superjson';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000',
      transformer: superjson,
    }),
  ],
});
```

### Subscriptions (WebSocket)

```typescript
// Server
import { observable } from '@trpc/server/observable';

const appRouter = router({
  onMessage: publicProcedure.subscription(() => {
    return observable<Message>((emit) => {
      const onMessage = (msg: Message) => emit.next(msg);
      eventEmitter.on('message', onMessage);
      
      return () => {
        eventEmitter.off('message', onMessage);
      };
    });
  }),
});

// Client
const subscription = trpc.onMessage.subscribe(undefined, {
  onData(msg) {
    console.log('New message:', msg);
  },
});
```

## Testing

```typescript
// Direct router testing
import { appRouter } from './appRouter';
import { createInnerTRPCContext } from './context';

test('greeting query', async () => {
  const ctx = createInnerTRPCContext({ user: null });
  const caller = appRouter.createCaller(ctx);
  
  const result = await caller.greeting({ name: 'Test' });
  expect(result).toBe('Hello Test!');
});
```

## Best Practices

1. **Use procedures composition**: Create reusable procedure builders
2. **Organize routers**: Split large routers into sub-routers
3. **Type your context**: Always define context type
4. **Handle errors properly**: Use TRPCError with appropriate codes
5. **Validate inputs and outputs**: Use Zod schemas for runtime safety
6. **Use middleware**: For auth, logging, and other cross-cutting concerns

## Migration from REST

```typescript
// REST API
app.get('/api/users/:id', async (req, res) => {
  const user = await db.user.findById(req.params.id);
  res.json(user);
});

// tRPC equivalent
const appRouter = router({
  user: router({
    byId: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => db.user.findById(input.id)),
  }),
});
```

## Performance Optimization

- **Request batching**: Enabled by default
- **Response caching**: Use HTTP cache headers
- **Query deduplication**: Automatic on the client
- **Lazy loading**: Split routers for code splitting

## Security Considerations

- **Input validation**: Always validate with Zod
- **Authentication**: Use middleware for auth checks
- **Rate limiting**: Implement at server level
- **CORS**: Configure appropriately for production

Version: 10.45.2
