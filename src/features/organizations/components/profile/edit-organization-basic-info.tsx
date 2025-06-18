'use client';

import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Building2, Globe, Mail, Phone, Save } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useOrganization } from '@/features/organizations/hooks/use-organization';
import { useUpdateOrganizationBasicInfo } from '@/features/organizations/hooks/use-organization-updates';
import { OrganizationBasicInfoData } from '@/features/organizations/types/types';
import { useToast } from '@/hooks/use-toast';

interface EditOrganizationBasicInfoProps {
  organizationId: string;
  userId?: string;
}

export function EditOrganizationBasicInfo({
  organizationId,
  userId,
}: EditOrganizationBasicInfoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading, error } = useOrganization(organizationId);

  const form = useFormContext<OrganizationBasicInfoData>();

  const updateOrganizationMutation = useUpdateOrganizationBasicInfo({
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update organization',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        description: organization.description || '',
        phone: organization.phone || '',
        website: organization.website || '',
        email: organization.email || '',
      });
    }
  }, [organization, form]);

  useEffect(() => {
    if (
      organization &&
      userId &&
      organization.memberships.some((m) => m.userId === userId && m.role === 'ADMIN')
    ) {
      // User is an admin, allow editing
    } else if (
      organization &&
      userId &&
      !organization.memberships.some((m) => m.userId === userId && m.role === 'ADMIN')
    ) {
      // User is not an admin, or not a member, disable editing
      form.setError('name', {
        type: 'manual',
        message: 'You are not authorized to edit this organization.',
      });
    }
  }, [organization, userId, form]);

  if (isLoading) {
    return null; // The parent component (EditOrganization) handles the loading skeleton
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

  async function onSubmit(data: OrganizationBasicInfoData) {
    setIsSubmitting(true);
    try {
      await updateOrganizationMutation.mutate({ organizationId, data });
    } catch (err) {
      // Error handled by useUpdateOrganizationBasicInfo hook's onError
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">
          Update your organization's basic details and contact information.
        </p>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter organization name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your organization..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide a brief description of your organization and services.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="contact@organization.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+27 11 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://www.organization.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billingModel"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Billing Model</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 gap-4"
                  >
                    {['CONSOLIDATED', 'PER_LOCATION', 'HYBRID'].map((model) => (
                      <div
                        key={model}
                        className="flex items-center space-x-2 rounded-md border p-4"
                      >
                        <RadioGroupItem value={model} id={model} />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={model}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {getBillingModelLabel(model)}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {getBillingModelDescription(model)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || updateOrganizationMutation.isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting || updateOrganizationMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

const getBillingModelLabel = (model: string) => {
  switch (model) {
    case 'CONSOLIDATED':
      return 'Consolidated Billing';
    case 'PER_LOCATION':
      return 'Per-Location Billing';
    case 'HYBRID':
      return 'Hybrid Billing';
    default:
      return model;
  }
};

const getBillingModelDescription = (model: string) => {
  switch (model) {
    case 'CONSOLIDATED':
      return 'All locations share a single subscription and billing account.';
    case 'PER_LOCATION':
      return 'Each location has its own separate subscription and billing.';
    case 'HYBRID':
      return 'Mix of consolidated and per-location billing for different locations.';
    default:
      return '';
  }
};
