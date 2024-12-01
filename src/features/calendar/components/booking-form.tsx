'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
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
};

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => Promise<void>;
  isSubmitting?: boolean;
  serviceProviderId: string;
  availabilityId: string;
}

export function BookingForm({
  onSubmit,
  isSubmitting = false,
  serviceProviderId,
  availabilityId,
}: BookingFormProps) {
  const form = useForm<BookingFormData>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      ...defaultValues,
      serviceProviderId,
      availabilityId,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    </FormControl>
                  </div>
                  <div className="w-[140px]">
                    <FormControl>
                      <TimePicker
                        date={field.value}
                        onChange={(date) => {
                          if (date) {
                            field.onChange(date);
                          }
                        }}
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

        <div className="space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Booking...' : 'Complete Booking'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
