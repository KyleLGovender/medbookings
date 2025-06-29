import * as React from 'react';

import { Minus, Plus } from 'lucide-react';

import { SearchForm } from '@/components/search-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NavigationLink } from '@/components/ui/navigation-link';
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
                  <div className="flex w-full items-center">
                    {/* Clickable main item */}
                    <SidebarMenuButton asChild className="flex-1">
                      <NavigationLink href={item.url} className="flex items-center gap-2">
                        {item.icon}
                        {item.title}
                      </NavigationLink>
                    </SidebarMenuButton>

                    {/* Separate expand/collapse trigger */}
                    {item.items?.length ? (
                      <CollapsibleTrigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-accent hover:text-accent-foreground">
                          <Plus className="h-4 w-4 group-data-[state=open]/collapsible:hidden" />
                          <Minus className="h-4 w-4 group-data-[state=closed]/collapsible:hidden" />
                        </button>
                      </CollapsibleTrigger>
                    ) : null}
                  </div>

                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                              <NavigationLink href={subItem.url}>{subItem.title}</NavigationLink>
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
