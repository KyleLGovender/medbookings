import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = currentUser.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: id },
      include: {
        memberships: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is an admin of the organization
    const isAdmin = organization.memberships.some((m) => m.role === 'ADMIN');
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this organization' },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await req.json();

    // Validate the billing model
    const { billingModel } = data;
    if (!billingModel || !['CONSOLIDATED', 'PER_LOCATION', 'HYBRID'].includes(billingModel)) {
      return NextResponse.json(
        { error: 'Invalid billing model. Must be CONSOLIDATED, PER_LOCATION, or HYBRID' },
        { status: 400 }
      );
    }

    // Update the organization's billing model
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: { billingModel },
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization billing model:', error);
    return NextResponse.json(
      { error: 'Failed to update organization billing model' },
      { status: 500 }
    );
  }
}
