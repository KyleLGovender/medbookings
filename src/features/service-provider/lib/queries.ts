import { prisma } from '@/lib/prisma';

import { serializeServiceProvider } from './helper';
import { ServiceProvider } from './types';

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
