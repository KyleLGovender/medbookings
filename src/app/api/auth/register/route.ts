import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { logger, sanitizeEmail } from '@/lib/logger';
import { hashPassword } from '@/lib/password-hash';
import { passwordSchema } from '@/lib/password-validation';
import { prisma } from '@/lib/prisma';
import { addMilliseconds, nowUTC } from '@/lib/timezone';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema, // Use centralized password complexity validation
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password using bcrypt (new users automatically get bcrypt hashes)
    const hashedPassword = await hashPassword(password);

    // Create user with bcrypt password and mark as migrated
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        passwordMigratedAt: nowUTC(), // New users are already using bcrypt
        emailVerified: null, // Will be set to true when user verifies email
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Generate and send verification email
    try {
      const { sendEmailVerification } = await import('@/lib/communications/email');
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expires = addMilliseconds(nowUTC(), 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token in database
      await prisma.emailVerificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      // Send verification email
      await sendEmailVerification(email, token, name);
      logger.info('Verification email sent to new user', {
        to: sanitizeEmail(email),
        userId: user.id,
      });
    } catch (emailError) {
      logger.error('Failed to send verification email', {
        to: sanitizeEmail(email),
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
      // Don't fail the registration if email sending fails
    }

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user,
    });
  } catch (error) {
    logger.error('Registration error', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
