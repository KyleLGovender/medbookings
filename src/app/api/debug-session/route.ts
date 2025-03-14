import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import env from '@/config/env/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check session
    const session = await getServerSession(authOptions);

    // Check database connection
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();

    // Return debug information
    return NextResponse.json({
      status: 'success',
      session: session,
      database: {
        connected: true,
        userCount,
        accountCount,
      },
      env: {
        nodeEnv: env.NODE_ENV,
        hasNextAuthUrl: !!env.NEXTAUTH_URL,
        hasAuthSecret: !!env.AUTH_SECRET,
        hasGoogleClientId: !!env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!env.GOOGLE_CLIENT_SECRET,
        hasDatabaseUrl: !!env.DATABASE_URL,
      },
      envdetails: {
        nodeEnv: env.NODE_ENV,
        hasNextAuthUrl: env.NEXTAUTH_URL,
        hasAuthSecret: env.AUTH_SECRET,
        hasGoogleClientId: env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: env.GOOGLE_CLIENT_SECRET,
        hasDatabaseUrl: env.DATABASE_URL,
      },
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
