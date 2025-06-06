import { notFound, redirect } from 'next/navigation';

import { getServerSession } from 'next-auth';

import { EditBasicInfo } from '@/features/providers/components/profile/edit-basic-info';
import { getServiceProviderByServiceProviderId } from '@/features/providers/lib/queries';
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

  // Get the provider data
  const provider = await getServiceProviderByServiceProviderId(params.id);

  // Check if provider exists
  if (!provider) {
    notFound();
  }

  // Check if the current user is authorized to edit this provider
  if (provider.userId !== userId) {
    redirect('/dashboard'); // Redirect to dashboard if not authorized
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Update your basic profile information visible to patients.
        </p>
      </div>

      <EditBasicInfo provider={provider} />
    </>
  );
}
