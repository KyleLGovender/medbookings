'use client';

import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Organization } from '@prisma/client';
import { AlertTriangle, Calendar, Clock, MapPin, Repeat, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TimePicker } from '@/components/ui/time-picker';
import { ServiceSelectionSection } from '@/features/calendar/components/availability/service-selection-section';
import {
  useAvailabilityById,
  useUpdateAvailability,
} from '@/features/calendar/hooks/use-availability';
import { updateAvailabilityDataSchema } from '@/features/calendar/types/schemas';
import {
  AvailabilityWithRelations,
  CalculatedAvailabilitySlotWithRelations,
  SchedulingRule,
  ServiceAvailabilityConfigWithRelations,
  UpdateAvailabilityData,
} from '@/features/calendar/types/types';
import { useCurrentUserOrganizations } from '@/features/organizations/hooks/use-current-user-organizations';
import { useOrganizationLocations } from '@/features/organizations/hooks/use-organization-locations';
import { OrganizationLocation } from '@/features/organizations/types/types';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useToast } from '@/hooks/use-toast';

// Using centralized OrganizationLocation type instead of local interface

interface AvailabilityEditFormProps {
  availabilityId: string;
  editMode?: 'single' | 'series' | 'future'; // How to handle recurring series
  scope?: 'single' | 'future' | 'all'; // SeriesActionScope for recurring availability
  onSuccess?: (data: AvailabilityWithRelations) => void;
  onCancel?: () => void;
}

type FormValues = UpdateAvailabilityData;

