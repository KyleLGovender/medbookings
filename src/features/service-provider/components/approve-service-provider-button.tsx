'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { approveServiceProvider } from '../lib/actions';

interface ApproveServiceProviderButtonProps {
  serviceProviderId: string;
}

export function ApproveServiceProviderButton({
  serviceProviderId,
}: ApproveServiceProviderButtonProps) {
  const router = useRouter();

  const handleApprove = async () => {
    const result = await approveServiceProvider(serviceProviderId);
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
