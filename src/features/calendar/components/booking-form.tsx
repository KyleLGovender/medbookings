'use client';

import { Suspense, useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { debounce } from 'lodash';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/ui/time-picker';
import { useToast } from '@/hooks/use-toast';

import { createBooking, updateBooking } from '../lib/actions';
import {
  Availability,
  Booking,
  type BookingFormData,
  BookingFormSchema,
  BookingFormValues,
} from '../lib/types';

const defaultValues: Partial<BookingFormData> = {
  bookingType: 'GUEST',
  notificationPreferences: {
    email: false,
    sms: false,
    whatsapp: true,
  },
  isOnline: true,
  duration: 15,
  notifyViaEmail: false,
  notifyViaSMS: false,
  notifyViaWhatsapp: true,
  status: 'PENDING',
  clientWhatsapp: '',
  clientPhone: '',
  clientName: '',
  price: 0,
};

interface BookingFormProps {
  serviceProviderId: string;
  booking?: Booking;
  mode: 'create' | 'edit';
  onClose: () => void;
  onRefresh?: () => Promise<void>;
  selectedDate: Date;
  availability?: Availability;
}

export function BookingForm({
  serviceProviderId,
  booking,
  mode,
  onClose,
  onRefresh,
  selectedDate,
  availability,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<BookingFormData>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      ...defaultValues,
      serviceProviderId,
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'startTime') {
        const startTime = value.startTime;
        if (startTime) {
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 15);
          form.setValue('endTime', endTime);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: BookingFormValues) => {
    setIsSubmitting(true);
    console.log('onSubmit: Current form values:', values);
    try {
      if (!values.startTime || !values.endTime) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Start time and end time are required',
        });
        return;
      }

      const formData = new FormData();

      // Core booking details
      formData.append('bookingType', 'GUEST');
      formData.append('serviceProviderId', serviceProviderId);
      formData.append('startTime', values.startTime.toISOString());
      formData.append('endTime', values.endTime.toISOString());
      formData.append('duration', String(values.duration));
      formData.append('status', 'PENDING');
      formData.append('isOnline', String(values.isOnline));

      // Client details - use empty string for optional fields
      formData.append('clientName', values.clientName?.trim() ?? '');
      formData.append('clientEmail', values.clientEmail?.trim() ?? '');
      formData.append('clientPhone', values.clientPhone?.trim() ?? '');
      formData.append('clientWhatsapp', values.clientWhatsapp?.trim() ?? '');

      // Notification preferences as JSON string
      formData.append(
        'notificationPreferences',
        JSON.stringify({
          email: values.notifyViaEmail || false,
          sms: values.notifyViaSMS || false,
          whatsapp: values.notifyViaWhatsapp || false,
        })
      );

      // Optional fields
      if (values.location) formData.append('location', values.location.trim());
      if (values.notes) formData.append('notes', values.notes.trim());
      formData.append('price', String(values.price || 0));

      const response =
        mode === 'create'
          ? await createBooking(formData)
          : await updateBooking(booking?.id || '', formData);

      if (!response) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No response from server',
        });
        return;
      }

      if (response.error || response.fieldErrors || response.formErrors) {
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, errors]) => {
            toast({
              variant: 'destructive',
              title: `Error in ${field}`,
              description: errors.join(', '),
            });
          });
        } else if (response.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: response.error,
          });
        }
        return;
      }

      toast({
        title: 'Success',
        description: `Booking ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      await onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Booking submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-xl space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment Time</FormLabel>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <FormControl>
                      <Suspense
                        fallback={<div className="h-10 w-full animate-pulse rounded-md bg-muted" />}
                      >
                        <DatePicker
                          date={field.value}
                          onChange={(date) => {
                            if (date) {
                              const currentTime = field.value || new Date();
                              date.setHours(currentTime.getHours());
                              date.setMinutes(currentTime.getMinutes());
                              field.onChange(date);
                            }
                          }}
                        />
                      </Suspense>
                    </FormControl>
                  </div>
                  <div className="w-[140px]">
                    <FormControl>
                      <TimePicker
                        date={field.value}
                        onChange={debounce((date) => {
                          if (date) {
                            field.onChange(date);
                          }
                        }, 150)}
                      />
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormLabel>Notifications</FormLabel>
          {/* Notification Preferences */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="notifyViaWhatsapp"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">WhatsApp Notifications</FormLabel>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="clientWhatsapp"
                      render={({ field }) => (
                        <PhoneInput
                          defaultCountry="ZA"
                          value={field.value ?? ''}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                            }
                          }}
                        />
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifyViaSMS"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">SMS Notifications</FormLabel>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="clientPhone"
                      render={({ field }) => (
                        <PhoneInput
                          defaultCountry="ZA"
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                            }
                          }}
                        />
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifyViaEmail"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">Email Notifications</FormLabel>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Enter your email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {form.formState.errors.root && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{form.formState.errors.root.message}</div>
          </div>
        )}

        <div className="text-sm text-red-500">
          <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre>
        </div>

        <div className="space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Booking'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
