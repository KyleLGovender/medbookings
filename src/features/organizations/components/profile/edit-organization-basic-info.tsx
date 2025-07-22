'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Globe, ImageIcon, Mail, Phone, Save, Upload } from 'lucide-react';
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
import { useOrganization } from '@/features/organizations/hooks/use-organization';
import { useUpdateOrganizationBasicInfo } from '@/features/organizations/hooks/use-organization-updates';
import { OrganizationBasicInfoData } from '@/features/organizations/types/types';
import { organizationBasicInfoSchema } from '@/features/organizations/types/schemas';
import { useToast } from '@/hooks/use-toast';

interface EditOrganizationBasicInfoProps {
  organizationId: string;
  userId?: string;
}

export function EditOrganizationBasicInfo({
  organizationId,
  userId,
}: EditOrganizationBasicInfoProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading, error, refetch } = useOrganization(organizationId);

  const form = useForm<OrganizationBasicInfoData>({
    resolver: zodResolver(organizationBasicInfoSchema),
    defaultValues: {
      name: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      logo: '',
    },
  });

  // Use the simplified mutation hook without callbacks
  const updateOrganizationMutation = useUpdateOrganizationBasicInfo();

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        description: organization.description || '',
        phone: organization.phone || '',
        website: organization.website || '',
        email: organization.email || '',
        logo: organization.logo || '',
      });
    }
  }, [organization, form]);

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
      // Use mutateAsync instead of mutate to properly await the result
      await updateOrganizationMutation.mutateAsync({ organizationId, data });

      // Manually update the local state to reflect the change immediately
      if (organization) {
        // Create a new organization object with the updated basic info
        const updatedOrganization = { ...organization, ...data };

        // Force update the query cache with the new data
        queryClient.setQueryData(['organization', organizationId], updatedOrganization);
      }

      toast({
        title: 'Success',
        description: 'Organization details updated successfully',
      });

      // Force a hard refetch to ensure we have the latest data
      refetch();

      // Also refresh the router to update any server components
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update organization',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleLogoUpload = () => {
    // TODO: Implement logo upload to Vercel Blob
    console.log('Logo upload functionality to be implemented');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Organization Details</h2>
        <p className="text-muted-foreground">
          Update your healthcare organization or medical practice information.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Essential details about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., City Medical Center" {...field} />
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
                          placeholder="Brief description of your organization and services..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be visible to patients when they search for providers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logo Upload */}
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Organization Logo
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            placeholder="Logo URL (will be uploaded to secure storage)"
                            {...field}
                            readOnly
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleLogoUpload}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Logo
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload your organization&apos;s logo (optional). Recommended size: 200x200px
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>How patients and providers can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@yourorganization.com"
                            {...field}
                          />
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
                        <Input
                          type="url"
                          placeholder="https://www.yourorganization.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Your organization&apos;s website (optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

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
