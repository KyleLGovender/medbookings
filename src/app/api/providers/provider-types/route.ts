import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET handler for /api/providers/provider-types
 * Fetches all provider types
 */
export async function GET(request: NextRequest) {
  try {
    const providerTypes = await prisma.providerType.findMany({
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
    console.error('Failed to fetch provider types:', error);
    return NextResponse.json({ error: 'Failed to fetch provider types' }, { status: 500 });
  }
}
