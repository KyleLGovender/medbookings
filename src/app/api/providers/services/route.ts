import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerTypeId = searchParams.get('providerTypeId');
    const providerId = searchParams.get('providerId');

    let servicesQuery: any = {
      where: {},
      orderBy: {
        name: 'asc',
      },
    };

    // If provider type ID is provided, filter services for that provider type
    if (providerTypeId) {
      servicesQuery.where = {
        ...servicesQuery.where,
        serviceProviderTypeId: providerTypeId,
      };
    }

    // If provider ID is provided, include whether each service is associated with that provider
    if (providerId) {
      servicesQuery.include = {
        providers: {
          where: {
            id: providerId,
          },
          select: {
            id: true,
          },
        },
      };
    }

    const services = await prisma.service.findMany(servicesQuery);

    // Convert Decimal to Number for JSON serialization and add isSelected property
    const serializedServices = services.map((service: any) => {
      // If we included providers, calculate isSelected
      const providersArray = Array.isArray(service.providers) ? service.providers : [];
      const isSelected = providerId ? providersArray.length > 0 : undefined;

      // Destructure properties safely
      const {
        defaultPrice,
        defaultDuration,
        createdAt,
        updatedAt,
        description,
        providers, // This may be undefined if not included in the query
        ...rest
      } = service;

      return {
        ...rest,
        defaultPrice: defaultPrice ? Number(defaultPrice) : null,
        defaultDuration: defaultDuration ? Number(defaultDuration) : null,
        description: description ?? undefined,
        createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
        updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
        isSelected,
      };
    });

    return NextResponse.json(serializedServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
