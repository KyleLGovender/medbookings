import Image from 'next/image';

import { BillingType, Languages } from '@prisma/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApproveServiceProviderButton } from '@/features/admin/components/providers/approve-service-provider-button';
import { ServiceProvider } from '@/features/providers/types/types';
import { IntegrateGoogleServicesButton } from '@/features/service-provider/components/integrate-google-services-button';
import { getCurrentUser } from '@/lib/auth';

import { DeleteServiceProviderButton } from './delete-service-provider-button';
import { EditServiceProviderButton } from './edit-service-provider-button';
import { MeetSettingsForm } from './meet-settings-form';
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
  console.log('serviceProvider', serviceProvider);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div>
              <CardTitle className="text-2xl">{serviceProvider.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{providerType?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(serviceProvider.status)}`}
              >
                {serviceProvider.status}
              </span>
              {serviceProvider.verifiedAt && (
                <span className="text-xs text-muted-foreground">
                  Verified on {new Date(serviceProvider.verifiedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            {serviceProvider.image && (
              <div className="relative h-48 w-48 overflow-hidden rounded-lg">
                <Image
                  src={serviceProvider.image}
                  alt={`${serviceProvider.name}'s profile`}
                  fill
                  sizes="(max-width: 768px) 192px, 192px"
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <div>
              <p className="whitespace-pre-wrap text-muted-foreground">{serviceProvider.bio}</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Actions Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Actions</h3>

            {/* Calendar Integration Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Calendar Integration</h4>

              {serviceProvider.calendarIntegration ? (
                <>
                  <IntegrateGoogleServicesButton
                    serviceProviderId={serviceProvider.id}
                    hasIntegration={true}
                  >
                    Update Integration
                  </IntegrateGoogleServicesButton>
                  <div className="space-y-3">
                    <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                      <p className="text-sm">Connected to Google Workspace:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Calendar: {serviceProvider.calendarIntegration.googleEmail}</li>
                        <li>• Meet: Enabled for video consultations</li>
                        <li>• Gmail: {serviceProvider.calendarIntegration.googleEmail}</li>
                      </ul>
                    </div>

                    {/* Add Meet Settings Form */}
                    <div className="rounded-lg border p-4">
                      <h4 className="mb-4 text-sm font-medium text-gray-700">
                        Google Meet Settings
                      </h4>
                      <MeetSettingsForm
                        initialSettings={
                          serviceProvider.calendarIntegration.meetSettings || {
                            requireAuthentication: true,
                            allowExternalGuests: false,
                            defaultConferenceSolution: 'google_meet',
                          }
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <IntegrateGoogleServicesButton
                  serviceProviderId={serviceProvider.id}
                  hasIntegration={false}
                >
                  Connect Google
                </IntegrateGoogleServicesButton>
              )}
            </div>

            {/* Profile Management Section */}
            {isAuthorized && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Manage Profile</h4>
                <div className="flex flex-col gap-3">
                  <EditServiceProviderButton serviceProviderId={serviceProvider.id} />
                  <DeleteServiceProviderButton serviceProviderId={serviceProvider.id} />
                </div>
              </div>
            )}

            {/* Admin Controls Section */}
            {isAdmin && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Admin Controls</h4>
                <div className="flex flex-col gap-3">
                  {serviceProvider.status !== 'APPROVED' && (
                    <ApproveServiceProviderButton serviceProviderId={serviceProvider.id} />
                  )}
                  {serviceProvider.status !== 'SUSPENDED' && (
                    <SuspendServiceProviderButton serviceProviderId={serviceProvider.id} />
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                {serviceProvider.email}
              </p>
              {serviceProvider.whatsapp && (
                <p className="flex items-center gap-2">
                  <span className="font-medium">WhatsApp:</span>
                  {serviceProvider.whatsapp}
                </p>
              )}
              {serviceProvider.website && (
                <p className="flex items-center gap-2">
                  <span className="font-medium">Website:</span>
                  <a
                    href={serviceProvider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {serviceProvider.website}
                  </a>
                </p>
              )}
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
