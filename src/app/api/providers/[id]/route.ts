import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { deleteServiceProvider } from '@/features/providers/lib/actions/delete-provider';
import { updateProviderBasicInfo } from '@/features/providers/lib/actions/update-provider';
import { serializeServiceProvider } from '@/features/providers/lib/helper';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: {
        id,
      },
      include: {
        services: true,
        user: {
          select: {
            email: true,
          },
        },
        serviceProviderType: {
          select: {
            name: true,
            description: true,
          },
        },
        requirementSubmissions: {
          include: {
            requirementType: true,
          },
        },
      },
    });

    if (!serviceProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    // Serialize the provider data to handle Decimal values and dates
    const serializedProvider = serializeServiceProvider(serviceProvider);

    return NextResponse.json(serializedProvider);
  } catch (error) {
    console.error('Error fetching service provider:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the service provider' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the provider ID from the URL
    const { id } = params;

    // Get form data
    const formData = await request.formData();

    // Add the ID to the form data
    formData.append('id', id);

    // Call the server action to update the provider
    const result = await updateProviderBasicInfo({}, formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update service provider' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in PUT /api/providers/[id]:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the service provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the provider ID from the URL
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Call the server action to delete the provider
    const result = await deleteServiceProvider(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete service provider' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE /api/providers/[id]:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the service provider' },
      { status: 500 }
    );
  }
}
