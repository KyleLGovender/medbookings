'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  Building2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Navigation,
  PenSquare,
  Phone,
  Tag,
} from 'lucide-react';

import { OrganizationProfileSkeleton } from '@/components/skeletons/organization-profile-skeleton';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationOutlineButton } from '@/components/ui/navigation-button';
import { Separator } from '@/components/ui/separator';
import { DeleteOrganizationButton } from '@/features/organizations/components/delete-organization-button';
import { ProviderNetworkManager } from '@/features/organizations/components/provider-network-manager';
import { StaticLocationMap } from '@/features/organizations/components/static-location-map';
import { useOrganization } from '@/features/organizations/hooks/use-organization';

interface OrganizationProfileViewProps {
  organizationId: string;
  userId?: string;
}

// Type guard for coordinates
function isValidCoordinates(coords: unknown): coords is { lat: number; lng: number } {
  return (
    typeof coords === 'object' &&
    coords !== null &&
    'lat' in coords &&
    'lng' in coords &&
    typeof (coords as { lat: unknown }).lat === 'number' &&
    typeof (coords as { lng: unknown }).lng === 'number'
  );
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

  // Check if current user is a member of this organization with admin privileges
  const isOwner = organization.memberships?.some(
    (membership) =>
      membership.userId === userId &&
      ['OWNER', 'ADMIN'].includes(membership.role) &&
      membership.status === 'ACTIVE'
  );

  const getBillingModelLabel = (model: string) => {
    switch (model) {
      case 'CONSOLIDATED':
        return 'Consolidated Billing';
      case 'PER_LOCATION':
        return 'Per-Location Billing';
      default:
        return model;
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
          <StatusBadge
            status={organization.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'}
          />
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Organization Details</h2>
            <p className="text-sm text-muted-foreground">
              Basic information and contact details for your organization.
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <NavigationOutlineButton href={`/organizations/${organization.id}/edit/basic-info`}>
                <PenSquare className="h-4 w-4" />
                Edit Basic Info
              </NavigationOutlineButton>
            </div>
          )}
        </div>
        <Separator className="my-4" />

        <div className="space-y-6">
          {organization.logo && (
            <div className="flex justify-start">
              <Image
                src={organization.logo}
                alt={organization.name}
                width={128}
                height={128}
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Locations</h2>
            <p className="text-sm text-muted-foreground">
              Physical locations associated with this organization.
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <NavigationOutlineButton href={`/organizations/${organization.id}/edit/locations`}>
                <PenSquare className="h-4 w-4" />
                Edit Locations
              </NavigationOutlineButton>
            </div>
          )}
        </div>
        <Separator className="my-4" />

        {organization.locations && organization.locations.length > 0 ? (
          <div className="space-y-6">
            {organization.locations.map((location, index: number) => (
              <Card key={location.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {location.name}
                    </CardTitle>
                    {isValidCoordinates(location.coordinates) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          const { lat, lng } = location.coordinates as { lat: number; lng: number };
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                            '_blank'
                          );
                        }}
                      >
                        <Navigation className="h-4 w-4" />
                        Directions
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Information Grid */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left Column - Details */}
                    <div className="space-y-4">
                      {/* Address */}
                      <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium text-foreground">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Address
                        </h3>
                        <p className="pl-6 text-sm text-muted-foreground">
                          {location.formattedAddress}
                        </p>
                        {isValidCoordinates(location.coordinates) && (
                          <div className="pl-6">
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-primary hover:underline"
                              onClick={() => {
                                const { lat, lng } = location.coordinates as {
                                  lat: number;
                                  lng: number;
                                };
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                                  '_blank'
                                );
                              }}
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              View on Google Maps
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <h3 className="flex items-center gap-2 font-medium text-foreground">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            Phone Number
                          </h3>
                          {location.phone ? (
                            <a
                              href={`tel:${location.phone}`}
                              className="pl-6 text-sm text-primary hover:underline"
                            >
                              {location.phone}
                            </a>
                          ) : (
                            <p className="pl-6 text-sm text-muted-foreground">Not provided</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h3 className="flex items-center gap-2 font-medium text-foreground">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            Email Address
                          </h3>
                          {location.email ? (
                            <a
                              href={`mailto:${location.email}`}
                              className="pl-6 text-sm text-primary hover:underline"
                            >
                              {location.email}
                            </a>
                          ) : (
                            <p className="pl-6 text-sm text-muted-foreground">Not provided</p>
                          )}
                        </div>
                      </div>

                      {/* Search Terms */}
                      <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium text-foreground">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          Search Terms
                        </h3>
                        {location.searchTerms && location.searchTerms.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pl-6">
                            {location.searchTerms.map((term: string) => (
                              <Badge key={term} variant="secondary" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="pl-6 text-sm text-muted-foreground">
                            No search terms provided
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Map */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground">Location Map</h3>
                      <div className="rounded-lg border bg-muted/50 p-1">
                        {location.coordinates &&
                        typeof location.coordinates === 'object' &&
                        'lat' in location.coordinates &&
                        'lng' in location.coordinates ? (
                          <StaticLocationMap
                            coordinates={location.coordinates as { lat: number; lng: number }}
                            locationName={location.name}
                          />
                        ) : (
                          <div className="flex h-[250px] items-center justify-center rounded-lg bg-muted">
                            <div className="text-center">
                              <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
                              <p className="mt-2 text-sm font-medium text-muted-foreground">
                                No coordinates available
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Map cannot be displayed
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
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

      {/* Billing */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Billing Model</h2>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <NavigationOutlineButton href={`/organizations/${organization.id}/edit/billing`}>
                <PenSquare className="h-4 w-4" />
                Edit Billing Model
              </NavigationOutlineButton>
            </div>
          )}
        </div>
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
            {organization.memberships.map((membership) => (
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

      {/* Provider Network Section */}
      {isOwner && <ProviderNetworkManager organizationId={organization.id} />}
    </div>
  );
}
