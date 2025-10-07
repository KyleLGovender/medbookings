'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { SchedulingRule } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  addHours,
  setDate,
  setHours,
  setMilliseconds,
  setMinutes,
  setMonth,
  setSeconds,
  setYear,
} from 'date-fns';
import { Calendar, Clock, Loader2, Repeat, Trash2 } from 'lucide-react';
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
import {
  SeriesActionDialog,
  type SeriesActionScope,
} from '@/features/calendar/components/availability/series-action-dialog';
import { ServiceSelectionSection } from '@/features/calendar/components/availability/service-selection-section';
import {
  useAvailabilityById,
  useDeleteAvailability,
} from '@/features/calendar/hooks/use-availability';
import {
  createRecurrencePattern,
  getRecurrenceOptions,
} from '@/features/calendar/lib/recurrence-utils';
import { updateAvailabilityDataSchema } from '@/features/calendar/types/schemas';
import { CustomRecurrenceData, DayOfWeek, RecurrenceOption } from '@/features/calendar/types/types';
import { useProviderAssociatedServices } from '@/features/providers/hooks/use-provider-associated-services';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { nowUTC, parseUTC } from '@/lib/timezone';
import { type RouterInputs, type RouterOutputs, api } from '@/utils/api';

// Extract input type from tRPC procedure for zero type drift
type UpdateAvailabilityInput = RouterInputs['calendar']['update'];
type AvailabilityWithRelations = RouterOutputs['calendar']['getById'];

interface AvailabilityEditFormProps {
  availabilityId: string;
  scope?: 'single' | 'future' | 'all'; // Scope passed from the modal dialog
  onSuccess?: (data: NonNullable<RouterOutputs['calendar']['update']['availability']>) => void;
  onCancel?: () => void;
}

type FormValues = Omit<UpdateAvailabilityInput, 'id'>;

/**
 * Custom hook for updating availability with optimistic updates
 */
function useUpdateAvailabilityOptimistic(
  availabilityId: string,
  options?: {
    onSuccess?: (data: RouterOutputs['calendar']['update']) => void;
    onError?: (error: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return api.calendar.update.useMutation({
    onMutate: async (variables) => {
      logger.debug('calendar', 'Optimistic update - updating availability', {
        availabilityId: variables.id,
      });

      // Cancel outgoing refetches for this availability
      await queryClient.cancelQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('getById') && keyStr.includes(availabilityId);
        },
      });

      // Find the actual cache key and snapshot current data
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let previousData;
      let actualKey;

      for (const query of allQueries) {
        const keyStr = JSON.stringify(query.queryKey);
        if (keyStr.includes('getById') && keyStr.includes(availabilityId)) {
          actualKey = query.queryKey;
          previousData = query.state.data;
          break;
        }
      }

      if (!previousData || !actualKey) {
        logger.warn('Could not find availability data to snapshot', {
          availabilityId,
        });
        return { previousData: null, actualKey: null };
      }

      // Optimistically update the availability cache
      queryClient.setQueryData(actualKey, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          startTime: variables.startTime || old.startTime,
          endTime: variables.endTime || old.endTime,
          isRecurring: variables.isRecurring ?? old.isRecurring,
          recurrencePattern: variables.recurrencePattern || old.recurrencePattern,
          schedulingRule: variables.schedulingRule || old.schedulingRule,
          isOnlineAvailable: variables.isOnlineAvailable ?? old.isOnlineAvailable,
          requiresConfirmation: variables.requiresConfirmation ?? old.requiresConfirmation,
          // Update service configurations if provided
          availableServices:
            variables.services?.map((service: any) => ({
              serviceId: service.serviceId,
              durationMinutes: service.duration,
              price: service.price,
            })) || old.availableServices,
        };
      });

      return { previousData, actualKey };
    },

    onError: (err, _variables, context) => {
      logger.error('Update availability failed, rolling back', {
        error: err instanceof Error ? err.message : String(err),
      });

      // Roll back to previous state
      if (context?.previousData && context?.actualKey) {
        queryClient.setQueryData(context.actualKey, context.previousData);
      }

      if (options?.onError) {
        options.onError(err);
      }
    },

    onSuccess: async (data, variables) => {
      logger.debug('calendar', 'Update availability success - invalidating queries', {
        availabilityId: variables.id,
        scope: variables.scope,
      });

      // For series updates (future/all), the old ID no longer exists - skip getById invalidation
      const isSeriesUpdate = variables.scope && variables.scope !== 'single';

      if (!isSeriesUpdate) {
        // Only invalidate getById for single updates where the ID is preserved
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const keyStr = JSON.stringify(query.queryKey);
            return keyStr.includes('getById') && keyStr.includes(variables.id);
          },
        });
      }

      // Invalidate provider availability queries
      if (data.availability?.providerId) {
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const keyStr = JSON.stringify(query.queryKey);
            return (
              keyStr.includes('getByProviderId') && keyStr.includes(data.availability!.providerId)
            );
          },
        });
      }

      // Invalidate series queries if it's part of a series
      if (data.availability?.seriesId) {
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const keyStr = JSON.stringify(query.queryKey);
            return (
              keyStr.includes('getBySeriesId') && keyStr.includes(data.availability!.seriesId!)
            );
          },
        });
      }

      // Invalidate search availability queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const keyStr = JSON.stringify(query.queryKey);
          return keyStr.includes('searchAvailability');
        },
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });
}

