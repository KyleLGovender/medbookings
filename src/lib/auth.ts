import { NextRequest } from 'next/server';

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import { DefaultSession, NextAuthOptions, Session, getServerSession } from 'next-auth';
import { JWT, getToken } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';

import env from '@/config/env/server';
import { prisma } from '@/lib/prisma';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}

interface User {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // Make sure this is set
  },
  // Ensure cookies work correctly across environments
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
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
      profile(profile) {
        console.log('Google profile received:', {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
        });
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'USER' as any,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/error', // Custom error page
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Log sign-in attempts for monitoring
      console.log('Sign-in callback started:', {
        userId: user?.id,
        email: user?.email,
        provider: account?.provider,
        timestamp: new Date().toISOString(),
      });

      try {
        // Allow sign-in by default
        // You can add custom logic here to deny sign-in for specific cases
        console.log('Sign-in callback successful');
        return true;
      } catch (error) {
        console.error('Sign-in callback error:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      try {
        if (user) {
          console.log('JWT callback - creating token for user:', user.email);
          token.accessToken = account?.access_token;
          token.refreshToken = account?.refresh_token;
          return {
            ...token,
            id: user.id,
            role: user.role,
          };
        }
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        throw error;
      }
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      try {
        session.accessToken = token.accessToken;
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            role: token.role,
          },
        };
      } catch (error) {
        console.error('Session callback error:', error);
        throw error;
      }
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign-ins
      console.log('Successful sign-in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString(),
      });
    },
    async signOut({ session, token }) {
      // Log sign-outs
      console.log('Sign-out:', {
        userId: token?.sub,
        timestamp: new Date().toISOString(),
      });
    },
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
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

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  if (token && token.sub) {
    // Find the provider for this user
    const provider = await prisma.provider.findFirst({
      where: { userId: token.sub },
    });

    if (provider) {
      // Store or update calendar integration
      await prisma.calendarIntegration.upsert({
        where: { providerId: provider.id },
        update: {
          accessToken: token.accessToken as string,
          refreshToken: token.refreshToken as string,
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
          calendarProvider: 'GOOGLE',
          googleEmail: token.email as string,
        },
        create: {
          providerId: provider.id,
          accessToken: token.accessToken as string,
          refreshToken: token.refreshToken as string,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          calendarProvider: 'GOOGLE',
          googleEmail: token.email as string,
        },
      });
    }
  }
}
