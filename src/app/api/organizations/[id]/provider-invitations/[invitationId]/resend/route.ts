import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  generateInvitationToken, 
  getInvitationExpiryDate, 
  generateInvitationEmail, 
  logEmail 
} from '@/lib/invitation-utils';

// POST /api/organizations/[id]/provider-invitations/[invitationId]/resend
export async function POST(
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
      return NextResponse.json({ 
        message: 'Organization ID and invitation ID are required' 
      }, { status: 400 });
    }

    // Check if user has permission to resend invitations
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: currentUser.id,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json({ 
        message: 'Forbidden: Only organization owners and admins can resend invitations' 
      }, { status: 403 });
    }

    // Find the invitation
    const invitation = await prisma.providerInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
      },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { name: true } }
      }
    });

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation not found' }, { status: 404 });
    }

    // Check if invitation can be resent
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ 
        message: 'Only pending invitations can be resent' 
      }, { status: 400 });
    }

    // Check rate limiting (no more than 1 resend per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (invitation.lastEmailSentAt && invitation.lastEmailSentAt > oneHourAgo) {
      return NextResponse.json({ 
        message: 'Invitation can only be resent once per hour' 
      }, { status: 429 });
    }

    // Generate new token and extend expiry
    const newToken = generateInvitationToken();
    const newExpiresAt = getInvitationExpiryDate();

    // Check if user exists to determine email type
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true }
    });

    // Update invitation with new token and reset expiry
    const updatedInvitation = await prisma.providerInvitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        emailAttempts: { increment: 1 },
        lastEmailSentAt: new Date(),
        emailDeliveryStatus: 'PENDING',
      }
    });

    // Generate and log email
    const emailContent = generateInvitationEmail({
      organizationName: invitation.organization.name,
      inviterName: currentUser.name || 'Someone',
      customMessage: invitation.customMessage || undefined,
      invitationToken: newToken,
      isExistingUser: !!existingUser,
    });

    logEmail({
      to: invitation.email,
      subject: `[REMINDER] ${emailContent.subject}`,
      htmlContent: emailContent.htmlContent,
      textContent: emailContent.textContent,
      type: 'reminder'
    });

    // Update email delivery status to "DELIVERED" for console logging
    await prisma.providerInvitation.update({
      where: { id: invitationId },
      data: { emailDeliveryStatus: 'DELIVERED' }
    });

    return NextResponse.json({
      message: 'Invitation resent successfully',
      invitation: {
        id: updatedInvitation.id,
        emailAttempts: updatedInvitation.emailAttempts,
        lastEmailSentAt: updatedInvitation.lastEmailSentAt,
        expiresAt: updatedInvitation.expiresAt,
      }
    });

  } catch (error) {
    console.error('Error resending provider invitation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}