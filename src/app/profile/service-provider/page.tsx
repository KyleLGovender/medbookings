import ServiceProviderForm from '@/features/profile/service-provider/components/service-provider-form';
import { prisma } from '@/lib/prisma';
import { BillingType, Languages } from '@prisma/client';

export default async function RegisterProviderPage() {
  // Fetch required data
  const [serviceProviderTypes, services, requirementTypes, languages, billingTypes] = await Promise.all([
    prisma.serviceProviderType.findMany(),
    prisma.service.findMany().then(services => 
      services.map(({ createdAt, updatedAt, description, ...rest }) => ({
        ...rest,
        description: description ?? undefined
      }))),
    prisma.requirementType.findMany(),
    Object.entries(Languages).map(([key]) => ({ id: key as Languages, name: key as Languages })),
    Object.entries(BillingType).map(([key]) => ({ id: key as BillingType, name: key as BillingType })),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Register as Service Provider</h1>
      <ServiceProviderForm
        serviceProviderTypes={serviceProviderTypes}
        services={services}
        requirementTypes={requirementTypes}
        languages={languages}
        billingTypes={billingTypes}
      />
    </div>
  );
}
