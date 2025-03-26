'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { updateBooking } from '@/features/calendar/lib/actions';
import { AvailabilitySlot, BookingFormSchema, BookingView } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';

interface BookingEditFormProps {
  booking: BookingView;
  slot: AvailabilitySlot;
  serviceProvider: {
    id: string;
    name: string;
    image?: string | null;
  };
  onCancel: () => void;
  onSuccess: (bookingId: string) => void;
}

export function BookingEditForm({
  booking,
  slot,
  serviceProvider,
  onCancel,
  onSuccess,
}: BookingEditFormProps) {
  // Move the form initialization before any conditional returns
  const form = useForm({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      slotId: slot?.id || '',
      bookingType: booking?.bookingType || ('GUEST_SELF' as const),
      notificationPreferences: {
        email: booking?.notificationPreferences.email || true,
        sms: booking?.notificationPreferences.sms || false,
        whatsapp: booking?.notificationPreferences.whatsapp || false,
      },
      guestInfo: {
        name: booking?.guestInfo.name || '',
        email: booking?.guestInfo.email || '',
        phone: booking?.guestInfo.phone || '',
        whatsapp: booking?.guestInfo.whatsapp || '',
      },
      agreeToTerms: booking ? true : false,
    },
    mode: 'onSubmit',
  });

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('Form validation errors:', form.formState.errors);
    }
  }, [form.formState.errors]);

  // Now you can have conditional returns
  if (!slot || !serviceProvider) {
    return <div>Error: Missing information</div>;
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);
      setServerErrors([]);

      const formData = new FormData();

      formData.append('slotId', data.slotId);
      formData.append('bookingType', data.bookingType);
      formData.append('notifyViaEmail', data.notificationPreferences.email.toString());
      formData.append('notifyViaSMS', data.notificationPreferences.sms.toString());
      formData.append('notifyViaWhatsapp', data.notificationPreferences.whatsapp.toString());
      formData.append('guestName', data.guestInfo.name);
      formData.append('guestEmail', data.guestInfo.email || '');
      formData.append('guestPhone', data.guestInfo.phone || '');
      formData.append('guestWhatsapp', data.guestInfo.whatsapp || '');
      const appointmentType = slot.serviceConfig.isOnlineAvailable ? 'online' : 'inperson';
      formData.append('appointmentType', appointmentType);
      formData.append('agreeToTerms', data.agreeToTerms.toString());

      const response = await updateBooking(booking.id, formData);

      if (response.error) {
        setServerErrors([response.error]);
        return;
      }

      const bookingId = response.data?.bookingId;

      if (!bookingId) {
        setServerErrors(['No booking ID returned from server']);
        return;
      }

      toast({
        title: 'Booking updated',
        description: 'Your booking has been successfully updated.',
      });

      onSuccess(bookingId);
    } catch (error) {
      console.error('Booking submission error:', error);
      setServerErrors([error instanceof Error ? error.message : 'An unknown error occurred']);

      toast({
        title: 'Error',
        description: 'Failed to update booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex h-full flex-col">
        {/* Form title based on mode */}
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">Update Booking</h2>
        </div>

        <div className="flex-1 space-y-6 p-4">
          {/* Service Provider Info */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-24 w-24 rounded-full">
              <AvatarImage
                src={serviceProvider.image || undefined}
                alt={serviceProvider.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xl font-medium">
                {serviceProvider.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-lg font-medium">{serviceProvider.name}</h4>
              <p className="text-base text-gray-500">{slot.service.name}</p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Appointment Details</h3>
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
                <span className="text-sm text-gray-600">R{slot.serviceConfig.price}</span>
              </div>

              <div className="flex flex-col pt-2">
                <span className="text-sm font-medium">Appointment Type</span>
                <RadioGroup
                  defaultValue={slot.serviceConfig.isOnlineAvailable ? 'online' : 'inperson'}
                  className="mt-1 flex space-x-4"
                  disabled
                >
                  {slot.serviceConfig.isOnlineAvailable && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="online-option" />
                      <label htmlFor="online-option" className="text-sm text-gray-600">
                        Online
                      </label>
                    </div>
                  )}
                  {slot.serviceConfig.isInPerson && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inperson" id="inperson-option" />
                      <label htmlFor="inperson-option" className="text-sm text-gray-600">
                        In Person
                      </label>
                    </div>
                  )}
                </RadioGroup>
                {slot.serviceConfig.isInPerson && slot.serviceConfig.location && (
                  <p className="mt-2 text-sm text-gray-600">
                    Location: {slot.serviceConfig.location}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start py-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-auto"
                  onClick={() => {
                    router.push(
                      `/calendar/service-provider/${serviceProvider.id}?start=${new Date(slot.startTime).toISOString().split('T')[0]}`
                    );
                  }}
                >
                  Select a different booking slot
                </Button>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Guest Information</h3>
            <FormField
              control={form.control}
              name="guestInfo.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={form.formState.errors.guestInfo?.name ? 'text-destructive' : ''}
                  >
                    Full Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={form.formState.errors.guestInfo?.name ? 'border-destructive' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guestInfo.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={form.formState.errors.guestInfo?.email ? 'text-destructive' : ''}
                  >
                    Email{' '}
                    {form.watch('notificationPreferences.email') && (
                      <span className="text-destructive">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      className={form.formState.errors.guestInfo?.email ? 'border-destructive' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guestInfo.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={form.formState.errors.guestInfo?.phone ? 'text-destructive' : ''}
                  >
                    Phone Number{' '}
                    {form.watch('notificationPreferences.sms') && (
                      <span className="text-destructive">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      {...field}
                      className={form.formState.errors.guestInfo?.phone ? 'border-destructive' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guestInfo.whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={form.formState.errors.guestInfo?.whatsapp ? 'text-destructive' : ''}
                  >
                    WhatsApp Number{' '}
                    {form.watch('notificationPreferences.whatsapp') && (
                      <span className="text-destructive">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      {...field}
                      className={
                        form.formState.errors.guestInfo?.whatsapp ? 'border-destructive' : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Preferences</h3>
            {form.formState.errors.notificationPreferences && (
              <p className="text-sm text-destructive">
                {typeof form.formState.errors.notificationPreferences.message === 'string'
                  ? form.formState.errors.notificationPreferences.message
                  : 'At least one notification method must be selected'}
              </p>
            )}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="notificationPreferences.email"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Email notifications</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notificationPreferences.sms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>SMS notifications</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notificationPreferences.whatsapp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>WhatsApp notifications</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    id="agreeToTerms"
                    aria-describedby="terms-error"
                    className={form.formState.errors.agreeToTerms ? 'border-destructive' : ''}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel
                    className={form.formState.errors.agreeToTerms ? 'text-destructive' : ''}
                  >
                    <a
                      href="/terms"
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      I agree to the terms and conditions
                    </a>
                    <span className="text-destructive"> *</span>
                  </FormLabel>
                  <FormMessage id="terms-error" className="font-medium text-destructive" />
                </div>
              </FormItem>
            )}
          />

          {/* Error message section */}
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">
                    Please fix the following errors:
                  </h3>
                  <div className="mt-2 text-sm text-destructive">
                    <ul className="list-disc space-y-1 pl-5">
                      {(() => {
                        const errorList: React.ReactNode[] = [];

                        Object.entries(form.formState.errors).forEach(([key, error]) => {
                          if (
                            key === 'guestInfo' &&
                            typeof error === 'object' &&
                            error.type !== 'custom'
                          ) {
                            Object.entries(error).forEach(([nestedKey, nestedError]) => {
                              if (nestedError && typeof nestedError === 'object') {
                                errorList.push(
                                  <li key={`${key}.${nestedKey}`}>
                                    <strong>Guest {nestedKey}:</strong> {nestedError.message}
                                  </li>
                                );
                              }
                            });
                          } else if (
                            key === 'notificationPreferences' &&
                            typeof error === 'object' &&
                            error.type !== 'custom'
                          ) {
                            Object.entries(error).forEach(([nestedKey, nestedError]) => {
                              if (nestedError && typeof nestedError === 'object') {
                                errorList.push(
                                  <li key={`${key}.${nestedKey}`}>
                                    <strong>{nestedKey} notification:</strong> {nestedError.message}
                                  </li>
                                );
                              }
                            });
                          } else if (error && typeof error === 'object') {
                            const fieldName =
                              {
                                slotId: 'Booking slot',
                                bookingType: 'Booking type',
                                agreeToTerms: 'Terms and conditions',
                              }[key] || key;

                            errorList.push(
                              <li key={key}>
                                <strong>{fieldName}:</strong>{' '}
                                {key === 'agreeToTerms'
                                  ? 'You must agree to the terms and conditions'
                                  : error.message || 'Required field'}
                              </li>
                            );
                          }
                        });

                        return errorList;
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 border-t border-gray-200 p-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Submitting...
              </>
            ) : (
              'Update Booking'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
