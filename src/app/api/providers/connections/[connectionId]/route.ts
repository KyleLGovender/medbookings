import { NextResponse } from 'next/server';

import { ConnectionUpdateSchema } from '@/features/providers/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/providers/connections/[connectionId]
export async function PUT(request: Request, { params }: { params: { connectionId: string } }) {
  try {
    const { connectionId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!connectionId) {
      return NextResponse.json({ message: 'Connection ID is required' }, { status: 400 });
    }

    // Find the service provider for the current user
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId: currentUser.id },
    });

    if (!serviceProvider) {
      return NextResponse.json(
        {
          message: 'Service provider profile not found',
        },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = ConnectionUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

    // Find the connection
    const connection = await prisma.organizationProviderConnection.findFirst({
      where: {
        id: connectionId,
        serviceProviderId: serviceProvider.id,
      },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!connection) {
      return NextResponse.json({ message: 'Connection not found' }, { status: 404 });
    }

    // Validate status transition
    if (connection.status === 'REJECTED') {
      return NextResponse.json(
        {
          message: 'Cannot modify a rejected connection',
        },
        { status: 400 }
      );
    }

    if (status === 'SUSPENDED' && connection.status !== 'ACCEPTED') {
      return NextResponse.json(
        {
          message: 'Only active connections can be suspended',
        },
        { status: 400 }
      );
    }

    if (status === 'ACCEPTED' && connection.status !== 'SUSPENDED') {
      return NextResponse.json(
        {
          message: 'Only suspended connections can be reactivated',
        },
        { status: 400 }
      );
    }

    // Update connection status
    const updatedConnection = await prisma.organizationProviderConnection.update({
      where: { id: connectionId },
      data: {
        status,
        ...(status === 'ACCEPTED' && { acceptedAt: new Date() }),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const actionMessage =
      status === 'SUSPENDED'
        ? 'Connection suspended successfully'
        : 'Connection reactivated successfully';

    return NextResponse.json({
      message: actionMessage,
      connection: {
        id: updatedConnection.id,
        status: updatedConnection.status,
        organizationName: updatedConnection.organization.name,
        acceptedAt: updatedConnection.acceptedAt,
      },
    });
  } catch (error) {
    console.error('Error updating provider connection:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/providers/connections/[connectionId]
export async function DELETE(request: Request, { params }: { params: { connectionId: string } }) {
  try {
    const { connectionId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!connectionId) {
      return NextResponse.json({ message: 'Connection ID is required' }, { status: 400 });
    }

    // Find the service provider for the current user
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId: currentUser.id },
    });

    if (!serviceProvider) {
      return NextResponse.json(
        {
          message: 'Service provider profile not found',
        },
        { status: 404 }
      );
    }

    // Find the connection
    const connection = await prisma.organizationProviderConnection.findFirst({
      where: {
        id: connectionId,
        serviceProviderId: serviceProvider.id,
      },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!connection) {
      return NextResponse.json({ message: 'Connection not found' }, { status: 404 });
    }

    // Check if there are any active availabilities or bookings
    const activeAvailabilities = await prisma.availability.count({
      where: {
        connectionId: connectionId,
        endTime: { gte: new Date() }, // Future availabilities
      },
    });

    if (activeAvailabilities > 0) {
      return NextResponse.json(
        {
          message:
            'Cannot delete connection with active future availabilities. Please remove or transfer them first.',
        },
        { status: 400 }
      );
    }

    // Delete the connection
    await prisma.organizationProviderConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({
      message: 'Connection deleted successfully',
      deletedConnection: {
        id: connectionId,
        organizationName: connection.organization.name,
      },
    });
  } catch (error) {
    console.error('Error deleting provider connection:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
