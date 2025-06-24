'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';

import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AuthButton from '@/features/auth/components/auth-button';
import { useOrganizationByUserId } from '@/features/organizations/hooks/use-organization-by-user-id';
import { useProviderByUserId } from '@/features/providers/hooks/use-provider-by-user-id';
import { cn } from '@/lib/utils';

type NavigationItem = {
  title: string;
  href: string;
  children?: {
    title: string;
    href: string;
    description: string;
  }[];
};

const getNavigationItems = (isSignedIn: boolean, isAdmin: boolean): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    {
      title: 'Home',
      href: '/',
    },
    {
      title: 'Search Providers',
      href: '/providers/',
    },
    {
      title: 'Join Medbookings',
      href: '/join-medbookings/',
    },
  ];

  return [...baseItems];
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const { data: provider } = useProviderByUserId(session?.user?.id);
  const [open, setOpen] = useState(false);

  // Helper function to check if a path matches the current pathname
  const isActivePath = (itemHref: string) => {
    // For the home page, exact match
    if (itemHref === '/') {
      return pathname === '/';
    }

    // For other pages, check if pathname starts with the href (handles nested routes)
    return pathname.startsWith(itemHref);
  };

  // Check if user is signed in and has ADMIN role
  const isSignedIn = !!session;
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const navigationItems = getNavigationItems(isSignedIn, isAdmin);

  // Fetch organization data for the current user
  const { data: organization } = useOrganizationByUserId(session?.user?.id);

  const profileMenuItems = [
    ...(isAdmin ? [{ label: 'Admin', href: '/admin' }] : []),
    { label: 'Profile', href: '/profile' },
    ...(provider?.id ? [{ label: 'Provider', href: `/providers/${provider.id}` }] : []),
    ...(organization?.id
      ? [{ label: 'My Organization', href: `/organizations/${organization.id}` }]
      : []),
    { label: 'Organizations', href: '/organizations' },
    { label: 'Calendar', href: '/calendar' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl">
        <div className="relative flex h-16 items-center px-6 md:px-24">
          {/* Logo - Left */}
          <div className="flex shrink-0 items-center">
            <Link href="/" className="flex cursor-pointer items-center gap-2 font-semibold">
              <Logo />
              <span className="hidden text-xl sm:inline">Medbookings</span>
            </Link>
          </div>

          {/* Navigation - Center */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationItems.map((item) =>
                  item.children ? (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuTrigger className="cursor-pointer">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {item.children.map((child) => (
                            <li key={child.title}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    'block cursor-pointer select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                                  )}
                                >
                                  <div className="text-sm font-medium leading-none">
                                    {child.title}
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {child.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          isActivePath(item.href) && 'text-primary'
                        )}
                        href={item.href}
                      >
                        {item.title}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Auth button - Right */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex">
              <AuthButton profileMenuItems={profileMenuItems} />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <AuthButton profileMenuItems={profileMenuItems} />
              {/* Mobile Navigation */}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="cursor-pointer md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-4 p-6">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                          'cursor-pointer text-lg font-medium transition-colors hover:text-foreground/80',
                          isActivePath(item.href) ? 'text-primary' : 'text-foreground/60'
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </nav>
                  <Separator className="mx-6" />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
