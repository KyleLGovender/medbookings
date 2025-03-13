import { ServiceProvider } from '@/features/service-provider/lib/types';
import { prisma } from '@/lib/prisma';

export async function getServiceProvider(userId: string): Promise<ServiceProvider | null> {
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
    },
  });

  if (!provider) return null;

  // Convert Decimal to number for defaultPrice and ensure the structure matches ServiceProvider type
  return {
    ...provider,
    services: provider.services.map((service) => ({
      ...service,
      defaultPrice: Number(service.defaultPrice),
    })),
    // These properties are already correctly shaped based on our updated type
    user: provider.user,
    serviceProviderType: provider.serviceProviderType,
  } as ServiceProvider;
}
