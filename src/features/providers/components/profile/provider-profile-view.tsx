'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PenSquare } from 'lucide-react';

import { ProviderProfileSkeleton } from '@/components/skeletons/provider-profile-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeleteProviderButton } from '@/features/providers/components/delete-provider-button';
import { OrganizationConnectionsManager } from '@/features/providers/components/organization-connections-manager';
import { RequirementSubmissionCard } from '@/features/providers/components/requirement-submission-card';
// Remove server-side import - will use inline logic
import { useProvider } from '@/features/providers/hooks/use-provider';

interface ProviderProfileViewProps {
  providerId: string;
  userId?: string;
}

export function ProviderProfileView({ providerId, userId }: ProviderProfileViewProps) {
  const router = useRouter();
  const { data: provider, isLoading, error } = useProvider(providerId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <ProviderProfileSkeleton />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h2 className="text-xl font-semibold text-destructive">Error loading provider</h2>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : 'Unable to load provider details'}
          </p>
          <Button className="mt-4" onClick={() => router.push('/profile')}>
            View Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if current user is the owner of this profile
  const isOwner = userId === provider.userId;

  // For provider type, use a generic label since we don't have the actual type name
  const providerTypeName = provider.providerType?.name || 'Healthcare Provider';

  return (
    <div className="space-y-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{provider.name}</h1>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <DeleteProviderButton
              providerId={provider.id}
              providerName={provider.name}
              redirectPath="/profile"
            />
          </div>
        )}
      </div>

      {/* Basic Information Section */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Basic Information</h2>
            <p className="text-sm text-muted-foreground">
              Provider details and contact information.
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/providers/${provider.id}/edit/basic-info`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <PenSquare className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div>
          <h3 className="font-medium">Provider Type</h3>
          <p>{providerTypeName}</p>

          {provider.providerType?.description && (
            <div className="mt-4">
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">{provider.providerType.description}</p>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-6">
          <div>
            <h3 className="font-medium">Name</h3>
            <p>{provider.name}</p>
          </div>

          {provider.image && (
            <div className="flex justify-start">
              <img
                src={provider.image}
                alt={provider.name}
                className="h-40 w-40 rounded-full object-cover"
              />
            </div>
          )}

          <div>
            <h3 className="font-medium">Email</h3>
            <p>{provider.email}</p>
          </div>

          <div>
            <h3 className="font-medium">WhatsApp</h3>
            <p>{provider.whatsapp || 'Not provided'}</p>
          </div>

          {provider.website && (
            <div>
              <h3 className="font-medium">Website</h3>
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {provider.website}
              </a>
            </div>
          )}

          <div>
            <h3 className="font-medium">Show Prices</h3>
            <p className="text-sm text-muted-foreground">
              {provider.showPrice
                ? 'Yes - Prices are displayed to patients'
                : 'No - Prices are not displayed to patients'}
            </p>
          </div>

          <div>
            <h3 className="font-medium">Languages</h3>
            <div className="flex flex-wrap gap-1">
              {provider.languages.map((language: string) => (
                <span key={language} className="rounded-full bg-muted px-2 py-1 text-xs">
                  {language}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium">Bio</h3>
            <p className="whitespace-pre-line">{provider.bio || 'No bio provided'}</p>
          </div>
        </div>
      </Card>

      {/* Services Section */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Services</h2>
            <p className="text-sm text-muted-foreground">Services offered and fee structure.</p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/providers/${provider.id}/edit/services`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <PenSquare className="h-4 w-4" />
                  Edit Services
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {provider.services && provider.services.length > 0 ? (
          <div className="space-y-4">
            {provider.services
              .sort((a, b) => (a.displayPriority ?? 999) - (b.displayPriority ?? 999))
              .map((service) => {
              // Get service configuration with fallback to defaults (client-side logic)
              const customConfig = provider.serviceConfigs?.find(config => config.serviceId === service.id);
              const isCustomConfig = !!customConfig;
              
              const effectivePrice = customConfig?.price ?? service.defaultPrice;
              const effectiveDuration = customConfig?.duration ?? service.defaultDuration;
              const isOnlineAvailable = customConfig?.isOnlineAvailable ?? true;
              const isInPerson = customConfig?.isInPerson ?? false;
              
              return (
                <div key={service.id} className="rounded-md border p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{service.name}</h3>
                      {isCustomConfig && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                          Custom Rates
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                    )}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center">
                        <span className="w-16 text-xs text-muted-foreground">Price:</span>
                        <span className="text-sm font-semibold text-primary">
                          R{effectivePrice || 'Varies'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-16 text-xs text-muted-foreground">Duration:</span>
                        <span className="text-sm">{effectiveDuration || 'Varies'} min</span>
                      </div>
                      {(isOnlineAvailable || isInPerson) && (
                        <div className="flex items-center">
                          <span className="w-16 text-xs text-muted-foreground">Available:</span>
                          <div className="flex gap-2">
                            {isOnlineAvailable && (
                              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                Online
                              </span>
                            )}
                            {isInPerson && (
                              <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
                                In-Person
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No services listed</p>
        )}
      </Card>

      {/* Regulatory Requirements Section */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Regulatory Requirements</h2>
            <p className="text-sm text-muted-foreground">Regulatory information and documents.</p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/providers/${provider.id}/edit/regulatory-requirements`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <PenSquare className="h-4 w-4" />
                  Edit Requirements
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {provider.requirementSubmissions && provider.requirementSubmissions.length > 0 ? (
          <div className="space-y-4">
            {provider.requirementSubmissions
              .slice()
              .sort((a: any, b: any) => {
                // Sort by requirementType displayPriority to maintain consistent order
                const priorityA = a.requirementType?.displayPriority ?? 999;
                const priorityB = b.requirementType?.displayPriority ?? 999;
                return priorityA - priorityB;
              })
              .map((submission) => (
                <RequirementSubmissionCard key={submission.id} submission={submission} />
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No regulatory requirements submitted</p>
        )}
      </Card>

      {/* Organization Connections Section */}
      {isOwner && <OrganizationConnectionsManager />}
    </div>
  );
}
