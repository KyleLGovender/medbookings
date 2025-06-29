import { NextRequest, NextResponse } from 'next/server';

import { ServiceProviderStatus } from '@prisma/client';

import type { AdminApiResponse, AdminProviderListSelect } from '@/features/admin/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest
): Promise<NextResponse<AdminApiResponse<AdminProviderListSelect[]>>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    // Validate status parameter against enum values
    const whereClause =
      statusParam &&
      Object.values(ServiceProviderStatus).includes(statusParam as ServiceProviderStatus)
        ? { status: statusParam as ServiceProviderStatus }
        : {};

    const providers = await prisma.serviceProvider.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        serviceProviderType: {
          select: { name: true },
        },
        requirementSubmissions: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
