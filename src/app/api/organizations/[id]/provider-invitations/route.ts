import { NextResponse } from 'next/server';

import { z } from 'zod';

import { ProviderInvitationSchema } from '@/features/organizations/types/types';
import { getCurrentUser } from '@/lib/auth';
import {
  generateInvitationEmail,
  generateInvitationToken,
  getInvitationExpiryDate,
  logEmail,
} from '@/lib/invitation-utils';
import { prisma } from '@/lib/prisma';

// POST /api/organizations/[id]/provider-invitations
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: organizationId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!organizationId) {
      return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has permission to send invitations (OWNER or ADMIN only)
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
          message: 'Forbidden: Only organization owners and admins can send invitations',
        },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = ProviderInvitationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, customMessage } = validationResult.data;

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.providerInvitation.findFirst({
      where: {
        organizationId,
        email,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        {
          message: 'An invitation has already been sent to this email address',
        },
        { status: 409 }
      );
    }

    // Check if there's already an established connection
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        provider: {
          include: {
            providerConnections: {
              where: {
                organizationId,
                status: { in: ['ACCEPTED', 'PENDING'] },
              },
            },
          },
        },
      },
    });

    if (existingUser?.provider?.providerConnections?.length && existingUser.provider.providerConnections.length > 0) {
      return NextResponse.json(
        {
          message: 'This provider is already connected to your organization',
        },
        { status: 409 }
      );
    }

    // Get organization details for email
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }

    // Generate invitation token and expiry
    const token = generateInvitationToken();
    const expiresAt = getInvitationExpiryDate();

    // Create invitation
    const invitation = await prisma.providerInvitation.create({
      data: {
        organizationId,
        email,
        customMessage,
        token,
        expiresAt,
        invitedById: currentUser.id,
        status: 'PENDING',
        emailAttempts: 1,
        lastEmailSentAt: new Date(),
      },
      include: {
        organization: {
          select: { name: true },
        },
        invitedBy: {
          select: { name: true },
        },
      },
    });

    // Generate and log email
    const emailContent = generateInvitationEmail({
      organizationName: organization.name,
      inviterName: currentUser.name || 'Someone',
      customMessage,
      invitationToken: token,
      isExistingUser: !!existingUser,
    });

    logEmail({
      to: email,
      subject: emailContent.subject,
      htmlContent: emailContent.htmlContent,
      textContent: emailContent.textContent,
      type: 'invitation',
    });

    // Update email delivery status to "DELIVERED" for console logging
    await prisma.providerInvitation.update({
      where: { id: invitation.id },
      data: { emailDeliveryStatus: 'DELIVERED' },
    });

    return NextResponse.json(
      {
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending provider invitation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/organizations/[id]/provider-invitations
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: organizationId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!organizationId) {
      return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has permission to view invitations
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: currentUser.id,
        role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          message: 'Forbidden: Insufficient permissions',
        },
        { status: 403 }
      );
    }

    // Get URL search params for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      organizationId,
    };

    if (status && ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(status)) {
      whereClause.status = status;
    }

    // Fetch invitations
    const invitations = await prisma.providerInvitation.findMany({
      where: whereClause,
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
        connection: {
          select: {
            id: true,
            status: true,
            acceptedAt: true,
            provider: {
              select: { name: true, id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching provider invitations:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
