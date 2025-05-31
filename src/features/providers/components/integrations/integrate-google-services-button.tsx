'use client';

import { useState } from 'react';

import { GoogleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface IntegrateGoogleServicesButtonProps {
  serviceProviderId: string;
  hasIntegration: boolean;
  children: React.ReactNode;
}

export function IntegrateGoogleServicesButton({
  serviceProviderId,
  hasIntegration,
  children,
}: IntegrateGoogleServicesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleIntegrate = async () => {
    setIsLoading(true);
    const url = `/api/auth/google/calendar?serviceProviderId=${serviceProviderId}`;
    window.location.href = url;
  };

  return (
    <Button
      onClick={handleIntegrate}
      variant="outline"
      className="flex w-full max-w-64 items-center gap-2"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          Connecting...
        </>
      ) : (
        <>
          <GoogleIcon className="h-4 w-4" />
          {children}
        </>
      )}
    </Button>
  );
}
