import { prisma } from '@/lib/prisma';

import { ServiceProviderWithRelations } from './types';

export async function getServiceProvider(
  userId: string
): Promise<ServiceProviderWithRelations | null> {
  return prisma.serviceProvider.findUnique({
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
    },
  });
}
