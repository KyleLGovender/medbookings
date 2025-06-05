'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { signIn, signOut, useSession } from 'next-auth/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuItemType {
  label: string;
  href: string;
}

interface AuthButtonProps {
  profileMenuItems?: MenuItemType[];
}

export default function AuthButton({ profileMenuItems = [] }: AuthButtonProps) {
  const { data, status } = useSession();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Preload the image when session data is available
  useEffect(() => {
    if (data?.user?.image) {
      const img = new window.Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(false);
      img.src = data.user.image;
    }
  }, [data?.user?.image]);

  // Show sign-in button for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <Button
        onClick={() => signIn('google', { callbackUrl: '/profile' })}
        variant="outline"
        className="ml-3"
        aria-label="Sign in with Google"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in
      </Button>
    );
  }

  // For authenticated users or loading state, show the profile menu with initials
  return (
    <div className="relative ml-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full p-0"
            aria-label="Open user menu"
          >
            <Avatar className="h-8 w-8">
              {status === 'authenticated' && data?.user?.image && imageLoaded ? (
                <AvatarImage
                  src={data.user.image}
                  alt={data.user.name || 'User avatar'}
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <AvatarFallback className="text-sm font-medium">
                {status === 'loading' ? '...' : data?.user?.name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        {status === 'authenticated' && (
          <DropdownMenuContent align="end" className="w-48">
            {profileMenuItems.map((item) => (
              <DropdownMenuItem key={item.label} asChild>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/' })}
              className="cursor-pointer"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}
