import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
    connectionId: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has admin access to this organization
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: params.id,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!['ACCEPTED', 'SUSPENDED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACCEPTED or SUSPENDED' },
        { status: 400 }
      );
    }

    // Verify connection belongs to this organization
    const existingConnection = await prisma.organizationProviderConnection.findFirst({
      where: {
        id: params.connectionId,
        organizationId: params.id,
      },
    });

    if (!existingConnection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Update the connection
    const updatedConnection = await prisma.organizationProviderConnection.update({
      where: {
        id: params.connectionId,
      },
      data: {
        status,
        ...(status === 'SUSPENDED' && { suspendedAt: new Date() }),
        ...(status === 'ACCEPTED' && { suspendedAt: null }),
      },
      include: {
        serviceProvider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            serviceProviderType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ connection: updatedConnection });
  } catch (error) {
    console.error('Error updating organization provider connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has admin access to this organization
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: params.id,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify connection belongs to this organization
    const existingConnection = await prisma.organizationProviderConnection.findFirst({
      where: {
        id: params.connectionId,
        organizationId: params.id,
      },
    });

    if (!existingConnection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Check if provider has any active availability with this organization
    const activeAvailabilities = await prisma.availability.findMany({
      where: {
        serviceProviderId: existingConnection.serviceProviderId,
        organizationId: params.id,
        endTime: {
          gte: new Date(),
        },
      },
    });

    if (activeAvailabilities.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete connection with active future availability. Please cancel all future availability first.',
        },
        { status: 400 }
      );
    }

    // Delete the connection
    await prisma.organizationProviderConnection.delete({
      where: {
        id: params.connectionId,
      },
    });

    return NextResponse.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization provider connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
