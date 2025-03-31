'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface EditServiceProviderButtonProps {
  serviceProviderId: string;
}

export function EditServiceProviderButton({ serviceProviderId }: EditServiceProviderButtonProps) {
  return (
    <Button asChild variant="outline">
      <Link href={'/profile/service-provider/edit/'}>Edit Profile</Link>
    </Button>
  );
}
