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

import { createBooking } from '../lib/actions';
import { type BookingFormData, BookingFormSchema } from '../lib/types';

const defaultValues: Partial<BookingFormData> = {
  bookingType: 'GUEST',
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
}

export function BookingForm({ serviceProviderId, booking, onClose, onRefresh }: BookingFormProps) {
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
    console.log('Current form values:', form.getValues());
  }, [form]);

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

  useEffect(() => {
    const subscription = form.watch((data) => {
      console.log('Form data changed:', data);
      form.trigger().then((isValid) => {
        console.log('Form validation result:', isValid);
        console.log('Form errors:', form.formState.errors);
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: BookingFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('serviceProviderId', serviceProviderId);
      formData.append('startTime', values.startTime.toISOString());
      formData.append('endTime', values.endTime.toISOString());
      formData.append('duration', String(values.duration));
      formData.append('price', String(values.price));
      formData.append('isOnline', String(values.isOnline));
      formData.append('location', values.location?.trim() || '');
      formData.append('notes', values.notes?.trim() || '');

      // Add client/guest information
      if (values.bookingType === 'USER' && values.userId) {
        formData.append('bookingType', 'USER');
        formData.append('userId', values.userId);
      } else {
        formData.append('bookingType', 'GUEST');
        formData.append('guestName', values.guestName.trim());
        formData.append('guestEmail', values.guestEmail.trim());
        formData.append('guestPhone', values.guestPhone?.trim() || '');
        formData.append('guestWhatsapp', values.guestWhatsapp?.trim() || '');
        // Notification preferences
        formData.append('notifyViaEmail', String(values.notificationPreferences?.email || false));
        formData.append('notifyViaSMS', String(values.notificationPreferences?.sms || false));
        formData.append(
          'notifyViaWhatsapp',
          String(values.notificationPreferences?.whatsapp || false)
        );
      }

      const response =
        mode === 'create'
          ? await createBooking(formData)
          : await updateBooking(booking?.id || '', formData);

      if (response.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error,
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: 'Success',
        description: 'Booking created successfully',
      });

      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Booking form error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
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
                  <Input {...field} placeholder="Enter your name" />
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
                          onChange={field.onChange}
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
