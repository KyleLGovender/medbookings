import { redirect } from 'next/navigation';

import { OrganizationList } from '@/features/admin/components/organizations';
import { getCurrentUser } from '@/lib/auth';

interface AdminOrganizationsPageProps {
  searchParams: { status?: string };
}

export default async function AdminOrganizationsPage({
  searchParams,
}: AdminOrganizationsPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Get status from search params and validate it
  const status = searchParams.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const initialStatus = status && validStatuses.includes(status) ? status : undefined;

  return <OrganizationList initialStatus={initialStatus} />;
}
