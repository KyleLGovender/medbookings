import { NextRequest, NextResponse } from 'next/server';

import { serializeServiceProvider } from '@/features/providers/lib/helper';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: {
        services: true,
        user: {
          select: {
            email: true,
          },
        },
        typeAssignments: {
          include: {
            providerType: {
              select: {
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
      return NextResponse.json(null, { status: 404 });
    }

    // Serialize the provider data to handle Decimal values and dates
    const serializedProvider = serializeServiceProvider(provider);

    return NextResponse.json(serializedProvider);
  } catch (error) {
    console.error('Error fetching service provider:', error);
    return NextResponse.json({ error: 'Failed to fetch service provider' }, { status: 500 });
  }
}
