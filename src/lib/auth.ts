import { UserRole } from '@prisma/client';
import { DefaultSession, NextAuthOptions, Session, getServerSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import env from '@/config/env/server';
import { logger, sanitizeEmail } from '@/lib/logger';
import { hashPassword, verifyPasswordWithMigration } from '@/lib/password-hash';
import { ensurePrismaConnected, prisma } from '@/lib/prisma';
import { nowUTC } from '@/lib/timezone';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    id?: string;
    role?: UserRole;
    emailVerified?: Date | null;
  }
}

interface User {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Debug logging for production environment variable verification
// These logs will appear in AWS CloudWatch Logs
// eslint-disable-next-line no-console
console.log('[NextAuth] Configuration loading...');
// eslint-disable-next-line no-console
console.log('[NextAuth] NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET');
// eslint-disable-next-line no-console
console.log('[NextAuth] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
// eslint-disable-next-line no-console
console.log('[NextAuth] NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length || 0);
// eslint-disable-next-line no-console
console.log('[NextAuth] GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
// eslint-disable-next-line no-console
console.log('[NextAuth] DATABASE_URL exists:', !!process.env.DATABASE_URL);

export const authOptions: NextAuthOptions = {
  // JWT-only strategy for serverless compatibility
  // No database adapter - users are created manually in signIn callback
  // NextAuth v4 secret for session encryption and JWT signing
  secret: env.NEXTAUTH_SECRET,
  // Enable debug logging in production to diagnose configuration issues
  // Logs will appear in AWS CloudWatch
  debug: true,
  // Use secure cookies in production (required for HTTPS)
  useSecureCookies: env.NODE_ENV === 'production',
  // Explicit cookie configuration for serverless/Lambda environments
  cookies: {
    sessionToken: {
      name:
        env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: env.NODE_ENV === 'production',
      },
    },
  },
  session: {
    strategy: 'jwt', // Make sure this is set
  },
  pages: {
    signIn: '/login',
    // Let NextAuth handle errors with default error page
    newUser: '/', // Redirect new users to home page
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('CredentialsRequired');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              emailVerified: true,
            },
          });

          // User doesn't exist at all
          if (!user) {
            logger.warn('Credentials sign-in blocked - user not found', {
              email: sanitizeEmail(credentials.email),
            });
            throw new Error('UserNotFound');
          }

          // User exists but has no password (OAuth user trying to sign in with credentials)
          if (!user.password) {
            logger.warn('Credentials sign-in blocked - OAuth user attempting credentials login', {
              email: sanitizeEmail(credentials.email),
            });
            throw new Error('OAuthUserAttemptingCredentials');
          }

          // Verify password with automatic migration from SHA-256 to bcrypt
          const { isValid, needsMigration } = await verifyPasswordWithMigration(
            credentials.password,
            user.password
          );

          if (!isValid) {
            logger.warn('Credentials sign-in blocked - invalid password', {
              email: sanitizeEmail(credentials.email),
            });
            throw new Error('InvalidPassword');
          }

          // Auto-migrate legacy SHA-256 passwords to bcrypt
          if (needsMigration) {
            try {
              const newHash = await hashPassword(credentials.password);
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  password: newHash,
                  passwordMigratedAt: nowUTC(),
                },
              });
              logger.info('Password successfully migrated from SHA-256 to bcrypt', {
                userId: user.id,
                email: sanitizeEmail(credentials.email),
              });
            } catch (migrationError) {
              // Log but don't fail the login if migration fails
              logger.error('Password migration failed (login still successful)', {
                userId: user.id,
                email: sanitizeEmail(credentials.email),
                error:
                  migrationError instanceof Error ? migrationError.message : String(migrationError),
              });
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          logger.error('Auth error', {
            error: error instanceof Error ? error.message : String(error),
          });
          // Re-throw our custom errors, or wrap unknown errors
          if (
            error instanceof Error &&
            [
              'CredentialsRequired',
              'UserNotFound',
              'OAuthUserAttemptingCredentials',
              'InvalidPassword',
            ].includes(error.message)
          ) {
            throw error;
          }
          throw new Error('AuthenticationFailed');
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, manually create/update user and account
      // (No adapter in JWT-only mode)
      if (account?.provider === 'google' && user.email) {
        try {
          // CRITICAL: Ensure Prisma is connected before any queries
          // This prevents race conditions in AWS Lambda cold starts
          await ensurePrismaConnected();

          // Determine if user should be admin
          const adminEmails =
            process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];
          const shouldBeAdmin = adminEmails.includes(user.email);

          // Create or update user in a single upsert operation
          // Google OAuth users always have verified emails
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
              emailVerified: nowUTC(),
              ...(shouldBeAdmin && { role: 'ADMIN' }),
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: nowUTC(),
              role: shouldBeAdmin ? 'ADMIN' : 'USER',
            },
          });

          // Update user object with database values for JWT
          user.id = dbUser.id;
          user.role = dbUser.role;

          // Create or update OAuth account link
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {
              access_token: account.access_token,
              expires_at: account.expires_at,
              id_token: account.id_token,
              refresh_token: account.refresh_token,
              scope: account.scope,
              token_type: account.token_type,
            },
            create: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at,
              id_token: account.id_token,
              refresh_token: account.refresh_token,
              scope: account.scope,
              token_type: account.token_type,
            },
          });

          logger.info('Google OAuth sign-in completed', {
            email: sanitizeEmail(user.email),
            role: dbUser.role,
            isNewUser: dbUser.emailVerified ? 'existing' : 'new',
          });

          return true;
        } catch (error) {
          logger.error('Error during Google OAuth sign-in', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          // Return false to properly deny sign-in (NextAuth v4 expects boolean)
          return false;
        }
      }

      // For non-Google OAuth providers or credentials, use original logic
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];

      if (user.email && adminEmails.includes(user.email)) {
        try {
          // First, check if user exists and get their current role
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, email: true },
          });

          if (existingUser && existingUser.role !== 'ADMIN') {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: 'ADMIN' },
            });

            // Update the user object to reflect the new role
            user.role = 'ADMIN';
          } else if (existingUser && existingUser.role === 'ADMIN') {
            user.role = 'ADMIN';
          } else if (!existingUser) {
            // For new users, set the role property so it gets saved correctly
            user.role = 'ADMIN';
          }
        } catch (error) {
          // Silent fail - user will still be able to sign in with default role
        }
      }

      return true; // Allow sign-in
    },
    async redirect({ url, baseUrl }) {
      // If we're coming from a login page, redirect to home page
      if (url.startsWith(`${baseUrl}/login`) || url === baseUrl) {
        return `${baseUrl}/`;
      }
      // If it's a relative URL, prepend baseUrl
      if (url.startsWith('/')) {
        return baseUrl + url;
      }
      // If URL is on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Otherwise, redirect to home page
      return `${baseUrl}/`;
    },
    async jwt({ token, user, account, trigger }) {
      // When user signs in for the first time
      if (user) {
        // Ensure Prisma is connected before database queries
        await ensurePrismaConnected();

        // Fetch the latest user data from database to get the correct role and email verification status
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, email: true, emailVerified: true },
        });

        token.accessToken = account?.access_token;
        token.refreshToken = account?.refresh_token;
        return {
          ...token,
          id: user.id,
          role: dbUser?.role || user.role || 'USER', // Use database role, fallback to user object role, then default to USER
          emailVerified: dbUser?.emailVerified || null,
        };
      }

      // On subsequent requests, refresh data from database if:
      // 1. Missing role or emailVerified data, OR
      // 2. Session update is triggered (e.g., after email verification)
      if (
        token &&
        (!token.role || token.emailVerified === undefined || trigger === 'update') &&
        token.id
      ) {
        await ensurePrismaConnected();

        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, emailVerified: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.emailVerified = dbUser.emailVerified;
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken;
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          emailVerified: token.emailVerified,
        },
      };
    },
  },
  // Note: No events needed in JWT-only mode (no adapter)
  // User creation is handled manually in the signIn callback above
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function checkRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error('Not authorized');
  }
  return user;
}
