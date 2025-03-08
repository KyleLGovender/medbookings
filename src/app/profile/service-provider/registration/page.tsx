import { redirect } from 'next/navigation';

import { BillingType, Languages } from '@prisma/client';

import ServiceProviderForm from '@/features/service-provider/components/service-provider-form';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function RegisterProviderPage() {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect('/auth/login');
  }

  // Fetch required data
  const [serviceProviderTypes, services, requirementTypes, languages, billingTypes] =
    await Promise.all([
      prisma.serviceProviderType.findMany(),
      prisma.service.findMany().then((services) =>
        services.map(({ defaultPrice, createdAt, updatedAt, description, ...rest }) => ({
          ...rest,
          defaultPrice: defaultPrice ? Number(defaultPrice) : null,
          description: description ?? undefined,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        }))
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Register as Service Provider</h1>
      <ServiceProviderForm
        userId={user.id}
        serviceProviderTypes={serviceProviderTypes}
        services={services}
        requirementTypes={requirementTypes}
        languages={languages}
        billingTypes={billingTypes}
      />
    </div>
  );
}
