'use client';

import { useEffect, useRef } from 'react';

import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ServicesSectionProps {
  availableServices: Array<{
    id: string;
    name: string;
    description: string | null;
    defaultDuration: number;
    defaultPrice: string;
    displayPriority: number;
  }>;
  selectedProviderTypeId: string;
}

export function ServicesSection({
  availableServices,
  selectedProviderTypeId,
}: ServicesSectionProps) {
  const {
    control,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext();
  const initializedRef = useRef(false);

  // Get the selected services from the form state
  const watchedServices = watch('services.availableServices') || [];

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

  // Reset initialization when provider type changes
  useEffect(() => {
    initializedRef.current = false;
  }, [selectedProviderTypeId]);

  // If no services are available, show a message
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
                                  defaultValue={Number(service.defaultDuration)}
                                  render={({ field }) => (
                                    <FormItem className="w-1/2">
                                      <FormLabel className="text-xs">Duration (min)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          className="h-8"
                                          value={field.value}
                                          min="1"
                                          onChange={(e) => {
                                            // Ensure we're getting a number
                                            const value =
                                              e.target.value === '' ? 0 : Number(e.target.value);
                                            field.onChange(value);
                                          }}
                                          onBlur={field.onBlur}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={control}
                                  name={`services.serviceConfigs.${service.id}.price`}
                                  defaultValue={Number(service.defaultPrice)}
                                  render={({ field }) => (
                                    <FormItem className="w-1/2">
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
                                              field.value === 0 ? '' : field.value?.toString() || ''
                                            }
                                            onChange={(e) => {
                                              const rawValue = e.target.value;

                                              // Allow empty string for better UX
                                              if (rawValue === '') {
                                                field.onChange(0);
                                                return;
                                              }

                                              // Only allow digits
                                              if (!/^\d+$/.test(rawValue)) {
                                                return; // Don't update if contains non-digits
                                              }

                                              const numValue = parseInt(rawValue, 10);
                                              if (!isNaN(numValue) && numValue >= 0) {
                                                field.onChange(numValue);
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
                                              if (value === '' || isNaN(parseInt(value, 10))) {
                                                field.onChange(0);
                                              }
                                              field.onBlur();
                                            }}
                                          />
                                        </div>
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
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}
