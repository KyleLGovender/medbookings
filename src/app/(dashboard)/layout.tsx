import {
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  Link2,
  Quote,
  Tag,
  Users,
} from 'lucide-react';

import { AppSidebar, DataStructure } from '@/components/app-sidebar';
import Section from '@/components/section';
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

const data: DataStructure = {
  title: 'Dashboard',
  url: '/dashboard',
  navMain: [
    {
      title: 'Dashboard',
      url: '#',
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      isActive: true,
    },
    {
      title: 'Blog Posts',
      url: '(dashboard)/dashboard/blog',
      icon: <FileText className="mr-2 h-4 w-4" />,
      items: [
        {
          title: 'Posts',
          url: '(dashboard)/dashboard/blog',
          isActive: true,
        },
        {
          title: 'New',
          url: '(dashboard)/dashboard/blog/new',
        },
      ],
    },
    {
      title: 'Events',
      url: '#',
      icon: <Calendar className="mr-2 h-4 w-4" />,
      isActive: true,
    },
    {
      title: 'Quotes',
      url: '#',
      icon: <Quote className="mr-2 h-4 w-4" />,
      isActive: true,
    },
    {
      title: 'People',
      url: '#',
      icon: <Users className="mr-2 h-4 w-4" />,
      isActive: true,
    },
    {
      title: 'References',
      url: '#',
      icon: <BookOpen className="mr-2 h-4 w-4" />,
      isActive: true,
    },
    {
      title: 'Related Content',
      url: '#',
      icon: <Link2 className="mr-2 h-4 w-4" />,
      isActive: true,
    },
    {
      title: 'Tags',
      url: '#',
      icon: <Tag className="mr-2 h-4 w-4" />,
      isActive: true,
    },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Section className="bg-background py-16">
      <SidebarProvider>
        <AppSidebar className="top-16" data={data} />
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
    </Section>
  );
}
