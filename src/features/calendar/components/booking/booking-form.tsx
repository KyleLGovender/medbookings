'use client';

import { useRouter } from 'next/navigation';

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
import { useToast } from '@/hooks/use-toast';

import { createBooking } from '../../lib/actions';
import { AvailabilitySlot, BookingFormSchema } from '../../lib/types';

interface BookingFormProps {
  slot: AvailabilitySlot;
  serviceProvider: {
    id: string;
    name: string;
    image?: string | null;
  };
  onCancel: () => void;
  onSuccess: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

export function BookingForm({
  slot,
  serviceProvider,
  onCancel,
  onSuccess,
  isSubmitting,
  setIsSubmitting,
}: BookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      slotId: slot.id,
      bookingType: 'GUEST_SELF' as const,
      notificationPreferences: {
        email: true,
        sms: false,
        whatsapp: false,
      },
      guestInfo: {
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
      },
      agreeToTerms: false,
    },
  });

  async function onSubmit(values: any) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('slotId', values.slotId);
    formData.append('bookingType', values.bookingType);

    // Add notification preferences
    formData.append('notifyViaEmail', values.notificationPreferences.email.toString());
    formData.append('notifyViaSMS', values.notificationPreferences.sms.toString());
    formData.append('notifyViaWhatsapp', values.notificationPreferences.whatsapp.toString());

    // Add guest info
    formData.append('guestName', values.guestInfo.name);
    formData.append('guestEmail', values.guestInfo.email || '');
    formData.append('guestPhone', values.guestInfo.phone || '');
    formData.append('guestWhatsapp', values.guestInfo.whatsapp || '');

    // Add appointment type (derived from slot configuration)
    const appointmentType = slot.serviceConfig.isOnlineAvailable ? 'online' : 'inperson';
    formData.append('appointmentType', appointmentType);

    try {
      const response = await createBooking(formData);

      if (response.error) {
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, errors]) => {
            // Handle nested fields
            if (field.includes('.')) {
              const [parent, child] = field.split('.');
              form.setError(`${parent}.${child}` as any, {
                type: 'server',
                message: Array.isArray(errors) ? errors[0] : 'Unknown error',
              });
            } else {
              form.setError(field as any, {
                type: 'server',
                message: Array.isArray(errors) ? errors[0] : 'Unknown error',
              });
            }
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

      onSuccess();
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
            <Avatar className="h-32 w-32">
              <AvatarImage src={serviceProvider.image || undefined} />
              <AvatarFallback>{serviceProvider.name[0]}</AvatarFallback>
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
                <span className="text-sm text-gray-600">${slot.serviceConfig.price}</span>
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
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1234567890" {...field} />
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
                  <FormLabel>WhatsApp Number (if different)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Preferences</h3>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="notificationPreferences.email"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        required
                      />
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
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        required
                      />
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
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        required
                      />
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
                    required
                  />
                </FormControl>
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            Request Booking
          </Button>
        </div>
      </div>
    </Form>
  );
}
