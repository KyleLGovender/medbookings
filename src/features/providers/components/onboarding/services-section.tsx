'use client';

import { useState } from 'react';

import { Plus, X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const COMMON_SERVICES = [
  'General Consultation',
  'Follow-up Consultation',
  'Preventive Care',
  'Health Screening',
  'Vaccination',
  'Minor Procedures',
  'Diagnostic Tests',
  'Treatment Planning',
  'Second Opinion',
  'Telemedicine Consultation',
];

export function ServicesSection() {
  const { control, setValue, watch } = useFormContext();
  const [customService, setCustomService] = useState('');
  const [customServices, setCustomServices] = useState<string[]>([]);

  const watchedServices = watch('services.availableServices') || [];

  const addCustomService = () => {
    if (customService.trim() && !customServices.includes(customService.trim())) {
      const newCustomServices = [...customServices, customService.trim()];
      setCustomServices(newCustomServices);
      setValue('services.customServices', newCustomServices);
      setCustomService('');
    }
  };

  const removeCustomService = (serviceToRemove: string) => {
    const newCustomServices = customServices.filter((service) => service !== serviceToRemove);
    setCustomServices(newCustomServices);
    setValue('services.customServices', newCustomServices);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select the services you provide and set your consultation fee.
      </p>

      <div className="space-y-6">
        <FormField
          control={control}
          name="services.consultationFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Standard Consultation Fee (USD) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground">
                    $
                  </span>
                  <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="services.availableServices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select services you provide *</FormLabel>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {COMMON_SERVICES.map((service) => (
                  <div key={service} className="flex flex-row items-start space-x-3 space-y-0">
                    <Checkbox
                      checked={field.value?.includes(service)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), service])
                          : field.onChange(
                              field.value?.filter((value: string) => value !== service)
                            );
                      }}
                    />
                    <span className="text-sm font-normal">{service}</span>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Custom Services</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Add a custom service"
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomService}
              disabled={!customService.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {customServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customServices.map((service) => (
                <Badge key={service} variant="secondary" className="flex items-center gap-1">
                  {service}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 h-auto w-4 p-0"
                    onClick={() => removeCustomService(service)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="mb-2 font-medium">Selected Services Summary</h4>
          <p className="mb-2 text-sm text-muted-foreground">
            You have selected {watchedServices?.length || 0} standard services
            {customServices.length > 0 && ` and ${customServices.length} custom services`}.
          </p>
          {(watchedServices?.length > 0 || customServices.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {watchedServices?.map((service: string) => (
                <Badge key={service} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
              {customServices.map((service) => (
                <Badge key={service} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
