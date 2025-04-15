'use client';

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
    // Redirect to Google OAuth consent screen
    // The URL should be your API endpoint that initiates OAuth flow
    window.location.href = `/api/auth/google/calendar?serviceProviderId=${serviceProviderId}`;
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
