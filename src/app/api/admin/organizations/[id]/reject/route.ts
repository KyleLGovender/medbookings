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
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

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

    // Check if organization is in a state that can be rejected
    if (organization.status === 'REJECTED') {
      return NextResponse.json({ error: 'Organization is already rejected' }, { status: 400 });
    }

    // Reject the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
        approvedById: null,
        approvedAt: null,
      },
    });

    // Console log for future email integration
    console.log('ADMIN_ACTION: Organization rejected', {
      organizationId: organization.id,
      organizationName: organization.name,
      organizationEmail: organization.email,
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      rejectionReason: reason.trim(),
      timestamp: new Date().toISOString(),
      action: 'ORGANIZATION_REJECTED',
    });

    return NextResponse.json({
      success: true,
      data: updatedOrganization,
      message: 'Organization rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
