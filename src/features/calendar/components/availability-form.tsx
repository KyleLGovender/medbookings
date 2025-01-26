'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { TimePicker } from '@/components/ui/time-picker';
import { useToast } from '@/hooks/use-toast';

import { createAvailability, updateAvailability } from '../lib/actions';
import { AvailabilityFormSchema, AvailabilityFormValues, Service } from '../lib/types';
import { RecurringSettingsFields } from './availability-form/recurring-settings-fields';
import { ServiceConfigurationFields } from './availability-form/service-configuration-fields';

interface AvailabilityFormProps {
  serviceProviderId: string;
  services: Service[];
  availability?: AvailabilityFormValues;
  mode: 'create' | 'edit';
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function AvailabilityForm({
  serviceProviderId,
  services,
  availability,
  mode,
  onClose,
  onRefresh,
}: AvailabilityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(AvailabilityFormSchema),
    defaultValues: availability || {
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(),
      serviceIds: [],
      isRecurring: false,
      recurringDays: [],
      recurrenceEndDate: null,
      availableServices: [],
    },
  });

  const {
    formState: { errors },
  } = form;

  async function onSubmit(values: AvailabilityFormValues) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('serviceProviderId', serviceProviderId);
      formData.append('date', values.date.toISOString());
      formData.append('startTime', values.startTime.toISOString());
      formData.append('endTime', values.endTime.toISOString());
      formData.append('duration', String(Math.max(1, Math.round(values.duration))));
      formData.append('price', String(Math.max(0, values.price)));
      formData.append('isOnlineAvailable', String(values.isOnlineAvailable));
      formData.append('isInPersonAvailable', String(values.isInPersonAvailable));
      formData.append('location', values.location?.trim() || '');
      formData.append('isRecurring', String(values.isRecurring));

      if (values.isRecurring) {
        if (!values.recurringDays?.length) {
          toast({
            variant: 'destructive',
            title: 'Invalid Recurring Days',
            description: 'Please select at least one recurring day',
          });
          return;
        }
        if (!values.recurrenceEndDate) {
          toast({
            variant: 'destructive',
            title: 'Invalid End Date',
            description: 'Please select a recurrence end date',
          });
          return;
        }
        formData.append('recurringDays', JSON.stringify(values.recurringDays));
        formData.append('recurrenceEndDate', values.recurrenceEndDate.toISOString());
      }

      const response =
        mode === 'create'
          ? await createAvailability(formData)
          : await updateAvailability(availability?.id || '', formData);

      if (response.error) {
        // Set field errors if they exist
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as any, {
              type: 'server',
              message: errors[0],
            });
          });
        }

        // Show toast for form-level errors
        if (response.formErrors?.length) {
          toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: response.formErrors[0],
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: response.error,
          });
        }

        setIsSubmitting(false);
        return;
      }

      toast({
        title: 'Success',
        description:
          mode === 'create'
            ? 'Availability created successfully'
            : 'Availability updated successfully',
      });

      router.refresh();
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Availability form error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
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
              <DatePicker {...field} />
              <FormMessage />
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
                <TimePicker {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="mb-2">End Time</FormLabel>
                <TimePicker {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ServiceConfigurationFields services={services} control={form.control} />

        <RecurringSettingsFields control={form.control} form={form} />

        {Object.keys(form.formState.errors).length > 0 && (
          <div className="rounded-lg border border-destructive p-4 text-sm text-destructive">
            <p className="mb-1 font-semibold">Please fix the following errors:</p>
            <ul className="list-disc pl-4">
              {Object.entries(form.formState.errors).map(([key, error]) => (
                <li key={key}>
                  {error?.message || `Invalid ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                </li>
              ))}
            </ul>
          </div>
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
