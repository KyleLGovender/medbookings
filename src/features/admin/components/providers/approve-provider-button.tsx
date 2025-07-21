'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { approveProvider } from '@/features/providers/lib/actions/administer-provider';

interface ApproveProviderButtonProps {
  providerId: string;
}

export function ApproveProviderButton({
  providerId,
}: ApproveProviderButtonProps) {
  const router = useRouter();

  const handleApprove = async () => {
    const result = await approveProvider(providerId);
    if (result.success) {
      router.refresh();
    }
  };

  return (
    <Button onClick={handleApprove} variant="outline" className="w-full max-w-64">
      Approve Provider
    </Button>
  );
}
