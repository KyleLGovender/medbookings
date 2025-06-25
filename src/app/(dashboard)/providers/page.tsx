import { getCurrentUser } from '@/lib/auth';

export default async function OrganizationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !currentUser.id) {
    return <p>Please log in to view your organizations.</p>;
  }

  return (
    <div>
      <h1>Providers</h1>
    </div>
  );
}
