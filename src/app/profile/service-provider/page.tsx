import { ServiceProvider } from '@/features/profile/service-provider/components/service-provider';
import { getServiceProvider } from '@/features/profile/service-provider/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ServiceProviderPage() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect('/auth/login');
  }

  const serviceProvider = await getServiceProvider(user?.id);
  if (!serviceProvider) {
    redirect('/profile/service-provider/registration'); // or wherever you want to redirect if no provider exists
  }

  
  return <ServiceProvider serviceProvider={serviceProvider} />;
}


