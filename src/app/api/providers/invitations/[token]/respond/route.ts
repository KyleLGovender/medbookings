import { NextResponse } from 'next/server';

import { InvitationResponseSchema } from '@/features/providers/types';
import { getCurrentUser } from '@/lib/auth';
import { isInvitationExpired } from '@/lib/invitation-utils';
import { prisma } from '@/lib/prisma';

// POST /api/providers/invitations/[token]/respond
export async function POST(request: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!token) {
      return NextResponse.json({ message: 'Invitation token is required' }, { status: 400 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = InvitationResponseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { action, rejectionReason } = validationResult.data;

    // Find the invitation
    const invitation = await prisma.providerInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        {
          message: 'Invalid or expired invitation token',
        },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (isInvitationExpired(invitation.expiresAt)) {
      await prisma.providerInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        {
          message: 'This invitation has expired',
        },
        { status: 410 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        {
          message: 'This invitation has already been responded to',
        },
        { status: 409 }
      );
    }

    // Verify the invitation is for the current user's email
    if (invitation.email !== currentUser.email) {
      return NextResponse.json(
        {
          message: 'This invitation is not for your email address',
        },
        { status: 403 }
      );
    }

    // Find or create service provider for the current user
    let provider = await prisma.provider.findUnique({
      where: { userId: currentUser.id },
    });

    if (!provider) {
      return NextResponse.json(
        {
          message:
            'You must complete your service provider registration before accepting invitations',
        },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // Update invitation status to rejected
      const updatedInvitation = await prisma.providerInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || null,
        },
      });

      return NextResponse.json({
        message: 'Invitation rejected',
        invitation: {
          id: updatedInvitation.id,
          status: updatedInvitation.status,
          rejectedAt: updatedInvitation.rejectedAt,
        },
      });
    }

    if (action === 'accept') {
      // Check if connection already exists
      const existingConnection = await prisma.organizationProviderConnection.findUnique({
        where: {
          organizationId_providerId: {
            organizationId: invitation.organizationId,
            providerId: provider.id,
          },
        },
      });

      if (existingConnection) {
        return NextResponse.json(
          {
            message: 'You are already connected to this organization',
          },
          { status: 409 }
        );
      }

      // Start transaction to create connection and update invitation
      const result = await prisma.$transaction(async (tx) => {
        // Create the organization-provider connection
        const connection = await tx.organizationProviderConnection.create({
          data: {
            organizationId: invitation.organizationId,
            providerId: provider!.id,
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
          include: {
            organization: {
              select: { name: true },
            },
          },
        });

        // Update invitation status and link to connection
        const updatedInvitation = await tx.providerInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            connectionId: connection.id,
          },
        });

        return { connection, invitation: updatedInvitation };
      });

      return NextResponse.json(
        {
          message: 'Invitation accepted successfully',
          connection: {
            id: result.connection.id,
            organizationName: result.connection.organization.name,
            status: result.connection.status,
            acceptedAt: result.connection.acceptedAt,
          },
          invitation: {
            id: result.invitation.id,
            status: result.invitation.status,
            acceptedAt: result.invitation.acceptedAt,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error responding to provider invitation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
