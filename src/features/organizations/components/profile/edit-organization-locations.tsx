'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Location, Organization } from '@prisma/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Building, Loader2, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';

import { InputTags } from '@/components/input-tags';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { GoogleMapsLocationPicker } from '@/features/organizations/components/google-maps-location-picker';
import { useUpdateOrganizationLocations } from '@/features/organizations/hooks/use-organization-updates';
import { OrganizationLocationsData } from '@/features/organizations/types/types';
import { organizationLocationsSchema } from '@/features/organizations/types/schemas';
import { toast } from '@/hooks/use-toast';
// Assuming Location type exists
import { isDevelopment } from '@/lib/constants';

interface EditOrganizationLocationsProps {
  organizationId: string;
  userId?: string;
}

export function EditOrganizationLocations({
  organizationId,
  userId,
}: EditOrganizationLocationsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current organization data including locations
  const {
    data: organization,
    isLoading: isLoadingOrganization,
    error: organizationError,
    refetch,
  } = useQuery<Organization & { locations: Location[] }>({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }
      return response.json();
    },
  });

  const form = useForm<OrganizationLocationsData>({
    resolver: zodResolver(organizationLocationsSchema),
    defaultValues: {
      locations: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'locations',
  });

  // Populate form with existing locations once organization data is loaded
  useEffect(() => {
    if (organization && organization.locations) {
      const formattedLocations = organization.locations.map((loc) => {
        const coordinates =
          loc.coordinates &&
          typeof loc.coordinates === 'object' &&
          loc.coordinates !== null &&
          'lat' in loc.coordinates &&
          'lng' in loc.coordinates
            ? {
                lat: (loc.coordinates as any).lat as number,
                lng: (loc.coordinates as any).lng as number,
              }
            : { lat: 0, lng: 0 }; // Default or error handling

        return {
          ...loc,
          id: loc.id || undefined, // Ensure id is string or undefined
          name: loc.name || '',
          googlePlaceId: loc.googlePlaceId || '',
          formattedAddress: loc.formattedAddress || '',
          coordinates,
          searchTerms: loc.searchTerms || [],
          phone: loc.phone || '',
          email: loc.email || '',
        };
      });
      form.reset({ locations: formattedLocations });
    }
  }, [organization, form]); // form.reset is stable, so form is the main dependency here along with organization

  const updateLocationsMutation = useUpdateOrganizationLocations();

  const addLocation = () => {
    append({
      name: '',
      googlePlaceId: '',
      formattedAddress: '',
      coordinates: { lat: 0, lng: 0 },
      searchTerms: [],
      phone: '',
      email: '',
    });
  };

  const handleLocationSelect = async (
    locationIndex: number,
    locationData: {
      googlePlaceId: string;
      formattedAddress: string;
      coordinates: { lat: number; lng: number };
    }
  ) => {
    update(locationIndex, {
      ...form.getValues(`locations.${locationIndex}`),
      googlePlaceId: locationData.googlePlaceId,
      formattedAddress: locationData.formattedAddress,
      coordinates: locationData.coordinates,
    });

    // Trigger validation for the updated fields
    await form.trigger([
      `locations.${locationIndex}.googlePlaceId`,
      `locations.${locationIndex}.formattedAddress`,
    ]);
  };

  async function onSubmit(data: OrganizationLocationsData) {
    setIsSubmitting(true);
    try {
      await updateLocationsMutation.mutateAsync({ organizationId, locations: data.locations });

      toast({
        title: 'Success',
        description: 'Organization locations updated successfully.',
      });

      // Invalidate and refetch organization data to get the latest locations
      await queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      refetch(); // Refetch the organization data for this component
      router.refresh(); // Refresh server components
    } catch (error) {
      toast({
        title: 'Error updating locations',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingOrganization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading organization data...</p>
      </div>
    );
  }

  if (organizationError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load organization data: {organizationError.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Manage Locations</h2>
          <p className="text-sm text-muted-foreground">
            Add, edit, or remove physical locations associated with your organization.
          </p>
        </div>
        <Separator />

        {fields.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No locations added yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Add your practice locations to help patients find you.
              </p>
              <p className="mb-4 text-center text-muted-foreground">test</p>
              <Button type="button" onClick={addLocation} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location {index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove Location</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`locations.${index}.name`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>Location Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Main Branch, Downtown Clinic"
                              {...formField}
                            />
                          </FormControl>
                          <FormDescription>
                            A friendly name to identify this location.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`locations.${index}.searchTerms`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>Search Terms</FormLabel>
                          <FormControl>
                            <InputTags
                              value={formField.value || []}
                              onChange={(newValue) => {
                                formField.onChange(newValue);
                                form.setValue(`locations.${index}.searchTerms`, newValue, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                });
                              }}
                              placeholder="Type term and press Enter"
                            />
                          </FormControl>
                          <FormDescription>
                            Add terms to help patients find this location (e.g., neighborhoods,
                            landmarks).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <GoogleMapsLocationPicker
                    onLocationSelect={(locationData) => handleLocationSelect(index, locationData)}
                    initialLocation={{
                      coordinates: form.getValues(`locations.${index}.coordinates`),
                      formattedAddress: form.getValues(`locations.${index}.formattedAddress`) || '',
                    }}
                  />

                  <FormField
                    control={form.control}
                    name={`locations.${index}.formattedAddress`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>Selected Address *</FormLabel>
                        <FormControl>
                          <Input
                            {...formField}
                            readOnly
                            placeholder="Select a location using the map above"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hidden fields for Google data - not strictly necessary to render if handled in state */}
                  <FormField
                    control={form.control}
                    name={`locations.${index}.googlePlaceId`}
                    render={({ field: formField }) => <Input {...formField} type="hidden" />}
                  />
                  <FormField
                    control={form.control}
                    name={`locations.${index}.coordinates.lat`}
                    render={({ field: formField }) => <Input {...formField} type="hidden" />}
                  />
                  <FormField
                    control={form.control}
                    name={`locations.${index}.coordinates.lng`}
                    render={({ field: formField }) => <Input {...formField} type="hidden" />}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`locations.${index}.phone`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 234 567 8900" {...formField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`locations.${index}.email`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="location@example.com" {...formField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {isDevelopment && (
                    <div className="mt-4 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                      <pre>{JSON.stringify(form.watch(`locations.${index}`), null, 2)}</pre>
                      <pre>{JSON.stringify(form.formState.errors.locations?.[index], null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={addLocation} disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" /> Add Another Location
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isDirty || !form.formState.isValid}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
