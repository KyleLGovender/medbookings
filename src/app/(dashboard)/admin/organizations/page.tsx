import { redirect } from 'next/navigation';
import { OrganizationStatus } from '@prisma/client';

import { OrganizationList } from '@/features/admin/components/organizations';
import type { AdminOrganizationsPageProps } from '@/features/admin/types/types';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminOrganizationsPage({
  searchParams,
}: AdminOrganizationsPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/unauthorized');
  }

  // Get status from search params and validate it
  const status = searchParams.status;
  const validStatuses = [
    OrganizationStatus.PENDING_APPROVAL,
    OrganizationStatus.APPROVED,
    OrganizationStatus.REJECTED,
  ] as const;
  const initialStatus =
    status && validStatuses.includes(status as any)
      ? (status as (typeof validStatuses)[number])
      : undefined;

  return <OrganizationList initialStatus={initialStatus} />;
}
