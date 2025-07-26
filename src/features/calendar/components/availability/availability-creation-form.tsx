'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { Organization } from '@prisma/client';
import { Calendar, Clock, MapPin, Repeat } from 'lucide-react';

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
import { CustomRecurrenceModal } from '@/features/calendar/components/availability/custom-recurrence-modal';
import { ServiceSelectionSection } from '@/features/calendar/components/availability/service-selection-section';
import { useCreateAvailability } from '@/features/calendar/hooks/use-availability';
import {
  createRecurrencePattern,
  getRecurrenceOptions,
} from '@/features/calendar/lib/recurrence-utils';
import { createAvailabilityDataSchema } from '@/features/calendar/types/schemas';
import {
  AvailabilityWithRelations,
  CreateAvailabilityData,
  CustomRecurrenceData,
  RecurrenceOption,
  SchedulingRule,
} from '@/features/calendar/types/types';
import { useCurrentUserOrganizations } from '@/features/organizations/hooks/use-current-user-organizations';
import { useOrganizationLocations } from '@/features/organizations/hooks/use-organization-locations';
import { OrganizationLocation } from '@/features/organizations/types/types';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useProviderAssociatedServices } from '@/features/providers/hooks/use-provider-associated-services';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityCreationFormProps {
  providerId: string;
  organizationId?: string;
  locationId?: string;
  onSuccess?: (data: AvailabilityWithRelations) => void;
  onCancel?: () => void;
}

type FormValues = CreateAvailabilityData;

/**
 * AvailabilityCreationForm - A comprehensive form for creating provider availability
 *
 * This form handles:
 * - Profile selection (provider vs organization)
 * - Time settings (date, start/end times)
 * - Recurrence patterns (including custom recurrence)
 * - Scheduling rules (continuous, hourly, half-hourly)
 * - Location management (online and physical locations)
 * - Service selection and configuration
 * - Additional settings (confirmation requirements)
 *
 * @param providerId - The ID of the provider
 * @param organizationId - Optional organization ID for organization-created availability
 * @param locationId - Optional pre-selected location ID
 * @param onSuccess - Callback fired when availability is created successfully
 * @param onCancel - Callback fired when the form is cancelled
 */
