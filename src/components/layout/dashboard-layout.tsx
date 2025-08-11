'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

import { useSession } from 'next-auth/react';

import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminOrganization } from '@/features/organizations/hooks/use-admin-organizations';
import { useCurrentUserOrganizations } from '@/features/organizations/hooks/use-current-user-organizations';
import { useOrganization } from '@/features/organizations/hooks/use-organization';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useProvider } from '@/features/providers/hooks/use-provider';
import { isMobileForUI } from '@/lib/utils/responsive';
import { type RouterOutputs } from '@/utils/api';

// Infer types from tRPC router outputs
type UserOrganizations = RouterOutputs['organizations']['getByUserId'];
type Organization = UserOrganizations[number];
type Provider = RouterOutputs['providers']['getByUserId'];

// Session user type
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

// Breadcrumb item type
interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Enhanced truncation function with dynamic calculation and truncation tracking
function truncateForMobile(
  text: string,
  screenWidth: number = 375
): {
  truncated: string;
  isTruncated: boolean;
  original: string;
} {
  // Dynamic max length based on screen width
  const baseLength = Math.floor(screenWidth / 25); // ~15 chars for 375px
  const maxLength = Math.max(8, Math.min(baseLength, 20));

  if (text.length <= maxLength) {
    return { truncated: text, isTruncated: false, original: text };
  }

  // Smart truncation for names
  if (text.includes('Dr.') || text.includes('Prof.')) {
    const parts = text.split(' ');
    if (parts.length >= 2) {
      const title = parts[0];
      const lastName = parts[parts.length - 1];
      if (`${title} ${lastName}`.length <= maxLength) {
        return {
          truncated: `${title} ${lastName}`,
          isTruncated: true,
          original: text,
        };
      }
    }
  }

  // Smart truncation for organization names (preserve key words)
  if (
    text.includes('Hospital') ||
    text.includes('Clinic') ||
    text.includes('Medical') ||
    text.includes('Health')
  ) {
    const parts = text.split(' ');
    if (parts.length >= 2) {
      // Try to preserve the first word and important identifier
      const firstWord = parts[0];
      const importantWord = parts.find((word) =>
        ['Hospital', 'Clinic', 'Medical', 'Health', 'Center', 'Institute'].includes(word)
      );
      if (importantWord && `${firstWord} ${importantWord}`.length <= maxLength) {
        return {
          truncated: `${firstWord} ${importantWord}`,
          isTruncated: true,
          original: text,
        };
      }
    }
  }

  return {
    truncated: `${text.substring(0, maxLength - 3)}...`,
    isTruncated: true,
    original: text,
  };
}

// Enhanced function to determine if breadcrumb should be collapsed based on content
function shouldCollapseBreadcrumb(
  items: BreadcrumbItem[],
  isMobile: boolean,
  isTablet: boolean
): {
  shouldCollapse: boolean;
  collapseStrategy: 'none' | 'middle' | 'aggressive';
} {
  if (!isMobile && !isTablet) return { shouldCollapse: false, collapseStrategy: 'none' };

  // Calculate estimated content width
  const estimatedWidth = items.reduce((total, item) => {
    return total + item.label.length * 8 + 20; // ~8px per char + spacing
  }, 0);

  const availableWidth = isMobile ? 300 : 600; // Conservative estimates

  if (estimatedWidth > availableWidth) {
    return {
      shouldCollapse: true,
      collapseStrategy: items.length > 4 ? 'aggressive' : 'middle',
    };
  }

  return { shouldCollapse: false, collapseStrategy: 'none' };
}

// Get device-specific breadcrumb styling classes
function getBreadcrumbClasses(deviceType: 'mobile' | 'tablet' | 'desktop') {
  switch (deviceType) {
    case 'mobile':
      return {
        list: 'gap-0.5 text-xs leading-tight',
        item: 'text-xs max-w-[120px] truncate',
        separator: 'mx-1',
      };
    case 'tablet':
      return {
        list: 'gap-1 text-sm leading-normal',
        item: 'text-sm max-w-[200px] truncate',
        separator: 'mx-1.5',
      };
    default:
      return {
        list: 'gap-1.5 text-sm leading-normal',
        item: 'text-sm',
        separator: 'mx-2',
      };
  }
}

