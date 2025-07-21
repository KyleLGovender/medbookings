'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { suspendProvider } from '@/features/providers/lib/actions/administer-provider';

interface SuspendProviderButtonProps {
  providerId: string;
}

export function SuspendProviderButton({
  providerId,
}: SuspendProviderButtonProps) {
  const router = useRouter();

  const handleSuspend = async () => {
    if (window.confirm('Are you sure you want to suspend this provider?')) {
      const result = await suspendProvider(providerId);
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
