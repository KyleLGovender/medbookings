'use client';

import {
  Avatar,
  Button,
  CircularProgress,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@nextui-org/react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthButton() {
  const { data, status } = useSession();

  if (status === 'loading') {
    return <CircularProgress aria-label="Loading authentication status" />;
  }

  if (status === 'authenticated') {
    return (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            isBordered
            as="button"
            className="transition-transform"
            showFallback={!data?.user?.image}
            src={data?.user?.image ?? undefined}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="Profile Actions" variant="flat">
          <DropdownItem key="profile" className="h-14 gap-2" textValue="Profile">
            <p className="font-semibold">Signed in as</p>
            <p className="font-semibold">{data?.user?.email}</p>
          </DropdownItem>
          <DropdownItem key="logout" color="danger" onClick={() => signOut({ callbackUrl: '/' })}>
            Sign Out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }

  return (
    <Button
      onClick={() => signIn('google', { callbackUrl: '/profile' })}
      className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
      variant="bordered"
      startContent={
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="#4285F4" // Google Blue
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853" // Google Green
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05" // Google Yellow
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335" // Google Red
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      }
      aria-label="Sign in with Google"
    >
      Sign in
    </Button>
  );
}
