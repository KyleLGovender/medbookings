'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { OversightDashboard } from '@/features/admin/components/oversight-dashboard';
import { type RouterOutputs, api } from '@/utils/api';

// Extract types from tRPC procedures for zero type drift
type DashboardStats = RouterOutputs['admin']['getDashboardStats'];
type PendingProviders = RouterOutputs['admin']['getPendingProviders'];
type PendingOrganizations = RouterOutputs['admin']['getPendingOrganizations'];

/**
 * AdminDashboardClient - Client component for admin dashboard
 *
 * Fetches dashboard data using tRPC hooks and provides the data
 * to the OversightDashboard component. This replaces server-side
 * data fetching with client-side tRPC calls for better separation
 * of concerns and type safety.
 */
export function AdminDashboardClient() {
  // Use tRPC hooks for data fetching
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = api.admin.getDashboardStats.useQuery();

  const {
    data: pendingProviders,
    isLoading: isProvidersLoading,
    error: providersError,
  } = api.admin.getPendingProviders.useQuery();

  const {
    data: pendingOrganizations,
    isLoading: isOrganizationsLoading,
    error: organizationsError,
  } = api.admin.getPendingOrganizations.useQuery();

  // Handle loading states
  if (isStatsLoading || isProvidersLoading || isOrganizationsLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Loading platform oversight data...</p>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-muted-foreground">Loading admin dashboard data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle error states
  if (statsError || providersError || organizationsError) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform oversight and management console</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">
              Error loading dashboard data:{' '}
              {statsError?.message || providersError?.message || organizationsError?.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transform data to match expected format for OversightDashboard
  const dashboardData = {
    stats: {
      totalUsers: stats?.totalUsers || 0,
      totalProviders: stats?.totalProviders || 0,
      totalOrganizations: stats?.totalOrganizations || 0,
      pendingProviders: stats?.pendingProviders || 0,
      pendingOrganizations: stats?.pendingOrganizations || 0,
      activeBookings: stats?.activeBookings || 0,
    },
    pendingProviders: pendingProviders || [],
    pendingOrganizations: pendingOrganizations || [],
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform oversight and management console</p>
        </div>

        <OversightDashboard {...dashboardData} />
      </div>
    </div>
  );
}
