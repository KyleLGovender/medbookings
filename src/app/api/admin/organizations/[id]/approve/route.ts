import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = params.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if organization is in a state that can be approved
    if (organization.status === 'APPROVED') {
      return NextResponse.json({ error: 'Organization is already approved' }, { status: 400 });
    }

    // Approve the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'APPROVED',
        approvedById: currentUser.id,
        approvedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    // Console log for future email integration
    console.log('ADMIN_ACTION: Organization approved', {
      organizationId: organization.id,
      organizationName: organization.name,
      organizationEmail: organization.email,
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      timestamp: new Date().toISOString(),
      action: 'ORGANIZATION_APPROVED',
    });

    return NextResponse.json({
      success: true,
      data: updatedOrganization,
      message: 'Organization approved successfully',
    });
  } catch (error) {
    console.error('Error approving organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
