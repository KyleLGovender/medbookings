import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { deleteProvider } from '@/features/providers/lib/actions/delete-provider';
import { updateProviderBasicInfo } from '@/features/providers/lib/actions/update-provider';
import { serializeProvider } from '@/features/providers/lib/helper';
import { authOptions, getCurrentUser } from '@/lib/auth';
import { providerDebug } from '@/lib/debug';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const provider = await prisma.provider.findUnique({
      where: {
        id,
      },
      include: {
        services: true,
        availabilityConfigs: {
          include: {
            service: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
        typeAssignments: {
          include: {
            providerType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        requirementSubmissions: {
          include: {
            requirementType: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Serialize the provider data to handle Decimal values and dates
    const serializedProvider = serializeProvider(provider);

    return NextResponse.json(serializedProvider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the provider' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the provider ID from the URL
    const { id } = params;

    // Get form data
    const formData = await request.formData();

    // Add the ID to the form data
    formData.append('id', id);

    providerDebug.logFormData('editServices', formData);

    // Call the server action to update the provider
    const result = await updateProviderBasicInfo({}, formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update provider' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in PUT /api/providers/[id]:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the provider' },
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
    const result = await deleteProvider(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete provider' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE /api/providers/[id]:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the provider' },
      { status: 500 }
    );
  }
}
