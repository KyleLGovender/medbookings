import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const serviceProvider = await prisma.serviceProvider.findFirst({
      where: { userId },
      include: {
        serviceProviderType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!serviceProvider) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(serviceProvider);
  } catch (error) {
    console.error('Error fetching service provider:', error);
    return NextResponse.json({ error: 'Failed to fetch service provider' }, { status: 500 });
  }
}
