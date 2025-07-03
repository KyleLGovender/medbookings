'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { useToast } from '@/hooks/use-toast';
import { 
  CreateAvailabilityData,
  createAvailabilityDataSchema,
  SchedulingRule,
  RecurrenceType,
  DayOfWeek,
} from '../types';
import { useCreateAvailability } from '../hooks';
import { ServiceSelectionSection } from './service-selection-section';

interface AvailabilityCreationFormProps {
  serviceProviderId: string;
  organizationId?: string;
  locationId?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

type FormValues = CreateAvailabilityData;

export function AvailabilityCreationForm({
  serviceProviderId,
  organizationId,
  locationId,
  onSuccess,
  onCancel,
}: AvailabilityCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(createAvailabilityDataSchema),
    defaultValues: {
      serviceProviderId,
      organizationId,
      locationId,
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

  const createMutation = useCreateAvailability({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Availability created successfully',
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

  const watchIsRecurring = form.watch('isRecurring');
  const watchSchedulingRule = form.watch('schedulingRule');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Create Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Time Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            if (date) {
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
                          onChange={field.onChange}
                        />
                      </div>
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
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <DatePicker
                          date={field.value}
                          onChange={(date) => {
                            if (date) {
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
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Scheduling Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
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
                        <SelectItem value={SchedulingRule.FIXED_INTERVAL}>
                          Fixed Interval - Appointments start at regular intervals (hourly, half-hourly, etc.)
                        </SelectItem>
                        <SelectItem value={SchedulingRule.CUSTOM_INTERVAL}>
                          Custom Interval - Appointments start at custom intervals you define
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This determines when appointments can be scheduled within your availability period.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchSchedulingRule === SchedulingRule.CUSTOM_INTERVAL && (
                <FormField
                  control={form.control}
                  name="schedulingInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Interval (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 20"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        How many minutes between each possible appointment start time.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Recurrence Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Recurrence Settings
              </h3>

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Make this availability recurring
                      </FormLabel>
                      <FormDescription>
                        Create a repeating schedule based on a pattern you define.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchIsRecurring && (
                <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
                  <Controller
                    name="recurrencePattern.type"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recurrence type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={RecurrenceType.DAILY}>Daily</SelectItem>
                            <SelectItem value={RecurrenceType.WEEKLY}>Weekly</SelectItem>
                            <SelectItem value={RecurrenceType.MONTHLY}>Monthly</SelectItem>
                            <SelectItem value={RecurrenceType.CUSTOM}>Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="recurrencePattern.interval"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repeat Every</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            How often to repeat (e.g., every 2 weeks)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Controller
                      name="recurrencePattern.count"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Occurrences</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="10"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Total number of recurring sessions (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Controller
                    name="recurrencePattern.endDate"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Stop creating recurring availability after this date
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Service Selection */}
            <ServiceSelectionSection
              serviceProviderId={serviceProviderId}
              organizationId={organizationId}
            />

            <Separator />

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isOnlineAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Available Online
                        </FormLabel>
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
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Requires Confirmation
                        </FormLabel>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? 'Creating...' : 'Create Availability'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}