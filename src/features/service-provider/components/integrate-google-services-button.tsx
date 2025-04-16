'use client';

import { signIn } from 'next-auth/react';

import { GoogleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface IntegrateGoogleServicesButtonProps {
  serviceProviderId: string;
  hasIntegration: boolean;
}

export function IntegrateGoogleServicesButton({
  serviceProviderId,
  hasIntegration,
}: IntegrateGoogleServicesButtonProps) {
  const handleIntegrate = async () => {
    // Use Auth.js signIn instead of direct redirect
    await signIn('google', {
      callbackUrl: '/profile/service-provider/view',
      // Request all necessary Google Workspace scopes
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/meetings.space.created',
        'https://www.googleapis.com/auth/gmail.send',
      ].join(' '),
      // Pass serviceProviderId as state to use in callback
      state: serviceProviderId,
    });
  };

  return (
    <Button
      onClick={handleIntegrate}
      variant="outline"
      className="flex max-w-64 items-center gap-2"
    >
      <GoogleIcon className="h-4 w-4" />
      {hasIntegration ? 'Reconfigure Google' : 'Connect Google'}
    </Button>
  );
}
