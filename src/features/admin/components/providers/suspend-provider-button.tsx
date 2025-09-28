'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  useSuspendProvider,
  useUnsuspendProvider,
} from '@/features/admin/hooks/use-provider-suspend';

interface SuspendProviderButtonProps {
  providerId: string;
  providerStatus: string;
}

export function SuspendProviderButton({ providerId, providerStatus }: SuspendProviderButtonProps) {
  const router = useRouter();
  const suspendProviderMutation = useSuspendProvider();
  const unsuspendProviderMutation = useUnsuspendProvider();

  const isSuspended = providerStatus === 'SUSPENDED';

  const handleToggleSuspension = async () => {
    const action = isSuspended ? 'reactivate' : 'suspend';
    const confirmMessage = `Are you sure you want to ${action} this provider?`;

    if (window.confirm(confirmMessage)) {
      try {
        if (isSuspended) {
          await unsuspendProviderMutation.mutateAsync({ id: providerId });
        } else {
          await suspendProviderMutation.mutateAsync({ id: providerId });
        }
        router.refresh();
      } catch (error) {
        console.error(`Failed to ${action} provider:`, error);
        alert(`Failed to ${action} provider. Please try again.`);
      }
    }
  };

  return (
    <Button
      onClick={handleToggleSuspension}
      variant={isSuspended ? 'default' : 'destructive'}
      className="w-full max-w-64"
      disabled={suspendProviderMutation.isPending || unsuspendProviderMutation.isPending}
    >
      {suspendProviderMutation.isPending || unsuspendProviderMutation.isPending
        ? 'Processing...'
        : isSuspended
          ? 'Reactivate Provider'
          : 'Suspend Provider'}
    </Button>
  );
}
