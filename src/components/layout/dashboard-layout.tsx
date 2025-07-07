'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

import { useSession } from 'next-auth/react';

import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAdminOrganization } from '@/features/organizations/hooks/use-admin-organizations';
import { useCurrentUserOrganizations } from '@/features/organizations/hooks/use-current-user-organizations';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useProvider } from '@/features/providers/hooks/use-provider';

// Dynamic breadcrumb component
function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Split pathname and filter out empty strings
  const pathSegments = pathname.split('/').filter(Boolean);

  // Check if this is a provider detail page (admin or regular)
  const isAdminProviderPage =
    pathSegments.length >= 3 &&
    pathSegments[0] === 'admin' &&
    pathSegments[1] === 'providers' &&
    pathSegments[2].length > 10; // Likely a UUID

  const isRegularProviderPage =
    pathSegments.length >= 2 && pathSegments[0] === 'providers' && pathSegments[1].length > 10; // Likely a UUID

  // Check if this is an organization detail page (admin or regular)
  const isAdminOrganizationPage =
    pathSegments.length >= 3 &&
    pathSegments[0] === 'admin' &&
    pathSegments[1] === 'organizations' &&
    pathSegments[2].length > 10; // Likely a UUID

  const isRegularOrganizationPage =
    pathSegments.length >= 2 && pathSegments[0] === 'organizations' && pathSegments[1].length > 10; // Likely a UUID

  const providerId = isAdminProviderPage
    ? pathSegments[2]
    : isRegularProviderPage
      ? pathSegments[1]
      : undefined;
  const organizationId = isAdminOrganizationPage
    ? pathSegments[2]
    : isRegularOrganizationPage
      ? pathSegments[1]
      : undefined;

  const { data: provider, isLoading: isProviderLoading } = useProvider(providerId);
  const { data: organization, isLoading: isOrganizationLoading } =
    useAdminOrganization(organizationId);

  // Create breadcrumb items
  const breadcrumbItems = [];

  // Always start with Dashboard
  breadcrumbItems.push({
    label: 'Dashboard',
    href: '/dashboard',
    isLast: pathSegments.length === 0,
  });

  // Add path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;

    let label;

    // Special handling for provider UUID (admin routes)
    if (isAdminProviderPage && index === 2) {
      if (provider) {
        label = provider.name;
      } else if (isProviderLoading) {
        label = 'Loading...';
      } else {
        label = 'Provider';
      }
    }
    // Special handling for provider UUID (regular routes)
    else if (isRegularProviderPage && index === 1) {
      if (provider) {
        label = provider.name;
      } else if (isProviderLoading) {
        label = 'Loading...';
      } else {
        label = 'Provider';
      }
    }
    // Special handling for organization UUID (admin routes)
    else if (isAdminOrganizationPage && index === 2) {
      if (organization) {
        label = organization.name;
      } else if (isOrganizationLoading) {
        label = 'Loading...';
      } else {
        label = 'Organization';
      }
    }
    // Special handling for organization UUID (regular routes)
    else if (isRegularOrganizationPage && index === 1) {
      if (organization) {
        label = organization.name;
      } else if (isOrganizationLoading) {
        label = 'Loading...';
      } else {
        label = 'Organization';
      }
    } else {
      // Convert segment to readable label
      label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    breadcrumbItems.push({
      label,
      href: currentPath,
      isLast,
    });
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// We'll create this as a function to make it dynamic
const createNavData = (providers: any[] = [], organizations: any[] = []) => ({
  title: 'MedBookings',
  url: '/',
  navMain: [
    {
      title: 'Public Site',
      url: '/',
      items: [
        {
          title: 'Home',
          url: '/',
        },
        {
          title: 'Search Providers',
          url: '/search',
        },
        {
          title: 'Join Platform',
          url: '/join-medbookings',
        },
      ],
    },
    {
      title: 'Admin',
      url: '/admin',
      items: [
        {
          title: 'Providers',
          url: '/admin/providers',
        },
        {
          title: 'Organizations',
          url: '/admin/organizations',
        },
      ],
    },
    {
      title: 'Profile',
      url: '/profile',
      items: [
        {
          title: 'Profile',
          url: '/profile',
        },
      ],
    },
    ...(providers.length > 0
      ? [
          {
            title: 'My Provider Profile',
            url: `/providers/${providers[0].id}`,
            items: [
              {
                title: 'Profile',
                url: `/providers/${providers[0].id}`,
              },
              {
                title: 'Calendar',
                url: `/providers/${providers[0].id}/calendar`,
              },
              {
                title: 'Availability',
                url: `/providers/${providers[0].id}/availability`,
              },
            ],
          },
        ]
      : []),
    ...(organizations.length > 0
      ? organizations
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
          .map((organization: any) => ({
            title: organization.name,
            url: `/organizations/${organization.id}`,
            items: [
              {
                title: 'Profile',
                url: `/organizations/${organization.id}`,
              },
              {
                title: 'Calendar',
                url: `/organizations/${organization.id}/calendar`,
              },
              {
                title: 'Availability',
                url: `/organizations/${organization.id}/availability`,
              },
            ],
          }))
      : []),
    {
      title: 'Calendar',
      url: '/calendar',
      items: [
        {
          title: 'Calendar Overview',
          url: '/calendar',
        },
        {
          title: 'Availability Management',
          url: '/calendar/availability',
        },
      ],
    },
    {
      title: 'Settings',
      url: '/settings',
      items: [
        {
          title: 'Settings',
          url: '/settings',
        },
      ],
    },
  ],
});

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const { data: userProvider } = useCurrentUserProvider();
  const { data: userOrganizations = [] } = useCurrentUserOrganizations();

  // Convert single provider to array format for navigation
  const providers = userProvider ? [userProvider] : [];
  const organizations = userOrganizations || [];

  const navData = createNavData(providers, organizations);

  return (
    <SidebarProvider collapsible="offcanvas">
      <AppSidebar data={navData} collapsible="offcanvas" />
      <SidebarInset className="flex h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <DynamicBreadcrumb />

          {/* Navigation back to public site */}
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Site
            </a>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-4 p-4">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
