import { redirect } from 'next/navigation';

import { ProviderList } from '@/features/admin/components/providers';
import { getCurrentUser } from '@/lib/auth';

interface AdminProvidersPageProps {
  searchParams: { status?: string };
}

export default async function AdminProvidersPage({ searchParams }: AdminProvidersPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Get status from search params and validate it
  const status = searchParams.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const initialStatus = status && validStatuses.includes(status) ? status : undefined;

  return <ProviderList initialStatus={initialStatus} />;
}
