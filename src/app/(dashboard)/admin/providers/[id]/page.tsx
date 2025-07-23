import { notFound, redirect } from 'next/navigation';

import { ProviderDetail } from '@/features/admin/components/providers';
import type { AdminProviderDetailPageProps } from '@/features/admin/types/types';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminProviderDetailPage({ params }: AdminProviderDetailPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Ensure ID exists
  if (!params.id) {
    notFound();
  }

  return <ProviderDetail providerId={params.id} />;
}
