import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const organizations = await prisma.organization.findMany({
      where: {
        memberships: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        locations: true, // Include locations if needed
        memberships: true, // Include memberships if needed
      },
    });

    if (!organizations || organizations.length === 0) {
      return NextResponse.json(
        { message: 'No organizations found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations by user ID:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
