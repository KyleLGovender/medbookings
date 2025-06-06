'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import CalendarLoader from '@/components/calendar-loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

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
  provider: any; // Will be replaced with proper type
  availableServices: Service[];
}

// API mutation function
const updateProviderServices = async (formData: FormData) => {
  const response = await fetch(`/api/providers/${formData.get('id')}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update services');
  }

  return await response.json();
};

export function EditServices({ provider, availableServices }: EditServicesProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Get provider's current services
  const providerServiceIds = provider.services?.map((s: any) => s.id) || [];

  // Set up form with default values from provider
  const methods = useForm<ServicesFormValues>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      services: providerServiceIds,
      serviceConfigs: provider.services?.reduce((acc: any, service: any) => {
        acc[service.id] = {
          duration: service.duration || service.defaultDuration || 30,
          price: service.price || service.defaultPrice || 0,
        };
        return acc;
      }, {}),
    },
    mode: 'onBlur',
  });

  // Initialize form with pre-selected services when available
  useEffect(() => {
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
  }, [availableServices, methods]);

  // TanStack Query mutation
  const mutation = useMutation({
    mutationFn: updateProviderServices,
    onSuccess: (data) => {
      toast({
        title: 'Services updated',
        description: 'Your services have been updated successfully.',
      });

      // Navigate back to profile view
      if (data.redirect) {
        router.push(data.redirect);
      } else {
        router.push(`/providers/${provider.id}/edit`);
      }
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'There was an error updating your services.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: ServicesFormValues) => {
    // Create FormData object for the API
    const formData = new FormData();
    formData.append('id', provider.id);
    formData.append('userId', provider.userId);

    // Add required fields to prevent validation errors
    formData.append('name', provider.name || '');
    formData.append('bio', provider.bio || '');
    formData.append('email', provider.email || '');
    formData.append('whatsapp', provider.whatsapp || '');
    if (provider.website) formData.append('website', provider.website);

    // Add languages if available
    if (provider.languages && Array.isArray(provider.languages)) {
      provider.languages.forEach((lang: string) => {
        formData.append('languages', lang);
      });
    }

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
    mutation.mutate(formData);
  };

  const watchedServices = methods.watch('services') || [];

  // Update service configs when services change
  useEffect(() => {
    const currentConfigs = methods.getValues('serviceConfigs') || {};

    // Add configs for newly selected services
    watchedServices.forEach((serviceId) => {
      if (!currentConfigs[serviceId]) {
        const service = availableServices.find((s) => s.id === serviceId);
        currentConfigs[serviceId] = {
          duration: service?.defaultDuration || 30,
          price: service?.defaultPrice || 0,
        };
      }
    });

    methods.setValue('serviceConfigs', currentConfigs);
  }, [watchedServices, availableServices, methods]);

  return (
    <>
      {mutation.isPending && (
        <CalendarLoader message="Saving Changes" submessage="Updating your services..." />
      )}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold">Services</h2>
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
                        {[...availableServices]
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
                          })}
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
