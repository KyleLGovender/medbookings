'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/ui/time-picker';
import { WeekdayPicker } from '@/components/ui/weekday-picker';
import { useToast } from '@/hooks/use-toast';

import { createAvailability } from '../lib/actions';
import { AvailabilityFormValues, availabilityFormSchema } from '../lib/types';

interface AvailabilityFormProps {
  onSuccess?: () => void;
}

export function AvailabilityForm({ onSuccess }: AvailabilityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      isOnlineAvailable: false,
      isInPersonAvailable: false,
      isRecurring: false,
      duration: 15,
      price: 600,
    },
  });

  async function onSubmit(values: AvailabilityFormValues) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('startTime', values.startTime.toISOString());
      formData.append('endTime', values.endTime.toISOString());
      formData.append('duration', values.duration.toString());
      formData.append('price', values.price.toString());
      formData.append('isOnlineAvailable', values.isOnlineAvailable.toString());
      formData.append('isInPersonAvailable', values.isInPersonAvailable.toString());
      formData.append('location', values.location || '');
      formData.append('isRecurring', values.isRecurring.toString());

      if (values.isRecurring && values.recurringDays?.length > 0) {
        formData.append('recurringDays', JSON.stringify(values.recurringDays));
      }

      if (values.isRecurring && values.recurrenceEndDate) {
        formData.append('recurrenceEndDate', values.recurrenceEndDate.toISOString());
      }

      const response = await createAvailability(formData);

      if (response.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error,
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Availability has been created successfully.',
      });

      onSuccess?.();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-xl space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2">Date</FormLabel>
              <DatePicker date={field.value} onChange={field.onChange} />
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="mb-2">Start Time</FormLabel>
                <TimePicker
                  date={field.value}
                  onChange={(time) => {
                    const date = form.getValues('date');
                    if (!date) return;

                    const datetime = new Date(date);
                    datetime.setHours(time.getHours());
                    datetime.setMinutes(time.getMinutes());
                    field.onChange(datetime);
                  }}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="mb-2">End Time</FormLabel>
                <TimePicker
                  date={field.value}
                  onChange={(time) => {
                    const date = form.getValues('date');
                    if (!date) return;

                    const datetime = new Date(date);
                    datetime.setHours(time.getHours());
                    datetime.setMinutes(time.getMinutes());
                    field.onChange(datetime);
                  }}
                />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2">Duration (minutes)</FormLabel>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2">Price</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Recurring Weekly</FormLabel>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormItem>
            )}
          />

          {form.watch('isRecurring') && (
            <>
              <FormField
                control={form.control}
                name="recurringDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Days</FormLabel>
                    <WeekdayPicker {...field} value={field.value || []} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recurrenceEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Recurrence End Date</FormLabel>
                    <DatePicker date={field.value} onChange={field.onChange} />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="isOnlineAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Online Available</FormLabel>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isInPersonAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">In-Person Available</FormLabel>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormItem>
            )}
          />
        </div>

        {form.watch('isInPersonAvailable') && (
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2">Location</FormLabel>
                <Input {...field} value={field.value || ''} />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" />
              Creating...
            </>
          ) : (
            'Create Availability'
          )}
        </Button>
      </form>
    </Form>
  );
}
