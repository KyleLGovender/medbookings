'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface EditServiceProviderButtonProps {
  serviceProviderId: string;
}

export function EditServiceProviderButton({ serviceProviderId }: EditServiceProviderButtonProps) {
  return (
    <Button asChild variant="outline" className="w-full max-w-64">
      <Link href={'/profile/service-provider/edit/'}>Edit Service Provider Profile</Link>
    </Button>
  );
}
