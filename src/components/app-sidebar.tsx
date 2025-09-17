import * as React from 'react';

import { Minus, Plus, Settings } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NavigationLink } from '@/components/ui/navigation-link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => {
              // Settings should be a direct clickable button without collapsible behavior
              if (!item.items?.length) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavigationLink href={item.url} className="flex items-center gap-2">
                        {item.icon}
                        {item.title}
                      </NavigationLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // Other items should be collapsible/expandable but main heading should not be clickable
              return (
                <Collapsible key={item.title} defaultOpen={true} className="group/collapsible">
                  <SidebarMenuItem>
                    <div className="flex w-full items-center">
                      {/* Non-clickable main item label */}
                      <div className="flex flex-1 items-center gap-2 px-2 py-1.5 text-sm font-medium">
                        {item.icon}
                        {item.title}
                      </div>

                      {/* Expand/collapse trigger */}
                      <CollapsibleTrigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-accent hover:text-accent-foreground">
                          <Plus className="h-4 w-4 group-data-[state=open]/collapsible:hidden" />
                          <Minus className="h-4 w-4 group-data-[state=closed]/collapsible:hidden" />
                        </button>
                      </CollapsibleTrigger>
                    </div>

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
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavigationLink href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </NavigationLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
