import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isInvitationExpired } from '@/lib/invitation-utils';

// GET /api/providers/invitations
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!currentUser.email) {
      return NextResponse.json({ 
        message: 'User email is required to check for invitations' 
      }, { status: 400 });
    }

    // Get URL search params for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      email: currentUser.email,
    };

    if (status && ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(status)) {
      whereClause.status = status;
    }

    // Fetch invitations for the current user's email
    const invitations = await prisma.providerInvitation.findMany({
      where: whereClause,
      include: {
        organization: {
          select: { 
            id: true,
            name: true, 
            description: true,
            logo: true,
            email: true,
            phone: true 
          }
        },
        invitedBy: {
          select: { name: true, email: true }
        },
        connection: {
          select: { 
            id: true, 
            status: true, 
            acceptedAt: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check for expired invitations and update them
    const expiredInvitations = invitations.filter(invitation => 
      invitation.status === 'PENDING' && isInvitationExpired(invitation.expiresAt)
    );

    if (expiredInvitations.length > 0) {
      await prisma.providerInvitation.updateMany({
        where: {
          id: { in: expiredInvitations.map(inv => inv.id) },
          status: 'PENDING'
        },
        data: { status: 'EXPIRED' }
      });

      // Update the status in our response
      expiredInvitations.forEach(inv => {
        inv.status = 'EXPIRED';
      });
    }

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Error fetching provider invitations:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}