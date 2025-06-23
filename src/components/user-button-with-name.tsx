'use client';

import { useSession } from 'next-auth/react';

import AuthButton from '@/features/auth/components/auth-button';

export function UserButtonWithName() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-2">
      <AuthButton />
      {session?.user?.name && <span className="font-medium">{session.user.name}</span>}
    </div>
  );
}
