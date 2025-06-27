'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationButton } from '@/components/ui/navigation-button';
import { NavigationLink } from '@/components/ui/navigation-link';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminOrganizationCounts } from '@/features/organizations/hooks/use-admin-organizations';
import { useAdminProviderCounts } from '@/features/providers/hooks/use-admin-providers';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, description, icon, href, isLoading }: StatCardProps) {
  const content = (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <Skeleton className="h-8 w-16" /> : value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return href ? (
    <NavigationLink href={href} className="block">
      {content}
    </NavigationLink>
  ) : (
    content
  );
}

export function AdminDashboard() {
  const { data: providerCounts, isLoading: isLoadingProviders } = useAdminProviderCounts();
  const { data: organizationCounts, isLoading: isLoadingOrganizations } =
    useAdminOrganizationCounts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage providers and organizations awaiting approval
        </p>
      </div>

      {/* Provider Statistics */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Provider Management
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Providers"
            value={providerCounts?.PENDING || 0}
            description="Awaiting approval"
            href="/admin/providers?status=PENDING"
            isLoading={isLoadingProviders}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Approved Providers"
            value={providerCounts?.APPROVED || 0}
            description="Active providers"
            href="/admin/providers?status=APPROVED"
            isLoading={isLoadingProviders}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Rejected Providers"
            value={providerCounts?.REJECTED || 0}
            description="Rejected applications"
            href="/admin/providers?status=REJECTED"
            isLoading={isLoadingProviders}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Total Providers"
            value={providerCounts?.total || 0}
            description="All providers"
            href="/admin/providers"
            isLoading={isLoadingProviders}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Organization Statistics */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Organization Management
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Organizations"
            value={organizationCounts?.PENDING || 0}
            description="Awaiting approval"
            href="/admin/organizations?status=PENDING"
            isLoading={isLoadingOrganizations}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Approved Organizations"
            value={organizationCounts?.APPROVED || 0}
            description="Active organizations"
            href="/admin/organizations?status=APPROVED"
            isLoading={isLoadingOrganizations}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Rejected Organizations"
            value={organizationCounts?.REJECTED || 0}
            description="Rejected applications"
            href="/admin/organizations?status=REJECTED"
            isLoading={isLoadingOrganizations}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Total Organizations"
            value={organizationCounts?.total || 0}
            description="All organizations"
            href="/admin/organizations"
            isLoading={isLoadingOrganizations}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Provider Management</CardTitle>
              <CardDescription>Review and approve provider applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <NavigationButton
                href="/admin/providers?status=PENDING"
                className="w-full bg-blue-600 hover:bg-blue-700"
                loadingText="Loading providers..."
              >
                Review Pending Providers
              </NavigationButton>
              <NavigationButton
                href="/admin/providers"
                variant="outline"
                className="w-full"
                loadingText="Loading providers..."
              >
                View All Providers
              </NavigationButton>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>Review and approve organization applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <NavigationButton
                href="/admin/organizations?status=PENDING"
                className="w-full bg-green-600 hover:bg-green-700"
                loadingText="Loading organizations..."
              >
                Review Pending Organizations
              </NavigationButton>
              <NavigationButton
                href="/admin/organizations"
                variant="outline"
                className="w-full"
                loadingText="Loading organizations..."
              >
                View All Organizations
              </NavigationButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
