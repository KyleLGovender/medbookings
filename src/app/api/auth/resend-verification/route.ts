import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { email } = await request.json();

    // Verify the email matches the current session
    if (email !== session.user.email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 400 });
    }

    // Check if user exists and is not verified
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Delete any existing verification tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new verification token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store new verification token
    await prisma.emailVerificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email
    try {
      const { sendEmailVerification } = await import('@/lib/communications/email');
      await sendEmailVerification(email, token, user.name || undefined);

      console.log(`Verification email resent to: ${email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
