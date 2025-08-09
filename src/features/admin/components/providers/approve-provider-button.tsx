'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useApproveProvider } from '@/features/providers/hooks/use-admin-provider-approval';

interface ApproveProviderButtonProps {
  providerId: string;
}

export function ApproveProviderButton({ providerId }: ApproveProviderButtonProps) {
  const router = useRouter();
  const approveProviderMutation = useApproveProvider();

  const handleApprove = async () => {
    try {
      await approveProviderMutation.mutateAsync({ id: providerId });
      router.refresh();
    } catch (error) {
      console.error('Failed to approve provider:', error);
    }
  };

  return (
    <Button onClick={handleApprove} variant="outline" className="w-full max-w-64">
      Approve Provider
    </Button>
  );
}
