/**
 * Protected admin dashboard page
 *
 * Main admin interface providing comprehensive platform oversight
 * and management capabilities for system administrators.
 */
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminDashboardClient } from '@/features/admin/components/admin-dashboard-client';
import { getCurrentUser } from '@/features/auth/lib/session-helper';
import { isSystemAdmin } from '@/lib/auth/permissions';

export const metadata: Metadata = {
  title: 'Admin Dashboard | MedBookings',
  description: 'Administrative oversight and management dashboard',
};

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();

  // Check authentication and admin permissions
  if (!currentUser) {
    redirect('/login');
  }

  if (!isSystemAdmin(currentUser.permissions)) {
    redirect('/unauthorized');
  }

  return <AdminDashboardClient />;
}
