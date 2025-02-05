'use client';

import { Control, useFieldArray } from 'react-hook-form';

import { Card } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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

  return (
    <div className="space-y-6">
      {/* Service Selection - Using flex with dynamic widths */}
      <div className="flex flex-wrap gap-4">
        {services.map((service) => {
          const isSelected = fields.some((field) => field.serviceId === service.id);
          const totalServices = services.length;

          // Calculate dynamic width based on number of services
          const widthClass =
            totalServices === 1
              ? 'w-full'
              : totalServices === 2
                ? 'w-[calc(50%-0.5rem)]'
                : totalServices === 3
                  ? 'w-[calc(33.333%-0.75rem)]'
                  : 'w-[calc(25%-0.75rem)]';

          return (
            <Card
              key={service.id}
              className={`cursor-pointer p-4 transition-all hover:border-primary ${widthClass} ${
                isSelected ? 'border-2 border-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                if (!isSelected) {
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
            >
              <div className="flex flex-col items-center space-y-2 text-center">
                <h3 className="font-medium">{service.name}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Configuration for Selected Services */}
      {fields.map((serviceConfig, index) => {
        const service = services.find((s) => s.id === serviceConfig.serviceId);
        if (!service) return null;

        return (
          <Card key={serviceConfig.id} className="p-4">
            <h4 className="mb-4 font-medium">{service.name} Configuration</h4>

            <div className="grid gap-4">
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
                    <FormItem className="flex items-center justify-between space-x-2">
                      <FormLabel>Online Available</FormLabel>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`availableServices.${index}.isInPerson`}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-x-2">
                      <FormLabel>In Person</FormLabel>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
          </Card>
        );
      })}
    </div>
  );
}
