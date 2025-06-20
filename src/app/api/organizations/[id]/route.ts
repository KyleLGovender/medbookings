import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: id,
      },
      include: {
        locations: true,
        memberships: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization by ID:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user is an admin of the organization
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: id,
        userId: currentUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, email, phone, website, billingModel } = body;

    const updatedOrganization = await prisma.organization.update({
      where: {
        id: id,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(billingModel && { billingModel }),
      },
      include: {
        locations: true,
        memberships: true,
      },
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user is an admin of the organization
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: id,
        userId: currentUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Delete organization
    await prisma.organization.delete({
      where: {
        id: id,
      },
    });

    // Return a successful response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
