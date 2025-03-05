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
import { roundToNearestMinute } from '@/features/calendar/lib/helper';
import { getServiceProviderServices } from '@/features/calendar/lib/queries';
import { Service } from '@/features/service-provider/lib/types';
import { useToast } from '@/hooks/use-toast';

import { createAvailability, updateAvailability } from '../../lib/actions';
import { AvailabilityFormSchema, AvailabilityFormValues, AvailabilityView } from '../../lib/types';
import { ServiceConfigurationFields } from './service-configuration-fields';

interface AvailabilityFormProps {
  serviceProviderId: string;
  availability?: AvailabilityView;
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

  // Modify the defaultValues transformation
  const defaultValues = availability
    ? {
        date: new Date(availability.startTime),
        startTime: roundToNearestMinute(new Date(availability.startTime)),
        endTime: roundToNearestMinute(new Date(availability.endTime)),
        availableServices: availability.availableServices.map((s) => ({
          serviceId: s.serviceId,
          duration: s.duration,
          price: Number(s.price),
          isOnlineAvailable: s.isOnlineAvailable,
          isInPerson: s.isInPerson,
          location: s.location || '',
        })),
      }
    : {
        date: new Date(),
        startTime: roundToNearestMinute(new Date()),
        endTime: roundToNearestMinute(new Date()),
        availableServices: [],
      };

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(AvailabilityFormSchema),
    defaultValues,
  });

  const {
    formState: { errors },
  } = form;

  // Add this to display validation errors
  // console.log('Form Errors:', errors);

  // Modify the onSubmit function
  async function onSubmit(values: AvailabilityFormValues) {
    // Combine date and times
    const baseDate = values.date;
    const startDateTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      values.startTime.getHours(),
      values.startTime.getMinutes()
    );
    const endDateTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      values.endTime.getHours(),
      values.endTime.getMinutes()
    );

    const formData = new FormData();
    formData.append('serviceProviderId', serviceProviderId);
    formData.append('date', values.date.toISOString());
    formData.append('startTime', roundToNearestMinute(startDateTime).toISOString());
    formData.append('endTime', roundToNearestMinute(endDateTime).toISOString());

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
      if (response.fieldErrors) {
        Object.entries(response.fieldErrors).forEach(([field, errors]) => {
          form.setError(field as any, {
            type: 'server',
            message: Array.isArray(errors) ? errors[0] : 'Unknown error',
          });
        });
      }

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
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log('Form submission attempted');
          form.handleSubmit(onSubmit)(e);
        }}
        className="w-full max-w-xl space-y-6"
      >
        {/* Temporary error display */}
        {Object.keys(errors).length > 0 && (
          <div className="text-sm text-red-500">
            <pre>{JSON.stringify(errors, null, 2)}</pre>
          </div>
        )}

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
