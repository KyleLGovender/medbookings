'use client';

import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProviderTypeSectionProps {
  providerTypes: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  selectedProviderType?: {
    id: string;
    name: string;
    description: string | null;
  };
  requirementsCount: number;
  servicesCount: number;
}

export function ProviderTypeSection({
  providerTypes,
  selectedProviderType,
  requirementsCount,
  servicesCount,
}: ProviderTypeSectionProps) {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select the type of healthcare services you provide. This will determine the regulatory
        requirements for your application.
      </p>

      {providerTypes.length === 0 ? (
        <p className="text-muted-foreground">No provider types available.</p>
      ) : (
        <FormField
          control={control}
          name="serviceProviderTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider type">
                      {field.value && selectedProviderType
                        ? selectedProviderType.name
                        : 'Select a provider type'}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {providerTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.name}</span>
                        {type.description && (
                          <span className="text-sm text-muted-foreground">{type.description}</span>
                        )}
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

      {selectedProviderType && (
        <div className="rounded-md border bg-background">
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <p className="font-medium">{selectedProviderType.name} Selected</p>
            </div>
            {selectedProviderType.description && (
              <p className="pl-4 text-sm text-muted-foreground">
                {selectedProviderType.description}
              </p>
            )}
            {requirementsCount > 0 && (
              <div className="pl-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Regulatory Requirements:</span> {requirementsCount}{' '}
                  requirements loaded.
                </p>
              </div>
            )}
            {servicesCount > 0 && (
              <div className="pl-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Available Services:</span> {servicesCount} services
                  available.
                </p>
              </div>
            )}
            <p className="pl-4 text-sm text-muted-foreground">
              Please continue to the next section to complete your application.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
