import { redirect } from 'next/navigation';

import { ProviderList } from '@/features/admin/components/providers';
import { getCurrentUser } from '@/lib/auth';
import type { AdminProvidersPageProps } from '@/features/admin/types';


export default async function AdminProvidersPage({ searchParams }: AdminProvidersPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Get status from search params and validate it
  const status = searchParams.status;
  const validStatuses = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const;
  const initialStatus = status && validStatuses.includes(status as any) ? status as typeof validStatuses[number] : undefined;

  return <ProviderList initialStatus={initialStatus} />;
}
