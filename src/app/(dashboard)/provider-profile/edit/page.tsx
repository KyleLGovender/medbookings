import { redirect } from 'next/navigation';

import { ProviderProfileEditClient } from '@/features/providers/components/provider-profile/provider-profile-edit-client';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ProviderProfileEditPage() {
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
    redirect('/profile');
  }

  // Allow editing for approved, active, and suspended providers
  if (
    provider.status !== 'APPROVED' &&
    provider.status !== 'ACTIVE' &&
    provider.status !== 'SUSPENDED'
  ) {
    redirect('/profile');
  }

  return <ProviderProfileEditClient />;
}
