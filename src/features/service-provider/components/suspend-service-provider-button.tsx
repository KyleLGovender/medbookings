'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { suspendServiceProvider } from '../lib/actions';

interface SuspendServiceProviderButtonProps {
  serviceProviderId: string;
}

export function SuspendServiceProviderButton({
  serviceProviderId,
}: SuspendServiceProviderButtonProps) {
  const router = useRouter();

  const handleSuspend = async () => {
    if (window.confirm('Are you sure you want to suspend this service provider?')) {
      const result = await suspendServiceProvider(serviceProviderId);
      if (result.success) {
        router.refresh();
      }
    }
  };

  return (
    <Button onClick={handleSuspend} variant="destructive" className="w-full max-w-64">
      Suspend Provider
    </Button>
  );
}
