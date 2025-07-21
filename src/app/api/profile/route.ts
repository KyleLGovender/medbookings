import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/profile - Get the current user's profile
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        whatsapp: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH /api/profile - Update the current user's profile
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Only allow updating specific fields
    const { name, email, phone, whatsapp } = data;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        phone,
        whatsapp,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        whatsapp: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/profile - Delete the current user's account
export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user has a provider profile
    const provider = await prisma.provider.findFirst({
      where: { userId: session.user.id },
    });

    if (provider) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please delete your service provider profile first before deleting your account.',
        },
        { status: 400 }
      );
    }

    // Delete the user and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete account connections (OAuth)
      await tx.account.deleteMany({
        where: { userId: session.user.id },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: session.user.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete account',
      },
      { status: 500 }
    );
  }
}
