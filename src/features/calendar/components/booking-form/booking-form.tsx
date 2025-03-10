'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

import { createBooking } from '../../lib/actions';
import { AvailabilitySlot } from '../../lib/types';

const BookingFormSchema = z.object({
  appointmentType: z.enum(['online', 'inperson']),
  guestFirstName: z.string().min(2, 'First name must be at least 2 characters'),
  guestLastName: z.string().min(2, 'Last name must be at least 2 characters'),
  guestEmail: z.string().email('Invalid email address'),
  guestPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

type BookingFormValues = z.infer<typeof BookingFormSchema>;

interface BookingFormProps {
  slot: AvailabilitySlot;
  serviceProvider: {
    id: string;
    name: string;
    image?: string | null;
  };
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function BookingForm({ slot, serviceProvider, onClose, onRefresh }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      appointmentType: slot.serviceConfig.isOnlineAvailable ? 'online' : 'inperson',
      guestFirstName: '',
      guestLastName: '',
      guestEmail: '',
      guestPhone: '',
      agreeToTerms: false,
    },
  });

  async function onSubmit(values: BookingFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('slotId', slot.id);
    formData.append('appointmentType', values.appointmentType);
    formData.append('guestFirstName', values.guestFirstName);
    formData.append('guestLastName', values.guestLastName);
    formData.append('guestEmail', values.guestEmail);
    formData.append('guestPhone', values.guestPhone);

    try {
      const response = await createBooking(formData);

      if (response.error) {
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as any, {
              type: 'server',
              message: Array.isArray(errors) ? errors[0] : 'Unknown error',
            });
          });
        }

        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error,
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Booking created successfully',
      });

      router.refresh();
      await onRefresh();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create booking',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <div className="flex h-full flex-col">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 space-y-6 overflow-y-auto p-4"
        >
          {/* Service Provider Info */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={serviceProvider.image || undefined} />
              <AvatarFallback>{serviceProvider.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-lg font-medium">{serviceProvider.name}</h4>
              <p className="text-base text-gray-500">{slot.service.name}</p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="grid gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Date</span>
                <span className="text-sm text-gray-600">
                  {new Date(slot.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Time</span>
                <span className="text-sm text-gray-600">
                  {new Date(slot.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' - '}
                  {new Date(slot.endTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Duration</span>
                <span className="text-sm text-gray-600">{slot.serviceConfig.duration} minutes</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Price</span>
                <span className="text-sm text-gray-600">${slot.serviceConfig.price}</span>
              </div>
            </div>
          </div>

          {/* Appointment Type */}
          <FormField
            control={form.control}
            name="appointmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment Type</FormLabel>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  {slot.serviceConfig.isOnlineAvailable && (
                    <div>
                      <RadioGroupItem value="online" id="online" className="peer sr-only" />
                      <label
                        htmlFor="online"
                        className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        Online
                      </label>
                    </div>
                  )}
                  {slot.serviceConfig.isInPerson && (
                    <div>
                      <RadioGroupItem value="inperson" id="inperson" className="peer sr-only" />
                      <label
                        htmlFor="inperson"
                        className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        In Person
                      </label>
                    </div>
                  )}
                </RadioGroup>
                {field.value === 'inperson' && slot.serviceConfig.location && (
                  <p className="mt-2 text-sm text-gray-500">
                    Location: {slot.serviceConfig.location}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Guest Information */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              <FormField
                control={form.control}
                name="guestFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <Input {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guestLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <Input {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="guestEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guestPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Phone Number</FormLabel>
                  <Input type="tel" placeholder="+1234567890" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Terms and Conditions */}
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the{' '}
                    <a href="/terms" className="text-primary hover:underline">
                      terms and conditions
                    </a>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </form>

        <div className="flex justify-end space-x-4 border-t border-gray-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            Request Booking
          </Button>
        </div>
      </div>
    </Form>
  );
}