/**
 * Helper function to update date while preserving time
 */
const updateDatePreservingTime = (currentTime: Date, newDate: Date): Date => {
  let updatedTime = setYear(currentTime, newDate.getFullYear());
  updatedTime = setMonth(updatedTime, newDate.getMonth());
  updatedTime = setDate(updatedTime, newDate.getDate());
  return updatedTime;
};

/**
 * Transform availability data from database format to form format
 */
const transformAvailabilityToForm = (
  availability: NonNullable<AvailabilityWithRelations>
): FormValues => {
  return {
    providerId: availability.providerId,
    startTime: availability.startTime,
    endTime: availability.endTime,
    isRecurring: availability.isRecurring,
    recurrencePattern: availability.recurrencePattern,
    schedulingRule: availability.schedulingRule,
    isOnlineAvailable: availability.isOnlineAvailable,
    locationId: availability.locationId || undefined,
    requiresConfirmation: availability.requiresConfirmation,
    services:
      availability.availableServices?.length > 0
        ? availability.availableServices.map((service: any) => ({
            serviceId: service.serviceId,
            duration: service.durationMinutes || service.duration,
            price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
          }))
        : [], // Empty array as fallback - this might cause validation to fail
  };
};

/**
 * AvailabilityEditForm - A comprehensive form for editing provider availability
 *
 * This form handles:
 * - Loading existing availability data
 * - Profile context display (read-only creator info)
 * - Time settings with booking constraints
 * - Recurrence editing with series update options
 * - Service selection and configuration
 * - Location constraints (online-only for provider-created)
 * - Form validation and error handling
 * - Update mutation with optimistic updates
 *
 * @param availabilityId - ID of the availability to edit
 * @param onSuccess - Callback fired when availability is updated successfully
 * @param onCancel - Callback fired when the form is cancelled
 */
