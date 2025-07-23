import { NextRequest, NextResponse } from 'next/server';

import type { AdminApiResponse, AdminRequirementRouteParams } from '@/features/admin/types/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: AdminRequirementRouteParams }
): Promise<NextResponse<AdminApiResponse>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: providerId, requirementId } = params;

    // Check if requirement submission exists
    const submission = await prisma.requirementSubmission.findUnique({
      where: { id: requirementId },
      include: {
        requirementType: true,
        provider: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Requirement submission not found' },
        { status: 404 }
      );
    }

    // Verify the submission belongs to the specified provider
    if (submission.providerId !== providerId) {
      return NextResponse.json(
        { success: false, error: 'Requirement submission does not belong to this provider' },
        { status: 400 }
      );
    }

    // Approve the requirement
    const updatedSubmission = await prisma.requirementSubmission.update({
      where: { id: requirementId },
      data: {
        status: 'APPROVED',
        validatedById: currentUser.id,
        validatedAt: new Date(),
        notes: null, // Clear any previous rejection notes
      },
    });

    // Console log for future email integration
    console.log('ADMIN_ACTION: Requirement approved', {
      providerId: submission.provider.id,
      providerName: submission.provider.name,
      providerEmail: submission.provider.email,
      requirementId: submission.id,
      requirementName: submission.requirementType.name,
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      timestamp: new Date().toISOString(),
      action: 'REQUIREMENT_APPROVED',
    });

    return NextResponse.json({
      success: true,
      data: updatedSubmission,
      message: 'Requirement approved successfully',
    });
  } catch (error) {
    console.error('Error approving requirement:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
