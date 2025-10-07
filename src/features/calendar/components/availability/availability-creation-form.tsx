'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { SchedulingRule } from '@prisma/client';
import {
  addHours,
  setDate as setDateFns,
  setHours,
  setMilliseconds,
  setMinutes,
  setMonth,
  setSeconds,
  setYear,
} from 'date-fns';
import { Calendar, Clock, Loader2, Repeat } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

import CalendarLoader from '@/components/calendar-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithInput } from '@/components/ui/date-picker-with-input';
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
import { CustomRecurrenceData, DayOfWeek, RecurrenceOption } from '@/features/calendar/types/types';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useAssociatedServices } from '@/features/calendar/hooks/use-associated-services';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { nowUTC, parseUTC } from '@/lib/timezone';
import { type RouterInputs, type RouterOutputs } from '@/utils/api';

// Extract input type from tRPC procedure for zero type drift
type CreateAvailabilityInput = RouterInputs['calendar']['create'];

// Extract the availability type from the create mutation response
// The create mutation returns an object with availability property that includes relations
type CreateAvailabilityResponse = RouterOutputs['calendar']['create'];
type CreatedAvailability = NonNullable<CreateAvailabilityResponse['availability']>;

interface AvailabilityCreationFormProps {
  onSuccess?: (data: CreatedAvailability) => void;
  onCancel?: () => void;
}

type FormValues = CreateAvailabilityInput;

/**
 * Helper function to update date while preserving time
 */
const updateDatePreservingTime = (currentTime: Date, newDate: Date): Date => {
  let updatedTime = setYear(currentTime, newDate.getFullYear());
  updatedTime = setMonth(updatedTime, newDate.getMonth());
  updatedTime = setDateFns(updatedTime, newDate.getDate());
  return updatedTime;
};

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
 * Uses currentUserProvider for provider self-scheduling
 * @param onSuccess - Callback fired when availability is created successfully
 * @param onCancel - Callback fired when the form is cancelled
 */
