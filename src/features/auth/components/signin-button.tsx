'use client';

import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';

type SignInButtonProps = {
  text?: string;
};

export function SignInButton({ text = 'Sign in' }: SignInButtonProps) {
  return (
    <Button
      onClick={() => signIn('github')} // You can change 'github' to your preferred provider
      variant="outline"
      className="ml-4"
    >
      {text}
    </Button>
  );
}
