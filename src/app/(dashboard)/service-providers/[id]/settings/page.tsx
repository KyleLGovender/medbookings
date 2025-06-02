import { redirect } from 'next/navigation';

import { BillingType, Languages } from '@prisma/client';

import { getServiceProviderByUserId } from '@/features/providers/lib/queries';
import ServiceProviderForm from '@/features/service-provider/components/service-provider-form';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function EditProviderPage() {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect('/auth/login');
  }

  const serviceProvider = await getServiceProviderByUserId(user.id);

  // If service provider doesn't exist, redirect to registration
  if (!serviceProvider) {
    redirect('/profile/service-provider/registration');
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

  // Format data for the form
  const formattedServiceProvider = {
    id: serviceProvider.id,
    userId: serviceProvider.userId,
    serviceProviderTypeId: serviceProvider.serviceProviderTypeId,
    name: serviceProvider.name,
    bio: serviceProvider.bio || '',
    image: serviceProvider.image,
    languages: serviceProvider.languages || [],
    billingType: serviceProvider.billingType,
    website: serviceProvider.website || '',
    email: serviceProvider.email,
    whatsapp: serviceProvider.whatsapp,
    services: serviceProvider.services?.map((s) => s.id) || [],
    requirementSubmissions:
      serviceProvider.requirementSubmissions?.map((submission) => ({
        requirementTypeId: submission.requirementTypeId,
        documentUrl: submission.documentUrl,
        documentMetadata: submission.documentMetadata,
      })) || [],
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book with </h1>
          <p className="mt-2 text-sm text-gray-600">
            Select an available time slot to schedule your appointment with
          </p>
        </div>

        <h1 className="mb-6 text-2xl font-bold">Edit Provider Profile</h1> */}
        <ServiceProviderForm
          userId={user.id}
          serviceProviderTypes={serviceProviderTypes}
          services={services}
          requirementTypes={requirementTypes}
          languages={languages}
          billingTypes={billingTypes}
          mode="edit"
          initialData={formattedServiceProvider}
        />
      </div>
    </div>
  );
}
