'use client';

import { Control, useFieldArray, useWatch } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { type AvailabilityFormValues, type Service } from '../../lib/types';

interface ServiceConfigurationFieldsProps {
  services: Service[];
  control: Control<AvailabilityFormValues>;
}

export function ServiceConfigurationFields({
  services = [],
  control,
}: ServiceConfigurationFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'availableServices',
  });

  // Watch serviceIds to update availableServices when services are selected
  const serviceIds = useWatch({
    control,
    name: 'serviceIds',
  });

  // Update availableServices when serviceIds change
  const handleServiceChange = (value: string) => {
    const newServiceIds = value.split(',').filter(Boolean);
    const newConfigs = newServiceIds.map((serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      const existingConfig = fields.find((f) => f.serviceId === serviceId);

      return {
        serviceId,
        duration: existingConfig?.duration ?? service?.defaultDuration ?? 60,
        price: Number(existingConfig?.price ?? service?.defaultPrice ?? 0),
        isOnlineAvailable: existingConfig?.isOnlineAvailable ?? false,
        isInPerson: existingConfig?.isInPerson ?? false,
        location: existingConfig?.location,
      };
    });

    return newConfigs;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Service Configuration</h3>

      <FormField
        control={control}
        name="serviceIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Services</FormLabel>
            <Select
              value={field.value.join(',')}
              onValueChange={(value) => {
                const newConfigs = handleServiceChange(value);
                field.onChange(newConfigs.map((config) => config.serviceId));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select services..." />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="availableServices"
        render={() => (
          <FormItem>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="flex items-center space-x-4">
                  <Checkbox
                    id={service.id}
                    checked={fields.some((field) => field.serviceId === service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        append({
                          serviceId: service.id,
                          duration: service.defaultDuration ?? 60,
                          price: service.defaultPrice ?? 0,
                          isOnlineAvailable: true,
                          isInPerson: true,
                        });
                      } else {
                        const index = fields.findIndex((field) => field.serviceId === service.id);
                        if (index > -1) remove(index);
                      }
                    }}
                  />
                  <label className="text-sm font-medium leading-none">{service.name}</label>
                </div>
              ))}
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="availableServices"
        render={() => (
          <FormItem>
            <div className="space-y-4">
              {fields.map((serviceConfig, index) => (
                <div key={serviceConfig.serviceId} className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-medium">
                    {services.find((s) => s.id === serviceConfig.serviceId)?.name}
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name={`availableServices.${index}.duration`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <Input type="number" {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`availableServices.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <Input type="number" step="0.01" {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name={`availableServices.${index}.isOnlineAvailable`}
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Online Available</FormLabel>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`availableServices.${index}.isInPerson`}
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>In Person</FormLabel>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {serviceConfig.isInPerson && (
                    <FormField
                      control={control}
                      name={`availableServices.${index}.location`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <Input {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
