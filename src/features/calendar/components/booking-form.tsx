'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

const bookingFormSchema = z.object({
  guestName: z.string().min(2, 'Name must be at least 2 characters'),
  guestEmail: z.string().email('Invalid email address'),
  guestWhatsapp: z.string().optional(),
  numberOfGuests: z.number().min(1).max(10),
  specialRequests: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean().default(true),
    whatsapp: z.boolean().default(false),
  }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const defaultValues: Partial<BookingFormValues> = {
  notificationPreferences: {
    email: true,
    whatsapp: false,
  },
  numberOfGuests: 1,
};

interface BookingFormProps {
  onSubmit: (data: BookingFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function BookingForm({ onSubmit, isSubmitting = false }: BookingFormProps) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues,
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

  async function handleSubmit(data: BookingFormValues) {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="guestName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your full name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="guestEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Enter your email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numberOfGuests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Guests</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  min={1}
                  max={10}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notificationPreferences.email"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <FormLabel className="text-base">Email Notifications</FormLabel>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notificationPreferences.whatsapp"
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">WhatsApp Notifications</FormLabel>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
                {field.value && (
                  <FormField
                    control={form.control}
                    name="guestWhatsapp"
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        value={field.value || '+27'}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    )}
                  />
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Requests</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Any special requests or notes?"
                  className="h-32"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Complete Booking'}
        </Button>
      </form>
    </Form>
  );
}
