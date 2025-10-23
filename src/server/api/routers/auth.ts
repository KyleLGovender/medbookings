import { z } from 'zod';

import { logger, sanitizeEmail } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';
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
        email: z.string().email().optional(), // Email for race condition handling
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find the verification token first
        const tokenRecord = await ctx.prisma.emailVerificationToken.findFirst({
          where: {
            token: input.token,
            expires: {
              gte: nowUTC(), // Token is not expired
            },
          },
        });

        if (!tokenRecord) {
          // Token not found - might be expired, invalid, or already used
          // Check if user's email is already verified (handles duplicate/race requests)

          // For authenticated users: check session user
          if (ctx.session?.user) {
            const currentUser = await ctx.prisma.user.findUnique({
              where: { id: ctx.session.user.id },
              select: { emailVerified: true },
            });

            if (currentUser?.emailVerified) {
              logger.info('Verification token not found but authenticated user already verified', {
                email: sanitizeEmail(ctx.session.user.email ?? ''),
              });
              return {
                success: true,
                message: 'Email already verified',
                alreadyVerified: true,
              };
            }
          }

          // For unauthenticated users: check using provided email (from race condition)
          if (!ctx.session?.user && input.email) {
            const userByEmail = await ctx.prisma.user.findUnique({
              where: { email: input.email },
              select: { emailVerified: true },
            });

            if (userByEmail?.emailVerified) {
              logger.info(
                'Verification token not found but unauthenticated user already verified',
                {
                  email: sanitizeEmail(input.email),
                }
              );
              return {
                success: true,
                message: 'Email already verified',
                alreadyVerified: true,
              };
            }
          }

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
              emailVerified: nowUTC(),
            },
          }),
          // Delete the verification token (deleteMany won't fail if already deleted)
          ctx.prisma.emailVerificationToken.deleteMany({
            where: {
              id: tokenRecord.id,
            },
          }),
        ]);

        logger.info('Email verification completed for user', {
          email: sanitizeEmail(userToVerify.email),
        });

        return {
          success: true,
          message: 'Email verification completed successfully',
          verified: true,
        };
      } catch (error) {
        logger.error('Complete verification error', {
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          success: false,
          error: 'Internal server error',
        };
      }
    }),
});