export function AvailabilityEditForm({
  availabilityId,
  scope = 'single',
  onSuccess,
  onCancel,
}: AvailabilityEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customRecurrenceModalOpen, setCustomRecurrenceModalOpen] = useState(false);
  const [customRecurrenceData, setCustomRecurrenceData] = useState<
    CustomRecurrenceData | undefined
  >();
  const [hasExistingBookings, setHasExistingBookings] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [seriesActionModalOpen, setSeriesActionModalOpen] = useState(false);
  const [pendingDeleteScope, setPendingDeleteScope] = useState<SeriesActionScope | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch existing availability data
  const {
    data: availability,
    isLoading: isAvailabilityLoading,
    error: availabilityError,
  } = useAvailabilityById(availabilityId);

  // Fetch provider's services - must call hook unconditionally
  const {
    data: availableServices,
    isLoading: isServicesLoading,
    error: servicesError,
  } = useProviderAssociatedServices(availability?.providerId || '');

  const form = useForm<FormValues>({
    resolver: zodResolver(updateAvailabilityDataSchema.omit({ id: true })),
    defaultValues: {
      providerId: '',
      startTime: nowUTC(),
      endTime: addHours(nowUTC(), 2), // 2 hours from now
      isRecurring: false,
      schedulingRule: SchedulingRule.CONTINUOUS,
      isOnlineAvailable: true,
      requiresConfirmation: false,
      services: [],
    },
    mode: 'all', // Changed from 'onChange' to 'all' for better validation timing
  });

  // Populate form when availability data is loaded
  useEffect(() => {
    if (availability) {
      const formData = transformAvailabilityToForm(availability);
      form.reset(formData);

      // Trigger validation after reset to ensure form state is updated
      setTimeout(() => {
        form.trigger();
      }, 100);

      // Check for existing bookings
      if (availability.calculatedSlots) {
        const bookedSlots = availability.calculatedSlots.filter((slot: any) => slot.booking);
        setHasExistingBookings(bookedSlots.length > 0);
        setBookingCount(bookedSlots.length);
      }

      // If there's custom recurrence data, extract it
      if (
        availability.recurrencePattern &&
        typeof availability.recurrencePattern === 'object' &&
        'option' in availability.recurrencePattern
      ) {
        const pattern = availability.recurrencePattern as {
          option: string;
          customDays?: string[];
          endDate?: string;
        };
        if (pattern.option === RecurrenceOption.CUSTOM && pattern.customDays && pattern.endDate) {
          setCustomRecurrenceData({
            selectedDays: pattern.customDays as unknown as DayOfWeek[],
            endDate: parseUTC(pattern.endDate),
          });
        }
      }
    }
  }, [availability, form]);

  const updateMutation = useUpdateAvailabilityOptimistic(availabilityId, {
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Availability updated successfully',
      });
      if (data.availability) {
        if (onSuccess) {
          onSuccess(data.availability);
        } else {
          // Navigate back if no callback provided
          router.back();
        }
      }
    },
    onError: (error) => {
      // Error handling is already in the form submission, but this provides additional coverage
      logger.error('Optimistic update error', {
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const deleteMutation = useDeleteAvailability({
    onSuccess: (variables) => {
      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });
      if (onCancel) {
        onCancel();
      } else {
        // Navigate back if no callback provided
        router.back();
      }
    },
  });

  // Watch form values for reactive UI updates - optimized with useWatch
  const watchStartTime = useWatch({ control: form.control, name: 'startTime' });

  // Memoize expensive recurrence options computation
  const recurrenceOptions = useMemo(() => {
    const startTime =
      watchStartTime instanceof Date
        ? watchStartTime
        : watchStartTime
          ? parseUTC(watchStartTime)
          : nowUTC();
    return getRecurrenceOptions(startTime);
  }, [watchStartTime]);

  // Show loading state while availability data is being fetched
  if (isAvailabilityLoading) {
    return (
      <CalendarLoader
        message="Loading availability data"
        submessage="Fetching existing availability information..."
        showAfterMs={300}
      />
    );
  }

  // Show error state if availability data cannot be loaded
  if (availabilityError || !availability) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardContent className="py-8 text-center">
          <p className="font-medium text-destructive">Failed to load availability data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please refresh the page or contact support if the problem persists.
          </p>
          <Button variant="outline" onClick={onCancel || (() => router.back())} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  /**
   * Handles form submission
   * Validates data, enforces constraints, and updates the availability
   */
  const onSubmit = async (data: FormValues) => {
    if (updateMutation.isPending) return;

    setIsSubmitting(true);
    try {
      // Ensure all Date fields are properly converted and maintain provider constraints
      const startTime =
        data.startTime instanceof Date
          ? data.startTime
          : data.startTime
            ? parseUTC(data.startTime)
            : nowUTC();
      const endTime =
        data.endTime instanceof Date
          ? data.endTime
          : data.endTime
            ? parseUTC(data.endTime)
            : nowUTC();

      // Round times to clean minutes (zero seconds and milliseconds)
      startTime.setSeconds(0, 0);
      endTime.setSeconds(0, 0);

      const submitData: UpdateAvailabilityInput = {
        id: availabilityId,
        scope,
        ...data,
        startTime,
        endTime,
        // Enforce online-only for provider-created availability
        isOnlineAvailable: true,
        locationId: undefined,
      };

      await updateMutation.mutateAsync(submitData);
    } catch (error) {
      logger.error('Failed to update availability', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Enhanced error handling with specific error types
      let errorTitle = 'Failed to update availability';
      let errorMessage = 'An unexpected error occurred while updating availability';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error cases
        if (error.message.includes('booking')) {
          errorTitle = 'Cannot modify availability';
          errorMessage = 'This availability cannot be modified because it has existing bookings.';
        } else if (error.message.includes('validation')) {
          errorTitle = 'Invalid data';
          errorMessage = 'Please check your input and try again.';
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorTitle = 'Access denied';
          errorMessage = 'You do not have permission to modify this availability.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorTitle = 'Connection error';
          errorMessage = 'Please check your internet connection and try again.';
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        action: (
          <button
            onClick={() => {
              // Retry the last form submission
              form.handleSubmit(onSubmit)();
            }}
            className="text-sm underline"
          >
            Retry
          </button>
        ),
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
    const startTime =
      watchStartTime instanceof Date
        ? watchStartTime
        : watchStartTime
          ? parseUTC(watchStartTime)
          : nowUTC();
    const pattern = createRecurrencePattern(
      RecurrenceOption.CUSTOM,
      startTime,
      data.selectedDays,
      data.endDate ? data.endDate.toISOString().split('T')[0] : undefined
    );

    // Set values and mark them as dirty to enable form submission
    form.setValue('recurrencePattern', pattern, { shouldDirty: true, shouldValidate: true });
    form.setValue('isRecurring', true, { shouldDirty: true, shouldValidate: true });
    setCustomRecurrenceData(data);
    setCustomRecurrenceModalOpen(false);
  };

  const handleCustomRecurrenceCancel = () => {
    setCustomRecurrenceModalOpen(false);
  };

  /**
   * Handles delete button click - checks for bookings and recurring series
   */
  const handleDeleteClick = () => {
    if (hasExistingBookings) {
      toast({
        title: 'Cannot Delete',
        description:
          'Cannot delete availability with existing bookings. Cancel the bookings first.',
        variant: 'destructive',
      });
      return;
    }

    // If it's a recurring series, show the series action dialog
    if (availability?.isRecurring || availability?.seriesId) {
      setSeriesActionModalOpen(true);
    } else {
      // Single availability - delete directly
      handleConfirmDelete('single');
    }
  };

  /**
   * Handles confirmed deletion with scope
   */
  const handleConfirmDelete = async (scope: SeriesActionScope) => {
    if (deleteMutation.isPending) return;

    try {
      await deleteMutation.mutateAsync({
        ids: [availabilityId],
        scope,
      });
    } catch (error) {
      logger.error('Failed to delete availability', {
        error: error instanceof Error ? error.message : String(error),
        availabilityId,
        scope,
      });
      toast({
        title: 'Failed to delete',
        description: 'An error occurred while deleting the availability. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handles series action dialog confirmation
   */
  const handleSeriesActionConfirm = (scope: SeriesActionScope) => {
    setSeriesActionModalOpen(false);
    handleConfirmDelete(scope);
  };

  const handleSeriesActionCancel = () => {
    setSeriesActionModalOpen(false);
  };

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Edit Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Read-only Context Header */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Editing availability for {availability.provider?.user?.name || 'Provider'}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Created by Provider</span>
                  <span>•</span>
                  <span>Online appointments only</span>
                  {availability.seriesId && (
                    <>
                      <span>•</span>
                      <span>Part of recurring series</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Constraint Warning */}
            {hasExistingBookings && (
              <div
                className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-2">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-900">
                      This availability has {bookingCount} existing booking
                      {bookingCount !== 1 ? 's' : ''}
                    </h4>
                    <p className="mt-1 text-sm text-amber-700">
                      Time and date changes are restricted to prevent disrupting scheduled
                      appointments. You can still modify services, scheduling rules, and
                      confirmation settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                                : currentStartTime
                                  ? parseUTC(currentStartTime)
                                  : nowUTC();
                            const endTimeDate =
                              currentEndTime instanceof Date
                                ? currentEndTime
                                : currentEndTime
                                  ? parseUTC(currentEndTime)
                                  : nowUTC();

                            form.setValue(
                              'startTime',
                              updateDatePreservingTime(startTimeDate, date)
                            );
                            form.setValue('endTime', updateDatePreservingTime(endTimeDate, date));
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {hasExistingBookings
                        ? 'Date changes are restricted due to existing bookings'
                        : 'Select the date for your availability slot'}
                    </FormDescription>
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
                          date={
                            field.value instanceof Date
                              ? field.value
                              : field.value
                                ? parseUTC(field.value)
                                : nowUTC()
                          }
                          onChange={field.onChange}
                        />
                      </FormControl>
                      {hasExistingBookings && (
                        <FormDescription className="text-amber-600">
                          Time changes are restricted due to existing bookings
                        </FormDescription>
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
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <TimePicker
                          date={
                            field.value instanceof Date
                              ? field.value
                              : field.value
                                ? parseUTC(field.value)
                                : nowUTC()
                          }
                          onChange={(newTime) => {
                            // Get the current date from the start time (which is updated by DatePicker)
                            const currentStartTime = form.getValues('startTime');
                            const baseDate =
                              currentStartTime instanceof Date
                                ? currentStartTime
                                : currentStartTime
                                  ? parseUTC(currentStartTime)
                                  : nowUTC();

                            // Create new end time using the base date but with the selected time
                            let updatedEndTime = setHours(baseDate, newTime.getHours());
                            updatedEndTime = setMinutes(updatedEndTime, newTime.getMinutes());
                            updatedEndTime = setSeconds(updatedEndTime, 0);
                            updatedEndTime = setMilliseconds(updatedEndTime, 0);

                            field.onChange(updatedEndTime);
                          }}
                        />
                      </FormControl>
                      {hasExistingBookings && (
                        <FormDescription className="text-amber-600">
                          Time changes are restricted due to existing bookings
                        </FormDescription>
                      )}
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
                                : watchStartTime
                                  ? parseUTC(watchStartTime)
                                  : nowUTC();
                            const pattern = createRecurrencePattern(option, startTime);
                            field.onChange(pattern);
                            form.setValue('isRecurring', option !== RecurrenceOption.NONE, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
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
                  Provider-created availability is limited to virtual appointments via video call
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
                  Please configure your services before editing availability.
                </p>
              </div>
            ) : (
              <ServiceSelectionSection
                providerId={availability.providerId}
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
            <div className="flex justify-between pt-6">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel || (() => router.back())}
                  disabled={isSubmitting || updateMutation.isPending || deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting || updateMutation.isPending || deleteMutation.isPending}
                  className="gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  updateMutation.isPending ||
                  deleteMutation.isPending ||
                  !form.formState.isValid
                }
                className="min-w-[140px]"
              >
                {isSubmitting || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {updateMutation.isPending ? 'Saving...' : 'Updating...'}
                  </>
                ) : (
                  'Update Availability'
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

      {/* Series Action Dialog for Delete */}
      <SeriesActionDialog
        isOpen={seriesActionModalOpen}
        onClose={handleSeriesActionCancel}
        onConfirm={handleSeriesActionConfirm}
        actionType="delete"
        availabilityTitle={availability?.provider?.user?.name || 'Provider Availability'}
        availabilityDate={
          availability?.startTime
            ? availability.startTime.toLocaleDateString()
            : ''
        }
        isDestructive={true}
      />
    </Card>
  );
}
