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

const data = {
  title: 'MedBookings',
  url: '/',
  navMain: [
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
      url: '/dashboard/providers',
      items: [
        {
          title: 'Accessibility',
          url: '#',
        },
        {
          title: 'Fast Refresh',
          url: '#',
        },
        {
          title: 'Next.js Compiler',
          url: '#',
        },
        {
          title: 'Supported Browsers',
          url: '#',
        },
        {
          title: 'Turbopack',
          url: '#',
        },
      ],
    },
    {
      title: 'Calendar',
      url: '/dashboard/calendar',
      items: [
        {
          title: 'Contribution Guide',
          url: '#',
        },
      ],
    },
    {
      title: 'Organizations',
      url: '/dashboard/organizations',
      items: [
        {
          title: 'Contribution Guide',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      items: [
        {
          title: 'Contribution Guide',
          url: '#',
        },
      ],
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
