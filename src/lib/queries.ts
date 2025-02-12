import { prisma } from '@/lib/prisma';

export async function getServiceProviderName(serviceProviderId: string) {
  const serviceProvider = await prisma.serviceProvider.findUnique({
    where: { id: serviceProviderId },
    select: { name: true },
  });

  return serviceProvider?.name;
}
