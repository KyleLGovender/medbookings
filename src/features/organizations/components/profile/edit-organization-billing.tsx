'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useOrganization } from '@/features/organizations/hooks/use-organization';
import { useUpdateOrganizationBilling } from '@/features/organizations/hooks/use-organization-updates';
import { useToast } from '@/hooks/use-toast';

// Define schema for billing model updates
const organizationBillingSchema = z.object({
  billingModel: z.enum(['CONSOLIDATED', 'PER_LOCATION']),
});

// Define type based on the schema
type OrganizationBillingData = z.infer<typeof organizationBillingSchema>;

interface EditOrganizationBillingProps {
  organizationId: string;
  userId?: string;
}

export function EditOrganizationBilling({ organizationId, userId }: EditOrganizationBillingProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading, error, refetch } = useOrganization(organizationId);

  const form = useForm<OrganizationBillingData>({
    resolver: zodResolver(organizationBillingSchema),
    defaultValues: {
      billingModel: 'CONSOLIDATED',
    },
  });

  // Use the simplified mutation hook without callbacks
  const updateOrganizationMutation = useUpdateOrganizationBilling();

  // Update form when organization data is loaded
  useEffect(() => {
    if (organization) {
      form.reset({
        billingModel: organization.billingModel || 'CONSOLIDATED',
      });
    }
  }, [organization, form]);

  // Check if user is authorized to edit this organization
  useEffect(() => {
    if (
      organization &&
      userId &&
      organization.memberships.some((m: any) => m.userId === userId && m.role === 'ADMIN')
    ) {
      // User is an admin, allow editing
    } else if (
      organization &&
      userId &&
      !organization.memberships.some((m: any) => m.userId === userId && m.role === 'ADMIN')
    ) {
      // User is not an admin, or not a member, disable editing
      form.setError('billingModel', {
        type: 'manual',
        message: 'You are not authorized to edit this organization.',
      });
    }
  }, [organization, userId, form]);

  if (isLoading) {
    return null; // The parent component handles the loading skeleton
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Error Loading Organization</h2>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Unable to load organization details'}
        </p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Organization Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested organization could not be found.
        </p>
      </div>
    );
  }

  async function onSubmit(data: OrganizationBillingData) {
    setIsSubmitting(true);
    try {
      // Use mutateAsync with the tRPC-compatible parameters
      await updateOrganizationMutation.mutateAsync({
        id: organizationId,
        billingModel: data.billingModel,
      });

      // Explicitly refetch the organization data to ensure we have the latest
      await refetch();

      toast({
        title: 'Success',
        description: 'Billing model updated successfully',
      });

      // Navigate back to the organization page
      router.push(`/organizations/${organizationId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update billing model',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Billing Settings</h2>
        <p className="text-muted-foreground">
          Configure how billing is managed across your organization and locations.
        </p>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Model
              </CardTitle>
              <CardDescription>
                Choose how billing is managed across your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="billingModel"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-4"
                      >
                        <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <RadioGroupItem value="CONSOLIDATED" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-medium">Consolidated</FormLabel>
                            <FormDescription>
                              All locations are billed under the main organization account.
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <RadioGroupItem value="PER_LOCATION" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-medium">Per Location</FormLabel>
                            <FormDescription>
                              Each location has its own separate billing account.
                            </FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
