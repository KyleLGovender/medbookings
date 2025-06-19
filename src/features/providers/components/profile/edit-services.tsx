'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import CalendarLoader from '@/components/calendar-loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useProvider } from '@/features/providers/hooks/use-provider';
import { useProviderServices } from '@/features/providers/hooks/use-provider-services';
import { useUpdateProviderServices } from '@/features/providers/hooks/use-provider-updates';
import { useToast } from '@/hooks/use-toast';

// Zod schema for a single service
const serviceSchema = z.object({
  id: z.string().min(1, 'Service is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  duration: z.coerce.number().min(1, 'Duration must be a positive number'),
});

// Zod schema for the form
const editServicesSchema = z.object({
  services: z.array(serviceSchema),
});

type EditServicesFormValues = z.infer<typeof editServicesSchema>;

interface EditServicesProps {
  providerId: string;
  userId: string;
}

export function EditServices({ providerId, userId }: EditServicesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch provider data
  const {
    data: provider,
    isLoading: isProviderLoading,
    error: providerError,
    refetch,
  } = useProvider(providerId);

  // Fetch available services
  const {
    data: availableServices,
    isLoading: isServicesLoading,
    error: servicesError,
  } = useProviderServices(providerId);

  // Get provider's current services
  const providerServiceIds = provider?.services?.map((s: any) => s.id) || [];

  const updateProviderServicesMutation = useUpdateProviderServices({
    onSuccess: (data) => {
      // Invalidate queries to ensure data consistency with the server
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider-services', providerId] });

      toast({
        title: 'Success',
        description: 'Services updated successfully',
      });

      // Force a hard refetch to ensure we have the latest data
      refetch();

      // Also refresh the router to update any server components
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update services',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<EditServicesFormValues>({
    resolver: zodResolver(editServicesSchema),
    defaultValues: {
      services: providerServiceIds.map((id) => ({
        id,
        price: 0,
        duration: 30,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  const onSubmit = async (data: EditServicesFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', providerId);

      data.services.forEach((service, index) => {
        formData.append(`services[${index}][id]`, service.id);
        formData.append(`services[${index}][price]`, service.price.toString());
        formData.append(`services[${index}][duration]`, service.duration.toString());
      });

      // Call the mutation with the formData
      await updateProviderServicesMutation.mutateAsync(formData);

      // Manually update the local state to reflect the changes immediately
      if (provider) {
        // Create a new provider object with the updated services
        const updatedProvider = {
          ...provider,
          services: data.services.map((service) => ({
            serviceId: service.id,
            price: service.price,
            duration: service.duration,
            // Preserve other fields that might be in the original services
            ...(provider.services.find((s) => s.id === service.id) || {}),
          })),
        };

        // Force update the query cache with the new data
        queryClient.setQueryData(['provider', providerId], updatedProvider);

        // Also update the provider-services cache if it exists
        queryClient.setQueryData(['provider-services', providerId], data.services);
      }

      toast({
        title: 'Success',
        description: 'Services updated successfully',
      });

      // Force a hard refetch to ensure we have the latest data
      refetch();

      // Also refresh the router to update any server components
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update services',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current user is authorized to edit this provider
  useEffect(() => {
    if (provider && provider.userId !== userId) {
      router.push('/dashboard');
    }
  }, [provider, userId, router]);

  // Show loading state
  if (isProviderLoading || isServicesLoading) {
    return <CalendarLoader message="Loading" submessage="Fetching services data..." />;
  }

  // Show error state
  if (providerError || servicesError || !provider || !availableServices) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-red-500">Error</h2>
        <p>Failed to load services data. Please try again later.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      {isSubmitting && (
        <CalendarLoader message="Saving Changes" submessage="Updating your services..." />
      )}
      <form id="edit-services-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-6 text-2xl font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground">
            Select the services you offer to patients.
          </p>
          <Separator className="my-4" />

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-md border p-4">
                <div className="flex items-start space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={availableServices.some((s) => s.id === field.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          append({ id: field.id, price: 0, duration: 30 });
                        } else {
                          remove(index);
                        }
                      }}
                    />
                  </FormControl>
                  <div className="flex-1">
                    <div className="space-y-1">
                      <span className="text-sm font-medium">
                        {availableServices.find((s) => s.id === field.id)?.name}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col space-y-3">
                      <FormField
                        control={form.control}
                        name={`services.${index}.price`}
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel className="text-xs">Price (R)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 transform text-xs text-muted-foreground">
                                  R
                                </span>
                                <Input
                                  type="number"
                                  className="h-8 pl-4"
                                  value={field.value}
                                  onChange={(e) => {
                                    // Simple conversion to number
                                    const value =
                                      e.target.value === '' ? 0 : Number(e.target.value);
                                    field.onChange(value);
                                  }}
                                  onBlur={field.onBlur}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`services.${index}.duration`}
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel className="text-xs">Duration (min)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="h-8"
                                value={field.value}
                                onChange={(e) => {
                                  // Simple conversion to number
                                  const value = e.target.value === '' ? 0 : Number(e.target.value);
                                  field.onChange(value);
                                }}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ id: '', price: 0, duration: 30 })}
          >
            Add Service
          </Button>
          <Button type="submit" disabled={isSubmitting} form="edit-services-form">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </>
  );
}
