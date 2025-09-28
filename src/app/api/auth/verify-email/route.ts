import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid-verification-token', request.url));
  }

  try {
    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        token,
        expires: {
          gte: new Date(), // Token is not expired
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=verification-token-expired', request.url));
    }

    // Find the user by email to ensure the user exists
    const user = await prisma.user.findUnique({
      where: {
        email: verificationToken.identifier,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=user-not-found', request.url));
    }

    // Redirect to the verification completion page
    // This page will handle both authenticated and unauthenticated users
    const verifyUrl = new URL('/verify-email-complete', request.url);
    verifyUrl.searchParams.set('verificationToken', token);

    return NextResponse.redirect(verifyUrl);
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url));
  }
}
