import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getServerSession } from 'next-auth';

import CalendarLoader from '@/components/calendar-loader';
import { CancelButton } from '@/components/cancel-button';
import { EditRegulatoryRequirements } from '@/features/providers/components/profile/edit-regulatory-requirements';
import { authOptions } from '@/lib/auth';

interface EditProviderPageProps {
  params: {
    id: string;
  };
}

export default async function EditProviderPage({ params }: EditProviderPageProps) {
  // Get the current user
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

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
          <h1 className="text-3xl font-bold tracking-tight">Edit Regulatory Requirements</h1>
          <p className="mt-2 text-muted-foreground">Update your regulatory requirements.</p>
        </div>
        <CancelButton cancelTo={`/providers/${params.id}`}>Cancel</CancelButton>
      </div>

      <EditRegulatoryRequirements providerId={params.id} userId={userId} />
    </Suspense>
  );
}
