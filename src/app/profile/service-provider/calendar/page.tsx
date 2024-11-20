import { redirect } from 'next/navigation';

import { addDays } from 'date-fns';

import Calendar from '@/features/calendar/components/calendar';
import { getAvailabilitiesInRange } from '@/features/calendar/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { getServiceProviderId } from '@/lib/queries';

export default async function CalendarPage() {
  const user = await getCurrentUser();
  const initialData = await getAvailabilitiesInRange(new Date(), addDays(new Date(), 7));

  if (!user?.id) {
    redirect('/auth/login');
  }

  const serviceProviderId = await getServiceProviderId(user.id);

  if (!serviceProviderId) {
    redirect('/profile/service-provider');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set your available time slots and manage your schedule
          </p>
        </div>

        <div className="rounded-lg bg-white shadow">
          <Calendar initialData={initialData} providerId={serviceProviderId} />
        </div>
      </div>
    </main>
  );
}