export function AvailabilityCreationForm({
  providerId,
  organizationId,
  locationId,
  onSuccess,
  onCancel,
}: AvailabilityCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customRecurrenceModalOpen, setCustomRecurrenceModalOpen] = useState(false);
  const [customRecurrenceData, setCustomRecurrenceData] = useState<
    CustomRecurrenceData | undefined
  >();
  const { toast } = useToast();

  // Fetch user data for profile selection
  const { data: currentUserProvider } = useCurrentUserProvider();
  const { data: userOrganizations = [] } = useCurrentUserOrganizations();

  // State for profile selection
  const [selectedCreatorType, setSelectedCreatorType] = useState<'provider' | 'organization'>(
    currentUserProvider ? 'provider' : 'organization'
  );
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    providerId || currentUserProvider?.id || ''
  );

  // Fetch provider's services
  const {
    data: availableServices,
    isLoading: isServicesLoading,
    error: servicesError,
  } = useProviderAssociatedServices(selectedProviderId);

  // Fetch organization locations
  const organizationIds = userOrganizations.map((org) => org.id);
  const { data: availableLocations = [], isLoading: isLocationsLoading } =
    useOrganizationLocations(organizationIds);

  const form = useForm<FormValues>({
    resolver: zodResolver(createAvailabilityDataSchema),
    defaultValues: {
      providerId: selectedProviderId,
      organizationId,
      locationId: locationId || undefined,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      isRecurring: false,
      schedulingRule: SchedulingRule.CONTINUOUS,
      isOnlineAvailable: true,
      requiresConfirmation: false,
      services: [],
    },
    mode: 'onChange',
  });

  // Update form when selectedProviderId changes
  useEffect(() => {
    form.setValue('providerId', selectedProviderId);
  }, [selectedProviderId, form]);

  const createMutation = useCreateAvailability({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Availability created successfully',
      });
      onSuccess?.(data);
    },
  });

  const watchIsOnlineAvailable = form.watch('isOnlineAvailable');
  const watchLocationId = form.watch('locationId');

  // Memoize selected location to avoid repeated lookups
  const selectedLocation = useMemo(() => {
    if (!watchLocationId) return null;
    return (
      availableLocations
        .filter((loc) => loc.id)
        .find((loc) => loc.id === watchLocationId) || null
    );
  }, [watchLocationId, availableLocations]);

  const onSubmit = async (data: FormValues) => {
    if (createMutation.isPending) return;

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomRecurrenceSave = (data: CustomRecurrenceData) => {
    const startTime = form.watch('startTime');
    const pattern = createRecurrencePattern(
      RecurrenceOption.CUSTOM,
      startTime,
      data.selectedDays,
      data.endDate ? data.endDate.toISOString().split('T')[0] : undefined
    );

    form.setValue('recurrencePattern', pattern);
    form.setValue('isRecurring', true);
    setCustomRecurrenceData(data);
    setCustomRecurrenceModalOpen(false);
  };

  const handleCustomRecurrenceCancel = () => {
    setCustomRecurrenceModalOpen(false);
  };

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Create Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Creating Availability</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Creating as</label>
                  <Select
                    value={selectedCreatorType}
                    onValueChange={(value: 'provider' | 'organization') => {
                      setSelectedCreatorType(value);
                      // Reset provider selection when changing creator type
                      if (value === 'provider' && currentUserProvider) {
                        setSelectedProviderId(currentUserProvider.id);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUserProvider && (
                        <SelectItem value="provider">Provider (Self)</SelectItem>
                      )}
                      {userOrganizations.length > 0 && (
                        <SelectItem value="organization">Organization Role</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <Select
                    value={selectedProviderId}
                    onValueChange={(value) => {
                      setSelectedProviderId(value);
                      form.setValue('providerId', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCreatorType === 'provider' && currentUserProvider && (
                        <SelectItem value={currentUserProvider.id}>
                          {currentUserProvider.name} (You)
                        </SelectItem>
                      )}
                      {selectedCreatorType === 'organization' && userOrganizations.length > 0 && (
                        <SelectItem value="" disabled>
                          Select an organization first to see providers
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Basic Time Settings */}
            <div className="space-y-4">
              {/* Single Date Picker */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onChange={(date) => {
                          if (date) {
                            // Update both start and end time dates
                            const currentStartTime = form.getValues('startTime');
                            const currentEndTime = form.getValues('endTime');

                            const newStartTime = new Date(currentStartTime);
                            newStartTime.setFullYear(date.getFullYear());
                            newStartTime.setMonth(date.getMonth());
                            newStartTime.setDate(date.getDate());

                            const newEndTime = new Date(currentEndTime);
                            newEndTime.setFullYear(date.getFullYear());
                            newEndTime.setMonth(date.getMonth());
                            newEndTime.setDate(date.getDate());

                            form.setValue('startTime', newStartTime);
                            form.setValue('endTime', newEndTime);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>Select the date for your availability slot</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Pickers */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <TimePicker date={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <TimePicker date={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Recurrence Settings */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Repeat className="h-4 w-4" />
                Recurrence Settings
              </h3>

              <FormField
                control={form.control}
                name="recurrencePattern"
                render={({ field }) => {
                  const startTime = form.watch('startTime');
                  const recurrenceOptions = getRecurrenceOptions(startTime);

                  return (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const option = value as RecurrenceOption;

                          if (option === RecurrenceOption.CUSTOM) {
                            setCustomRecurrenceModalOpen(true);
                          } else {
                            const pattern = createRecurrencePattern(option, startTime);
                            field.onChange(pattern);
                            form.setValue('isRecurring', option !== RecurrenceOption.NONE);
                          }
                        }}
                        defaultValue={field.value?.option || RecurrenceOption.NONE}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recurrence" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recurrenceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how often this availability should repeat.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormDescription>
                      This determines when appointments can be scheduled within your availability
                      period.
                    </FormDescription>
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
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available Online</FormLabel>
                      <FormDescription>Allow virtual appointments via video call</FormDescription>
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
                            .map((location) => (
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
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Service Selection */}
            {isServicesLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading services...</div>
            ) : servicesError ? (
              <div className="py-8 text-center text-destructive">Failed to load services.</div>
            ) : (
              <ServiceSelectionSection
                providerId={providerId}
                organizationId={organizationId}
                availableServices={(availableServices || []).map((s) => ({
                  ...s,
                  description: s.description ?? undefined,
                }))}
              />
            )}

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
                  disabled={isSubmitting || createMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || !form.formState.isValid}
                className="min-w-[140px]"
              >
                {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Availability'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* Custom Recurrence Modal */}
      <CustomRecurrenceModal
        isOpen={customRecurrenceModalOpen}
        onClose={handleCustomRecurrenceCancel}
        onSave={handleCustomRecurrenceSave}
        initialData={customRecurrenceData}
      />
    </Card>
  );
}
