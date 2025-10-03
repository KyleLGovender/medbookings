import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { appRouter } from '@/server/api/root';
import { createCallerFactory, createInnerTRPCContext } from '@/server/trpc';

export async function POST(request: NextRequest) {
  try {
    const { verificationToken } = await request.json();

    if (!verificationToken) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Get current user for context
    const currentUser = await getCurrentUser();

    // Create tRPC caller
    const createCaller = createCallerFactory(appRouter);
    const caller = createCaller(
      createInnerTRPCContext({
        session: currentUser ? { user: currentUser, expires: '' } : null,
      })
    );

    // Call the tRPC procedure
    const result = await caller.auth.completeEmailVerification({
      token: verificationToken,
    });

    // Handle the result
    if (!result.success) {
      const statusCode = result.error === 'User not found' ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({
      message: result.message,
      verified: result.verified,
      alreadyVerified: result.alreadyVerified,
    });
  } catch (error) {
    logger.error('Complete verification error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
