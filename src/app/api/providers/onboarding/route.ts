import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET handler for /api/providers/onboarding
 * Returns consolidated onboarding data: provider types, requirements, and services
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all provider types
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

    // Fetch all requirements grouped by provider type
    const requirementsData = await prisma.serviceProviderType.findMany({
      select: {
        id: true,
        requirements: {
          select: {
            id: true,
            name: true,
            description: true,
            validationType: true,
            isRequired: true,
            validationConfig: true,
            displayPriority: true,
          },
          orderBy: [{ displayPriority: 'asc' }, { name: 'asc' }],
        },
      },
    });

    // Fetch all services grouped by provider type
    const servicesData = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        defaultDuration: true,
        defaultPrice: true,
        displayPriority: true,
        serviceProviderTypeId: true,
      },
      orderBy: [{ displayPriority: 'asc' }, { name: 'asc' }],
    });

    // Organize requirements by provider type ID
    const requirementsByProviderType: Record<string, any[]> = {};
    requirementsData.forEach((providerType) => {
      requirementsByProviderType[providerType.id] = providerType.requirements;
    });

    // Organize services by provider type ID
    const servicesByProviderType: Record<string, any[]> = {};
    servicesData.forEach((service) => {
      if (!servicesByProviderType[service.serviceProviderTypeId]) {
        servicesByProviderType[service.serviceProviderTypeId] = [];
      }
      servicesByProviderType[service.serviceProviderTypeId].push({
        id: service.id,
        name: service.name,
        description: service.description,
        defaultDuration: service.defaultDuration,
        defaultPrice: service.defaultPrice.toString(), // Convert Decimal to string
        displayPriority: service.displayPriority,
      });
    });

    const response = {
      providerTypes,
      requirements: requirementsByProviderType,
      services: servicesByProviderType,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch onboarding data:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding data' }, { status: 500 });
  }
}
