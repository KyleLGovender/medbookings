'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Globe, Mail, Phone, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { useToast } from '@/hooks/use-toast';

const organizationBasicInfoSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  billingModel: z.enum(['CONSOLIDATED', 'PER_LOCATION', 'HYBRID']),
});

type OrganizationBasicInfoData = z.infer<typeof organizationBasicInfoSchema>;

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

  const form = useForm<OrganizationBasicInfoData>({
    resolver: zodResolver(organizationBasicInfoSchema),
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationBasicInfoData) => {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast({
        title: 'Organization updated',
        description: 'Your organization details have been successfully updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: OrganizationBasicInfoData) => {
    setIsSubmitting(true);
    try {
      await updateOrganizationMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">
          Update your organization&apos;s basic details and contact information.
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
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
