'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { TimePicker } from '@/components/ui/time-picker';
import { getServiceProviderServices } from '@/features/calendar/lib/queries';
import { useToast } from '@/hooks/use-toast';

import { createAvailability, updateAvailability } from '../lib/actions';
import {
  AvailabilityFormSchema,
  AvailabilityFormValues,
  QueriedAvailability,
  Service,
} from '../lib/types';
import { ServiceConfigurationFields } from './availability-form/service-configuration-fields';

interface AvailabilityFormProps {
  serviceProviderId: string;
  availability?: QueriedAvailability;
  mode: 'create' | 'edit';
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function AvailabilityForm({
  serviceProviderId,
  availability,
  mode,
  onClose,
  onRefresh,
}: AvailabilityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  // Fetch services on mount
  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getServiceProviderServices(serviceProviderId);
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load services',
        });
      }
    });
  }, [serviceProviderId, toast]);

  // Transform availability data to match form values
  const defaultValues = availability
    ? {
        date: new Date(availability.startTime),
        startTime: new Date(availability.startTime),
        endTime: new Date(availability.endTime),
        serviceIds: availability.availableServices.map((s) => s.serviceId),
        availableServices: availability.availableServices.map((s) => ({
          serviceId: s.serviceId,
          duration: s.duration,
          price: Number(s.price),
          isOnlineAvailable: s.isOnlineAvailable,
          isInPerson: s.isInPerson,
          location: s.location || undefined,
        })),
      }
    : {
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        serviceIds: [],
        availableServices: [],
      };

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(AvailabilityFormSchema),
    defaultValues,
  });

  const {
    formState: { errors },
  } = form;

  console.log('Form errors:', form.formState.errors);

  async function onSubmit(values: AvailabilityFormValues) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('serviceProviderId', serviceProviderId);
      formData.append('date', values.date.toISOString());
      formData.append('startTime', values.startTime.toISOString());
      formData.append('endTime', values.endTime.toISOString());

      values.availableServices.forEach((service, index) => {
        formData.append(`availableServices[${index}][serviceId]`, service.serviceId);
        formData.append(`availableServices[${index}][duration]`, String(service.duration));
        formData.append(`availableServices[${index}][price]`, String(service.price));
        formData.append(
          `availableServices[${index}][isOnlineAvailable]`,
          String(service.isOnlineAvailable)
        );
        formData.append(`availableServices[${index}][isInPerson]`, String(service.isInPerson));
        if (service.location) {
          formData.append(`availableServices[${index}][location]`, service.location);
        }
      });

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
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2">Date</FormLabel>
              <DatePicker date={field.value} onChange={field.onChange} />
              <FormMessage>
                {fieldState.error?.message || (fieldState.invalid && 'Please select a valid date')}
              </FormMessage>
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field, fieldState }) => (
              <FormItem className="flex-1">
                <FormLabel className="mb-2">Start Time</FormLabel>
                <TimePicker date={field.value} onChange={field.onChange} />
                <FormMessage>
                  {fieldState.error?.message ||
                    (fieldState.invalid && 'Please select a valid start time')}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field, fieldState }) => (
              <FormItem className="flex-1">
                <FormLabel className="mb-2">End Time</FormLabel>
                <TimePicker date={field.value} onChange={field.onChange} />
                <FormMessage>
                  {fieldState.error?.message ||
                    (fieldState.invalid && 'Please select a valid end time')}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="availableServices"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2">Available Services</FormLabel>
              <ServiceConfigurationFields
                services={services}
                control={form.control}
                form={form}
                toast={toast}
              />
              <FormMessage>
                {fieldState.error?.message ||
                  (fieldState.invalid && 'Please configure at least one service')}
              </FormMessage>
            </FormItem>
          )}
        />

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
