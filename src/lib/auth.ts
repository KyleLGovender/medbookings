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
  pages: {
    signIn: '/login',
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
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If we're coming from a login page, redirect to home page
      if (url.startsWith(baseUrl + '/login') || url === baseUrl) {
        return baseUrl + '/';
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
      return baseUrl + '/';
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = account?.access_token;
        token.refreshToken = account?.refresh_token;
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
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
        },
      };
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
