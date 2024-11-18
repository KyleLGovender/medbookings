import { Metadata } from 'next';

import ServiceProviderCalendar from '@/features/calendar/components/calendar';

export const metadata: Metadata = {
  title: 'Manage Availability | Service Provider Dashboard',
  description: 'Manage your availability and schedule as a service provider',
};

export default function AvailabilityPage() {
  // TODO: Fetch provider details from your auth/context/api
  const mockProviderDetails = {
    id: '123',
    name: 'John Doe',
  };

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
          <ServiceProviderCalendar
            providerId={mockProviderDetails.id}
            providerName={mockProviderDetails.name}
          />
        </div>
      </div>
    </main>
  );
}
