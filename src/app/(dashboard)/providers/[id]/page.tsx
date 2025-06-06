import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getServerSession } from 'next-auth';

import CalendarLoader from '@/components/calendar-loader';
import { ProviderProfileView } from '@/features/providers/components/profile/provider-profile-view';
import { authOptions } from '@/lib/auth';

interface ServiceProviderPageProps {
  params: {
    id: string;
  };
}

export default async function ServiceProviderPage({ params }: ServiceProviderPageProps) {
  // Get current session to check if user can edit this profile
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Ensure ID exists
  if (!params.id) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <CalendarLoader
          message="Loading Provider"
          submessage="Retrieving provider details..."
          showAfterMs={0}
        />
      }
    >
      <ProviderProfileView providerId={params.id} userId={userId} />
    </Suspense>
  );
}