// Dynamic breadcrumb component
function DynamicBreadcrumb() {
  const pathname = usePathname();
  const isMobile = isMobileForUI();

  // Get screen width for dynamic truncation and device detection
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const deviceType: 'mobile' | 'tablet' | 'desktop' = isMobile
    ? 'mobile'
    : isTablet
      ? 'tablet'
      : 'desktop';
  const classes = getBreadcrumbClasses(deviceType);

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

  // Use admin hook for admin routes, regular hook for user routes
  const isAdminRoute = pathname.startsWith('/admin');

  const { data: adminOrganization, isLoading: isAdminOrganizationLoading } = useAdminOrganization(
    isAdminRoute ? organizationId : undefined
  );
  const { data: userOrganization, isLoading: isUserOrganizationLoading } = useOrganization(
    !isAdminRoute ? organizationId : undefined
  );

  const organization = isAdminRoute ? adminOrganization : userOrganization;
  const isOrganizationLoading = isAdminRoute
    ? isAdminOrganizationLoading
    : isUserOrganizationLoading;

  // Create breadcrumb items
  const breadcrumbItems = [];

  // Always start with Dashboard
  breadcrumbItems.push({
    label: 'Dashboard',
    href: '/dashboard',
    isLast: pathSegments.length === 0,
    isTruncated: false,
    originalLabel: 'Dashboard',
  });

  // Add path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;

    let label;
    let isTruncated = false;
    let originalLabel = '';

    // Special handling for provider UUID (admin routes)
    if (isAdminProviderPage && index === 2) {
      if (provider) {
        if (isMobile) {
          const truncationResult = truncateForMobile(provider.name, screenWidth);
          label = truncationResult.truncated;
          isTruncated = truncationResult.isTruncated;
          originalLabel = truncationResult.original;
        } else {
          label = provider.name;
          originalLabel = provider.name;
        }
      } else if (isProviderLoading) {
        label = 'Loading...';
        originalLabel = 'Loading...';
      } else {
        label = 'Provider';
        originalLabel = 'Provider';
      }
    }
    // Special handling for provider UUID (regular routes)
    else if (isRegularProviderPage && index === 1) {
      if (provider) {
        if (isMobile) {
          const truncationResult = truncateForMobile(provider.name, screenWidth);
          label = truncationResult.truncated;
          isTruncated = truncationResult.isTruncated;
          originalLabel = truncationResult.original;
        } else {
          label = provider.name;
          originalLabel = provider.name;
        }
      } else if (isProviderLoading) {
        label = 'Loading...';
        originalLabel = 'Loading...';
      } else {
        label = 'Provider';
        originalLabel = 'Provider';
      }
    }
    // Special handling for organization UUID (admin routes)
    else if (isAdminOrganizationPage && index === 2) {
      if (organization) {
        if (isMobile) {
          const truncationResult = truncateForMobile(organization.name, screenWidth);
          label = truncationResult.truncated;
          isTruncated = truncationResult.isTruncated;
          originalLabel = truncationResult.original;
        } else {
          label = organization.name;
          originalLabel = organization.name;
        }
      } else if (isOrganizationLoading) {
        label = 'Loading...';
        originalLabel = 'Loading...';
      } else {
        label = 'Organization';
        originalLabel = 'Organization';
      }
    }
    // Special handling for organization UUID (regular routes)
    else if (isRegularOrganizationPage && index === 1) {
      if (organization) {
        if (isMobile) {
          const truncationResult = truncateForMobile(organization.name, screenWidth);
          label = truncationResult.truncated;
          isTruncated = truncationResult.isTruncated;
          originalLabel = truncationResult.original;
        } else {
          label = organization.name;
          originalLabel = organization.name;
        }
      } else if (isOrganizationLoading) {
        label = 'Loading...';
        originalLabel = 'Loading...';
      } else {
        label = 'Organization';
        originalLabel = 'Organization';
      }
    } else {
      // Convert segment to readable label
      const fullLabel = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (isMobile) {
        const truncationResult = truncateForMobile(fullLabel, screenWidth);
        label = truncationResult.truncated;
        isTruncated = truncationResult.isTruncated;
        originalLabel = truncationResult.original;
      } else {
        label = fullLabel;
        originalLabel = fullLabel;
      }
    }

    breadcrumbItems.push({
      label,
      href: currentPath,
      isLast,
      isTruncated,
      originalLabel,
    });
  });

  // Implement enhanced breadcrumb collapsing
  const collapseResult = shouldCollapseBreadcrumb(breadcrumbItems, isMobile, isTablet);
  let displayItems = breadcrumbItems;

  if (collapseResult.shouldCollapse) {
    if (collapseResult.collapseStrategy === 'aggressive') {
      // Show: Dashboard > ... > Current Page
      displayItems = [
        breadcrumbItems[0], // Dashboard
        breadcrumbItems[breadcrumbItems.length - 1], // Current page
      ];
    } else if (collapseResult.collapseStrategy === 'middle') {
      // Show: Dashboard > ... > Second-to-last > Current Page
      if (breadcrumbItems.length > 3) {
        displayItems = [
          breadcrumbItems[0], // Dashboard
          breadcrumbItems[breadcrumbItems.length - 2], // Second-to-last
          breadcrumbItems[breadcrumbItems.length - 1], // Current page
        ];
      } else {
        // Fallback to aggressive strategy
        displayItems = [
          breadcrumbItems[0], // Dashboard
          breadcrumbItems[breadcrumbItems.length - 1], // Current page
        ];
      }
    }
  }

  return (
    <TooltipProvider>
      <Breadcrumb>
        <BreadcrumbList className={classes.list}>
          {displayItems.map((item, index) => (
            <React.Fragment key={item.href}>
              {index > 0 && <BreadcrumbSeparator />}
              {/* Show ellipsis for collapsed breadcrumbs */}
              {collapseResult.shouldCollapse &&
                index === 1 &&
                breadcrumbItems.length > displayItems.length && (
                  <React.Fragment>
                    <BreadcrumbItem>
                      <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </React.Fragment>
                )}
              <BreadcrumbItem>
                {item.isTruncated ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {item.isLast ? (
                        <BreadcrumbPage
                          className={classes.item}
                          aria-label={`Current page: ${item.originalLabel}`}
                        >
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={item.href}
                          className={classes.item}
                          aria-label={`Navigate to: ${item.originalLabel}`}
                        >
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.originalLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    {item.isLast ? (
                      <BreadcrumbPage className={classes.item}>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href} className={classes.item}>
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </TooltipProvider>
  );
}

// We'll create this as a function to make it dynamic
const createNavData = (
  providers: Provider[] = [],
  organizations: Organization[] = [],
  user?: SessionUser
) => ({
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
    // Only show Admin section for users with admin privileges
    ...(user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
      ? [
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
        ]
      : []),
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
                title: 'Manage Calendar',
                url: `/providers/${providers[0].id}/manage-calendar`,
              },
            ],
          },
        ]
      : []),
    ...(organizations.length > 0
      ? organizations
          .sort((a: Organization, b: Organization) => a.name.localeCompare(b.name))
          .map((organization: Organization) => ({
            title: organization.name,
            url: `/organizations/${organization.id}`,
            items: [
              {
                title: 'Profile',
                url: `/organizations/${organization.id}`,
              },
              {
                title: 'View Calendar',
                url: `/organizations/${organization.id}/view-calendar`,
              },
              {
                title: 'Manage Calendar',
                url: `/organizations/${organization.id}/manage-calendar`,
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

  const navData = createNavData(providers, organizations, session?.user);

  return (
    <SidebarProvider collapsible="offcanvas">
      <AppSidebar data={navData} collapsible="offcanvas" />
      <SidebarInset className="flex h-screen flex-col" data-sidebar-layout>
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
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4 pb-8">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
