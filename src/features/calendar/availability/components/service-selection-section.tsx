'use client';

import { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, DollarSign, Clock, MapPin, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreateAvailabilityData } from '../types';

interface ServiceSelectionSectionProps {
  serviceProviderId: string;
  organizationId?: string;
  availableServices?: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
  }>;
  availableLocations?: Array<{
    id: string;
    name: string;
    address: string;
  }>;
}

export function ServiceSelectionSection({
  serviceProviderId,
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

  // Mock services for now - in real implementation, these would come from props or be fetched
  const mockServices = [
    { id: '1', name: 'General Consultation', description: 'Standard consultation appointment', category: 'Consultation' },
    { id: '2', name: 'Follow-up Appointment', description: 'Follow-up consultation', category: 'Consultation' },
    { id: '3', name: 'X-Ray', description: 'Diagnostic X-ray imaging', category: 'Imaging' },
    { id: '4', name: 'Blood Test', description: 'Laboratory blood work', category: 'Lab Work' },
  ];

  const mockLocations = [
    { id: '1', name: 'Main Clinic', address: '123 Health St, Medical City' },
    { id: '2', name: 'Downtown Office', address: '456 Center Ave, Downtown' },
  ];

  const services = availableServices.length > 0 ? availableServices : mockServices;
  const locations = availableLocations.length > 0 ? availableLocations : mockLocations;

  const addService = (serviceId: string) => {
    if (!selectedServiceIds.has(serviceId)) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        append({
          serviceId,
          duration: 30, // Default 30 minutes
          price: 100, // Default price
          showPrice: true,
          isOnlineAvailable: true,
          isInPerson: true,
        });
        setSelectedServiceIds(prev => new Set([...prev, serviceId]));
      }
    }
  };

  const removeService = (index: number, serviceId: string) => {
    remove(index);
    setSelectedServiceIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(serviceId);
      return newSet;
    });
  };

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || 'Unknown Service';
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || 'Unknown Location';
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {services.map((service) => (
              <Button
                key={service.id}
                type="button"
                variant={selectedServiceIds.has(service.id) ? "default" : "outline"}
                className="justify-start h-auto p-3"
                onClick={() => addService(service.id)}
                disabled={selectedServiceIds.has(service.id)}
              >
                <div className="text-left">
                  <div className="font-medium">{service.name}</div>
                  {service.description && (
                    <div className="text-xs text-muted-foreground">{service.description}</div>
                  )}
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
                  <CardTitle className="text-base">
                    {getServiceName(field.serviceId)}
                  </CardTitle>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormLabel className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Price
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Price Display */}
                <FormField
                  control={form.control}
                  name={`services.${index}.showPrice`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Show price to patients
                        </FormLabel>
                        <FormDescription>
                          Display the price when patients view available appointments
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Delivery Methods */}
                <div className="space-y-3">
                  <FormLabel>Service Delivery</FormLabel>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`services.${index}.isOnlineAvailable`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              Online/Virtual
                            </FormLabel>
                            <FormDescription>
                              Allow virtual appointments via video call
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`services.${index}.isInPerson`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              In-Person
                            </FormLabel>
                            <FormDescription>
                              Allow appointments at physical location
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Location Selection for In-Person */}
                {form.watch(`services.${index}.isInPerson`) && (
                  <FormField
                    control={form.control}
                    name={`services.${index}.locationId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location for in-person appointments" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                <div>
                                  <div className="font-medium">{location.name}</div>
                                  <div className="text-xs text-muted-foreground">{location.address}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {fields.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No services selected</p>
              <p className="text-sm">Add at least one service to create availability</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}