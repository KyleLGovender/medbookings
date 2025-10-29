import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import { DefaultSession, NextAuthOptions, Session, getServerSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import env from '@/config/env/server';
import { logger, sanitizeEmail } from '@/lib/logger';
import { hashPassword, verifyPasswordWithMigration } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { addMilliseconds, nowUTC } from '@/lib/timezone';

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
  adapter: PrismaAdapter(prisma),
  // NextAuth v4 secret for session encryption and JWT signing
  secret: env.NEXTAUTH_SECRET,
  // Enable debug logging in production to diagnose configuration issues
  // Logs will appear in AWS CloudWatch
  debug: true,
  session: {
    strategy: 'jwt', // Make sure this is set
  },
  pages: {
    signIn: '/login',
    error: '/error', // Redirect to dedicated error page (prevents redirect loops)
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
    async signIn({ user, account, profile }) {
      // For Google OAuth, always allow account creation
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, email: true, emailVerified: true },
          });

          // Auto-promote configured admin emails to ADMIN role on sign-in
          const adminEmails =
            process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];

          if (user.email && adminEmails.includes(user.email)) {
            if (existingUser && existingUser.role !== 'ADMIN') {
              await prisma.user.update({
                where: { email: user.email },
                data: { role: 'ADMIN' },
              });
              user.role = 'ADMIN';
            } else if (existingUser && existingUser.role === 'ADMIN') {
              user.role = 'ADMIN';
            } else if (!existingUser) {
              // For new users, set the role property so it gets saved correctly
              user.role = 'ADMIN';
            }
          }

          // For existing Google OAuth users, automatically set emailVerified to true if not already set
          if (existingUser && !existingUser.emailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: nowUTC() },
            });
          }

          logger.info('Google OAuth sign-in allowed', {
            email: sanitizeEmail(user.email || ''),
            isExistingUser: !!existingUser,
          });
          return true; // Always allow Google OAuth
        } catch (error) {
          logger.error('Error during Google OAuth sign-in check', {
            error: error instanceof Error ? error.message : String(error),
          });
          return '/login?error=OAuthCallback';
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
  events: {
    async createUser({ user }) {
      logger.info('NextAuth createUser event triggered', {
        email: sanitizeEmail(user.email || ''),
      });

      // For Google OAuth users, set emailVerified to true immediately
      // Google has already verified the email address
      const isGoogleUser = user.image?.includes('googleusercontent.com') || false;

      logger.info('User creation details', {
        email: sanitizeEmail(user.email || ''),
        isGoogleUser,
        hasImage: !!user.image,
      });

      if (isGoogleUser) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: nowUTC() },
          });
          logger.info('Set emailVerified=true for Google user', {
            email: sanitizeEmail(user.email || ''),
          });
        } catch (error) {
          logger.error('Failed to set emailVerified for Google user', {
            email: sanitizeEmail(user.email || ''),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Check if this new user should be an admin
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];

      if (user.email && adminEmails.includes(user.email)) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' },
          });
        } catch (error) {
          // Silent fail - user will have default role
        }
      }

      // Send appropriate email based on verification status
      if (user.email) {
        try {
          const { sendEmailVerification, sendEmail } = await import('@/lib/communications/email');

          // Re-check verification status after potential update above
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { emailVerified: true },
          });

          logger.info('Final user email verification status', {
            email: sanitizeEmail(user.email),
            emailVerified: !!dbUser?.emailVerified,
            willSendVerification: !dbUser?.emailVerified,
          });

          if (!dbUser?.emailVerified) {
            // Generate and send verification email for unverified users
            const crypto = await import('crypto');
            const token = crypto.randomBytes(32).toString('hex');
            const expires = addMilliseconds(nowUTC(), 24 * 60 * 60 * 1000); // 24 hours from now

            // Store verification token in database
            await prisma.emailVerificationToken.create({
              data: {
                identifier: user.email,
                token,
                expires,
              },
            });

            // Send verification email
            await sendEmailVerification(user.email, token, user.name || undefined);
            logger.info('Verification email sent to new user', {
              email: sanitizeEmail(user.email),
            });
          } else {
            // Send regular welcome email for verified users
            await sendEmail({
              to: user.email,
              subject: 'Welcome to MedBookings!',
              html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Welcome to MedBookings</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">Welcome to MedBookings</h1>
                  </div>

                  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Thank you for joining us!</h2>

                    <p>Hi ${user.name || 'there'},</p>

                    <p>Welcome to MedBookings! Your account has been successfully created.</p>

                    <p>You can now:</p>
                    <ul>
                      <li>Browse and book appointments with healthcare providers</li>
                      <li>Manage your bookings and medical history</li>
                      <li>Join organizations and access their services</li>
                      <li>Become a healthcare provider (subject to approval)</li>
                    </ul>

                    <p style="margin-top: 20px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${process.env.NEXTAUTH_URL || 'https://medbookings.co.za'}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Visit MedBookings</a>
                    </div>
                  </div>

                  <div style="margin-top: 20px; padding: 20px; text-align: center; color: #666; font-size: 14px;">
                    <p>© 2024 MedBookings. All rights reserved.</p>
                    <p>Cape Town, South Africa</p>
                  </div>
                </body>
              </html>
            `,
              text: `Welcome to MedBookings!\n\nHi ${user.name || 'there'},\n\nYour account has been successfully created. You can now browse and book appointments with healthcare providers.\n\nVisit: ${process.env.NEXTAUTH_URL || 'https://medbookings.co.za'}`,
            });

            logger.info('Welcome email sent to verified user', {
              email: sanitizeEmail(user.email),
            });
          }
        } catch (error) {
          logger.error('Failed to send email', {
            email: sanitizeEmail(user.email || ''),
            error: error instanceof Error ? error.message : String(error),
          });
          // Don't fail the sign-up process if email fails
        }
      }
    },
  },
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
