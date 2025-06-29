import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import {
  generateInvitationEmail,
  generateInvitationToken,
  getInvitationExpiryDate,
  logEmail,
} from '@/lib/invitation-utils';
import { prisma } from '@/lib/prisma';

// DELETE /api/organizations/[id]/provider-invitations/[invitationId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; invitationId: string } }
) {
  try {
    const { id: organizationId, invitationId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!organizationId || !invitationId) {
      return NextResponse.json(
        {
          message: 'Organization ID and invitation ID are required',
        },
        { status: 400 }
      );
    }

    // Check if user has permission to cancel invitations
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: currentUser.id,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          message: 'Forbidden: Only organization owners and admins can cancel invitations',
        },
        { status: 403 }
      );
    }

    // Find the invitation
    const invitation = await prisma.providerInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
      },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation not found' }, { status: 404 });
    }

    // Check if invitation can be cancelled
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        {
          message: 'Only pending invitations can be cancelled',
        },
        { status: 400 }
      );
    }

    // Update invitation status
    const updatedInvitation = await prisma.providerInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Log cancellation email
    const cancelEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invitation Cancelled</h2>
        <p>Hi there,</p>
        <p>The invitation to join ${invitation.organization.name} on MedBookings has been cancelled.</p>
        <p>If you have any questions, please contact ${invitation.organization.name} directly.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          This email was sent by MedBookings on behalf of ${invitation.organization.name}.
        </p>
      </div>
    `;

    logEmail({
      to: invitation.email,
      subject: `Invitation to ${invitation.organization.name} has been cancelled`,
      htmlContent: cancelEmailContent,
      type: 'cancellation',
    });

    return NextResponse.json({
      message: 'Invitation cancelled successfully',
      invitation: {
        id: updatedInvitation.id,
        status: updatedInvitation.status,
        cancelledAt: updatedInvitation.cancelledAt,
      },
    });
  } catch (error) {
    console.error('Error cancelling provider invitation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
