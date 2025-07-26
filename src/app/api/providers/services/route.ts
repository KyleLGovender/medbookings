import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
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
    // and include ServiceAvailabilityConfig data
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
        serviceConfigs: {
          where: {
            providerId: providerId,
          },
          select: {
            id: true,
            duration: true,
            price: true,
            isOnlineAvailable: true,
            isInPerson: true,
            locationId: true,
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

      // Get service config if it exists
      const serviceConfigsArray = Array.isArray(service.serviceConfigs) ? service.serviceConfigs : [];
      const serviceConfig = serviceConfigsArray.length > 0 ? serviceConfigsArray[0] : null;

      // Determine pricing and duration with fallback logic
      const hasCustomConfig = !!serviceConfig;
      const finalPrice = serviceConfig?.price 
        ? Number(serviceConfig.price)
        : (service.defaultPrice ? Number(service.defaultPrice) : null);
      const finalDuration = serviceConfig?.duration || service.defaultDuration;

      // Destructure properties safely
      const {
        defaultPrice,
        defaultDuration,
        createdAt,
        updatedAt,
        description,
        displayPriority,
        providers, // This may be undefined if not included in the query
        serviceConfigs, // This may be undefined if not included in the query
        ...rest
      } = service;

      return {
        ...rest,
        defaultPrice: defaultPrice ? Number(defaultPrice) : null,
        defaultDuration: defaultDuration ? Number(defaultDuration) : null,
        description: description ?? undefined,
        createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
        updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
        displayPriority,
        isSelected,
        // Add computed fields for current effective pricing
        currentPrice: finalPrice,
        currentDuration: finalDuration,
        hasCustomConfig,
        // Include custom config details if available
        ...(serviceConfig && {
          customConfig: {
            id: serviceConfig.id,
            duration: serviceConfig.duration,
            price: serviceConfig.price ? Number(serviceConfig.price) : null,
            isOnlineAvailable: serviceConfig.isOnlineAvailable,
            isInPerson: serviceConfig.isInPerson,
            locationId: serviceConfig.locationId,
          },
        }),
      };
    });

    return NextResponse.json(serializedServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
