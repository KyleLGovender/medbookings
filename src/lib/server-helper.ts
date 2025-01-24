import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function getServiceProviderId(
  userId: string,
): Promise<string | null> {
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

export async function getAuthenticatedServiceProvider(): Promise<{
  serviceProviderId?: string;
  error?: string;
}> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const serviceProvider = await prisma.serviceProvider.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!serviceProvider) {
    return { error: "No service provider profile found" };
  }

  return { serviceProviderId: serviceProvider.id };
}
