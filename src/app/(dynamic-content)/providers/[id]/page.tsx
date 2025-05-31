import { notFound } from 'next/navigation';

import { BillingType, Languages } from '@prisma/client';

import { getServiceProviderByServiceProviderId } from '@/features/providers/lib/queries';
import { ServiceProviderView } from '@/features/service-provider/components/service-provider-view';
import { prisma } from '@/lib/prisma';

interface ServiceProviderDetailsPageProps {
  params: {
    serviceProviderId: string;
  };
}

export default async function ServiceProviderDetailsPage({
  params,
}: ServiceProviderDetailsPageProps) {
  const serviceProvider = await getServiceProviderByServiceProviderId(params.serviceProviderId);

  if (!serviceProvider) {
    notFound();
  }
  // Fetch required data
  const [serviceProviderTypes, services, requirementTypes, languages, billingTypes] =
    await Promise.all([
      prisma.serviceProviderType.findMany(),
      prisma.service.findMany().then((services) =>
        services.map(
          ({ defaultPrice, defaultDuration, createdAt, updatedAt, description, ...rest }) => ({
            ...rest,
            defaultPrice: defaultPrice ? Number(defaultPrice) : null,
            defaultDuration: defaultDuration ? Number(defaultDuration) : null,
            description: description ?? undefined,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
          })
        )
      ),
      prisma.requirementType.findMany(),
      Object.entries(Languages).map(([key]) => ({
        id: key as Languages,
        name: key as Languages,
      })),
      Object.entries(BillingType).map(([key]) => ({
        id: key as BillingType,
        name: key as BillingType,
      })),
    ]);

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Provider Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            View detailed information about this service provider
          </p>
        </div>

        <ServiceProviderView
          serviceProvider={serviceProvider}
          serviceProviderTypes={serviceProviderTypes}
          services={services}
          requirementTypes={requirementTypes}
          languages={languages}
          billingTypes={billingTypes}
        />
      </div>
    </div>
  );
}
