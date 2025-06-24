import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react';

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

// This would be your actual navigation data
const data = {
  title: 'MedBookings',
  url: '#',
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <Home className="h-4 w-4" />,
      isActive: true,
    },
    {
      title: 'Admin',
      url: '/dashboard/admin',
      icon: <Search className="h-4 w-4" />,
    },
    {
      title: 'Profile',
      url: '/dashboard/profile',
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      title: 'Providers',
      url: '/dashboard/providers',
      icon: <Inbox className="h-4 w-4" />,
    },
    {
      title: 'Calendar',
      url: '/dashboard/calendar',
      icon: <Inbox className="h-4 w-4" />,
    },
    {
      title: 'Organizations',
      url: '/dashboard/organizations',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ],
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider collapsible="offcanvas">
      <AppSidebar data={data} collapsible="offcanvas" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
