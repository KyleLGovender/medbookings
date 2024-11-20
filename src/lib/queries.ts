import { prisma } from '@/lib/prisma';

export async function getServiceProviderId(userId: string): Promise<string | null> {
  const serviceProvider = await prisma.serviceProvider.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  return serviceProvider?.id ?? null;
}
