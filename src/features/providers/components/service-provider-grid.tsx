import { ServiceProviderCard } from '@/features/service-provider/components/service-provider-card';

import { getApprovedServiceProviders } from '../lib/queries';
import { ServiceProvider } from '../lib/types';

interface ServiceProviderGridProps {
  typeId?: string;
}

export async function ServiceProviderGrid({ typeId }: ServiceProviderGridProps) {
  // Fetch service providers with optional type filter
  const serviceProviders = await getApprovedServiceProviders();

  return (
    <div className="space-y-6 rounded-lg bg-white shadow">
      <div className="max-w-[100vw] overflow-x-hidden p-4">
        <div className="rounded-lg bg-white shadow">
          {serviceProviders.length === 0 ? (
            <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed">
              <p className="text-muted-foreground">No service providers match your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {serviceProviders.map((provider: ServiceProvider) => (
                <ServiceProviderCard key={provider.id} serviceProvider={provider} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
