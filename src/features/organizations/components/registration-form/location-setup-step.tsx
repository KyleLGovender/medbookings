'use client';

import { useCallback, useEffect, useState } from 'react';

import { AlertCircle, Building, Info, MapPin, Plus, Trash2 } from 'lucide-react';
import { FieldError, useFieldArray, useFormContext } from 'react-hook-form';

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
import { OrganizationRegistrationData } from '@/features/organizations/types/types';
import { isDevelopment } from '@/lib/constants';
import { logger } from '@/lib/logger';

import { GoogleMapsLocationPicker } from '../google-maps-location-picker';

// Type guard for field array errors
type FieldArrayError = Record<string, FieldError | undefined>;

function isFieldArrayError(error: unknown): error is FieldArrayError[] {
  return (
    Array.isArray(error) && error.every((item) => typeof item === 'object' || item === undefined)
  );
}

export function LocationSetupStep() {
  const form = useFormContext<OrganizationRegistrationData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'locations',
  });

  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Function to update form errors
  const updateFormErrors = useCallback(() => {
    // Collect location errors
    const locationErrors =
      form.formState.errors.locations && isFieldArrayError(form.formState.errors.locations)
        ? form.formState.errors.locations.flatMap((locationError, index) => {
            if (!locationError) return [];

            return Object.entries(locationError).map(([field, error]) => {
              const errorMessage =
                typeof error === 'object' && error && 'message' in error
                  ? String(error.message)
                  : String(error);
              return `Location ${index + 1} - ${field}: ${errorMessage}`;
            });
          })
        : [];

    setFormErrors(locationErrors);
  }, [form.formState.errors]);

  // Watch for validation errors and update when form state changes
  useEffect(() => {
    if (form.formState.isSubmitted) {
      updateFormErrors();
    }
  }, [form.formState.isSubmitted, form.formState.errors, updateFormErrors]);

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

  const handleLocationSelect = useCallback(
    async (locationIndex: number, locationData: any) => {
      logger.debug('forms', 'Setting location data for index', {
        locationIndex,
        hasGooglePlaceId: !!locationData.googlePlaceId,
        hasFormattedAddress: !!locationData.formattedAddress,
      });

      form.setValue(`locations.${locationIndex}.googlePlaceId`, locationData.googlePlaceId);
      form.setValue(`locations.${locationIndex}.formattedAddress`, locationData.formattedAddress);
      form.setValue(`locations.${locationIndex}.coordinates`, locationData.coordinates);

      // Set search terms if available
      if (locationData.searchTerms && locationData.searchTerms.length > 0) {
        form.setValue(`locations.${locationIndex}.searchTerms`, locationData.searchTerms);
      }

      // Trigger validation for the updated fields
      await form.trigger([
        `locations.${locationIndex}.googlePlaceId`,
        `locations.${locationIndex}.formattedAddress`,
      ]);

      logger.debug('forms', 'Form values after location select', {
        locationIndex,
        hasValues: !!form.getValues(`locations.${locationIndex}`),
      });
      logger.debug('forms', 'Form errors after location select', {
        locationIndex,
        hasErrors: !!(isFieldArrayError(form.formState.errors.locations)
          ? form.formState.errors.locations[locationIndex]
          : undefined),
      });
    },
    [form]
  );

  return (
    <div className="space-y-6">
      {/* Display form errors at the top */}
      {formErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Form Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Location Setup</h2>
        <p className="text-muted-foreground">
          Add your practice locations where patients will visit. Use the interactive map to pinpoint
          exact locations.
        </p>
      </div>

      {/* Locations List */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No locations added yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Add your practice locations to help patients find you, or skip this step to
                configure later.
              </p>
              <Button onClick={addLocation} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
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
                      size="sm"
                      onClick={() => remove(index)}
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`locations.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Main Branch, Downtown Clinic" {...field} />
                          </FormControl>
                          <FormDescription>
                            A friendly name to identify this location
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`locations.${index}.searchTerms`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Search Terms</FormLabel>
                          <FormControl>
                            <InputTags
                              value={field.value || []}
                              onChange={(newValue) => {
                                field.onChange(newValue);
                                // Explicitly trigger form update
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
                            areas)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Google Maps Location Picker */}
                  <GoogleMapsLocationPicker
                    onLocationSelect={(locationData) => handleLocationSelect(index, locationData)}
                    initialLocation={
                      form.getValues(`locations.${index}.coordinates.lat`)
                        ? {
                            coordinates: form.getValues(`locations.${index}.coordinates`),
                            formattedAddress: form.getValues(`locations.${index}.formattedAddress`),
                          }
                        : undefined
                    }
                  />

                  {/* Display selected address */}
                  <FormField
                    control={form.control}
                    name={`locations.${index}.formattedAddress`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selected Address *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                            placeholder="Select a location using the map above"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hidden fields for Google data */}
                  <FormField
                    control={form.control}
                    name={`locations.${index}.googlePlaceId`}
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Show validation errors for this location */}
                  {isFieldArrayError(form.formState.errors.locations) &&
                    form.formState.errors.locations[index] && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Location {index + 1} Errors</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc space-y-1 pl-5">
                            {Object.entries(form.formState.errors.locations[index] || {}).map(
                              ([field, error]) => (
                                <li key={field} className="text-sm">
                                  <strong>{field}:</strong>{' '}
                                  {typeof error === 'object' && error && 'message' in error
                                    ? String(error.message)
                                    : String(error)}
                                </li>
                              )
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                  <Separator />

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`locations.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+27 21 123 4567" {...field} />
                          </FormControl>
                          <FormDescription>Direct line for this location</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`locations.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="location@yourorganization.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Email for this specific location</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Debug info for development */}
                  {isDevelopment && (
                    <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                      <div>Location {index + 1} Debug:</div>
                      <div>Name: {form.getValues(`locations.${index}.name`) || 'Not set'}</div>
                      <div>
                        Place ID: {form.getValues(`locations.${index}.googlePlaceId`) || 'Not set'}
                      </div>
                      <div>
                        Address:{' '}
                        {form.getValues(`locations.${index}.formattedAddress`) || 'Not set'}
                      </div>
                      <div>
                        Search Terms:{' '}
                        {form.getValues(`locations.${index}.searchTerms`)?.join(', ') || 'Not set'}
                      </div>
                      <div>
                        Errors:{' '}
                        {JSON.stringify(
                          isFieldArrayError(form.formState.errors.locations)
                            ? form.formState.errors.locations[index] || {}
                            : {},
                          null,
                          2
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addLocation}
              className="flex w-full items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Location
            </Button>
          </>
        )}
      </div>

      {/* Skip Option */}
      {fields.length === 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium">Skip for now?</div>
                <div className="text-muted-foreground">
                  You can continue without adding locations and set them up later from your
                  organization dashboard.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall form debug info */}
      {isDevelopment && (
        <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
          <div>Form Debug Info:</div>
          <div>Form Valid: {form.formState.isValid ? '✓' : '✗'}</div>
          <div>Locations Count: {fields.length}</div>
          <div>All Errors: {JSON.stringify(form.formState.errors, null, 2)}</div>
        </div>
      )}
    </div>
  );
}
