'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Loader2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';

import { useSendEmailVerification, useUpdateAccountSettings } from '../hooks/use-settings';
import { type AccountSettingsInput, accountSettingsSchema } from '../types/schemas';
import { type UserSettings } from '../types/types';

interface AccountSettingsSectionProps {
  user: UserSettings;
}

export default function AccountSettingsSection({ user }: AccountSettingsSectionProps) {
  const { toast } = useToast();
  const updateAccountSettings = useUpdateAccountSettings();
  const sendEmailVerification = useSendEmailVerification();

  const form = useForm<AccountSettingsInput>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
    },
  });

  const onSubmit = async (data: AccountSettingsInput) => {
    try {
      await updateAccountSettings.mutateAsync(data);
      toast({
        title: 'Account updated',
        description: 'Your account settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update account settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendVerification = async () => {
    try {
      await sendEmailVerification.mutateAsync();
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for the verification email.',
      });
    } catch (error) {
      toast({
        title: 'Failed to send verification email',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Email verification status */}
      {user.email && (
        <Alert variant={user.emailVerified ? 'default' : 'destructive'}>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {user.emailVerified
                ? 'Your email address is verified.'
                : 'Your email address is not verified. Check your inbox for a verification email.'}
            </span>
            {!user.emailVerified && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendVerification}
                disabled={sendEmailVerification.isPending}
                className="ml-4"
              >
                {sendEmailVerification.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification
                  </>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email address" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your primary email for notifications and login.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormDescription>Used for SMS notifications (optional).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter your WhatsApp number" {...field} />
                  </FormControl>
                  <FormDescription>Used for WhatsApp notifications (optional).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={updateAccountSettings.isPending}
              className="min-w-[100px]"
            >
              {updateAccountSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Account'
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
