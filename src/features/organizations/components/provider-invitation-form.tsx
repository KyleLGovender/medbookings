'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MessageSquare, Send, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useSendProviderInvitation } from '@/features/organizations/hooks/use-provider-invitations';
import {
  ProviderInvitationData,
  ProviderInvitationSchema,
} from '@/features/organizations/types/types';
import { useToast } from '@/hooks/use-toast';

interface ProviderInvitationFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function ProviderInvitationForm({ organizationId, onSuccess }: ProviderInvitationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProviderInvitationData>({
    resolver: zodResolver(ProviderInvitationSchema),
    defaultValues: {
      email: '',
      customMessage: '',
    },
  });

  const sendInvitationMutation = useSendProviderInvitation({
    onSuccess: (data) => {
      toast({
        title: 'Invitation Sent',
        description: `Provider invitation has been sent to ${form.getValues('email')}`,
      });
      form.reset();
      setIsSubmitting(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Failed to Send Invitation',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: ProviderInvitationData) => {
    setIsSubmitting(true);
    sendInvitationMutation.mutate({
      organizationId,
      data,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite Provider
        </CardTitle>
        <CardDescription>
          Send an invitation to a healthcare provider to join your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Provider Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="provider@example.com"
                      type="email"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the email address of the healthcare provider you want to invite
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Personal Message (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hi! We'd love to have you join our team at [Organization Name]. Looking forward to working together!"
                      className="min-h-[100px]"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a personal message to make your invitation more welcoming
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
