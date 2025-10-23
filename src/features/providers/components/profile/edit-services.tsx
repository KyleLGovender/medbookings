'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import CalendarLoader from '@/components/calendar-loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useProvider } from '@/features/providers/hooks/use-provider';
import { useProviderTypeServices } from '@/features/providers/hooks/use-provider-type-services';
import { useUpdateProviderServices } from '@/features/providers/hooks/use-provider-updates';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Define the form schema - simpler approach with a map of service selections
const editServicesSchema = z.object({
  selectedServices: z.record(
    z.string(),
    z.object({
      selected: z.boolean(),
      price: z.coerce.number().min(0, 'Price must be a positive number'),
      duration: z.coerce.number().min(1, 'Duration must be a positive number'),
    })
  ),
});

type EditServicesFormValues = z.infer<typeof editServicesSchema>;

interface EditServicesProps {
  providerId: string;
  userId: string;
}

export function EditServices({ providerId, userId }: EditServicesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch provider data and available services
  const { data: provider, isLoading: isProviderLoading, refetch } = useProvider(providerId);
  const { data: availableServices, isLoading: isServicesLoading } =
    useProviderTypeServices(providerId);

  // Mutation for updating services
  const updateServicesMutation = useUpdateProviderServices({
    onSuccess: () => {
      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider-services', providerId] });

      toast({
        title: 'Success',
        description: 'Services updated successfully',
      });

      refetch();
      // Redirect to the provider profile view
      router.push(`/providers/${providerId}`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update services';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Initialize form with default values
  const form = useForm<EditServicesFormValues>({
    resolver: zodResolver(editServicesSchema),
    defaultValues: {
      selectedServices: {},
    },
  });

  // Initialize form data when provider and services are loaded
  useEffect(() => {
    if (provider && availableServices) {
      const selectedServices: Record<
        string,
        { selected: boolean; price: number; duration: number }
      > = {};

      // Initialize all available services
      availableServices.forEach((service) => {
        const isSelected = service.isSelected || false;

        // Use current effective pricing from API (which handles fallbacks)
        const effectivePrice = service.currentPrice || service.defaultPrice || 0;
        const effectiveDuration = service.currentDuration || service.defaultDuration || 30;

        selectedServices[service.id] = {
          selected: isSelected,
          price: effectivePrice,
          duration: effectiveDuration,
        };
      });

      form.reset({ selectedServices });
    }
  }, [provider, availableServices, form]);

  const onSubmit = (data: EditServicesFormValues) => {
    if (!providerId) return;

    // Transform form data to the format expected by the tRPC API
    const selectedServices = Object.entries(data.selectedServices)
      .filter(([_, serviceData]) => serviceData.selected)
      .map(([serviceId, _]) => serviceId);

    const serviceConfigs: Record<string, { duration: number; price: number }> = {};

    Object.entries(data.selectedServices)
      .filter(([_, serviceData]) => serviceData.selected)
      .forEach(([serviceId, serviceData]) => {
        serviceConfigs[serviceId] = {
          duration: serviceData.duration,
          price: serviceData.price,
        };
      });

    logger.debug('providers', 'Submitting to tRPC', {
      providerId,
      serviceCount: selectedServices.length,
      configCount: serviceConfigs.length,
    });

    updateServicesMutation.mutate({
      id: providerId,
      availableServices: selectedServices,
      serviceConfigs,
    });
  };

  if (isProviderLoading || isServicesLoading) {
    return <CalendarLoader />;
  }

  if (!provider || !availableServices) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Unable to load provider or services data.
        </p>
      </Card>
    );
  }

  // Sort services by display priority
  const sortedServices = [...availableServices].sort(
    (a, b) => (a.displayPriority ?? 999) - (b.displayPriority ?? 999)
  );

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Manage Services</h2>
        <p className="text-sm text-muted-foreground">
          Select the services you offer and set their prices and durations.
        </p>
      </div>

      <Separator className="my-4" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {sortedServices.map((service) => (
              <Controller
                key={service.id}
                name={`selectedServices.${service.id}`}
                control={form.control}
                render={({ field }) => {
                  const serviceData = field.value || { selected: false, price: 0, duration: 30 };

                  return (
                    <div className="rounded-md border p-4">
                      <div className="flex items-start space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={serviceData.selected}
                            onCheckedChange={(checked) => {
                              field.onChange({
                                ...serviceData,
                                selected: !!checked,
                                // Set default values when selecting
                                price: serviceData.price || service.defaultPrice || 0,
                                duration: serviceData.duration || service.defaultDuration || 30,
                              });
                            }}
                          />
                        </FormControl>

                        <div className="flex-1">
                          <div className="space-y-1">
                            <span className="text-sm font-medium">{service.name}</span>
                            {service.description && (
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            )}
                          </div>

                          {serviceData.selected && (
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`selectedServices.${service.id}.price`}
                                render={({ field: priceField }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Price (R)</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 transform text-xs text-muted-foreground">
                                          R
                                        </span>
                                        <Input
                                          type="text"
                                          className="h-8 pl-6"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          value={
                                            priceField.value === 0
                                              ? ''
                                              : priceField.value?.toString() || ''
                                          }
                                          onChange={(e) => {
                                            const rawValue = e.target.value;

                                            // Allow empty string for better UX
                                            if (rawValue === '') {
                                              const newValue = 0;
                                              priceField.onChange(newValue);
                                              field.onChange({
                                                ...serviceData,
                                                price: newValue,
                                              });
                                              return;
                                            }

                                            // Only allow digits
                                            if (!/^\d+$/.test(rawValue)) {
                                              return; // Don't update if contains non-digits
                                            }

                                            const numValue = parseInt(rawValue, 10);
                                            if (!isNaN(numValue) && numValue >= 0) {
                                              priceField.onChange(numValue);
                                              field.onChange({
                                                ...serviceData,
                                                price: numValue,
                                              });
                                            }
                                          }}
                                          onKeyPress={(e) => {
                                            // Only allow digits
                                            if (
                                              !/[0-9]/.test(e.key) &&
                                              ![
                                                'Backspace',
                                                'Delete',
                                                'Tab',
                                                'Enter',
                                                'ArrowLeft',
                                                'ArrowRight',
                                              ].includes(e.key)
                                            ) {
                                              e.preventDefault();
                                            }
                                          }}
                                          onBlur={(e) => {
                                            // Ensure we have a valid number on blur
                                            const value = e.target.value;
                                            const finalValue =
                                              value === '' || isNaN(parseInt(value, 10))
                                                ? 0
                                                : parseInt(value, 10);
                                            priceField.onChange(finalValue);
                                            field.onChange({
                                              ...serviceData,
                                              price: finalValue,
                                            });
                                            priceField.onBlur();
                                          }}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`selectedServices.${service.id}.duration`}
                                render={({ field: durationField }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Duration (min)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="h-8"
                                        {...durationField}
                                        onChange={(e) => {
                                          const value =
                                            e.target.value === '' ? 0 : Number(e.target.value);
                                          durationField.onChange(value);
                                          // Also update the parent field to keep everything in sync
                                          field.onChange({
                                            ...serviceData,
                                            duration: value,
                                          });
                                        }}
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
                }}
              />
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateServicesMutation.isPending}>
              {updateServicesMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
