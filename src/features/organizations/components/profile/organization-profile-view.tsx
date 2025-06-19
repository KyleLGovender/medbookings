'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Building2, Globe, Mail, MapPin, PenSquare, Phone, Tag } from 'lucide-react';

import { OrganizationProfileSkeleton } from '@/components/skeletons/organization-profile-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeleteOrganizationButton } from '@/features/organizations/components/delete-organization-button';
import { StaticLocationMap } from '@/features/organizations/components/static-location-map';
import { useOrganization } from '@/features/organizations/hooks/use-organization';

interface OrganizationProfileViewProps {
  organizationId: string;
  userId?: string;
}

export function OrganizationProfileView({ organizationId, userId }: OrganizationProfileViewProps) {
  const router = useRouter();
  const { data: organization, isLoading, error } = useOrganization(organizationId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <OrganizationProfileSkeleton />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h2 className="text-xl font-semibold text-destructive">Error loading organization</h2>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : 'Unable to load organization details'}
          </p>
          <Button className="mt-4" onClick={() => router.push('/profile')}>
            View Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if current user is a member of this organization
  const isOwner = organization.memberships?.some(
    (membership: any) => membership.userId === userId && membership.role === 'ADMIN'
  );

  const getBillingModelLabel = (model: string) => {
    switch (model) {
      case 'CONSOLIDATED':
        return 'Consolidated Billing';
      case 'PER_LOCATION':
        return 'Per-Location Billing';
      case 'HYBRID':
        return 'Hybrid Billing';
      default:
        return model;
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
          <p className="text-muted-foreground">Status: {organization.status}</p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link href={`/organizations/${organization.id}/edit`}>
              <Button variant="outline" className="flex items-center gap-2">
                <PenSquare className="h-4 w-4" />
                Edit Organization
              </Button>
            </Link>
            <DeleteOrganizationButton
              organizationId={organization.id}
              organizationName={organization.name}
              redirectPath="/profile"
            />
          </div>
        )}
      </div>

      {/* Organization Details Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Organization Details</h2>
        <p className="text-sm text-muted-foreground">
          Basic information and contact details for your organization.
        </p>
        <Separator className="my-4" />

        <div className="space-y-6">
          {organization.logo && (
            <div className="flex justify-start">
              <img
                src={organization.logo}
                alt={organization.name}
                className="h-32 w-32 rounded-lg object-cover"
              />
            </div>
          )}

          <div>
            <h3 className="font-medium">Organization Name</h3>
            <p>{organization.name}</p>
          </div>

          {organization.description && (
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="whitespace-pre-line">{organization.description}</p>
            </div>
          )}

          {organization.email && (
            <div>
              <h3 className="font-medium">Email</h3>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${organization.email}`} className="text-primary hover:underline">
                  {organization.email}
                </a>
              </div>
            </div>
          )}

          {organization.phone && (
            <div>
              <h3 className="font-medium">Phone</h3>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${organization.phone}`} className="text-primary hover:underline">
                  {organization.phone}
                </a>
              </div>
            </div>
          )}

          {organization.website && (
            <div>
              <h3 className="font-medium">Website</h3>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {organization.website}
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Locations Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Locations</h2>
        <p className="text-sm text-muted-foreground">
          Physical locations associated with this organization.
        </p>
        <Separator className="my-4" />

        {organization.locations && organization.locations.length > 0 ? (
          <div className="space-y-6">
            {organization.locations.map((location: any, index: number) => (
              <Card key={location.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {location.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        Search Terms
                      </h3>
                      {location.searchTerms && location.searchTerms.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {location.searchTerms.map((term: string) => (
                            <Badge key={term} variant="secondary">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No search terms provided.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center py-4">
                    {location.coordinates &&
                    typeof location.coordinates === 'object' &&
                    'lat' in location.coordinates &&
                    'lng' in location.coordinates ? (
                      <StaticLocationMap
                        coordinates={location.coordinates as { lat: number; lng: number }}
                        locationName={location.name}
                      />
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                    <p>{location.formattedAddress}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </h3>
                      {location.phone ? (
                        <a href={`tel:${location.phone}`} className="text-primary hover:underline">
                          {location.phone}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not provided.</p>
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </h3>
                      {location.email ? (
                        <a
                          href={`mailto:${location.email}`}
                          className="text-primary hover:underline"
                        >
                          {location.email}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not provided.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No locations added</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add locations to help patients find your organization.
            </p>
          </div>
        )}
      </Card>

      {/* Organization Details Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Billing Model</h2>
        <Separator className="my-4" />
        <div className="space-y-6">
          <div>
            <h3 className="font-medium">Billing Model</h3>
            <p>{getBillingModelLabel(organization.billingModel)}</p>
          </div>
        </div>
      </Card>

      {/* Team Members Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Team Members</h2>
        <p className="text-sm text-muted-foreground">
          Members and their roles within the organization.
        </p>
        <Separator className="my-4" />

        {organization.memberships && organization.memberships.length > 0 ? (
          <div className="space-y-4">
            {organization.memberships.map((membership: any) => (
              <div key={membership.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {membership.user?.name || membership.user?.email || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">Role: {membership.role}</p>
                    <p className="text-sm text-muted-foreground">Status: {membership.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No team members found</p>
          </div>
        )}
      </Card>

      {/* Providers Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold">Providers</h2>
        <p className="text-sm text-muted-foreground">
          Providers associated with this organization.
        </p>
        <Separator className="my-4" />

        {organization.providers && organization.providers.length > 0 ? (
          <div className="space-y-4">
            {organization.providers.map((provider: any) => (
              <div key={provider.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">Role: {provider.role}</p>
                    <p className="text-sm text-muted-foreground">Status: {provider.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No providers found</p>
          </div>
        )}
      </Card>
    </div>
  );
}
