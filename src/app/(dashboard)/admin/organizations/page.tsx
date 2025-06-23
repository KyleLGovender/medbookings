import { redirect } from 'next/navigation';

import { OrganizationList } from '@/features/admin/components/organizations';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminOrganizationsPage() {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  return <OrganizationList />;
}
