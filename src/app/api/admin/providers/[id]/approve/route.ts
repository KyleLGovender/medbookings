import { NextRequest, NextResponse } from 'next/server';

import type {
  AdminApiErrorResponse,
  AdminApiResponse,
  AdminRouteParams,
} from '@/features/admin/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: AdminRouteParams }
): Promise<NextResponse<AdminApiResponse | AdminApiErrorResponse>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const providerId = params.id;

    // Check if all required requirements are approved
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        requirementSubmissions: {
          include: {
            requirementType: true,
          },
        },
        serviceProviderType: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }

    // Check if all required requirements are approved
    const requiredSubmissions = provider.requirementSubmissions.filter(
      (submission) => submission.requirementType.isRequired
    );

    const unapprovedRequired = requiredSubmissions.filter(
      (submission) => submission.status !== 'APPROVED'
    );

    if (unapprovedRequired.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot approve provider: not all required requirements are approved',
          unapprovedRequirements: unapprovedRequired.map((sub) => ({
            id: sub.id,
            name: sub.requirementType.name,
            status: sub.status,
          })),
        },
        { status: 400 }
      );
    }

    // Approve the provider
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        status: 'APPROVED',
        approvedById: currentUser.id,
        approvedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    // Console log for future email integration
    console.log('ADMIN_ACTION: Provider approved', {
      providerId: provider.id,
      providerName: provider.name,
      providerEmail: provider.email,
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      timestamp: new Date().toISOString(),
      action: 'PROVIDER_APPROVED',
    });

    return NextResponse.json({
      success: true,
      data: updatedProvider,
      message: 'Provider approved successfully',
    });
  } catch (error) {
    console.error('Error approving provider:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
