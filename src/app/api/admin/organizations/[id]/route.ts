import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        approvedBy: {
          select: { name: true, email: true },
        },
        memberships: {
          include: {
            user: {
              select: { email: true, name: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        locations: {
          select: {
            id: true,
            name: true,
            formattedAddress: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        providerConnections: {
          include: {
            serviceProvider: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
                serviceProviderType: {
                  select: { name: true },
                },
              },
            },
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
