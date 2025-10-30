import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getProviderId(userId: string): Promise<string | null> {
  const provider = await prisma.provider.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  return provider?.id ?? null;
}

export async function getAuthenticatedProvider(): Promise<{
  providerId?: string;
  error?: string;
}> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!provider) {
    return { error: 'No provider profile found' };
  }

  return { providerId: provider.id };
}
