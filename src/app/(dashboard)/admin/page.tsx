/**
 * Protected admin dashboard page
 * 
 * Main admin interface providing comprehensive platform oversight
 * and management capabilities for system administrators.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/lib/session-helper';
import { isSystemAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';
import { OversightDashboard } from '@/features/admin/components/oversight-dashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard | MedBookings',
  description: 'Administrative oversight and management dashboard'
};

async function getAdminDashboardData() {
  // Get platform statistics
  const [
    totalUsers,
    totalProviders,
    totalOrganizations,
    pendingProvidersCount,
    pendingOrganizationsCount,
    activeBookings
  ] = await Promise.all([
    prisma.user.count(),
    prisma.provider.count({ where: { status: 'ACTIVE' } }),
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.provider.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.organization.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } })
  ]);

  // Get pending providers with requirements status
  const pendingProvidersData = await prisma.provider.findMany({
    where: { status: 'PENDING_APPROVAL' },
    include: {
      user: true,
      typeAssignments: {
        include: { providerType: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Get pending organizations
  const pendingOrganizationsData = await prisma.organization.findMany({
    where: { status: 'PENDING_APPROVAL' },
    include: {
      locations: true,
      memberships: {
        where: { role: 'OWNER' },
        include: { user: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Transform data for component
  const pendingProviders = pendingProvidersData.map(provider => {
    // Simplified - no requirements for now since schema doesn't have them yet
    const requirementsStatus: 'complete' | 'pending' | 'rejected' = 'pending';
    const providerTypeName = provider.typeAssignments[0]?.providerType?.name || 'Unknown';

    return {
      id: provider.id,
      email: provider.user.email || 'No email',
      name: provider.name,
      providerType: providerTypeName,
      submittedAt: provider.createdAt,
      requirementsStatus,
      totalRequirements: 0,
      approvedRequirements: 0
    };
  });

  const pendingOrganizations = pendingOrganizationsData.map(org => {
    const owner = org.memberships.find(m => m.role === 'OWNER')?.user;
    
    return {
      id: org.id,
      name: org.name,
      type: 'Healthcare Facility', // Default type since not in schema
      ownerEmail: owner?.email || 'No email',
      submittedAt: org.createdAt,
      locationsCount: org.locations.length
    };
  });

  return {
    stats: {
      totalUsers,
      totalProviders,
      totalOrganizations,
      pendingProviders: pendingProvidersCount,
      pendingOrganizations: pendingOrganizationsCount,
      activeBookings
    },
    pendingProviders,
    pendingOrganizations
  };
}

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();
  
  // Check authentication and admin permissions
  if (!currentUser) {
    redirect('/login');
  }
  
  if (!isSystemAdmin(currentUser.permissions)) {
    redirect('/unauthorized');
  }

  // Load dashboard data
  const dashboardData = await getAdminDashboardData();

  return (
    <div className='container mx-auto py-6'>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
          <p className='text-muted-foreground'>
            Platform oversight and management console
          </p>
        </div>

        <OversightDashboard {...dashboardData} />
      </div>
    </div>
  );
}
