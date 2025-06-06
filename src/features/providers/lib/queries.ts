'use server';

import { Service, ServiceProvider } from '@prisma/client';

import { serializeServiceProvider } from '@/features/providers/lib/helper';
import { prisma } from '@/lib/prisma';

// Define a serialized service type that has number instead of Decimal
interface SerializedService extends Omit<Service, 'defaultPrice'> {
  defaultPrice: number;
  availabilityConfigs?: Array<{
    price: number;
    [key: string]: any;
  }>;
}

export async function getServiceProviderByUserId(userId: string): Promise<ServiceProvider | null> {
  const provider = await prisma.serviceProvider.findUnique({
    where: {
      userId,
    },
    include: {
      services: true,
      user: {
        select: {
          email: true,
        },
      },
      serviceProviderType: {
        select: {
          name: true,
          description: true,
        },
      },
      requirementSubmissions: {
        include: {
          requirementType: true,
        },
      },
      calendarIntegration: true,
    },
  });

  if (!provider) return null;

  const serialized = serializeServiceProvider(provider);
  return serialized;
}

export async function getServiceProviderByServiceProviderId(
  serviceProviderId: string
): Promise<ServiceProvider | null> {
  const provider = await prisma.serviceProvider.findUnique({
    where: {
      id: serviceProviderId,
    },
    include: {
      services: true,
      user: {
        select: {
          email: true,
        },
      },
      serviceProviderType: {
        select: {
          name: true,
          description: true,
        },
      },
      requirementSubmissions: {
        include: {
          requirementType: true,
        },
      },
    },
  });

  if (!provider) return null;

  const serialized = serializeServiceProvider(provider);
  return serialized;
}

export async function getApprovedServiceProviders() {
  const providers = await prisma.serviceProvider.findMany({
    where: {
      status: 'APPROVED', // Only fetch approved providers
    },
    include: {
      serviceProviderType: {
        select: {
          name: true,
          description: true,
        },
      },
      services: true,
      user: {
        select: {
          email: true,
        },
      },
      requirementSubmissions: {
        include: {
          requirementType: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return providers.map((provider) => serializeServiceProvider(provider));
}

export async function getServiceProviderServices(
  serviceProviderId: string
): Promise<SerializedService[]> {
  try {
    const services = await prisma.service.findMany({
      where: {
        providers: {
          some: {
            id: serviceProviderId,
          },
        },
      },
      include: {
        availabilityConfigs: {
          where: {
            serviceProviderId,
          },
        },
      },
    });
    return services.map((service) => ({
      ...service,
      defaultPrice: Number(service.defaultPrice),
      availabilityConfigs: service.availabilityConfigs.map((config) => ({
        ...config,
        price: Number(config.price),
      })),
    }));
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}
