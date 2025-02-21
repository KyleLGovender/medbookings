import { redirect } from 'next/navigation';

import { ServiceProviderProfile } from '@/features/service-provider/components/service-provider';
import { getServiceProvider } from '@/features/service-provider/lib/queries';
import { getCurrentUser } from '@/lib/auth';

export default async function ServiceProviderPage() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect('/auth/login');
  }

  const serviceProvider = await getServiceProvider(user?.id);
  if (!serviceProvider) {
    redirect('/profile/service-provider/registration'); // or wherever you want to redirect if no provider exists
  }

  return <ServiceProviderProfile serviceProvider={serviceProvider} />;
}
