'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface EditProviderButtonProps {
  providerId: string;
}

export function EditProviderButton({ providerId }: EditProviderButtonProps) {
  return (
    <Button asChild variant="outline" className="w-full max-w-64">
      <Link href={'/profile/provider/edit/'}>Edit Provider Profile</Link>
    </Button>
  );
}
