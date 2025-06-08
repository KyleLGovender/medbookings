'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface CancelButtonProps {
  providerId: string;
}

export default function CancelButton({ providerId }: CancelButtonProps) {
  const router = useRouter();

  const handleCancel = () => {
    router.push(`/providers/${providerId}`);
  };

  return (
    <Button variant="outline" onClick={handleCancel}>
      Cancel
    </Button>
  );
}
