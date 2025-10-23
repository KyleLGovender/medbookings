'use client';

import { useState } from 'react';

import { Clock, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreateAvailabilityData } from '@/features/calendar/types/types';
import { Service } from '@/features/providers/types/types';

interface ServiceSelectionSectionProps {
  providerId: string;
  organizationId?: string;
  availableServices?: Service[];
  availableLocations?: Array<{
    id: string;
    name: string;
    address: string;
  }>;
}

export function ServiceSelectionSection({
  providerId,
  organizationId,
  availableServices = [],
  availableLocations = [],
}: ServiceSelectionSectionProps) {
  const form = useFormContext<CreateAvailabilityData>();
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  const services = availableServices.length > 0 ? availableServices : [];
  const locations = availableLocations.length > 0 ? availableLocations : [];

  const addService = (serviceId: string) => {
    if (!selectedServiceIds.has(serviceId)) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        append({
          serviceId,
          duration: service.duration || 15, // Use service default or 15 minutes
          price: service.price || 600, // Use service default or 600
        });
        setSelectedServiceIds((prev) => new Set(Array.from(prev).concat(serviceId)));
      }
    }
  };

  const removeService = (index: number, serviceId: string) => {
    remove(index);
    setSelectedServiceIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(serviceId);
      return newSet;
    });
  };

  const getServiceName = (serviceId: string) => {
    return services.find((s) => s.id === serviceId)?.name || 'Unknown Service';
  };

  const getLocationName = (locationId: string) => {
    return locations.find((l) => l.id === locationId)?.name || 'Unknown Location';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Available Services</h3>
        <Badge variant="secondary">{fields.length} selected</Badge>
      </div>

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {services.map((service) => (
              <Button
                key={service.id}
                type="button"
                variant={selectedServiceIds.has(service.id) ? 'default' : 'outline'}
                className="h-auto justify-start whitespace-normal text-wrap p-3"
                onClick={() => addService(service.id)}
                disabled={selectedServiceIds.has(service.id)}
              >
                <div className="w-full text-left">
                  <div className="font-medium leading-tight">{service.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Services Configuration */}
      {fields.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Service Configuration</h4>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{getServiceName(field.serviceId)}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(index, field.serviceId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Duration and Price */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`services.${index}.duration`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Duration (minutes)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="5"
                            max="480"
                            step="5"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`services.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">Price (R)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={field.value === 0 ? '' : field.value?.toString() || ''}
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {fields.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Plus className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No services selected</p>
              <p className="text-sm">Add at least one service to create availability</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
