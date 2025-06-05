'use client';

import { useEffect, useRef } from 'react';

import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ServiceTypeData } from '@/features/providers/lib/provider-types';

export function ServicesSection() {
  const { control, setValue, watch, getValues } = useFormContext();
  const initializedRef = useRef(false);

  // Get the selected services from the form state
  const watchedServices = watch('services.availableServices') || [];

  // Get the available services loaded from provider type selection
  const availableServices: ServiceTypeData[] = watch('services.loadedServices') || [];

  // Force clear services when component mounts and when available services change
  useEffect(() => {
    // Use a ref to ensure this only runs once per component instance
    if (!initializedRef.current && availableServices.length > 0) {
      // Use a small timeout to ensure this runs after any other initialization
      setTimeout(() => {
        // Clear services no matter what
        setValue('services.availableServices', [], { shouldDirty: true });

        // Initialize serviceConfigs if not already set
        if (!getValues('services.serviceConfigs')) {
          setValue('services.serviceConfigs', {}, { shouldDirty: true });
        }

        // Mark as initialized
        initializedRef.current = true;
      }, 50);
    }
  }, [availableServices, setValue, getValues]);

  // If no services are loaded yet, show a message
  if (availableServices.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Please select a provider type first to see available services.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background">
      <div className="space-y-6">
        <FormField
          control={control}
          name="services.availableServices"
          render={({ field }) => {
            // Force field value to be an array
            const fieldValue = Array.isArray(field.value) ? field.value : [];
            return (
              <FormItem>
                <FormLabel>Select services you provide *</FormLabel>
                <div className="space-y-4">
                  {availableServices.map((service) => {
                    const isChecked = fieldValue.includes(service.id);
                    return (
                      <div key={service.id} className="rounded-md border p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 pt-[0.125rem]">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                // When checking the service, initialize its configuration
                                if (checked) {
                                  const currentConfigs = getValues('services.serviceConfigs') || {};
                                  if (!currentConfigs[service.id]) {
                                    const updatedConfigs = {
                                      ...currentConfigs,
                                      [service.id]: {
                                        duration: service.defaultDuration,
                                        price: service.defaultPrice,
                                      },
                                    };
                                    setValue('services.serviceConfigs', updatedConfigs);
                                  }
                                  field.onChange([...fieldValue, service.id]);
                                } else {
                                  field.onChange(
                                    fieldValue.filter((value: string) => value !== service.id)
                                  );
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="space-y-1">
                              <span className="text-sm font-medium">{service.name}</span>
                              {service.description && (
                                <p className="text-xs text-muted-foreground">
                                  {service.description}
                                </p>
                              )}
                            </div>

                            {fieldValue.includes(service.id) && (
                              <div className="mt-3 flex flex-col space-y-3">
                                <FormField
                                  control={control}
                                  name={`services.serviceConfigs.${service.id}.duration`}
                                  defaultValue={service.defaultDuration}
                                  render={({ field }) => (
                                    <div className="w-1/2">
                                      <div className="flex flex-col">
                                        <label className="mb-1 text-xs font-medium">
                                          Duration (min)
                                        </label>
                                        <Input
                                          type="number"
                                          className="h-8"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(parseInt(e.target.value) || 0)
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}
                                />
                                <FormField
                                  control={control}
                                  name={`services.serviceConfigs.${service.id}.price`}
                                  defaultValue={service.defaultPrice}
                                  render={({ field }) => (
                                    <div className="w-1/2">
                                      <div className="flex flex-col">
                                        <label className="mb-1 text-xs font-medium">
                                          Price (R)
                                        </label>
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 transform text-xs text-muted-foreground">
                                            R
                                          </span>
                                          <Input
                                            type="number"
                                            className="h-8 pl-6"
                                            {...field}
                                            onChange={(e) =>
                                              field.onChange(parseFloat(e.target.value) || 0)
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
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
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}
