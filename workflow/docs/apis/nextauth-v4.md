# NextAuth.js v4 Documentation

## Configuration

### Basic Setup

```typescript
// auth.ts
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token, user }) {
      // Add custom fields to session
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // Persist user data in JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // Control sign in flow
      return true; // or false to deny
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
```

## Providers

### OAuth Providers

```typescript
import Facebook from 'next-auth/providers/facebook';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

providers: [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
    },
  }),
  GitHub({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }),
  Facebook({
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  }),
];
```

### Email Provider

```typescript
import Resend from 'next-auth/providers/resend';

providers: [
  Resend({
    apiKey: process.env.AUTH_RESEND_KEY,
    from: 'no-reply@medbookings.com',
  }),
];
```

### Credentials Provider

```typescript
import bcrypt from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';

providers: [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.password) return null;

      const isValid = await bcrypt.compare(credentials.password, user.password);

      if (!isValid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
];
```

## Usage in Components

### Server Components

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <h1>Welcome {session.user?.name}</h1>
      <p>Email: {session.user?.email}</p>
      <p>Role: {session.user?.role}</p>
    </div>
  )
}
```

### Client Components

```typescript
'use client'
import { useSession } from "next-auth/react"
import { signIn, signOut } from "next-auth/react"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (session) {
    return (
      <>
        <span>Signed in as {session.user?.email}</span>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }

  return (
    <button onClick={() => signIn()}>Sign in</button>
  )
}
```

### SessionProvider

```typescript
// app/providers.tsx
'use client'
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## Server Actions with Auth

```typescript
import { auth } from '@/auth';

export async function updateProfile(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Update user profile
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: formData.get('name') as string,
      bio: formData.get('bio') as string,
    },
  });
}

export async function deleteAccount() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Soft delete user account
  await prisma.user.update({
    where: { id: session.user.id },
    data: { deletedAt: new Date() },
  });

  // Sign out user
  await signOut();
}
```

## Middleware Protection

```typescript
// middleware.ts
export { auth as middleware } from '@/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/protected/:path*'],
};
```

## Custom Pages

```typescript
// app/auth/signin/page.tsx
import { signIn } from "@/auth"

export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google", { redirectTo: "/dashboard" })
      }}
    >
      <button type="submit">Sign in with Google</button>
    </form>
  )
}
```

## Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  role          String    @default("USER")
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Best Practices for MedBookings

1. **Session Strategy**: Use JWT for stateless auth, database sessions for more control
2. **Role-Based Access**: Implement role checks in callbacks and middleware
3. **Secure Pages**: Always check auth state in server components
4. **API Protection**: Protect API routes with auth checks
5. **Custom User Fields**: Extend session with necessary user data

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Providers](https://next-auth.js.org/providers)
- [Adapters](https://next-auth.js.org/adapters)
- [Callbacks](https://next-auth.js.org/configuration/callbacks)

Version: 4.24.10
