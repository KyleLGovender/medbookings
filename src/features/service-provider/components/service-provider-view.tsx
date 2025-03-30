import Image from 'next/image';

import { BillingType, Languages } from '@prisma/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ServiceProvider } from '@/features/service-provider/lib/types';

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

export function ServiceProviderView({
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

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
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