export function AvailabilityEditForm({
  availabilityId,
  editMode = 'single',
  scope = 'single',
  onSuccess,
  onCancel,
}: AvailabilityEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingBookings, setHasExistingBookings] = useState(false);
  const { toast } = useToast();

  // Fetch existing availability data
  const { data: availability, isLoading, error } = useAvailabilityById(availabilityId);

  // Fetch user data for profile information
  const { data: currentUserProvider } = useCurrentUserProvider();
  const { data: userOrganizations = [] } = useCurrentUserOrganizations();

  // Fetch organization locations
  const organizationIds = userOrganizations.map((org: Organization) => org.id);
  const { data: availableLocations = [], isLoading: isLocationsLoading } =
    useOrganizationLocations(organizationIds);

  const form = useForm<FormValues>({
    resolver: zodResolver(updateAvailabilityDataSchema),
    mode: 'onChange',
  });

  const updateMutation = useUpdateAvailability({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Availability updated successfully',
      });
      onSuccess?.(data);
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (availability) {
      // Check for existing bookings
      const availabilityWithSlots = availability as AvailabilityWithRelations;
      const bookingCount =
        availabilityWithSlots.calculatedSlots?.filter(
          (slot: CalculatedAvailabilitySlotWithRelations) => slot.booking
        ).length || 0;
      setHasExistingBookings(bookingCount > 0);

      // Populate form with current values
      const availabilityWithId = availability as AvailabilityWithRelations;
      form.reset({
        id: availabilityWithId.id,
        providerId: availabilityWithId.providerId,
        organizationId: availabilityWithId.organizationId || undefined,
        locationId: availabilityWithId.locationId || undefined,
        startTime: availabilityWithId.startTime,
        endTime: availabilityWithId.endTime,
        isRecurring: availabilityWithId.isRecurring,
        recurrencePattern: availabilityWithId.recurrencePattern || undefined,
        schedulingRule: availabilityWithId.schedulingRule,
        schedulingInterval: availabilityWithId.schedulingInterval || undefined,
        isOnlineAvailable: availabilityWithId.isOnlineAvailable,
        requiresConfirmation: availabilityWithId.requiresConfirmation,
        services: availabilityWithId.availableServices?.map(
          (config: ServiceAvailabilityConfigWithRelations) => ({
            serviceId: config.serviceId,
            duration: config.duration,
            price: Number(config.price),
          })
        ),
      });
    }
  }, [availability, form]);

  const watchIsRecurring = form.watch('isRecurring');
  const watchSchedulingRule = form.watch('schedulingRule');
  const watchIsOnlineAvailable = form.watch('isOnlineAvailable');
  const watchLocationId = form.watch('locationId');

  // Memoize selected location to avoid repeated lookups
  const selectedLocation = useMemo(() => {
    if (!watchLocationId) return null;
    return (
      availableLocations
        .filter((loc) => loc.id)
        .find((loc: OrganizationLocation) => loc.id === watchLocationId) || null
    );
  }, [watchLocationId, availableLocations]);

  const onSubmit = async (data: FormValues) => {
    if (updateMutation.isPending) return;

    // Validate scope for recurring availability
    const typedAvailability = availability as AvailabilityWithRelations;
    if (typedAvailability?.isRecurring) {
      if (!scope || !['single', 'future', 'all'].includes(scope)) {
        toast({
          title: 'Error',
          description: 'Invalid scope parameter for recurring availability',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Include scope parameter for recurring availability edits
      const updatePayload = {
        ...data,
        ...(typedAvailability?.isRecurring && { scope }),
      };
      await updateMutation.mutateAsync(updatePayload);
    } catch (error) {
      // Error handled by mutation onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading availability...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load availability:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!availability) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              Availability not found or you don&apos;t have permission to edit it.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Availability
          </CardTitle>
          <div className="flex items-center gap-2">
            {(availability as AvailabilityWithRelations)?.isRecurring && (
              <Badge variant="secondary">
                <Repeat className="mr-1 h-3 w-3" />
                Recurring
              </Badge>
            )}
            {hasExistingBookings && (
              <Badge variant="outline">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Has Bookings
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Warnings for existing bookings */}
        {hasExistingBookings && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Existing Bookings</AlertTitle>
            <AlertDescription>
              This availability has existing bookings. Changes to time and date will be restricted
              to prevent conflicts. You can modify other settings like confirmation requirements.
            </AlertDescription>
          </Alert>
        )}

        {/* Recurring series edit mode selection */}
        {(availability as AvailabilityWithRelations)?.isRecurring && (
          <Alert className="mb-6">
            <Repeat className="h-4 w-4" />
            <AlertTitle>Recurring Availability</AlertTitle>
            <AlertDescription>
              Changes will apply to{' '}
              {editMode === 'single'
                ? 'this occurrence only'
                : editMode === 'series'
                  ? 'all occurrences in the series'
                  : 'this and future occurrences'}
              .
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Information (Read-only) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Availability Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Created by</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {(availability as AvailabilityWithRelations)?.createdBy?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {(availability as AvailabilityWithRelations)?.providerId ===
                      (availability as AvailabilityWithRelations)?.createdBy?.id
                        ? 'Provider (Self)'
                        : 'Organization Role'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {(availability as AvailabilityWithRelations)?.provider?.name ||
                        'Unknown Provider'}
                    </div>
                    <div className="text-xs text-gray-600">Service Provider</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Basic Time Settings */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <DatePicker
                          date={field.value}
                          onChange={(date) => {
                            if (date && field.value && !hasExistingBookings) {
                              const newDateTime = new Date(field.value);
                              newDateTime.setFullYear(date.getFullYear());
                              newDateTime.setMonth(date.getMonth());
                              newDateTime.setDate(date.getDate());
                              field.onChange(newDateTime);
                            }
                          }}
                        />
                        <TimePicker
                          date={field.value}
                          onChange={hasExistingBookings ? undefined : field.onChange}
                        />
                      </div>
                    </FormControl>
                    {hasExistingBookings && (
                      <FormDescription>Cannot modify time when bookings exist</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <DatePicker
                          date={field.value}
                          onChange={(date) => {
                            if (date && field.value && !hasExistingBookings) {
                              const newDateTime = new Date(field.value);
                              newDateTime.setFullYear(date.getFullYear());
                              newDateTime.setMonth(date.getMonth());
                              newDateTime.setDate(date.getDate());
                              field.onChange(newDateTime);
                            }
                          }}
                        />
                        <TimePicker
                          date={field.value}
                          onChange={hasExistingBookings ? undefined : field.onChange}
                        />
                      </div>
                    </FormControl>
                    {hasExistingBookings && (
                      <FormDescription>Cannot modify time when bookings exist</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Scheduling Rules */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Clock className="h-4 w-4" />
                Scheduling Rules
              </h3>

              <FormField
                control={form.control}
                name="schedulingRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Scheduling</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={hasExistingBookings}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scheduling rule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SchedulingRule.CONTINUOUS}>
                          Continuous - Appointments start immediately after previous ends
                        </SelectItem>
                        <SelectItem value={SchedulingRule.ON_THE_HOUR}>
                          On the Hour - Appointments start only on the hour (9:00, 10:00, 11:00)
                        </SelectItem>
                        <SelectItem value={SchedulingRule.ON_THE_HALF_HOUR}>
                          On the Half Hour - Appointments start on the hour or half-hour (9:00,
                          9:30, 10:00)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {hasExistingBookings && (
                      <FormDescription>
                        Cannot modify scheduling rule when bookings exist
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <MapPin className="h-4 w-4" />
                Location
              </h3>

              {/* Online Availability Toggle */}
              <FormField
                control={form.control}
                name="isOnlineAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={hasExistingBookings}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available Online</FormLabel>
                      <FormDescription>Allow virtual appointments via video call</FormDescription>
                      {hasExistingBookings && (
                        <FormDescription className="text-yellow-600">
                          Cannot modify online availability when bookings exist
                        </FormDescription>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              {/* Physical Location Selection */}
              {isLocationsLoading ? (
                <div className="py-4 text-center text-muted-foreground">Loading locations...</div>
              ) : (
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Physical Location{!watchIsOnlineAvailable && ' (Required)'}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        required={!watchIsOnlineAvailable}
                        disabled={hasExistingBookings}
                        aria-label="Physical location selection"
                      >
                        <FormControl>
                          <SelectTrigger
                            className={field.value ? 'border-green-500 bg-green-50' : ''}
                            aria-describedby="location-description"
                          >
                            <SelectValue placeholder="Choose a physical location" />
                            {field.value && (
                              <div
                                className="flex items-center gap-2"
                                aria-label="Location selected"
                              >
                                <svg
                                  className="h-4 w-4 text-green-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableLocations
                            .filter((location) => location.id)
                            .map((location: OrganizationLocation) => (
                              <SelectItem key={location.id} value={location.id!}>
                                {location.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription id="location-description">
                        {selectedLocation ? (
                          <div className="font-medium text-green-700">
                            ✓ Selected: {selectedLocation.name}
                            {selectedLocation.formattedAddress && (
                              <div className="mt-1 text-sm text-muted-foreground">
                                {selectedLocation.formattedAddress}
                              </div>
                            )}
                          </div>
                        ) : watchIsOnlineAvailable ? (
                          'Select a physical location for in-person appointments (optional)'
                        ) : (
                          'You must select a physical location when online availability is disabled'
                        )}
                        {hasExistingBookings && (
                          <div className="mt-1 text-yellow-600">
                            Cannot modify location when bookings exist
                          </div>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Service Selection */}
            <ServiceSelectionSection
              providerId={(availability as AvailabilityWithRelations).providerId}
              organizationId={
                (availability as AvailabilityWithRelations).organizationId || undefined
              }
            />

            <Separator />

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Settings</h3>

              <FormField
                control={form.control}
                name="requiresConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requires Confirmation</FormLabel>
                      <FormDescription>
                        Manually approve bookings for this availability
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting || updateMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending || !form.formState.isValid}
                className="flex min-w-[140px] items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
