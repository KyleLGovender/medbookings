'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { PenSquare } from 'lucide-react';

import CalendarLoader from '@/components/calendar-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SerializedServiceProvider } from '@/features/providers/types/types';

interface ProviderProfileViewProps {
  providerId: string;
  userId?: string;
}

export function ProviderProfileView({ providerId, userId }: ProviderProfileViewProps) {
  const router = useRouter();

  // Fetch service provider data using Tanstack Query
  const {
    data: provider,
    isLoading,
    error,
  } = useQuery<SerializedServiceProvider>({
    queryKey: ['serviceProvider', providerId],
    queryFn: async () => {
      const response = await fetch(`/api/providers/${providerId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/404');
          return null;
        }
        throw new Error('Failed to fetch service provider');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <CalendarLoader
        message="Loading Provider"
        submessage="Retrieving provider details..."
        showAfterMs={0}
      />
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
          <Button className="mt-4" onClick={() => router.push('/providers')}>
            View All Providers
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if current user is the owner of this profile
  const isOwner = userId === provider.userId;

  // For provider type, use a generic label since we don't have the actual type name
  const providerTypeName = provider.serviceProviderType?.name || 'Healthcare Provider';

  return (
    <div className="space-y-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{provider.name}</h1>
          <p className="mt-2 text-muted-foreground">{providerTypeName}</p>
        </div>

        {isOwner && (
          <Link href={`/service-provider/${provider.id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <PenSquare className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Basic Information Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">Provider details and contact information.</p>
        <Separator className="my-4" />

        <div className="space-y-6">
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
            <h3 className="font-medium">Name</h3>
            <p>{provider.name}</p>
          </div>

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

      {/* Provider Type Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Provider Type</h2>
        <p className="text-sm text-muted-foreground">Medical profession or specialty.</p>
        <Separator className="my-4" />

        <div>
          <h3 className="font-medium">Provider Type</h3>
          <p>{providerTypeName}</p>

          {provider.serviceProviderType?.description && (
            <div className="mt-4">
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">{provider.serviceProviderType.description}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Services Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Services</h2>
        <p className="text-sm text-muted-foreground">Services offered and fee structure.</p>
        <Separator className="my-4" />

        {provider.services && provider.services.length > 0 ? (
          <div className="space-y-4">
            {provider.services.map((service) => (
              <div key={service.id} className="rounded-md border p-4">
                <div className="flex justify-between">
                  <h3 className="font-medium">{service.name}</h3>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      R{service.defaultPrice || 'Varies'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {service.defaultDuration || 'Varies'} min
                    </div>
                  </div>
                </div>
                {service.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No services listed</p>
        )}
      </Card>

      {/* Regulatory Requirements Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Regulatory Requirements</h2>
        <p className="text-sm text-muted-foreground">Regulatory information and documents.</p>
        <Separator className="my-4" />

        {provider.requirementSubmissions && provider.requirementSubmissions.length > 0 ? (
          <div className="space-y-4">
            {provider.requirementSubmissions.map((submission) => (
              <div key={submission.id} className="rounded-md border p-4">
                <h3 className="font-medium">{submission.requirementType?.name || 'Requirement'}</h3>
                {submission.requirementType?.description && (
                  <p className="text-sm text-muted-foreground">
                    {submission.requirementType.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Submitted: {new Date(submission.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No regulatory requirements submitted</p>
        )}
      </Card>
    </div>
  );
}
