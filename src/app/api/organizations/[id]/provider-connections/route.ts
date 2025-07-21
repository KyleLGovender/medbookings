import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Verify user has access to this organization
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: params.id,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause for status filtering
    const whereClause: any = {
      organizationId: params.id,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const connections = await prisma.organizationProviderConnection.findMany({
      where: whereClause,
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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
          },
        },
        invitation: {
          include: {
            invitedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { acceptedAt: 'desc' }, { requestedAt: 'desc' }],
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching organization provider connections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
