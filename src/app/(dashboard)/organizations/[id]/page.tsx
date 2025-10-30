import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import CalendarLoader from '@/components/calendar-loader';
import { OrganizationProfileView } from '@/features/organizations/components/profile/organization-profile-view';
import { auth } from '@/lib/auth';

interface OrganizationDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function OrganizationDetailsPage({ params }: OrganizationDetailsPageProps) {
  // Get current session to check if user can edit this profile
  const session = await auth();
  const userId = session?.user?.id;

  // Ensure ID exists
  if (!params.id) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <CalendarLoader
          message="Loading Organization"
          submessage="Retrieving organization details..."
          showAfterMs={0}
        />
      }
    >
      <OrganizationProfileView organizationId={params.id} userId={userId} />
    </Suspense>
  );
}
