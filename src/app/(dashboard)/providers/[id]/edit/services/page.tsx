import { Suspense } from 'react';


import notFound from '@/app/not-found';
import CalendarLoader from '@/components/calendar-loader';
import { CancelButton } from '@/components/cancel-button';
import { EditServices } from '@/features/providers/components/profile/edit-services';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface EditProviderServicesPageProps {
  params: {
    id: string;
  };
}

export default async function EditProviderServicesPage({ params }: EditProviderServicesPageProps) {
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

  // Check if user owns this provider or is an admin
  const provider = await prisma.provider.findUnique({
    where: { id: params.id },
    select: { userId: true }
  });

  if (!provider) {
    notFound();
  }

  // Check ownership or admin role
  const isOwner = provider.userId === userId;
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

  if (!isOwner && !isAdmin) {
    redirect(`/unauthorized?reason=insufficient_permissions&attempted_route=/providers/${params.id}/edit/services`);
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Services</h1>
          <p className="mt-2 text-muted-foreground">Update your services and fee structure.</p>
        </div>
        <CancelButton cancelTo={`/providers/${params.id}`}>Cancel</CancelButton>
      </div>

      <EditServices providerId={params.id} userId={userId} />
    </Suspense>
  );
}
