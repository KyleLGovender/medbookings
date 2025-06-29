import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/invitations/[token]/validate
export async function GET(request: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ message: 'Token is required' }, { status: 400 });
    }

    // Find the invitation by token
    const invitation = await prisma.providerInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            email: true,
            phone: true,
            website: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        connection: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        {
          message: 'Invalid invitation token',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
