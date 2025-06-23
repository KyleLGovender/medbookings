import { redirect } from 'next/navigation';

import { AdminDashboard } from '@/features/admin/components/dashboard';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  return <AdminDashboard />;
}
