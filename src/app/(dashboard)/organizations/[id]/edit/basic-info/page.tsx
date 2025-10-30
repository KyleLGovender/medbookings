import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getServerSession } from 'next-auth';

import CalendarLoader from '@/components/calendar-loader';
import { CancelButton } from '@/components/cancel-button';
import { EditOrganizationBasicInfo } from '@/features/organizations/components/profile/edit-organization-basic-info';
import { authOptions } from '@/lib/auth';

interface EditOrganizationPageProps {
  params: {
    id: string;
  };
}

export default async function EditOrganizationPage({ params }: EditOrganizationPageProps) {
  // Get current session to check if user can edit this profile
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect('/login');
  }
  const userId = session?.user?.id;

  // Ensure ID exists
  if (!params.id) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <CalendarLoader
          message="Loading Editor"
          submessage="Preparing provider editor..."
          showAfterMs={0}
        />
      }
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
          <p className="mt-2 text-muted-foreground">
            Update your organization information and services.
          </p>
        </div>
        <CancelButton cancelTo={`/organizations/${params.id}`}>Cancel</CancelButton>
      </div>
      <EditOrganizationBasicInfo organizationId={params.id} userId={userId} />
    </Suspense>
  );
}
