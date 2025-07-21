'use server';

import { Service, Provider } from '@prisma/client';

import { serializeProvider } from '@/features/providers/lib/helper';
import { prisma } from '@/lib/prisma';

// Define a serialized service type that has number instead of Decimal
interface SerializedService extends Omit<Service, 'defaultPrice'> {
  defaultPrice: number;
  availabilityConfigs?: Array<{
    price: number;
    [key: string]: any;
  }>;
}

export async function getProviderByUserId(userId: string): Promise<Provider | null> {
  const provider = await prisma.provider.findUnique({
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
      typeAssignments: {
        include: {
          providerType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
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

  const serialized = serializeProvider(provider);
  return serialized;
}

export async function getProviderByProviderId(
  providerId: string
): Promise<Provider | null> {
  const provider = await prisma.provider.findUnique({
    where: {
      id: providerId,
    },
    include: {
      services: true,
      user: {
        select: {
          email: true,
        },
      },
      typeAssignments: {
        include: {
          providerType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
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

  const serialized = serializeProvider(provider);
  return serialized;
}

export async function getApprovedProviders() {
  const providers = await prisma.provider.findMany({
    where: {
      status: 'APPROVED', // Only fetch approved providers
    },
    include: {
      typeAssignments: {
        include: {
          providerType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
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

  return providers.map((provider) => serializeProvider(provider));
}

export async function getProviderServices(
  providerId: string
): Promise<SerializedService[]> {
  try {
    const services = await prisma.service.findMany({
      where: {
        providers: {
          some: {
            id: providerId,
          },
        },
      },
      include: {
        availabilityConfigs: {
          where: {
            providerId,
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
