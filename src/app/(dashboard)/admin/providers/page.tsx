import { redirect } from 'next/navigation';

import { ProviderStatus } from '@prisma/client';

import { ProviderList } from '@/features/admin/components/providers/provider-list';
import { getCurrentUser } from '@/lib/auth';

// Extract page props type for admin providers page
interface AdminProvidersPageProps {
  searchParams: {
    status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  };
}

export default async function AdminProvidersPage({ searchParams }: AdminProvidersPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/unauthorized');
  }

  // Get status from search params and validate it
  const status = searchParams.status;
  const validStatuses = [
    ProviderStatus.PENDING_APPROVAL,
    ProviderStatus.APPROVED,
    ProviderStatus.REJECTED,
  ] as const;
  const initialStatus =
    status && (validStatuses as readonly string[]).includes(status)
      ? (status as (typeof validStatuses)[number])
      : undefined;

  return <ProviderList initialStatus={initialStatus} />;
}
