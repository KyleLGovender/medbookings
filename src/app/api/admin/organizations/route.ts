import { NextRequest, NextResponse } from 'next/server';

import { OrganizationStatus } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    // Validate status parameter against enum values
    const whereClause =
      statusParam && Object.values(OrganizationStatus).includes(statusParam as OrganizationStatus)
        ? { status: statusParam as OrganizationStatus }
        : {};

    const organizations = await prisma.organization.findMany({
      where: whereClause,
      include: {
        approvedBy: {
          select: { email: true, name: true },
        },
        memberships: {
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
        },
        locations: {
          select: { id: true, name: true, formattedAddress: true },
        },
        _count: {
          select: {
            memberships: true,
            locations: true,
            providerConnections: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
