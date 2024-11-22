'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
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

import { createAvailability, updateAvailability } from '../lib/actions';
import { AvailabilityFormValues, Schedule, availabilityFormSchema } from '../lib/types';

interface AvailabilityFormProps {
  serviceProviderId: string;
  availability?: Schedule;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
}

export function AvailabilityForm({
  serviceProviderId,
  availability,
  mode,
  onSuccess = () => {},
}: AvailabilityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: availability
      ? {
          date: new Date(availability.startTime),
          startTime: new Date(availability.startTime),
          endTime: new Date(availability.endTime),
          duration: availability.duration,
          price: availability.price,
          isOnlineAvailable: availability.isOnlineAvailable,
          isInPersonAvailable: availability.isInPersonAvailable,
          location: availability.location || '',
          isRecurring: availability.isRecurring,
          recurringDays: availability.recurringDays,
          recurrenceEndDate: availability.recurrenceEndDate
            ? new Date(availability.recurrenceEndDate)
            : (() => {
                const date = new Date(availability.startTime);
                date.setMonth(date.getMonth() + 3);
                return date;
              })(),
        }
      : {
          date: new Date(),
          startTime: new Date(),
          endTime: new Date(),
          duration: 15,
          price: 600,
          isOnlineAvailable: false,
          isInPersonAvailable: false,
          location: '',
          isRecurring: false,
          recurringDays: [],
          recurrenceEndDate: (() => {
            const date = new Date();
            date.setMonth(date.getMonth() + 3);
            return date;
          })(),
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
      formData.append('recurringDays', JSON.stringify(values.recurringDays || []));
      if (values.recurrenceEndDate) {
        formData.append('recurrenceEndDate', values.recurrenceEndDate.toISOString());
      }

      const response =
        mode === 'create'
          ? await createAvailability(formData)
          : await updateAvailability(availability?.id.split('-')[0] || '', formData);

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
        description:
          mode === 'create'
            ? 'Availability created successfully'
            : 'Availability updated successfully',
      });

      await queryClient.invalidateQueries({ queryKey: ['schedule', serviceProviderId] });
      onSuccess();
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          return form.handleSubmit(onSubmit)(e);
        }}
        className="w-full max-w-xl space-y-6"
      >
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2">Date</FormLabel>
              <DatePicker
                date={field.value}
                onChange={(date) => {
                  if (!date) return;
                  field.onChange(date);
                  const endDate = new Date(date);
                  endDate.setMonth(endDate.getMonth() + 3);
                  form.setValue('recurrenceEndDate', endDate);
                }}
              />
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
                    <DatePicker
                      date={field.value || undefined}
                      defaultMonth={field.value || undefined}
                      onChange={field.onChange}
                    />
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
              {`${mode === 'create' ? 'Creating' : 'Updating'}...`}
            </>
          ) : (
            `${mode === 'create' ? 'Create' : 'Update'} Availability`
          )}
        </Button>
      </form>
    </Form>
  );
}
