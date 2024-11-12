'use client';

import React from 'react';

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@nextui-org/react';
import { IconMedicalCrossCircle } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';

import AuthButton from '@/components/app-navbar/auth-button';

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { data: session } = useSession();

  const menuItems = [{ label: 'Home', href: '/' }];

  if (session) {
    menuItems.push({ label: 'Profile', href: '/profile' });
  }

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} isBordered>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="/" color="foreground">
            <IconMedicalCrossCircle className="text-foreground" />
          </Link>
          <p className="ml-2 font-bold text-inherit">Next.js Starter</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        {menuItems.map((item) => (
          <NavbarItem key={item.label}>
            <Link color="foreground" href={item.href}>
              {item.label}
            </Link>
          </NavbarItem>
        ))}
        <NavbarItem>
          <AuthButton />
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        {menuItems.map((item) => (
          <NavbarMenuItem key={item.label}>
            <Link color="foreground" className="w-full" href={item.href} size="lg">
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem>
          <AuthButton />
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
