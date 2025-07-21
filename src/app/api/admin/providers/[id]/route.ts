import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { email: true, name: true, phone: true, whatsapp: true, id: true },
        },
        typeAssignments: {
          include: {
            providerType: {
              select: { id: true, name: true },
            },
          },
        },
        services: {
          select: { id: true, name: true },
        },
        requirementSubmissions: {
          include: {
            requirementType: {
              select: {
                id: true,
                name: true,
                displayPriority: true,
                isRequired: true,
              },
            },
            validatedBy: {
              select: { id: true, name: true },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
