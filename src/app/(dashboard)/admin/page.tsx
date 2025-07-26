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
    pendingProviders,
    pendingOrganizations,
    activeBookings
  ] = await Promise.all([
    prisma.user.count(),
    prisma.serviceProvider.count({ where: { status: 'ACTIVE' } }),
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.serviceProvider.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.organization.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } })
  ]);

  // Get pending providers with requirements status
  const pendingProvidersData = await prisma.serviceProvider.findMany({
    where: { status: 'PENDING_APPROVAL' },
    include: {
      user: true,
      providerType: true,
      requirementSubmissions: {
        include: { requirementType: true }
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
    const totalRequirements = provider.requirementSubmissions.length;
    const approvedRequirements = provider.requirementSubmissions.filter(
      req => req.status === 'APPROVED'
    ).length;
    const rejectedRequirements = provider.requirementSubmissions.filter(
      req => req.status === 'REJECTED'
    ).length;

    let requirementsStatus: 'complete' | 'pending' | 'rejected' = 'pending';
    if (rejectedRequirements > 0) {
      requirementsStatus = 'rejected';
    } else if (totalRequirements > 0 && approvedRequirements === totalRequirements) {
      requirementsStatus = 'complete';
    }

    return {
      id: provider.id,
      email: provider.user.email,
      name: `${provider.user.firstName} ${provider.user.lastName}`,
      providerType: provider.providerType?.name || 'Unknown',
      submittedAt: provider.createdAt,
      requirementsStatus,
      totalRequirements,
      approvedRequirements
    };
  });

  const pendingOrganizations = pendingOrganizationsData.map(org => {
    const owner = org.memberships.find(m => m.role === 'OWNER')?.user;
    
    return {
      id: org.id,
      name: org.name,
      type: org.type || 'Healthcare Facility',
      ownerEmail: owner?.email || 'Unknown',
      submittedAt: org.createdAt,
      locationsCount: org.locations.length
    };
  });

  return {
    stats: {
      totalUsers,
      totalProviders,
      totalOrganizations,
      pendingProviders,
      pendingOrganizations,
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
