import { prisma } from '@/lib/prisma';

export async function getProviderName(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { name: true },
  });

  return provider?.name;
}
