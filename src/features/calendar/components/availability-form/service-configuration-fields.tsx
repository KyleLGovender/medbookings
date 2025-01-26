'use client';

import { Control } from 'react-hook-form';

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

export function ServiceConfigurationFields({ services, control }: ServiceConfigurationFieldsProps) {
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
              onValueChange={(value) => field.onChange(value.split(','))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select services..." />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
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
        render={({ field }) => (
          <FormItem>
            <div className="space-y-4">
              {field.value.map((serviceConfig, index) => (
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
