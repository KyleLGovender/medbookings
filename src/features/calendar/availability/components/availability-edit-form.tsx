'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Calendar, Clock, Repeat, Save } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TimePicker } from '@/components/ui/time-picker';
import { ServiceSelectionSection } from '@/features/calendar/availability/components/service-selection-section';
import {
  useAvailabilityById,
  useUpdateAvailability,
} from '@/features/calendar/availability/hooks/use-availability';
import { updateAvailabilityDataSchema } from '@/features/calendar/availability/types/schemas';
import {
  CalculatedAvailabilitySlotWithRelations,
  SchedulingRule,
  ServiceAvailabilityConfigWithRelations,
  UpdateAvailabilityData,
} from '@/features/calendar/availability/types/types';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityEditFormProps {
  availabilityId: string;
  editMode?: 'single' | 'series' | 'future'; // How to handle recurring series
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

type FormValues = UpdateAvailabilityData;

export function AvailabilityEditForm({
  availabilityId,
  editMode = 'single',
  onSuccess,
  onCancel,
}: AvailabilityEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingBookings, setHasExistingBookings] = useState(false);
  const { toast } = useToast();

  // Fetch existing availability data
  const { data: availability, isLoading, error } = useAvailabilityById(availabilityId);

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
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (availability) {
      // Check for existing bookings
      const bookingCount =
        availability.calculatedSlots?.filter(
          (slot: CalculatedAvailabilitySlotWithRelations) => slot.booking
        ).length || 0;
      setHasExistingBookings(bookingCount > 0);

      // Populate form with current values
      form.reset({
        id: availability.id,
        serviceProviderId: availability.serviceProviderId,
        organizationId: availability.organizationId || undefined,
        locationId: availability.locationId || undefined,
        startTime: availability.startTime,
        endTime: availability.endTime,
        isRecurring: availability.isRecurring,
        recurrencePattern: availability.recurrencePattern || undefined,
        schedulingRule: availability.schedulingRule,
        schedulingInterval: availability.schedulingInterval || undefined,
        isOnlineAvailable: availability.isOnlineAvailable,
        requiresConfirmation: availability.requiresConfirmation,
        services: availability.availableServices.map(
          (config: ServiceAvailabilityConfigWithRelations) => ({
            serviceId: config.serviceId,
            duration: config.duration,
            price: config.price,
            showPrice: config.showPrice,
          })
        ),
      });
    }
  }, [availability, form]);

  const watchIsRecurring = form.watch('isRecurring');
  const watchSchedulingRule = form.watch('schedulingRule');
  const watchIsOnlineAvailable = form.watch('isOnlineAvailable');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
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
            <AlertDescription>Failed to load availability: {error.message}</AlertDescription>
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
            {availability.isRecurring && (
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
        {availability.isRecurring && (
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

            {/* Service Selection */}
            <ServiceSelectionSection
              serviceProviderId={availability.serviceProviderId}
              organizationId={availability.organizationId || undefined}
            />

            <Separator />

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Settings</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        <FormDescription>
                          Allow online appointments for this availability
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

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
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
