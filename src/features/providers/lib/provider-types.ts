'use server';

import { prisma } from '@/lib/prisma';

export type ProviderTypeData = {
  id: string;
  name: string;
  description: string | null;
};

export type RequirementTypeData = {
  id: string;
  name: string;
  description: string | null;
  validationType: string;
  isRequired: boolean;
  validationConfig: any;
  displayPriority?: number;
};

export type ServiceTypeData = {
  id: string;
  name: string;
  description: string | null;
  defaultDuration: number;
  defaultPrice: number | string;
  displayPriority: number;
};

/**
 * Fetches all provider types from the database
 */
export async function getProviderTypes(): Promise<ProviderTypeData[]> {
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

    return providerTypes;
  } catch (error) {
    console.error('Failed to fetch provider types:', error);
    throw new Error('Failed to fetch provider types');
  }
}

/**
 * Fetches requirements for a specific provider type
 */
export async function getRequirementsForProviderType(
  providerTypeId: string
): Promise<RequirementTypeData[]> {
  try {
    const providerType = await prisma.providerType.findUnique({
      where: { id: providerTypeId },
      include: {
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

    if (!providerType) {
      throw new Error(`Provider type with ID ${providerTypeId} not found`);
    }

    return providerType.requirements;
  } catch (error) {
    console.error(`Failed to fetch requirements for provider type ${providerTypeId}:`, error);
    throw new Error('Failed to fetch provider type requirements');
  }
}

/**
 * Fetches services for a specific provider type
 */
export async function getServicesForProviderType(
  providerTypeId: string
): Promise<ServiceTypeData[]> {
  try {
    const services = await prisma.service.findMany({
      where: {
        providerTypeId: providerTypeId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        defaultDuration: true,
        defaultPrice: true,
        displayPriority: true,
      },
      orderBy: [{ displayPriority: 'asc' }, { name: 'asc' }],
    });

    return services.map((service) => ({
      ...service,
      // Convert Decimal to string to avoid serialization issues
      defaultPrice: service.defaultPrice.toString(),
    }));
  } catch (error) {
    console.error(`Failed to fetch services for provider type ${providerTypeId}:`, error);
    throw new Error('Failed to fetch provider type services');
  }
}
