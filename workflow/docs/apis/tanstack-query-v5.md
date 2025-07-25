# TanStack Query v5 Documentation

## Setup

### QueryClient Provider

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
          retry: 3,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

## Queries

### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query'

function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
    enabled: !!userId, // Only run if userId exists
  })
}

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, isError, error } = useUser(userId)
  
  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {error.message}</div>
  
  return <div>{data.name}</div>
}
```

### Query with TypeScript

```typescript
interface Todo {
  id: number
  title: string
  completed: boolean
}

function useTodos() {
  return useQuery<Todo[], Error>({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos')
      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    select: (data) => data.filter(todo => !todo.completed), // Transform data
  })
}
```

### Dependent Queries

```typescript
function useUserProjects(userId: string) {
  const { data: user } = useUser(userId)
  
  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => fetchProjects(user.id),
    enabled: !!user?.id, // Only run when user is loaded
  })
}
```

### Parallel Queries

```typescript
import { useQueries } from '@tanstack/react-query'

function useMultipleUsers(userIds: string[]) {
  const results = useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => fetchUser(id),
      staleTime: 5 * 60 * 1000,
    })),
  })
  
  return {
    users: results.map(result => result.data),
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  }
}
```

## Mutations

### Basic Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useCreateTodo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (newTodo: { title: string }) => 
      fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      }).then(res => res.json()),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      
      // Or update cache directly
      queryClient.setQueryData(['todos'], (old: Todo[]) => [...old, data])
    },
    onError: (error) => {
      console.error('Error creating todo:', error)
    },
  })
}

// Usage in component
function TodoForm() {
  const mutation = useCreateTodo()
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate({ title: 'New Todo' })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Add Todo'}
      </button>
      {mutation.isError && (
        <div>Error: {mutation.error.message}</div>
      )}
    </form>
  )
}
```

### Optimistic Updates

```typescript
function useUpdateTodo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (todo: Todo) => 
      fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      }).then(res => res.json()),
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      
      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos'])
      
      // Optimistically update
      queryClient.setQueryData(['todos'], (old: Todo[]) =>
        old.map(todo => todo.id === newTodo.id ? newTodo : todo)
      )
      
      // Return context with snapshot
      return { previousTodos }
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
```

### Mutation with Variables

```typescript
interface UpdateUserVariables {
  userId: string
  data: {
    name?: string
    email?: string
  }
}

function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation<User, Error, UpdateUserVariables>({
    mutationFn: ({ userId, data }) =>
      fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: (data, variables) => {
      // Update specific user cache
      queryClient.setQueryData(['user', variables.userId], data)
      
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

## Cache Management

### Query Invalidation

```typescript
const queryClient = useQueryClient()

// Invalidate all queries
queryClient.invalidateQueries()

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: ['todos'] })

// Invalidate with exact match
queryClient.invalidateQueries({ 
  queryKey: ['todo', 5], 
  exact: true 
})

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) => 
    query.queryKey[0] === 'todos' && query.state.data?.isStale
})
```

### Direct Cache Updates

```typescript
// Set query data
queryClient.setQueryData(['todo', id], newTodo)

// Get query data
const todo = queryClient.getQueryData(['todo', id])

// Remove query data
queryClient.removeQueries({ queryKey: ['todo', id] })

// Reset queries to initial state
queryClient.resetQueries({ queryKey: ['todos'] })
```

### Prefetching

```typescript
// Prefetch for instant navigation
await queryClient.prefetchQuery({
  queryKey: ['todo', todoId],
  queryFn: () => fetchTodo(todoId),
  staleTime: 10 * 60 * 1000, // 10 minutes
})

// In a component
function TodoList() {
  const queryClient = useQueryClient()
  
  const prefetchTodo = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ['todo', id],
      queryFn: () => fetchTodo(id),
    })
  }
  
  return (
    <div onMouseEnter={() => prefetchTodo(5)}>
      Hover to prefetch
    </div>
  )
}
```

## Advanced Patterns

### Infinite Queries

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

function useTodosInfinite() {
  return useInfiniteQuery({
    queryKey: ['todos', 'infinite'],
    queryFn: ({ pageParam }) => fetchTodos({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
  })
}

// Usage
function InfiniteTodoList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTodosInfinite()
  
  return (
    <>
      {data?.pages.map((page) => (
        page.todos.map(todo => <TodoItem key={todo.id} todo={todo} />)
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </>
  )
}
```

### Mutation State

```typescript
import { useMutationState } from '@tanstack/react-query'

function PendingMutations() {
  const pendingMutations = useMutationState({
    filters: { status: 'pending' },
  })
  
  return (
    <div>
      {pendingMutations.length > 0 && (
        <div>Saving {pendingMutations.length} changes...</div>
      )}
    </div>
  )
}
```

### Query Options Helper

```typescript
import { queryOptions } from '@tanstack/react-query'

// Define reusable query options
const todoQueryOptions = (id: number) => 
  queryOptions({
    queryKey: ['todo', id],
    queryFn: () => fetchTodo(id),
    staleTime: 5 * 60 * 1000,
  })

// Use in components
function useTodo(id: number) {
  return useQuery(todoQueryOptions(id))
}

// Use with queryClient
queryClient.prefetchQuery(todoQueryOptions(5))
```

## Best Practices for MedBookings

1. **Query Keys**: Use consistent, hierarchical query keys
2. **Error Handling**: Implement proper error boundaries
3. **Loading States**: Use Suspense or skeleton loaders
4. **Cache Time**: Set appropriate staleTime and gcTime
5. **Optimistic Updates**: Use for better UX in mutations
6. **Network Mode**: Consider offline support settings

## Additional Resources

- [TanStack Query Documentation](https://tanstack.com/query)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Mutations Guide](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Caching Guide](https://tanstack.com/query/latest/docs/react/guides/caching)

Version: 5.60.6