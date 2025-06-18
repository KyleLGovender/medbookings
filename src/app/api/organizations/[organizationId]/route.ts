import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { organizationId: string } }) {
  try {
    const { organizationId } = params;

    if (!organizationId) {
      return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      include: {
        locations: true,
        memberships: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization by ID:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
