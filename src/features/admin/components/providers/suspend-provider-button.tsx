'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

// Temporary placeholder until useSuspendProvider hook is implemented
const useSuspendProvider = () => ({
  mutateAsync: async ({ id }: { id: string }) => {
    throw new Error('Suspend provider functionality is temporarily disabled');
  },
});

interface SuspendProviderButtonProps {
  providerId: string;
}

export function SuspendProviderButton({ providerId }: SuspendProviderButtonProps) {
  const router = useRouter();
  const suspendProviderMutation = useSuspendProvider();

  const handleSuspend = async () => {
    if (window.confirm('Are you sure you want to suspend this provider?')) {
      try {
        await suspendProviderMutation.mutateAsync({ id: providerId });
        router.refresh();
      } catch (error) {
        console.error('Failed to suspend provider:', error);
      }
    }
  };

  return (
    <Button onClick={handleSuspend} variant="destructive" className="w-full max-w-64">
      Suspend Provider
    </Button>
  );
}
