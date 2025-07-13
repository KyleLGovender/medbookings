import { redirect } from 'next/navigation';

import { OrganizationList } from '@/features/admin/components/organizations';
import type { AdminOrganizationsPageProps } from '@/features/admin/types';
import { AdminApprovalStatus } from '@/features/admin/types/enums';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminOrganizationsPage({ searchParams }: AdminOrganizationsPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/unauthorized');
  }

  // Get status from search params and validate it
  const status = searchParams.status;
  const validStatuses = [
    AdminApprovalStatus.PENDING_APPROVAL,
    AdminApprovalStatus.APPROVED,
    AdminApprovalStatus.REJECTED,
  ] as const;
  const initialStatus =
    status && validStatuses.includes(status as any)
      ? (status as (typeof validStatuses)[number])
      : undefined;

  return <OrganizationList initialStatus={initialStatus} />;
}