export function AvailabilityCreationForm({ onSuccess, onCancel }: AvailabilityCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customRecurrenceModalOpen, setCustomRecurrenceModalOpen] = useState(false);
  const [customRecurrenceData, setCustomRecurrenceData] = useState<
    CustomRecurrenceData | undefined
  >();
  const { toast } = useToast();
  const router = useRouter();

  // Fetch current provider data - required for this form
  const { data: currentUserProvider, isLoading: isProviderLoading } = useCurrentUserProvider();

  // Fetch provider's services - must call hook unconditionally
  const {
    data: availableServices,
    isLoading: isServicesLoading,
    error: servicesError,
  } = useAssociatedServices(currentUserProvider?.id || '');

  const form = useForm<FormValues>({
    resolver: zodResolver(createAvailabilityDataSchema),
    defaultValues: {
      providerId: currentUserProvider?.id || '',
      startTime: nowUTC(),
      endTime: addHours(nowUTC(), 2), // 2 hours from now
      isRecurring: false,
      schedulingRule: SchedulingRule.CONTINUOUS,
      isOnlineAvailable: true,
      requiresConfirmation: false,
      services: [],
    },
    mode: 'onChange',
  });

  // Update form when currentUserProvider changes
  useEffect(() => {
    if (currentUserProvider?.id) {
      form.setValue('providerId', currentUserProvider.id);
    }
  }, [currentUserProvider?.id, form]);

  const createMutation = useCreateAvailability({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Availability created successfully',
      });
      if (onSuccess) {
        onSuccess(data);
      } else {
        // Navigate back to calendar if no callback provided
        router.back();
      }
    },
  });

  // Watch form values for reactive UI updates - optimized with useWatch
  const watchStartTime = useWatch({ control: form.control, name: 'startTime' });

  // Memoize expensive recurrence options computation
  const recurrenceOptions = useMemo(() => {
    const startTime = watchStartTime instanceof Date ? watchStartTime : parseUTC(watchStartTime);
    return getRecurrenceOptions(startTime);
  }, [watchStartTime]);

  // Authorization check - redirect if not a provider
  useEffect(() => {
    if (!isProviderLoading && !currentUserProvider?.id) {
      router.push('/unauthorized');
    }
  }, [isProviderLoading, currentUserProvider?.id, router]);

  // Show loading state while provider data is being fetched
  if (isProviderLoading) {
    return (
      <CalendarLoader
        message="Loading availability form"
        submessage="Fetching your provider information..."
        showAfterMs={300}
      />
    );
  }

  // Show nothing while redirecting (useEffect will handle redirect)
  if (!currentUserProvider?.id) {
    return null;
  }

  /**
   * Handles form submission
   * Validates data, enforces online-only availability, and creates the availability
   */
  const onSubmit = async (data: FormValues) => {
    if (createMutation.isPending) return;

    setIsSubmitting(true);
    try {
      // Ensure all Date fields are properly converted and enforce online-only for provider self-scheduling
      const startTime = data.startTime instanceof Date ? data.startTime : parseUTC(data.startTime);
      const endTime = data.endTime instanceof Date ? data.endTime : parseUTC(data.endTime);

      // Round times to clean minutes (zero seconds and milliseconds)
      startTime.setSeconds(0, 0);
      endTime.setSeconds(0, 0);

      const submitData: CreateAvailabilityInput = {
        ...data,
        startTime,
        endTime,
        isOnlineAvailable: true, // Always online for provider self-scheduling
        locationId: undefined, // Never set location for provider self-scheduling
      };

      await createMutation.mutateAsync(submitData);
    } catch (error) {
      logger.error('Failed to create availability', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating availability';

      toast({
        title: 'Failed to create availability',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles saving custom recurrence pattern from the modal
   * Converts the selected days and end date into a recurrence pattern
   */
  const handleCustomRecurrenceSave = (data: CustomRecurrenceData) => {
    const startTime = watchStartTime instanceof Date ? watchStartTime : parseUTC(watchStartTime);
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
            {/* Clear Context Header */}
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Creating online availability for {currentUserProvider?.name || 'Provider'}
              </p>
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
                      <DatePickerWithInput
                        date={
                          field.value instanceof Date
                            ? field.value
                            : field.value
                              ? parseUTC(field.value)
                              : undefined
                        }
                        onChange={(date) => {
                          if (date) {
                            // Update both start and end time dates
                            const currentStartTime = form.getValues('startTime');
                            const currentEndTime = form.getValues('endTime');

                            const startTimeDate =
                              currentStartTime instanceof Date
                                ? currentStartTime
                                : parseUTC(currentStartTime);
                            const endTimeDate =
                              currentEndTime instanceof Date
                                ? currentEndTime
                                : parseUTC(currentEndTime);

                            form.setValue(
                              'startTime',
                              updateDatePreservingTime(startTimeDate, date)
                            );
                            form.setValue('endTime', updateDatePreservingTime(endTimeDate, date));
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
                        <TimePicker
                          date={field.value instanceof Date ? field.value : parseUTC(field.value)}
                          onChange={field.onChange}
                        />
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
                        <TimePicker
                          date={field.value instanceof Date ? field.value : parseUTC(field.value)}
                          onChange={(newTime) => {
                            // Get the current date from the start time (which is updated by DatePicker)
                            const currentStartTime = form.getValues('startTime');
                            const baseDate =
                              currentStartTime instanceof Date
                                ? currentStartTime
                                : parseUTC(currentStartTime);

                            // Create new end time using the base date but with the selected time
                            let updatedEndTime = setHours(baseDate, newTime.getHours());
                            updatedEndTime = setMinutes(updatedEndTime, newTime.getMinutes());
                            updatedEndTime = setSeconds(updatedEndTime, 0);
                            updatedEndTime = setMilliseconds(updatedEndTime, 0);

                            field.onChange(updatedEndTime);
                          }}
                        />
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
                  return (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const option = value as RecurrenceOption;

                          if (option === RecurrenceOption.CUSTOM) {
                            setCustomRecurrenceModalOpen(true);
                          } else {
                            const startTime =
                              watchStartTime instanceof Date
                                ? watchStartTime
                                : parseUTC(watchStartTime);
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

              {/* Display Custom Recurrence Details */}
              {customRecurrenceData && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      <span className="font-medium">Custom recurrence</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomRecurrenceModalOpen(true)}
                    >
                      Edit
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Repeat every 1 week</span>
                    </div>

                    <div>
                      <span className="mb-2 block text-sm font-medium">Repeat on</span>
                      <div className="flex gap-2">
                        {[
                          { label: 'M', value: DayOfWeek.MONDAY },
                          { label: 'T', value: DayOfWeek.TUESDAY },
                          { label: 'W', value: DayOfWeek.WEDNESDAY },
                          { label: 'T', value: DayOfWeek.THURSDAY },
                          { label: 'F', value: DayOfWeek.FRIDAY },
                          { label: 'S', value: DayOfWeek.SATURDAY },
                          { label: 'S', value: DayOfWeek.SUNDAY },
                        ].map((day, index) => {
                          const isSelected = customRecurrenceData.selectedDays.includes(day.value);
                          return (
                            <div
                              key={index}
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {day.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Ends on</span>
                      <div className="mt-1 text-sm text-gray-600">
                        {customRecurrenceData.endDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Availability Type */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Clock className="h-4 w-4" />
                Availability Type
              </h3>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="font-medium">Online Appointments Only</span>
                </div>
                <p className="mt-1 text-sm text-blue-600">
                  Provider self-scheduling is available for virtual appointments via video call
                </p>
              </div>
            </div>

            <Separator />

            {/* Service Selection */}
            {isServicesLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading available services...</p>
              </div>
            ) : servicesError ? (
              <div className="py-8 text-center">
                <p className="font-medium text-destructive">Failed to load services</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please refresh the page or contact support if the problem persists.
                </p>
              </div>
            ) : !availableServices || availableServices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-medium text-muted-foreground">No services configured</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please configure your services before creating availability.
                </p>
              </div>
            ) : (
              <ServiceSelectionSection
                providerId={currentUserProvider?.id || ''}
                availableServices={(availableServices || []).map((s: any) => ({
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
                        When enabled, bookings for this availability will require manual approval
                        from the provider before confirmation. When disabled, bookings are
                        automatically confirmed.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => router.back())}
                disabled={isSubmitting || createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || !form.formState.isValid}
                className="min-w-[140px]"
              >
                {isSubmitting || createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Availability'
                )}
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
