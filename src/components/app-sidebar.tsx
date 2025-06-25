import * as React from 'react';

import { Minus, Plus } from 'lucide-react';

import { SearchForm } from '@/components/search-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { DashboardUserButton } from '@/components/user-button-with-name';

// Define the type structure for `data`
export interface NavItem {
  title: string;
  url: string;
  icon?: JSX.Element;
  isActive?: boolean;
  items?: NavItem[];
}

export interface DataStructure {
  title: string;
  url: string;
  icon?: JSX.Element;
  navMain: NavItem[];
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data: DataStructure;
}

export function AppSidebar({ data, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex gap-2">
                <DashboardUserButton />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item, index) => (
              <Collapsible key={item.title} defaultOpen={index === 1} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.icon}
                      {item.title}{' '}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild isActive={item.isActive}>
                              <a href={item.url}>{item.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
