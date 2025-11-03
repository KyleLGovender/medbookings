'use client';

import { useSession } from 'next-auth/react';

import AuthButton from '@/components/auth/auth-button';
import { ModeToggle } from '@/components/mode-toggle';

export function DashboardUserButton() {
  const { data: session } = useSession();

  return (
    <div className="flex w-full items-center justify-between gap-2">
      {session?.user?.name && <span className="flex-none font-medium">{session.user.name}</span>}
      <ModeToggle />
      <AuthButton className="flex-none" />
    </div>
  );
}
