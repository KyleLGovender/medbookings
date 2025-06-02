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

  if (isSignedIn) {
    const signedInItems = [
      ...baseItems,
      {
        title: 'Dashboard',
        href: '/dashboard/',
      },
      {
        title: 'Profile',
        href: '/profile/',
      },
      {
        title: 'Organizations',
        href: '/organizations/',
      },
      {
        title: 'Calendar',
        href: '/calendar/',
      },
      {
        title: 'Settings',
        href: '/settings/ ',
      },
    ];

    // Only add Admin menu item if user is an admin
    if (isAdmin) {
      signedInItems.push({
        title: 'Admin',
        href: '/admin/ ',
      });
    }

    return signedInItems;
  }

  return [...baseItems];
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Check if user is signed in and has ADMIN role
  const isSignedIn = !!session;
  const isAdmin = session?.user?.role === 'ADMIN';

  const navigationItems = getNavigationItems(isSignedIn, isAdmin);

  const profileMenuItems = [
    { label: 'Profile', href: '/profile' },
    { label: 'Availabilty', href: '/profile/service-provider/calendar' },
    { label: 'Bookings', href: '/calendar/service-provider/bookings' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-10">
        <div className="flex items-center">
          <Link href="/" className="ml-3 flex items-center gap-2 font-semibold">
            <Logo />
            <span className="hidden text-xl sm:inline">Medbookings</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:gap-10">
          <NavigationMenu>
            <NavigationMenuList>
              {navigationItems.map((item) =>
                item.children ? (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {item.children.map((child) => (
                          <li key={child.title}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={child.href}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
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
                      href={item.href}
                      className={navigationMenuTriggerStyle()}
                      active={pathname === item.href}
                    >
                      {item.title}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <AuthButton profileMenuItems={profileMenuItems} />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <AuthButton profileMenuItems={profileMenuItems} />
          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
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
                      'text-lg font-medium transition-colors hover:text-foreground/80',
                      pathname === item.href ? 'text-foreground' : 'text-foreground/60'
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
    </header>
  );
}
