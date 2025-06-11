'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import CalendarLoader from '@/components/calendar-loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useProvider } from '@/features/providers/hooks/use-provider';
import {
  useProviderServices,
  useUpdateProviderServices,
} from '@/features/providers/hooks/use-provider-services';
import { useToast } from '@/hooks/use-toast';
import { providerDebug } from '@/lib/debug';

const servicesSchema = z.object({
  services: z.array(z.string()).min(1, 'Please select at least one service'),
  serviceConfigs: z.record(
    z.object({
      duration: z.number().min(5, 'Duration must be at least 5 minutes'),
      price: z.number().min(0, 'Price must be a positive number'),
    })
  ),
});

type ServicesFormValues = z.infer<typeof servicesSchema>;

interface Service {
  id: string;
  name: string;
  description?: string;
  defaultDuration?: number | null;
  defaultPrice?: number | null;
  isSelected?: boolean;
  displayPriority?: number;
}

interface EditServicesProps {
  providerId: string;
  userId: string;
}

export function EditServices({ providerId, userId }: EditServicesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch provider data
  const {
    data: provider,
    isLoading: isProviderLoading,
    error: providerError,
  } = useProvider(providerId);

  // Fetch available services
  const {
    data: availableServices,
    isLoading: isServicesLoading,
    error: servicesError,
  } = useProviderServices(providerId);

  // Get provider's current services
  const providerServiceIds = provider?.services?.map((s: any) => s.id) || [];

  // Set up form with default values
  const methods = useForm<ServicesFormValues>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      services: [],
      serviceConfigs: {},
    },
    mode: 'onBlur',
  });

  // Update form values when provider data is loaded
  useEffect(() => {
    if (provider && provider.services) {
      const serviceIds = provider.services.map((s: any) => s.id);
      const serviceConfigs = provider.services.reduce((acc: any, service: any) => {
        acc[service.id] = {
          duration: service.duration || service.defaultDuration || 30,
          price: service.price || service.defaultPrice || 0,
        };
        return acc;
      }, {});

      methods.reset({
        services: serviceIds,
        serviceConfigs: serviceConfigs,
      });
    }
  }, [provider, methods]);

  // Initialize form with pre-selected services when available
  useEffect(() => {
    if (availableServices) {
      // If we have services with isSelected property, use that to pre-select services
      const selectedServices = availableServices
        .filter((service) => service.isSelected)
        .map((service) => service.id);

      if (selectedServices.length > 0) {
        // Only update if we have pre-selected services and they differ from current selection
        const currentSelection = methods.getValues('services') || [];
        if (
          selectedServices.length !== currentSelection.length ||
          !selectedServices.every((id) => currentSelection.includes(id))
        ) {
          methods.setValue('services', selectedServices);
        }
      }
    }
  }, [availableServices, methods]);

  // Check if current user is authorized to edit this provider
  useEffect(() => {
    if (provider && provider.userId !== userId) {
      router.push('/dashboard');
    }
  }, [provider, userId, router]);

  // Use our custom mutation hook
  const mutation = useUpdateProviderServices({
    onSuccess: (data) => {
      toast({
        title: 'Services updated',
        description: 'Your services have been updated successfully.',
      });

      // Navigate back to profile view
      if (data.redirect) {
        router.push(data.redirect);
      } else if (provider) {
        router.push(`/providers/${provider.id}/edit`);
      }
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'There was an error updating your services.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: ServicesFormValues) => {
    if (!provider) {
      return;
    }

    // Create FormData object for the API
    const formData = new FormData();
    formData.append('id', provider.id);
    formData.append('userId', provider.userId);

    // Append services
    data.services.forEach((serviceId) => {
      formData.append('services', serviceId);
    });

    // Append service configurations
    const serviceConfigs = methods.getValues('serviceConfigs') || {};
    Object.entries(serviceConfigs).forEach(([serviceId, config]) => {
      formData.append(`serviceConfigs[${serviceId}][duration]`, config.duration.toString());
      formData.append(`serviceConfigs[${serviceId}][price]`, config.price.toString());
    });

    // Trigger the mutation
    providerDebug.logFormData('editServices', formData);
    mutation.mutate(formData);
  };

  const watchedServices = methods.watch('services');
  useEffect(() => {
    if (!watchedServices || !availableServices) return;

    // Get current service configs
    const currentConfigs = methods.getValues('serviceConfigs') || {};

    // Add any missing service configs
    watchedServices.forEach((serviceId) => {
      if (!currentConfigs[serviceId]) {
        const service = availableServices.find((s) => s.id === serviceId);
        if (service) {
          currentConfigs[serviceId] = {
            duration: service.defaultDuration || 30,
            price: service.defaultPrice || 0,
          };
        }
      }
    });

    // Update the form
    methods.setValue('serviceConfigs', currentConfigs);
  }, [watchedServices, availableServices, methods]);

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
      {mutation.isPending && (
        <CalendarLoader message="Saving Changes" submessage="Updating your services..." />
      )}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-6 text-2xl font-semibold">Services</h2>
            <p className="text-sm text-muted-foreground">
              Select the services you offer to patients.
            </p>
            <Separator className="my-4" />

            <div className="space-y-6">
              <FormField
                control={methods.control}
                name="services"
                render={({ field }) => {
                  // Force field value to be an array
                  const fieldValue = Array.isArray(field.value) ? field.value : [];
                  return (
                    <FormItem>
                      <FormLabel>Select services you provide *</FormLabel>
                      <FormMessage />
                      <div className="mt-2 space-y-4">
                        {availableServices ? (
                          [...availableServices]
                            .sort((a, b) => (a.displayPriority || 0) - (b.displayPriority || 0))
                            .map((service) => {
                              const isChecked = fieldValue.includes(service.id);
                              return (
                                <div key={service.id} className="rounded-md border p-4">
                                  <div className="flex items-start space-x-3">
                                    <FormControl>
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...fieldValue, service.id]);
                                          } else {
                                            field.onChange(
                                              fieldValue.filter(
                                                (value: string) => value !== service.id
                                              )
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="flex-1">
                                      <div className="space-y-1">
                                        <span className="text-sm font-medium">{service.name}</span>
                                        {service.description && (
                                          <p className="text-xs text-muted-foreground">
                                            {service.description}
                                          </p>
                                        )}
                                      </div>

                                      {isChecked && (
                                        <div className="mt-3 flex flex-col space-y-3">
                                          <FormField
                                            control={methods.control}
                                            name={`serviceConfigs.${service.id}.price`}
                                            defaultValue={Number(service.defaultPrice) || 0}
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
                                                          e.target.value === ''
                                                            ? 0
                                                            : Number(e.target.value);
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
                                            control={methods.control}
                                            name={`serviceConfigs.${service.id}.duration`}
                                            defaultValue={Number(service.defaultDuration) || 30}
                                            render={({ field }) => (
                                              <FormItem className="w-1/2">
                                                <FormLabel className="text-xs">
                                                  Duration (min)
                                                </FormLabel>
                                                <FormControl>
                                                  <Input
                                                    type="number"
                                                    className="h-8"
                                                    value={field.value}
                                                    onChange={(e) => {
                                                      // Simple conversion to number
                                                      const value =
                                                        e.target.value === ''
                                                          ? 0
                                                          : Number(e.target.value);
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
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <p>No services available</p>
                        )}
                      </div>
                    </FormItem>
                  );
                }}
              />
            </div>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
