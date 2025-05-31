import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient, UserRole } from '@prisma/client';
// Import UserRole from Prisma
import type { AuthOptions, DefaultSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import env from '@/config/env/server';

const prisma = new PrismaClient(); // Or import the existing instance

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    // ...add more providers here if needed in the future
  ],
  session: {
    strategy: 'jwt', // Using JWT sessions as per PRD
  },
  callbacks: {
    async jwt({ token, user }) {
      // The `user` object is available on initial sign-in
      if (user) {
        token.id = user.id; // Add user ID from database to the token
        token.name = user.name;
        token.email = user.email;
        token.image = user.image; // Add user image from database to the token
      }
      return token;
    },
    async session({ session, token }) {
      // The `token` object contains the data from the `jwt` callback
      if (token) {
        if (!session.user) {
          // Initialize session.user if it doesn't exist and we have a token
          // Adjust the type assertion as necessary for your DefaultSession['user']
          session.user = {} as DefaultSession['user'] & { id: string; role: UserRole };
        }
        session.user.id = token.id as string; // Add user ID to session
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image as string | null | undefined; // Add user image to session
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Return true to allow the sign-in process to continue.
      // The PrismaAdapter will handle user creation/update.
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If the user just signed in successfully, the default redirect URL is baseUrl.
      // We change it to /profile.
      if (url === baseUrl) {
        return `${baseUrl}/profile`;
      }
      // Allows relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to baseUrl for any other case (e.g., invalid or external URLs)
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login', // Points to /app/(auth)/login/page.tsx
    // signOut: '/auth/signout', // Example: Custom sign-out page
    // error: '/auth/error', // Example: Custom error page for auth errors
    // verifyRequest: '/auth/verify-request', // Example: For email/passwordless login
    // newUser: '/auth/new-user' // Example: Redirect new users to a specific page
  },
  // pages: {
  //   signIn: '/auth/signin', // If you have a custom sign-in page
  //   // error: '/auth/error', // Error code passed in query string as ?error=
  // },
  // events: {},
  // debug: process.env.NODE_ENV === 'development',
};
