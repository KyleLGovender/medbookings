'use client';

import { useEffect, useState } from 'react';

import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RequirementTypeData,
  ServiceProviderTypeData,
  ServiceTypeData,
  getRequirementsForProviderType,
  getServiceProviderTypes,
  getServicesForProviderType,
} from '@/features/providers/lib/provider-types';
import { useToast } from '@/hooks/use-toast';

export function ProviderTypeSection() {
  const { control, setValue, watch } = useFormContext();
  const { toast } = useToast();
  const [providerTypes, setProviderTypes] = useState<ServiceProviderTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProviderType, setSelectedProviderType] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<RequirementTypeData[]>([]);
  const [services, setServices] = useState<ServiceTypeData[]>([]);

  const currentProviderType = watch('providerType.providerType');

  // Fetch provider types on component mount
  useEffect(() => {
    async function fetchProviderTypes() {
      try {
        setIsLoading(true);
        const types = await getServiceProviderTypes();
        setProviderTypes(types);
        setError(null);
      } catch (err) {
        console.error('Error fetching provider types:', err);
        setError('Failed to load provider types. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProviderTypes();
  }, []);

  // Watch for changes to the selected provider type
  useEffect(() => {
    if (currentProviderType && currentProviderType !== selectedProviderType) {
      setSelectedProviderType(currentProviderType);
      // Reset data when changing provider type
      setRequirements([]);
      setServices([]);
    }
  }, [currentProviderType, selectedProviderType]);

  // Function to handle confirmation of selection
  const handleConfirmSelection = async (providerTypeId: string) => {
    if (!providerTypeId) return;

    // Immediately fetch both requirements and services
    try {
      setIsLoadingData(true);

      // Fetch both datasets in parallel
      const [requirementsList, servicesList] = await Promise.all([
        getRequirementsForProviderType(providerTypeId),
        getServicesForProviderType(providerTypeId),
      ]);

      // Update the requirements in the form state
      setValue(
        'regulatoryRequirements.requirements',
        requirementsList.map((req, idx) => ({
          requirementTypeId: req.id,
          index: idx,
        }))
      );

      // Store services in the form (create a structure if not already in the form schema)
      setValue(
        'services.availableServices',
        servicesList.map((service) => service.id)
      );

      // Store the full service objects for reference in other components
      setValue('services.loadedServices', servicesList);

      setRequirements(requirementsList);
      setServices(servicesList);

      toast({
        title: 'Provider type confirmed',
        description: `Data for ${providerTypes.find((t) => t.id === providerTypeId)?.name} has been loaded.`,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      toast({
        title: 'Failed to load data',
        description: 'There was an issue loading the requirements and services. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Loading provider types...</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

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
          name="providerType.providerType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset requirements and services when changing provider type
                    if (value !== selectedProviderType) {
                      setRequirements([]);
                      setServices([]);
                    }
                  }}
                  value={field.value}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {providerTypes.map((type) => (
                    <div key={type.id}>
                      <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                      <label htmlFor={type.id} className="cursor-pointer">
                        <Card
                          className={`hover:muted h-full bg-background transition-all peer-checked:ring-2 peer-checked:ring-primary ${field.value === type.id ? 'bg-muted' : ''}`}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{type.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <CardDescription>{type.description}</CardDescription>
                          </CardContent>
                          {field.value === type.id && (
                            <CardFooter className="flex justify-center border-t pt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault(); // Prevent label click propagation
                                  handleConfirmSelection(type.id);
                                }}
                                disabled={isLoadingData}
                              >
                                {isLoadingData ? 'Loading...' : 'Confirm Selection'}
                              </Button>
                            </CardFooter>
                          )}
                        </Card>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="border bg-background">
        {isLoadingData && (
          <div className="rounded-md p-4 text-center">
            <p className="text-sm text-muted-foreground">Loading requirements and services...</p>
          </div>
        )}

        {selectedProviderType && (requirements.length > 0 || services.length > 0) && (
          <div className="space-y-3 rounded-md p-4">
            <p className="font-medium">
              {providerTypes.find((t) => t.id === selectedProviderType)?.name} Selected
            </p>
            {requirements.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Regulatory Requirements:</span>{' '}
                  {requirements.length} requirements loaded.
                </p>
                <p className="text-xs text-muted-foreground">
                  {requirements.filter((r) => r.isRequired).length} required,{' '}
                  {requirements.filter((r) => !r.isRequired).length} optional
                </p>
              </div>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Please continue to the next section to complete your application.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
