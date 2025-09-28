import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const authRouter = createTRPCRouter({
  /**
   * Complete email verification using verification token
   * Supports both authenticated and unauthenticated verification
   */
  completeEmailVerification: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Verification token is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find the verification token first
        const tokenRecord = await ctx.prisma.emailVerificationToken.findFirst({
          where: {
            token: input.token,
            expires: {
              gte: new Date(), // Token is not expired
            },
          },
        });

        if (!tokenRecord) {
          return {
            success: false,
            error: 'Invalid or expired verification token',
          };
        }

        // Find the user by the email in the token (works for both authenticated and unauthenticated users)
        const userToVerify = await ctx.prisma.user.findUnique({
          where: {
            email: tokenRecord.identifier,
          },
          select: {
            id: true,
            email: true,
            emailVerified: true,
          },
        });

        if (!userToVerify) {
          return {
            success: false,
            error: 'User not found',
          };
        }

        // If user is authenticated, verify that the token is for the currently authenticated user
        if (ctx.session?.user?.email && ctx.session.user.email !== tokenRecord.identifier) {
          return {
            success: false,
            error: 'Verification token does not match authenticated user',
          };
        }

        // Check if already verified
        if (userToVerify.emailVerified) {
          // Clean up the token since verification is already complete
          await ctx.prisma.emailVerificationToken.deleteMany({
            where: {
              id: tokenRecord.id,
            },
          });

          return {
            success: true,
            message: 'Email already verified',
            alreadyVerified: true,
          };
        }

        // Complete the verification
        await ctx.prisma.$transaction([
          // Mark user as verified
          ctx.prisma.user.update({
            where: {
              id: userToVerify.id,
            },
            data: {
              emailVerified: new Date(),
            },
          }),
          // Delete the verification token (deleteMany won't fail if already deleted)
          ctx.prisma.emailVerificationToken.deleteMany({
            where: {
              id: tokenRecord.id,
            },
          }),
        ]);

        console.log(`Email verification completed for user: ${userToVerify.email}`);

        return {
          success: true,
          message: 'Email verification completed successfully',
          verified: true,
        };
      } catch (error) {
        console.error('Complete verification error:', error);
        return {
          success: false,
          error: 'Internal server error',
        };
      }
    }),
});
