import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET handler for /api/providers/provider-types
 * Fetches all service provider types
 */
export async function GET(request: NextRequest) {
  try {
    const providerTypes = await prisma.serviceProviderType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(providerTypes);
  } catch (error) {
    console.error('Failed to fetch service provider types:', error);
    return NextResponse.json({ error: 'Failed to fetch service provider types' }, { status: 500 });
  }
}
