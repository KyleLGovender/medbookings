import { redirect } from 'next/navigation';

import { ProviderProfileClient } from '@/features/providers/components/provider-profile/provider-profile-client';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ProviderProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has a provider profile
  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!provider) {
    // User is not a provider, redirect to regular profile
    redirect('/profile');
  }

  // Allow access for all provider statuses (including SUSPENDED)
  // The client component will handle the display based on status
  return <ProviderProfileClient />;
}
