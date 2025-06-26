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

// Dynamic breadcrumb component
function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Split pathname and filter out empty strings
  const pathSegments = pathname.split('/').filter(Boolean);

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

    // Convert segment to readable label
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

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
const createNavData = (providerId?: string) => ({
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
          title: 'Admin',
          url: '/admin',
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
    {
      title: 'Providers',
      url: '/providers',
      items: [
        {
          title: 'Providers',
          url: '/providers',
        },
      ],
    },
    {
      title: 'Calendar',
      url: '/calendar',
      items: [
        {
          title: 'Calendar',
          url: '/calendar',
        },
      ],
    },
    {
      title: 'Organizations',
      url: '/organizations',
      items: [
        {
          title: 'Organizations',
          url: '/organizations',
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

  const navData = createNavData();

  return (
    <SidebarProvider collapsible="offcanvas">
      <AppSidebar data={navData} collapsible="offcanvas" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
