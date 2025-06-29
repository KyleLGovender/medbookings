import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/providers/connections
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find the service provider for the current user
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId: currentUser.id }
    });

    if (!serviceProvider) {
      return NextResponse.json({ 
        message: 'Service provider profile not found' 
      }, { status: 404 });
    }

    // Get URL search params for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      serviceProviderId: serviceProvider.id,
    };

    if (status && ['PENDING', 'ACCEPTED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      whereClause.status = status;
    }

    // Fetch connections
    const connections = await prisma.organizationProviderConnection.findMany({
      where: whereClause,
      include: {
        organization: {
          select: { 
            id: true,
            name: true, 
            description: true,
            logo: true,
            email: true,
            phone: true,
            website: true
          }
        },
        invitation: {
          select: {
            id: true,
            customMessage: true,
            createdAt: true,
            invitedBy: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });

    return NextResponse.json({ connections });

  } catch (error) {
    console.error('Error fetching provider connections:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}