import { notFound, redirect } from 'next/navigation';

import { OrganizationDetail } from '@/features/admin/components/organizations/organization-detail';
import { getCurrentUser } from '@/lib/auth';

interface AdminOrganizationDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminOrganizationDetailPage({
  params,
}: AdminOrganizationDetailPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Ensure ID exists
  if (!params.id) {
    notFound();
  }

  return <OrganizationDetail organizationId={params.id} />;
}
