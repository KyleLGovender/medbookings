import Image from 'next/image';

import { BillingType, Languages } from '@prisma/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApproveServiceProviderButton } from '@/features/service-provider/components/approve-service-provider-button';
import { ServiceProvider } from '@/features/service-provider/lib/types';
import { getCurrentUser } from '@/lib/auth';

import { DeleteServiceProviderButton } from './delete-service-provider-button';
import { EditServiceProviderButton } from './edit-service-provider-button';
import { SuspendServiceProviderButton } from './suspend-service-provider-button';

interface ServiceProviderViewProps {
  serviceProvider: ServiceProvider;
  serviceProviderTypes: Array<{ id: string; name: string }>;
  services: Array<{
    id: string;
    name: string;
    serviceProviderTypeId: string;
    description?: string;
    displayPriority: number;
  }>;
  requirementTypes: Array<{
    id: string;
    name: string;
    description?: string | null;
    validationType: string;
    isRequired: boolean;
    serviceProviderTypeId: string;
    validationConfig?: any;
    displayPriority?: number;
  }>;
  languages: Array<{
    id: Languages;
    name: Languages;
  }>;
  billingTypes: Array<{
    id: BillingType;
    name: BillingType;
  }>;
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'APPROVED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'SUSPENDED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export async function ServiceProviderView({
  serviceProvider,
  serviceProviderTypes,
  services,
  requirementTypes,
  languages,
  billingTypes,
}: ServiceProviderViewProps) {
  const providerType = serviceProviderTypes.find(
    (type) => type.id === serviceProvider.serviceProviderTypeId
  );

  const currentUser = await getCurrentUser();
  const isAuthorized =
    currentUser?.id === serviceProvider.userId ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  console.log('currentUser', currentUser);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Basic Information</CardTitle>
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(serviceProvider.status)}`}
              >
                {serviceProvider.status}
              </span>
              {serviceProvider.verifiedAt && (
                <span className="ml-2 text-xs text-gray-500">
                  Verified on {new Date(serviceProvider.verifiedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {isAuthorized && (
            <div className="flex gap-2">
              <EditServiceProviderButton serviceProviderId={serviceProvider.id} />
              <DeleteServiceProviderButton serviceProviderId={serviceProvider.id} />
            </div>
          )}
          {isAdmin && (
            <div className="flex gap-2">
              {serviceProvider.status !== 'APPROVED' && (
                <ApproveServiceProviderButton serviceProviderId={serviceProvider.id} />
              )}
              {serviceProvider.status !== 'SUSPENDED' && (
                <SuspendServiceProviderButton serviceProviderId={serviceProvider.id} />
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            {serviceProvider.image && (
              <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                <Image
                  src={serviceProvider.image}
                  alt={`${serviceProvider.name}'s profile`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{serviceProvider.name}</h2>
              <p className="text-sm text-gray-500">{providerType?.name}</p>
              <p className="mt-2 whitespace-pre-wrap text-gray-700">{serviceProvider.bio}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Contact Information</h3>
              <div className="mt-2 space-y-2">
                <p>
                  <span className="text-sm text-gray-500">Email:</span>{' '}
                  <a
                    href={`mailto:${serviceProvider.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {serviceProvider.email}
                  </a>
                </p>
                {serviceProvider.whatsapp && (
                  <p>
                    <span className="text-sm text-gray-500">WhatsApp:</span>{' '}
                    <a
                      href={`https://wa.me/${serviceProvider.whatsapp.replace(/\D/g, '')}`}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {serviceProvider.whatsapp}
                    </a>
                  </p>
                )}
                {serviceProvider.website && (
                  <p>
                    <span className="text-sm text-gray-500">Website:</span>{' '}
                    <a
                      href={serviceProvider.website}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {serviceProvider.website}
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Additional Details</h3>
              <div className="mt-2 space-y-2">
                <p>
                  <span className="text-sm text-gray-500">Languages:</span>{' '}
                  {serviceProvider.languages.join(', ')}
                </p>
                <p>
                  <span className="text-sm text-gray-500">Billing Type:</span>{' '}
                  {serviceProvider.billingType}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add a warning message for pending providers */}
      {serviceProvider.status === 'PENDING' && (isAuthorized || currentUser?.role === 'ADMIN') && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.873-1.512 3.157-1.512 4.03 0l8.485 14.7c.873 1.512-.218 3.405-2.015 3.405H2.015C.218 20.6-.873 18.707 0 17.195l8.485-14.7zM10 6a.75.75 0 01.75.75v5a.75.75 0 01-1.5 0v-5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Pending Approval</h3>
              <p className="mt-2 text-sm text-yellow-700">
                This profile is pending administrative approval. Some features may be limited until
                approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services Offered</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {services
              .filter((service) => serviceProvider.services.some((s) => s.id === service.id))
              .sort((a, b) => a.displayPriority - b.displayPriority)
              .map((service) => (
                <div
                  key={service.id}
                  className="rounded-md bg-gray-50 px-4 py-2 text-sm text-gray-700"
                >
                  {service.name}
                  {service.description && (
                    <p className="mt-1 text-xs text-gray-500">{service.description}</p>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements and Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements and Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(serviceProvider.requirementSubmissions ?? [])
              .sort((a, b) => {
                const reqA = requirementTypes.find((r) => r.id === a.requirementTypeId);
                const reqB = requirementTypes.find((r) => r.id === b.requirementTypeId);
                return (reqA?.displayPriority ?? 0) - (reqB?.displayPriority ?? 0);
              })
              .map((submission) => {
                const requirementType = requirementTypes.find(
                  (r) => r.id === submission.requirementTypeId
                );
                if (!requirementType) return null;

                return (
                  <div key={submission.requirementTypeId} className="rounded-lg border p-4">
                    <h4 className="font-medium">{requirementType.name}</h4>
                    {requirementType.description && (
                      <p className="mt-1 text-sm text-gray-500">{requirementType.description}</p>
                    )}
                    <div className="mt-2">
                      {submission.documentUrl ? (
                        <a
                          href={submission.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Document
                        </a>
                      ) : submission.documentMetadata?.value ? (
                        <p className="text-sm">{submission.documentMetadata.value}</p>
                      ) : (
                        <p className="text-sm text-gray-500">No document provided</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
