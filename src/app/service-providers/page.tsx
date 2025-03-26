import { ServiceProviderGrid } from '@/features/service-provider/components/service-provider-grid';

interface ServiceProvidersPageProps {
  searchParams: { type?: string };
}

export const metadata = {
  title: 'Service Providers | Book an Appointment',
  description: 'Browse our service providers and book an appointment',
};

export default function ServiceProvidersPage({ searchParams }: ServiceProvidersPageProps) {
  const typeId = searchParams.type;

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Service Providers</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse our qualified service providers and book an appointment
          </p>
        </div>
        <ServiceProviderGrid typeId={typeId} />
      </div>
    </div>
  );
}
