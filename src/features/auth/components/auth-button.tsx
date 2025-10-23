'use client';

import Link from 'next/link';

import { signIn, signOut, useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/user-avatar';

interface MenuItemType {
  label: string;
  href: string;
}

interface AuthButtonProps {
  profileMenuItems?: MenuItemType[];
  className?: string;
}

export default function AuthButton({ profileMenuItems = [], className }: AuthButtonProps) {
  const { data, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Show sign-in button for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <Link href="/login">
        <Button variant="outline" className="ml-3" aria-label="Sign in">
          Sign in
        </Button>
      </Link>
    );
  }

  // For authenticated users or loading state, show the profile menu with initials
  return (
    <div className="relative ml-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={className} aria-label="Open user menu">
            <UserAvatar
              name={data?.user?.name}
              image={data?.user?.image}
              email={data?.user?.email}
              className="h-8 w-8"
              showLoading={status === 'loading'}
            />
          </Button>
        </DropdownMenuTrigger>

        {status === 'authenticated' && (
          <DropdownMenuContent align="end" className="w-48">
            {profileMenuItems.map((item) => (
              <DropdownMenuItem asChild key={item.label}>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}
