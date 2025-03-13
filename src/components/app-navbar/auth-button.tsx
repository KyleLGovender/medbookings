'use client';

import Image from 'next/image';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { signIn, signOut, useSession } from 'next-auth/react';

import { Spinner } from '@/components/ui/spinner';

interface MenuItemType {
  label: string;
  href: string;
}

interface AuthButtonProps {
  profileMenuItems?: MenuItemType[];
}

export default function AuthButton({ profileMenuItems = [] }: AuthButtonProps) {
  const { data, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="ml-3 flex h-9 w-9 items-center justify-center">
        <Spinner className="text-blue-600" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <Menu as="div" className="relative ml-3">
        <div>
          <MenuButton className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <span className="absolute -inset-1.5" />
            <span className="sr-only">Open user menu</span>
            {data?.user?.image ? (
              <Image
                alt=""
                src={data.user.image}
                width={32}
                height={32}
                className="size-8 rounded-full"
              />
            ) : (
              <div className="size-8 rounded-full bg-gray-200" />
            )}
          </MenuButton>
        </div>
        <MenuItems
          transition
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
        >
          {profileMenuItems.map((item) => (
            <MenuItem key={item.label}>
              <a
                href={item.href}
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
              >
                {item.label}
              </a>
            </MenuItem>
          ))}
          <MenuItem>
            <a
              href="#"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
            >
              Sign out
            </a>
          </MenuItem>
        </MenuItems>
      </Menu>
    );
  }

  return (
    <button
      onClick={() => signIn('google', { callbackUrl: '/profile' })}
      className="ml-3 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
    </button>
  );
}
