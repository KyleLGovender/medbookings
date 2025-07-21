import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { updateProviderServices } from '@/features/providers/lib/actions/update-provider';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PUT handler for updating provider services
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    formData.append('id', params.id);

    // Call the server action
    const result = await updateProviderServices({}, formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update services' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating provider services:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating provider services' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for fetching provider's associated services
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = params.id;
    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { services: true },
    });

    const result =
      provider?.services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description ?? undefined,
        price: Number(service.defaultPrice),
        duration: service.defaultDuration,
      })) || [];

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching provider associated services:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching provider services' },
      { status: 500 }
    );
  }
}
