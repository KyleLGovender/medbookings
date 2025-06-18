import OrganizationsClient from '@/features/organizations/components/organizations-client';
import { getCurrentUser } from '@/lib/auth';

export default async function OrganizationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !currentUser.id) {
    return <p>Please log in to view your organizations.</p>;
  }

  return <OrganizationsClient userId={currentUser.id} />;
}
