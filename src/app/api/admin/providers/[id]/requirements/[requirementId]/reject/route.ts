import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: providerId, requirementId } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Check if requirement submission exists
    const submission = await prisma.requirementSubmission.findUnique({
      where: { id: requirementId },
      include: {
        requirementType: true,
        serviceProvider: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Requirement submission not found' }, { status: 404 });
    }

    // Verify the submission belongs to the specified provider
    if (submission.serviceProviderId !== providerId) {
      return NextResponse.json(
        { error: 'Requirement submission does not belong to this provider' },
        { status: 400 }
      );
    }

    // Reject the requirement
    const updatedSubmission = await prisma.requirementSubmission.update({
      where: { id: requirementId },
      data: {
        status: 'REJECTED',
        validatedById: currentUser.id,
        validatedAt: new Date(),
        notes: reason.trim(),
      },
    });

    // Console log for future email integration
    console.log('ADMIN_ACTION: Requirement rejected', {
      providerId: submission.serviceProvider.id,
      providerName: submission.serviceProvider.name,
      providerEmail: submission.serviceProvider.email,
      requirementId: submission.id,
      requirementName: submission.requirementType.name,
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      rejectionReason: reason.trim(),
      timestamp: new Date().toISOString(),
      action: 'REQUIREMENT_REJECTED',
    });

    return NextResponse.json({
      success: true,
      data: updatedSubmission,
      message: 'Requirement rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
