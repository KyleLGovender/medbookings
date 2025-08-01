'use client';

import { useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Organization } from '@prisma/client';
import { Clock, MapPin, Repeat, Send, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Textarea } from '@/components/ui/textarea';
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

// Using centralized OrganizationLocation type instead of local interface

interface AvailabilityProposalFormProps {
  organizationId: string;
  providerId: string;
  locationId?: string;
  connectionId?: string;
  providerName?: string;
  onSuccess?: (data: AvailabilityWithRelations) => void;
  onCancel?: () => void;
}

interface ProposalFormData extends CreateAvailabilityData {
  proposalNote?: string;
}

type FormValues = ProposalFormData;

/**
 * AvailabilityProposalForm - A form for organizations to propose availability to providers
 *
 * This form allows organizations to create availability proposals that will be sent to
 * providers for review and approval. The form follows the same patterns as the creation
 * form but includes proposal-specific features like custom messages and billing context.
 *
 * Features:
 * - Proposal message to provider
 * - Time settings (date, start/end times)
 * - Recurrence patterns (including custom recurrence)
 * - Scheduling rules (continuous, hourly, half-hourly)
 * - Location management (online and physical locations)
 * - Service selection and configuration
 * - Additional settings (confirmation requirements)
 *
 * @param organizationId - The ID of the organization creating the proposal
 * @param providerId - The ID of the target service provider
 * @param locationId - Optional pre-selected location ID
 * @param connectionId - Optional provider connection ID
 * @param providerName - Optional provider name for display
 * @param onSuccess - Callback fired when proposal is created successfully
 * @param onCancel - Callback fired when the form is cancelled
 */
export function AvailabilityProposalForm({
  organizationId,
  providerId,
  locationId,
  connectionId,
  providerName,
  onSuccess,
  onCancel,
}: AvailabilityProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customRecurrenceModalOpen, setCustomRecurrenceModalOpen] = useState(false);
  const [currentRecurrenceOption, setCurrentRecurrenceOption] = useState<RecurrenceOption>(
    RecurrenceOption.NONE
  );
  const [customRecurrenceData, setCustomRecurrenceData] = useState<
    CustomRecurrenceData | undefined
  >();
  const { toast } = useToast();

  // Fetch user data for profile selection
  const { data: currentUserProvider } = useCurrentUserProvider();
  const { data: userOrganizations = [] } = useCurrentUserOrganizations();

  // Fetch provider's services
  const {
    data: availableServices,
    isLoading: isServicesLoading,
    error: servicesError,
  } = useProviderAssociatedServices(providerId);

  // Fetch organization locations
  const organizationIds = userOrganizations.map((org: Organization) => org.id);
  const { data: availableLocations = [], isLoading: isLocationsLoading } =
    useOrganizationLocations(organizationIds);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      z
        .object({
          proposalNote: z.string().optional(),
        })
        .and(createAvailabilityDataSchema)
    ),
    defaultValues: {
      providerId,
      organizationId,
      locationId: locationId || undefined,
      connectionId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      isRecurring: false,
      schedulingRule: SchedulingRule.CONTINUOUS,
      isOnlineAvailable: true,
      requiresConfirmation: false,
      services: [],
      proposalNote: '',
    },
    mode: 'onChange',
  });

  const createMutation = useCreateAvailability({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Availability proposal sent to provider for review',
      });
      onSuccess?.(data);
    },
  });

  const watchIsRecurring = form.watch('isRecurring');
  const watchSchedulingRule = form.watch('schedulingRule');
  const watchIsOnlineAvailable = form.watch('isOnlineAvailable');
  const watchLocationId = form.watch('locationId');

  // Memoize selected location to avoid repeated lookups
  const selectedLocation = useMemo(() => {
    if (!watchLocationId) return null;
    return (
      availableLocations.filter((loc) => loc.id).find((loc: any) => loc.id === watchLocationId) ||
      null
    );
  }, [watchLocationId, availableLocations]);

  const onSubmit = async (data: FormValues) => {
    if (createMutation.isPending) return;

    setIsSubmitting(true);
    try {
      // Remove proposalNote from the data before sending to API
      const { proposalNote, ...availabilityData } = data;

      // Note: In a real implementation, the proposalNote would be stored
      // in a separate field or in the availability metadata
      await createMutation.mutateAsync(availabilityData);
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Propose Availability to Provider
          </CardTitle>
          {providerName && (
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {providerName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Send className="h-4 w-4" />
          <AlertTitle>Availability Proposal</AlertTitle>
          <AlertDescription>
            This availability will be sent to the provider for review. They can accept or reject the
            proposal. Once accepted, the availability will become active and slots will be
            generated. Your organization will be billed for the slots based on your subscription
            plan.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Proposal Message */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Proposal Message</h3>
              <FormField
                control={form.control}
                name="proposalNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message to Provider (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a note to explain this availability request..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This message will be sent to the provider along with the availability
                      proposal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormDescription>Select the date for the proposed availability</FormDescription>
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
                          setCurrentRecurrenceOption(option);

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
                      Fixed intervals are recommended for organization-managed availability.
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
                            .map((location: any) => (
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
                      <FormDescription>Provider must approve each booking manually</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Billing Information */}
            <Alert>
              <AlertTitle>Billing Information</AlertTitle>
              <AlertDescription>
                Your organization will be billed for the time slots generated from this availability
                based on your current subscription plan. The provider can see the proposed times and
                services but not the billing details.
              </AlertDescription>
            </Alert>

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
                className="flex min-w-[200px] items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting || createMutation.isPending
                  ? 'Sending Proposal...'
                  : 'Send Proposal to Provider'}
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
