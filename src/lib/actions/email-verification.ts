'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { appRouter } from '@/server/api/root';
import { createCallerFactory, createInnerTRPCContext } from '@/server/trpc';

export async function completeEmailVerification(verificationToken: string, email?: string) {
  try {
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
      email: email, // Pass email for race condition handling
    });

    // Revalidate any cached user data if successful
    if (result.success) {
      revalidatePath('/');
    }

    return result;
  } catch (error) {
    logger.error('Complete verification error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}
