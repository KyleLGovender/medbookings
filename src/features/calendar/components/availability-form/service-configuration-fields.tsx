'use client';

import { Control, UseFormReturn, useFieldArray } from 'react-hook-form';

import { Card } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

import { AvailabilityFormValues, Service, ServiceConfigFormSchema } from '../../lib/types';

interface ServiceConfigurationFieldsProps {
  services: Service[];
  control: Control<AvailabilityFormValues>;
  form: UseFormReturn<AvailabilityFormValues>;
  toast: typeof toast;
}

export function ServiceConfigurationFields({
  services = [],
  control,
  form,
  toast,
}: ServiceConfigurationFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'availableServices',
  });

  const handleServiceSelect = (service: Service) => {
    // Create a new service config
    const newServiceConfig = {
      serviceId: service.id,
      duration: service.defaultDuration ?? 60,
      price: service.defaultPrice ?? 100,
      isOnlineAvailable: true,
      isInPerson: false,
      location: undefined,
    };

    // Validate before adding to form
    const result = ServiceConfigFormSchema.safeParse(newServiceConfig);
    if (!result.success) {
      // Show validation errors
      toast({
        variant: 'destructive',
        title: 'Invalid Service Configuration',
        description: result.error.errors[0]?.message || 'Please check the service configuration',
      });
      return;
    }

    append(result.data);
    // Add console log after appending
    console.log('ServiceConfigurationFields - after append:', form.getValues());
  };

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <div className="flex flex-wrap gap-4">
        {services.map((service) => {
          const isSelected = fields.some((field) => field.serviceId === service.id);
          return (
            <Card
              key={service.id}
              className={`cursor-pointer p-4 ${isSelected ? 'border-primary' : ''}`}
              onClick={() => {
                if (!isSelected) {
                  handleServiceSelect(service);
                } else {
                  const index = fields.findIndex((field) => field.serviceId === service.id);
                  if (index > -1) remove(index);
                }
              }}
            >
              <h3 className="font-medium">{service.name}</h3>
            </Card>
          );
        })}
      </div>

      {/* Configuration for Selected Services */}
      {fields.map((field, index) => {
        const service = services.find((s) => s.id === field.serviceId);
        if (!service) return null;

        const isInPerson = form.watch(`availableServices.${index}.isInPerson`);

        return (
          <Card key={field.id} className="p-4">
            <h4 className="mb-4 font-medium">{service.name} Configuration</h4>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`availableServices.${index}.duration`}
                  render={({ field: durationField, fieldState }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <Input
                        type="number"
                        {...durationField}
                        onChange={(e) => durationField.onChange(Number(e.target.value))}
                      />
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`availableServices.${index}.price`}
                  render={({ field: priceField, fieldState }) => (
                    <FormItem>
                      <FormLabel>Price (R)</FormLabel>
                      <Input
                        type="number"
                        step="5"
                        {...priceField}
                        onChange={(e) => priceField.onChange(Number(e.target.value))}
                      />
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`availableServices.${index}.isOnlineAvailable`}
                  render={({ field: onlineField, fieldState }) => (
                    <FormItem className="flex items-center justify-between space-x-2">
                      <FormLabel>Online Available</FormLabel>
                      <Switch
                        checked={onlineField.value}
                        onCheckedChange={(checked) => {
                          onlineField.onChange(checked);
                          const isInPerson = form.getValues(
                            `availableServices.${index}.isInPerson`
                          );
                          if (!checked && !isInPerson) {
                            form.setError(`availableServices.${index}`, {
                              type: 'custom',
                              message: 'At least one availability type must be selected',
                            });
                          }
                        }}
                      />
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`availableServices.${index}.isInPerson`}
                  render={({ field: inPersonField, fieldState }) => (
                    <FormItem className="flex items-center justify-between space-x-2">
                      <FormLabel>In Person</FormLabel>
                      <Switch
                        checked={inPersonField.value}
                        onCheckedChange={(checked) => {
                          inPersonField.onChange(checked);
                          const isOnline = form.getValues(
                            `availableServices.${index}.isOnlineAvailable`
                          );
                          if (!checked && !isOnline) {
                            form.setError(`availableServices.${index}`, {
                              type: 'custom',
                              message: 'At least one availability type must be selected',
                            });
                          }
                        }}
                      />
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              {isInPerson && (
                <FormField
                  control={control}
                  name={`availableServices.${index}.location`}
                  render={({ field: locationField, fieldState }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Input {...locationField} />
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
