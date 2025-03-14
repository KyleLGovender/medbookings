import { ServiceProvider } from '@prisma/client';

import { ServiceProviderCard } from '@/features/service-provider/components/service-provider-card';
import { prisma } from '@/lib/prisma';

interface ServiceProviderGridProps {
  typeId?: string;
}

// Define the type for service providers with included relations
type ServiceProviderWithType = ServiceProvider & {
  serviceProviderType: { name: string } | null;
};

export async function ServiceProviderGrid({ typeId }: ServiceProviderGridProps) {
  // Fetch service providers with optional type filter
  const serviceProviders = await prisma.serviceProvider.findMany({
    include: {
      serviceProviderType: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      {serviceProviders.length === 0 ? (
        <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed">
          <p className="text-muted-foreground">No service providers match your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {serviceProviders.map((provider: ServiceProviderWithType) => (
            <ServiceProviderCard key={provider.id} serviceProvider={provider} />
          ))}
        </div>
      )}
    </div>
  );
}
