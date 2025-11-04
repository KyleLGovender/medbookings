import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

import { logger, sanitizeEmail } from '@/lib/logger';
import { addMilliseconds, nowUTC } from '@/lib/timezone';
import { authRateLimitedProcedure, createTRPCRouter } from '@/server/trpc';

export const authRouter = createTRPCRouter({
  /**
   * Complete email verification using verification token
   * Supports both authenticated and unauthenticated verification
   */
  completeEmailVerification: authRateLimitedProcedure
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

  /**
   * Request password reset
   * Generates and sends a password reset token to the user's email
   */
  requestPasswordReset: authRateLimitedProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find user by email
        const user = await ctx.prisma.user.findUnique({
          where: { email: input.email },
          select: { id: true, email: true, name: true },
        });

        // For security, always return success even if user doesn't exist
        // This prevents email enumeration attacks
        if (!user) {
          logger.info('Password reset requested for non-existent email', {
            email: sanitizeEmail(input.email),
          });
          return {
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent',
          };
        }

        // Delete any existing unused tokens for this user
        await ctx.prisma.passwordResetToken.deleteMany({
          where: {
            userId: user.id,
            usedAt: null, // Only delete unused tokens
          },
        });

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = addMilliseconds(nowUTC(), 60 * 60 * 1000); // 1 hour expiry

        // Create password reset token
        await ctx.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token,
            expires: expiresAt,
          },
        });

        // TODO: Send password reset email
        // const { sendPasswordResetEmail } = await import('@/features/communications/lib/email-templates');
        // await sendPasswordResetEmail(user.email!, token);

        logger.info('Password reset token created', {
          email: sanitizeEmail(user.email!),
          expiresAt: expiresAt.toISOString(),
        });

        return {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent',
        };
      } catch (error) {
        logger.error('Password reset request error', {
          error: error instanceof Error ? error.message : String(error),
          email: sanitizeEmail(input.email),
        });
        return {
          success: false,
          error: 'Internal server error',
        };
      }
    }),

  /**
   * Validate password reset token
   * Checks if token exists, is valid, not expired, and not used
   */
  validatePasswordResetToken: authRateLimitedProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Token is required'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const tokenRecord = await ctx.prisma.passwordResetToken.findFirst({
          where: {
            token: input.token,
            usedAt: null, // Token hasn't been used
            expires: {
              gte: nowUTC(), // Token is not expired
            },
          },
        });

        if (!tokenRecord) {
          return {
            valid: false,
            error: 'Invalid or expired password reset token',
          };
        }

        // Get user email separately
        const user = await ctx.prisma.user.findUnique({
          where: { id: tokenRecord.userId },
          select: { email: true },
        });

        return {
          valid: true,
          email: user?.email,
        };
      } catch (error) {
        logger.error('Password reset token validation error', {
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          valid: false,
          error: 'Internal server error',
        };
      }
    }),

  /**
   * Reset password using valid token
   * Validates token and updates user password
   */
  resetPassword: authRateLimitedProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Token is required'),
        newPassword: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
          .regex(/[0-9]/, 'Password must contain at least one number'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find and validate token (same validation as validatePasswordResetToken)
        const tokenRecord = await ctx.prisma.passwordResetToken.findFirst({
          where: {
            token: input.token,
            usedAt: null, // Token hasn't been used
            expires: {
              gte: nowUTC(), // Token is not expired
            },
          },
        });

        if (!tokenRecord) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid or expired password reset token',
          });
        }

        // Get user email for logging
        const user = await ctx.prisma.user.findUnique({
          where: { id: tokenRecord.userId },
          select: { email: true },
        });

        // Hash the new password
        const hashedPassword = await bcrypt.hash(input.newPassword, 12);

        // Update password and mark token as used in a transaction
        await ctx.prisma.$transaction([
          // Update user password
          ctx.prisma.user.update({
            where: { id: tokenRecord.userId },
            data: {
              password: hashedPassword,
              passwordMigratedAt: nowUTC(), // Mark as migrated to bcrypt
            },
          }),
          // Mark token as used
          ctx.prisma.passwordResetToken.update({
            where: { id: tokenRecord.id },
            data: {
              usedAt: nowUTC(),
            },
          }),
        ]);

        logger.info('Password reset completed', {
          email: sanitizeEmail(user?.email ?? ''),
        });

        return {
          success: true,
          message: 'Password has been reset successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Password reset error', {
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password',
        });
      }
    }),
});
