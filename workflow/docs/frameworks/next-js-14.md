# Next.js 14 Documentation

## App Router Overview

Next.js 14 uses the App Router, which provides a new way to build applications with React Server Components, streaming, and more.

### Route Handlers

Route handlers replace traditional API routes in the app directory:

```typescript
// app/api/route.ts
export async function GET(request: Request) {
  // Handle GET request
  return Response.json({ data: 'Hello World' })
}

export async function POST(request: Request) {
  const body = await request.json()
  // Handle POST request
  return Response.json({ success: true })
}
```

### Server Actions

Server Actions allow you to run server-side code directly from components:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  // Perform database operations
  const post = await db.post.create({ data: {...} })
  
  revalidatePath('/posts') // Revalidate cache
  redirect(`/post/${post.id}`) // Navigate to new post
}
```

### Data Fetching in Server Components

```typescript
// This component runs on the server
export default async function Page() {
  // Fetch with caching strategies
  const staticData = await fetch('https://...', { cache: 'force-cache' })
  const dynamicData = await fetch('https://...', { cache: 'no-store' })
  const revalidatedData = await fetch('https://...', {
    next: { revalidate: 60 } // Revalidate every 60 seconds
  })

  return <div>{/* Render data */}</div>
}
```

### Routing Hooks

```typescript
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function Component() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Navigation
  router.push('/dashboard')
  router.replace('/login')
  router.refresh()
}
```

### Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Redirect logic
  if (!request.cookies.get('token')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
```

### Dynamic Routes

```typescript
// app/posts/[id]/page.tsx
export default function Post({ params }: { params: { id: string } }) {
  return <div>Post {params.id}</div>
}

// Generate static params
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({
    id: post.id.toString(),
  }))
}
```

### Loading and Error States

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading...</div>
}

// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Layouts

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      <nav>Dashboard Navigation</nav>
      {children}
    </section>
  )
}
```

## Key Features for MedBookings

- **Server Components**: Reduce client-side JavaScript for better performance
- **Streaming**: Progressive rendering for improved user experience
- **Server Actions**: Direct database mutations without API endpoints
- **Built-in Optimizations**: Automatic code splitting, prefetching, and caching
- **Type Safety**: Full TypeScript support with improved type inference

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

Version: 14.2.15