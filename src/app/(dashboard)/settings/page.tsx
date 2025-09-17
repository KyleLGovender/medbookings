import { redirect } from 'next/navigation';

import SettingsPageClient from '@/features/settings/components/settings-page-client';
import { getCurrentUser } from '@/lib/auth';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <SettingsPageClient />;
}
