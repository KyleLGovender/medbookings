# Prisma 5.22.0 Documentation

## Setup and Configuration

### Schema Definition

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  name    String?
  posts   Post[]
  profile Profile?
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  tags      Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

## Client Usage

### Basic Queries

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Find many with relations
const users = await prisma.user.findMany({
  include: {
    posts: true,
    profile: true
  }
})

// Find unique
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
})

// Find first matching
const firstAdmin = await prisma.user.findFirst({
  where: {
    role: 'ADMIN'
  }
})
```

### Creating Records

```typescript
// Simple create
const user = await prisma.user.create({
  data: {
    name: 'Alice',
    email: 'alice@example.com'
  }
})

// Create with relations
const userWithPosts = await prisma.user.create({
  data: {
    name: 'Bob',
    email: 'bob@example.com',
    posts: {
      create: [
        { title: 'Hello World' },
        { title: 'My second post' }
      ]
    },
    profile: {
      create: { bio: 'I like coding' }
    }
  },
  include: {
    posts: true,
    profile: true
  }
})
```

### Updating Records

```typescript
// Simple update
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Updated Name' }
})

// Update with relations
const updateUserPosts = await prisma.user.update({
  where: { id: 1 },
  data: {
    posts: {
      create: { title: 'New Post' },
      update: {
        where: { id: 1 },
        data: { published: true }
      },
      delete: { id: 2 }
    }
  }
})

// Update many
const updateManyPosts = await prisma.post.updateMany({
  where: { published: false },
  data: { published: true }
})
```

### Deleting Records

```typescript
// Delete single record
const deletedUser = await prisma.user.delete({
  where: { id: 1 }
})

// Delete many
const deletedPosts = await prisma.post.deleteMany({
  where: {
    createdAt: {
      lt: new Date('2024-01-01')
    }
  }
})
```

### Complex Queries

```typescript
// With filtering and sorting
const publishedPosts = await prisma.post.findMany({
  where: {
    published: true,
    author: {
      email: { contains: '@example.com' }
    }
  },
  orderBy: {
    createdAt: 'desc'
  },
  include: {
    author: true,
    tags: true
  }
})

// With pagination
const paginatedPosts = await prisma.post.findMany({
  skip: 20,
  take: 10,
  where: { published: true }
})

// Count
const postCount = await prisma.post.count({
  where: { published: true }
})

// Aggregations
const stats = await prisma.post.aggregate({
  _count: { _all: true },
  _avg: { views: true },
  _max: { views: true }
})
```

### Transactions

```typescript
// Sequential transactions
const [post, totalPosts] = await prisma.$transaction([
  prisma.post.create({ data: { title: 'New Post' } }),
  prisma.post.count()
])

// Interactive transactions
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'new@example.com' }
  })
  
  const post = await tx.post.create({
    data: {
      title: 'Post',
      authorId: user.id
    }
  })
  
  // If error thrown here, entire transaction rolls back
  if (someCondition) {
    throw new Error('Rollback')
  }
  
  return { user, post }
})
```

### Raw Queries

```typescript
// Raw SQL
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email LIKE ${`%@example.com`}
`

// Execute raw SQL
const result = await prisma.$executeRaw`
  UPDATE "Post" SET views = views + 1 WHERE id = ${postId}
`
```

### Middleware

```typescript
// Log all queries
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})
```

## Best Practices for MedBookings

1. **Connection Management**: Use a singleton pattern for PrismaClient
2. **Query Optimization**: Use `select` to fetch only needed fields
3. **Relation Loading**: Be mindful of N+1 queries, use `include` wisely
4. **Error Handling**: Always wrap database operations in try-catch
5. **Type Safety**: Leverage Prisma's generated types

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

Version: 5.22.0