import { UserRole } from '@prisma/client';
import type { DefaultSession, NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import env from '@/config/env/server';
import { logger, sanitizeEmail } from '@/lib/logger';
import { hashPassword, verifyPasswordWithMigration } from '@/lib/password-hash';
import { ensurePrismaConnected, prisma } from '@/lib/prisma';
import { nowUTC } from '@/lib/timezone';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    emailVerified?: Date | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    id?: string;
    role?: UserRole;
    emailVerified?: Date | null;
  }
}

// Debug logging for production environment variable verification
// eslint-disable-next-line no-console
console.log('[NextAuth v5] Configuration loading...');
// eslint-disable-next-line no-console
console.log('[NextAuth v5] NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET');
// eslint-disable-next-line no-console
console.log('[NextAuth v5] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
// eslint-disable-next-line no-console
console.log('[NextAuth v5] GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
// eslint-disable-next-line no-console
console.log('[NextAuth v5] DATABASE_URL exists:', !!process.env.DATABASE_URL);

export const authConfig: NextAuthConfig = {
  // NextAuth v5 automatically detects the base URL from the request
  // No need for AUTH_TRUST_HOST or manual URL detection
  secret: env.NEXTAUTH_SECRET,

  // Enable debug logging
  debug: true,

  // Session configuration
  session: {
    strategy: 'jwt',
  },

  // Custom pages
  pages: {
    signIn: '/login',
    newUser: '/',
  },

  // Providers
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
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              emailVerified: true,
            },
          });

          if (!user) {
            logger.warn('Credentials sign-in blocked - user not found', {
              email: sanitizeEmail(credentials.email as string),
            });
            throw new Error('UserNotFound');
          }

          if (!user.password) {
            logger.warn('Credentials sign-in blocked - OAuth user attempting credentials login', {
              email: sanitizeEmail(credentials.email as string),
            });
            throw new Error('OAuthUserAttemptingCredentials');
          }

          const { isValid, needsMigration } = await verifyPasswordWithMigration(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            logger.warn('Credentials sign-in blocked - invalid password', {
              email: sanitizeEmail(credentials.email as string),
            });
            throw new Error('InvalidPassword');
          }

          // Auto-migrate legacy passwords
          if (needsMigration) {
            try {
              const newHash = await hashPassword(credentials.password as string);
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  password: newHash,
                  passwordMigratedAt: nowUTC(),
                },
              });
              logger.info('Password successfully migrated from SHA-256 to bcrypt', {
                userId: user.id,
                email: sanitizeEmail(credentials.email as string),
              });
            } catch (migrationError) {
              logger.error('Password migration failed (login still successful)', {
                userId: user.id,
                email: sanitizeEmail(credentials.email as string),
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
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          logger.error('Auth error', {
            error: error instanceof Error ? error.message : String(error),
          });
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

  // Callbacks
  callbacks: {
    async signIn({ user, account }) {
      // eslint-disable-next-line no-console
      console.log('[NextAuth v5 signIn] Callback started', {
        provider: account?.provider,
        email: user.email,
        userId: user.id,
      });

      // Handle Google OAuth
      if (account?.provider === 'google' && user.email) {
        try {
          // eslint-disable-next-line no-console
          console.log('[NextAuth v5 signIn] Google OAuth detected');

          await ensurePrismaConnected();

          const adminEmails =
            process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];
          const shouldBeAdmin = adminEmails.includes(user.email);

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

          // eslint-disable-next-line no-console
          console.log('[NextAuth v5 signIn] User upserted', {
            userId: dbUser.id,
            role: dbUser.role,
          });

          // Update user object for JWT
          user.id = dbUser.id;
          user.role = dbUser.role;
          user.emailVerified = dbUser.emailVerified;

          // Upsert OAuth account
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
          });

          return true;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[NextAuth v5 signIn] ERROR', {
            error: error instanceof Error ? error.message : String(error),
          });

          logger.error('Error during Google OAuth sign-in', {
            error: error instanceof Error ? error.message : String(error),
          });

          return false;
        }
      }

      // Handle admin emails for other providers
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];

      if (user.email && adminEmails.includes(user.email)) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          });

          if (existingUser && existingUser.role !== 'ADMIN') {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: 'ADMIN' },
            });
            user.role = 'ADMIN';
          } else if (existingUser) {
            user.role = existingUser.role;
          } else {
            user.role = 'ADMIN';
          }
        } catch (error) {
          // Silent fail
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // eslint-disable-next-line no-console
      console.log('[NextAuth v5 redirect]', { url, baseUrl });

      if (url.startsWith(`${baseUrl}/login`) || url === baseUrl) {
        return `${baseUrl}/`;
      }
      if (url.startsWith('/')) {
        return baseUrl + url;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/`;
    },

    async jwt({ token, user, account, trigger }) {
      // eslint-disable-next-line no-console
      console.log('[NextAuth v5 jwt] JWT callback', {
        hasUser: !!user,
        trigger,
      });

      if (user) {
        await ensurePrismaConnected();

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, email: true, emailVerified: true },
        });

        token.accessToken = account?.access_token;
        token.refreshToken = account?.refresh_token;
        return {
          ...token,
          id: user.id,
          role: dbUser?.role || user.role || 'USER',
          emailVerified: dbUser?.emailVerified || user.emailVerified || null,
        };
      }

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

    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as UserRole,
          emailVerified: token.emailVerified as Date | null,
        },
      };
    },
  },
};

// Initialize NextAuth v5
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Helper functions
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function checkRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error('Not authorized');
  }
  return user;
}
