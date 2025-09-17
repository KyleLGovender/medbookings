'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { useUpdateCommunicationPreferences } from '../hooks/use-settings';
import {
  type CommunicationPreferencesInput,
  communicationPreferencesSchema,
} from '../types/schemas';
import { type CommunicationPreferences } from '../types/types';

interface CommunicationPreferencesSectionProps {
  preferences: CommunicationPreferences;
}

export default function CommunicationPreferencesSection({
  preferences,
}: CommunicationPreferencesSectionProps) {
  const { toast } = useToast();
  const updatePreferences = useUpdateCommunicationPreferences();

  const form = useForm<CommunicationPreferencesInput>({
    resolver: zodResolver(communicationPreferencesSchema),
    defaultValues: {
      email: preferences.email,
      sms: preferences.sms,
      whatsapp: preferences.whatsapp,
      phoneNumber: preferences.phoneNumber || '',
      whatsappNumber: preferences.whatsappNumber || '',
      reminderHours: preferences.reminderHours,
    },
  });

  const watchSms = form.watch('sms');
  const watchWhatsapp = form.watch('whatsapp');

  const onSubmit = async (data: CommunicationPreferencesInput) => {
    try {
      await updatePreferences.mutateAsync(data);
      toast({
        title: 'Preferences updated',
        description: 'Your communication preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update communication preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Notification channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Channels</h3>
            <p className="text-sm text-muted-foreground">
              Choose how you want to receive notifications about your appointments and updates.
            </p>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Email notifications</FormLabel>
                      <FormDescription>
                        Receive notifications via email (recommended)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>SMS notifications</FormLabel>
                      <FormDescription>Receive notifications via SMS text messages</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>WhatsApp notifications</FormLabel>
                      <FormDescription>Receive notifications via WhatsApp messages</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contact numbers for notifications */}
          {(watchSms || watchWhatsapp) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Numbers</h3>

              {watchSms && (
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMS Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number for SMS" {...field} />
                      </FormControl>
                      <FormDescription>
                        This number will be used for SMS notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchWhatsapp && (
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter WhatsApp number" {...field} />
                      </FormControl>
                      <FormDescription>
                        This number will be used for WhatsApp notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}

          {/* Reminder timing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Reminder Timing</h3>
            <FormField
              control={form.control}
              name="reminderHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Reminder</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Select reminder time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 hour before</SelectItem>
                      <SelectItem value="2">2 hours before</SelectItem>
                      <SelectItem value="4">4 hours before</SelectItem>
                      <SelectItem value="8">8 hours before</SelectItem>
                      <SelectItem value="24">24 hours before</SelectItem>
                      <SelectItem value="48">48 hours before</SelectItem>
                      <SelectItem value="72">72 hours before</SelectItem>
                      <SelectItem value="168">1 week before</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How far in advance you want to receive appointment reminders
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={updatePreferences.isPending} className="min-w-[120px]">
              {updatePreferences.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>

            {form.formState.isDirty && (
              <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
