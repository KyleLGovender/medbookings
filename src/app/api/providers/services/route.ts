import { NextRequest, NextResponse } from 'next/server';

import { SerializedService } from '@/features/providers/types/types';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET handler for /api/providers/services
 * Fetches services for a provider type
 * Query parameters:
 * - providerTypeId: ID of the provider type to fetch services for
 * - providerId: ID of the provider to check which services are configured
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = request.nextUrl;
    const providerTypeId = searchParams.get('providerTypeId');
    const providerId = searchParams.get('providerId');

    // Validate required parameters
    if (!providerTypeId) {
      return NextResponse.json({ error: 'Provider type ID is required' }, { status: 400 });
    }

    // Fetch provider type with its services
    const providerType = await prisma.providerType.findUnique({
      where: { id: providerTypeId },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            description: true,
            defaultDuration: true,
            defaultPrice: true,
            displayPriority: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            displayPriority: 'asc',
          },
        },
      },
    });

    if (!providerType) {
      return NextResponse.json(
        { error: `Provider type with ID ${providerTypeId} not found` },
        { status: 404 }
      );
    }

    // If providerId is provided, fetch the provider's service configurations
    let serviceConfigs: Array<{
      id: string;
      serviceId: string;
      duration: number;
      price: any;
      isOnlineAvailable: boolean;
      isInPerson: boolean;
      locationId: string | null;
    }> | null = null;
    if (providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        include: {
          availabilityConfigs: {
            select: {
              id: true,
              serviceId: true,
              duration: true,
              price: true,
              isOnlineAvailable: true,
              isInPerson: true,
              locationId: true,
            },
          },
        },
      });

      if (provider) {
        serviceConfigs = provider.availabilityConfigs;
      }
    }

    // Map services and add service config data if available
    const services: SerializedService[] = providerType.services.map((service, index) => {
      // Check if this service has been configured by the provider
      const serviceConfig = serviceConfigs?.find(
        (config) => config.serviceId === service.id
      );

      // Determine if the service is configured by the provider
      const hasCustomConfig = !!serviceConfig;
      const currentPrice = serviceConfig?.price 
        ? Number(serviceConfig.price) 
        : (service.defaultPrice ? Number(service.defaultPrice) : null);
      const currentDuration = serviceConfig?.duration || service.defaultDuration;

      return {
        id: service.id,
        name: service.name,
        description: service.description ?? undefined,
        defaultDuration: service.defaultDuration,
        defaultPrice: service.defaultPrice ? Number(service.defaultPrice) : null,
        displayPriority: service.displayPriority,
        createdAt: service.createdAt ? service.createdAt.toISOString() : undefined,
        updatedAt: service.updatedAt ? service.updatedAt.toISOString() : undefined,
        // SerializedService fields for provider services API
        isSelected: hasCustomConfig,
        currentPrice,
        currentDuration,
        hasCustomConfig,
        customConfig: serviceConfig ? {
          id: serviceConfig.id,
          duration: serviceConfig.duration,
          price: serviceConfig.price ? Number(serviceConfig.price) : null,
          isOnlineAvailable: serviceConfig.isOnlineAvailable,
          isInPerson: serviceConfig.isInPerson,
          locationId: serviceConfig.locationId,
        } : undefined,
      };
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
