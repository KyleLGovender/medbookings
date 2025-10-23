'use client';

import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
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
  selectedProviderTypes?: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  totalRequirementsCount: number;
  totalServicesCount: number;
  multipleSelection?: boolean;
}

export function ProviderTypeSection({
  providerTypes,
  selectedProviderTypes,
  totalRequirementsCount,
  totalServicesCount,
  multipleSelection = true,
}: ProviderTypeSectionProps) {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {multipleSelection
          ? 'Select one or more types of healthcare services you provide. This will determine the regulatory requirements for your application.'
          : 'Select the type of healthcare services you provide. This will determine the regulatory requirements for your application.'}
      </p>

      {providerTypes.length === 0 ? (
        <p className="text-muted-foreground">No provider types available.</p>
      ) : multipleSelection ? (
        <FormField
          control={control}
          name="providerTypeIds"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel>Healthcare Service Types</FormLabel>
              <div className="space-y-3">
                {providerTypes.map((type) => (
                  <div key={type.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={type.id}
                      checked={(field.value as string[] | undefined)?.includes(type.id) || false}
                      onCheckedChange={(checked) => {
                        const currentValues: string[] = (field.value as string[] | undefined) || [];
                        if (checked) {
                          field.onChange([...currentValues, type.id] as string[]);
                        } else {
                          field.onChange(currentValues.filter((id: string) => id !== type.id));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={type.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {type.name}
                      </label>
                      {type.description && (
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="providerTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider Type *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={(field.value as string | undefined) || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider type" />
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

      {((multipleSelection && selectedProviderTypes && selectedProviderTypes.length > 0) ||
        (!multipleSelection && selectedProviderTypes && selectedProviderTypes.length > 0)) && (
        <div className="rounded-md border bg-background">
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <p className="font-medium">
                {selectedProviderTypes!.length === 1
                  ? `${selectedProviderTypes![0].name} Selected`
                  : `${selectedProviderTypes!.length} Provider Types Selected`}
              </p>
            </div>

            {selectedProviderTypes!.length === 1 && selectedProviderTypes![0].description && (
              <p className="pl-4 text-sm text-muted-foreground">
                {selectedProviderTypes![0].description}
              </p>
            )}

            {selectedProviderTypes!.length > 1 && (
              <div className="pl-4">
                <p className="text-sm font-medium text-muted-foreground">Selected Types:</p>
                <ul className="mt-2 space-y-1">
                  {selectedProviderTypes!.map((type) => (
                    <li key={type.id} className="text-sm text-muted-foreground">
                      • {type.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {totalRequirementsCount > 0 && (
              <div className="pl-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Regulatory Requirements:</span>{' '}
                  {totalRequirementsCount} unique requirements loaded.
                </p>
              </div>
            )}
            {totalServicesCount > 0 && (
              <div className="pl-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Available Services:</span> {totalServicesCount}{' '}
                  services available.
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
