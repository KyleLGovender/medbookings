import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { email: true, name: true, phone: true },
        },
        serviceProviderType: true,
        services: true,
        requirementSubmissions: {
          include: {
            requirementType: true,
            validatedBy: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
