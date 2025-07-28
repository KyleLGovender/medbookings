/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { OrganizationRole, Permission, SystemRole } from '@/types/permissions';

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

/**
 * Permission-aware navigation components
 *
 * Navigation components that adapt based on user permissions and roles,
 * showing only accessible routes and features.
 */

interface NavigationItem {
  href: string;
  label: string;
  icon?: ReactNode;
  description?: string;

  // Permission requirements
  permission?: Permission;
  systemRole?: SystemRole | SystemRole[];
  organizationRole?: OrganizationRole | OrganizationRole[];
  requiresProvider?: boolean;
  organizationId?: string;

  // Custom access check
  customCheck?: (permissions: any) => boolean;

  // Nested items
  children?: NavigationItem[];

  // Visual styling
  badge?: string;
  highlight?: boolean;
  external?: boolean;
}

interface PermissionNavigationProps {
  items: NavigationItem[];
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'sidebar';
  organizationId?: string;
}

/**
 * Main navigation component with permission-based filtering
 */
export function PermissionNavigation({
  items,
  className = '',
  variant = 'horizontal',
  organizationId,
}: PermissionNavigationProps) {
  const pathname = usePathname();
  const {
    hasPermission,
    isSystemAdmin,
    isProvider,
    getOrganizationRole,
    permissions: userPermissions,
  } = usePermissions();

  const checkAccess = (item: NavigationItem): boolean => {
    // Check custom access function first
    if (item.customCheck) {
      return item.customCheck(userPermissions);
    }

    // Check permission requirement
    if (item.permission) {
      const context = item.organizationId ? { organizationId: item.organizationId } : undefined;
      if (!hasPermission(item.permission, context)) return false;
    }

    // Check system role requirement
    if (item.systemRole) {
      const roles = Array.isArray(item.systemRole) ? item.systemRole : [item.systemRole];
      const userRole = userPermissions?.systemRole;
      if (!userRole || !roles.includes(userRole)) return false;
    }

    // Check organization role requirement
    if (item.organizationRole && (item.organizationId || organizationId)) {
      const orgId = item.organizationId || organizationId;
      if (!orgId) return false;

      const roles = Array.isArray(item.organizationRole)
        ? item.organizationRole
        : [item.organizationRole];
      const userOrgRole = getOrganizationRole(orgId);
      if (!userOrgRole || !roles.includes(userOrgRole as OrganizationRole)) return false;
    }

    // Check provider requirement
    if (item.requiresProvider && !isProvider) return false;

    return true;
  };

  const filterAccessibleItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(checkAccess).map((item) => ({
      ...item,
      children: item.children ? filterAccessibleItems(item.children) : undefined,
    }));
  };

  const accessibleItems = filterAccessibleItems(items);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (variant === 'sidebar') {
    return (
      <nav className={cn('space-y-2', className)}>
        {accessibleItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} isActive={isActive(item.href)} />
        ))}
      </nav>
    );
  }

  if (variant === 'vertical') {
    return (
      <nav className={cn('space-y-1', className)}>
        {accessibleItems.map((item) => (
          <VerticalNavItem key={item.href} item={item} isActive={isActive(item.href)} />
        ))}
      </nav>
    );
  }

  // Horizontal navigation (default)
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        {accessibleItems.map((item) => (
          <NavigationMenuItem key={item.href}>
            {item.children ? (
              <>
                <NavigationMenuTrigger
                  className={cn(isActive(item.href) && 'bg-accent text-accent-foreground')}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px]">
                    {item.children.map((child) => (
                      <NavigationMenuLink key={child.href} asChild>
                        <Link
                          href={child.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center">
                            {child.icon && <span className="mr-2">{child.icon}</span>}
                            <div className="text-sm font-medium leading-none">{child.label}</div>
                            {child.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {child.badge}
                              </Badge>
                            )}
                          </div>
                          {child.description && (
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {child.description}
                            </p>
                          )}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                    isActive(item.href) && 'bg-accent text-accent-foreground'
                  )}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/**
 * Sidebar navigation item component
 */
function SidebarNavItem({ item, isActive }: { item: NavigationItem; isActive: boolean }) {
  if (item.children) {
    return (
      <div className="space-y-1">
        <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
        </div>
        <div className="ml-4 space-y-1">
          {item.children.map((child) => (
            <SidebarNavItem
              key={child.href}
              item={child}
              isActive={child.href === location.pathname}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground'
      )}
    >
      {item.icon && <span className="mr-3 h-4 w-4">{item.icon}</span>}
      {item.label}
      {item.badge && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

/**
 * Vertical navigation item component
 */
function VerticalNavItem({ item, isActive }: { item: NavigationItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground'
      )}
    >
      {item.icon && <span className="mr-3 h-4 w-4">{item.icon}</span>}
      <div className="flex-1">
        {item.label}
        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
      </div>
      {item.badge && (
        <Badge variant="secondary" className="text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

/**
 * Context-aware breadcrumb navigation
 */
interface PermissionBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    permission?: Permission;
    organizationId?: string;
  }>;
  className?: string;
}

export function PermissionBreadcrumb({ items, className }: PermissionBreadcrumbProps) {
  const { hasPermission } = usePermissions();

  const accessibleItems = items.filter((item) => {
    if (!item.permission) return true;
    const context = item.organizationId ? { organizationId: item.organizationId } : undefined;
    return hasPermission(item.permission, context);
  });

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {accessibleItems.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="mx-1 h-3 w-3 text-gray-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m1 9 4-4-4-4"
                />
              </svg>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-500">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
