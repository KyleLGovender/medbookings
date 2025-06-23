import { redirect } from 'next/navigation';

import { ProviderList } from '@/features/admin/components/providers';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminProvidersPage() {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  return <ProviderList />;
}
