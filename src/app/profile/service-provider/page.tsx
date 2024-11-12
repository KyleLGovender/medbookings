import ServiceProviderForm from '@/features/profile/service-provider/components/service-provider-form';
import { prisma } from '@/lib/prisma';

export default async function RegisterProviderPage() {
  // Fetch required data
  const [serviceProviderTypes, services, requirementTypes] = await Promise.all([
    prisma.serviceProviderType.findMany(),
    prisma.service.findMany(),
    prisma.requirementType.findMany(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Register as Service Provider</h1>
      <ServiceProviderForm
        serviceProviderTypes={serviceProviderTypes}
        services={services}
        requirementTypes={requirementTypes}
      />
    </div>
  );
}
